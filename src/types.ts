export type DetectorModelType = 'yolov8n' | 'yolov8s' | 'yolov8m' | 'faster_rcnn' | 'coco_ssd' | 'gemini_ai';

export type TrackerType = 'sort' | 'deepsort';

export type TrackStatus = 'active' | 'tentative' | 'occluded' | 'lost';

export interface BoundingBox {
  x: number; // top-left x in pixels
  y: number; // top-left y in pixels
  width: number;
  height: number;
}

export interface Detection {
  id?: string;
  box: BoundingBox;
  classLabel: string;
  confidence: number;
  color?: string;
  embedding?: number[]; // Feature vector for DeepSORT re-ID
}

export interface Point2D {
  x: number;
  y: number;
  timestamp: number;
}

export interface TrackedObject {
  trackId: number;
  classLabel: string;
  confidence: number;
  currentBox: BoundingBox;
  predictedBox?: BoundingBox;
  velocity: { vx: number; vy: number; speed: number; angleDeg: number };
  status: TrackStatus;
  color: string;
  age: number; // Total frames track has existed
  hits: number; // Total detection matches
  timeSinceUpdate: number; // Frames since last detection match
  history: Point2D[]; // Trajectory points (center x,y)
  firstSeenFrame: number;
  lastSeenFrame: number;
  firstSeenTime: number;
  lastSeenTime: number;
  crossedLineCount?: { in: number; out: number };
  embedding?: number[];
  attributes?: string;
}

export interface LineCrossingBoundary {
  id: string;
  name: string;
  p1: { x: number; y: number }; // Line start (normalized 0..1)
  p2: { x: number; y: number }; // Line end (normalized 0..1)
  countIn: number;
  countOut: number;
  color: string;
}

export interface ROIZone {
  id: string;
  name: string;
  x: number; // 0..1 normalized
  y: number;
  width: number;
  height: number;
  color: string;
  objectCount: number;
}

export interface TrackerConfig {
  maxAge: number; // max frames to keep lost track (default: 30)
  minHits: number; // min detections before active status (default: 3)
  iouThreshold: number; // min IoU for matching (default: 0.3)
  confidenceThreshold: number; // min confidence for detections (default: 0.45)
  appearanceWeight: number; // 0 to 1 for DeepSORT (0 = pure IoU, 1 = pure cosine)
  trailLength: number; // max trajectory points to keep (default: 20)
}

export interface OverlayConfig {
  showBoundingBoxes: boolean;
  showTrackIds: boolean;
  showClassLabels: boolean;
  showConfidence: boolean;
  showMotionTrails: boolean;
  showVelocityVectors: boolean;
  showCountingLines: boolean;
  showROIZones: boolean;
  showDensityHeatmap: boolean;
  boxStyle: 'sharp' | 'rounded' | 'corners_only' | 'glow';
  trailStyle: 'solid' | 'dashed' | 'gradient' | 'dots';
}

export interface TelemetryStats {
  fps: number;
  latencyMs: number;
  totalDetections: number;
  activeTracksCount: number;
  totalUniqueObjectsSeen: number;
  classCounts: Record<string, number>;
  lineCrossings: { totalIn: number; totalOut: number };
  systemStatus: 'idle' | 'initializing' | 'running' | 'paused' | 'error';
  backendMode: 'WebGPU / WebGL' | 'WASM / CPU' | 'Server Gemini';
}

export interface EventLogEntry {
  id: string;
  timestamp: string;
  frameNumber: number;
  type: 'id_assigned' | 'id_lost' | 'line_crossed' | 'anomaly_detected' | 'gemini_detection';
  trackId?: number;
  classLabel?: string;
  message: string;
  badgeColor?: string;
}

export interface SampleVideo {
  id: string;
  name: string;
  category: string;
  description: string;
  url: string;
  poster: string;
  defaultTargetClasses: string[];
}

export interface GeminiFrameAnalysis {
  sceneSummary: string;
  anomalyDetected: boolean;
  anomalyReason?: string;
  detections: Array<{
    label: string;
    confidence: number;
    box2d: number[]; // [ymin, xmin, ymax, xmax] 0..1000
    attributes?: string;
    predictedDirection?: string;
  }>;
  classCounts?: Record<string, number>;
}
