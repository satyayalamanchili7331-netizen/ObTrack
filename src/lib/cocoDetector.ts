import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Detection } from '../types';

let modelPromise: Promise<cocoSsd.ObjectDetection> | null = null;
let loadedModel: cocoSsd.ObjectDetection | null = null;
let isTfReady = false;

/**
 * Initializes TensorFlow.js backend and loads COCO-SSD model.
 */
export async function initializeCocoDetector(): Promise<cocoSsd.ObjectDetection> {
  if (loadedModel) return loadedModel;

  if (!modelPromise) {
    modelPromise = (async () => {
      try {
        if (!isTfReady) {
          await tf.ready();
          isTfReady = true;
        }
        console.log('Loading TensorFlow.js COCO-SSD model...');
        loadedModel = await cocoSsd.load({
          base: 'lite_mobilenet_v2', // Lightweight fast model for 30+ FPS real-time tracking
        });
        console.log('COCO-SSD Model Loaded successfully.');
        return loadedModel;
      } catch (err) {
        console.warn('Failed to load TFJS COCO-SSD, falling back to inference engine:', err);
        throw err;
      }
    })();
  }

  return modelPromise;
}

/**
 * Runs COCO-SSD detection on an HTMLVideoElement or HTMLCanvasElement frame.
 */
export async function detectVideoFrame(
  video: HTMLVideoElement | HTMLCanvasElement,
  confidenceThreshold: number = 0.4
): Promise<Detection[]> {
  try {
    const model = await initializeCocoDetector();
    if (!model) return [];

    const predictions = await model.detect(video, 20, confidenceThreshold);

    return predictions.map((p) => ({
      box: {
        x: p.bbox[0],
        y: p.bbox[1],
        width: p.bbox[2],
        height: p.bbox[3],
      },
      classLabel: p.class,
      confidence: Math.round(p.score * 100) / 100,
      embedding: generateSimulatedEmbedding(p.class, p.bbox),
    }));
  } catch (e) {
    console.error('COCO-SSD Detection error:', e);
    return [];
  }
}

/**
 * Generates a pseudo appearance feature embedding vector (16-D) based on spatial & class features
 * used for DeepSORT re-identification testing.
 */
function generateSimulatedEmbedding(label: string, bbox: number[]): number[] {
  const vec: number[] = new Array(16).fill(0);
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash << 5) - hash + label.charCodeAt(i);
  }

  for (let i = 0; i < 16; i++) {
    vec[i] = Math.sin((hash + i) * 1.5 + bbox[0] * 0.01 + bbox[1] * 0.01);
  }
  // Normalize
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

/**
 * High-quality procedural target object generator for sample videos & benchmarking.
 * Generates physically consistent moving bounding boxes with occlusion and speed vectors.
 */
export class ProceduralVideoObjectSimulator {
  private simObjects: Array<{
    id: string;
    classLabel: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    w: number;
    h: number;
    confidence: number;
    phase: number;
  }> = [];

  constructor(sceneType: string = 'traffic', width: number = 800, height: number = 600) {
    this.initScene(sceneType, width, height);
  }

  public initScene(sceneType: string, width: number, height: number) {
    this.simObjects = [];

    if (sceneType === 'traffic') {
      const classes = ['car', 'bus', 'truck', 'person', 'bicycle'];
      for (let i = 0; i < 7; i++) {
        const cls = classes[i % classes.length];
        this.simObjects.push({
          id: `sim-${i}`,
          classLabel: cls,
          x: 50 + i * 110,
          y: 120 + (i % 3) * 130,
          vx: (i % 2 === 0 ? 1 : -1) * (1.8 + Math.random() * 2.2),
          vy: (Math.random() - 0.5) * 0.5,
          w: cls === 'bus' || cls === 'truck' ? 110 : cls === 'car' ? 80 : 45,
          h: cls === 'bus' || cls === 'truck' ? 65 : cls === 'car' ? 50 : 70,
          confidence: 0.78 + Math.random() * 0.2,
          phase: i * 1.2,
        });
      }
    } else if (sceneType === 'pedestrians') {
      for (let i = 0; i < 8; i++) {
        this.simObjects.push({
          id: `ped-${i}`,
          classLabel: i % 4 === 0 ? 'backpack' : 'person',
          x: 80 + i * 85,
          y: 100 + i * 50,
          vx: (Math.random() - 0.5) * 2.5,
          vy: (Math.random() - 0.5) * 2.0,
          w: 42,
          h: 82,
          confidence: 0.82 + Math.random() * 0.16,
          phase: i * 0.9,
        });
      }
    } else {
      const classes = ['dog', 'person', 'sports ball', 'chair', 'cat'];
      for (let i = 0; i < 6; i++) {
        this.simObjects.push({
          id: `gen-${i}`,
          classLabel: classes[i % classes.length],
          x: 100 + i * 100,
          y: 150 + (i % 2) * 160,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 2,
          w: 60,
          h: 60,
          confidence: 0.85,
          phase: i,
        });
      }
    }
  }

  public getNextFrameDetections(width: number = 800, height: number = 600, noiseRatio: number = 0.05): Detection[] {
    const detections: Detection[] = [];

    for (const obj of this.simObjects) {
      // Update coordinates
      obj.x += obj.vx;
      obj.y += obj.vy;
      obj.phase += 0.05;

      // Bounce off walls
      if (obj.x < 20 || obj.x + obj.w > width - 20) obj.vx *= -1;
      if (obj.y < 20 || obj.y + obj.h > height - 20) obj.vy *= -1;

      // Add mild noise/jitter for realistic detector behavior
      const jitterX = (Math.random() - 0.5) * 4;
      const jitterY = (Math.random() - 0.5) * 4;

      // Simulate occasional frame drop / miss (5% chance)
      if (Math.random() > noiseRatio) {
        const box = {
          x: Math.max(0, Math.min(width - obj.w, obj.x + jitterX)),
          y: Math.max(0, Math.min(height - obj.h, obj.y + jitterY)),
          width: obj.w,
          height: obj.h,
        };

        detections.push({
          box,
          classLabel: obj.classLabel,
          confidence: Math.min(0.99, Math.max(0.45, obj.confidence + (Math.random() - 0.5) * 0.08)),
          embedding: generateSimulatedEmbedding(obj.classLabel, [box.x, box.y, box.width, box.height]),
        });
      }
    }

    return detections;
  }
}
