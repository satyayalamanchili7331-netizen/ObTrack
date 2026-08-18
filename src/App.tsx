import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { VideoCanvas } from './components/VideoCanvas';
import { ControlPanel } from './components/ControlPanel';
import { StatsBar } from './components/StatsBar';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { SettingsDrawer } from './components/SettingsDrawer';
import { GeminiAnalysisModal } from './components/GeminiAnalysisModal';
import { ObjectInspectorModal } from './components/ObjectInspectorModal';
import { HelpPRDModal } from './components/HelpPRDModal';

import {
  DetectorModelType,
  TrackerType,
  TrackerConfig,
  OverlayConfig,
  TelemetryStats,
  TrackedObject,
  EventLogEntry,
  SampleVideo,
  LineCrossingBoundary,
  ROIZone,
  Detection,
} from './types';

import { OBTrackerEngine } from './lib/trackingEngine';
import { initializeCocoDetector, detectVideoFrame, ProceduralVideoObjectSimulator } from './lib/cocoDetector';

export default function App() {
  // Session State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [sourceType, setSourceType] = useState<'webcam' | 'upload' | 'sample'>('sample');
  const [selectedSampleId, setSelectedSampleId] = useState<string>('traffic');
  const [sampleVideos, setSampleVideos] = useState<SampleVideo[]>([]);

  // Engine Configuration
  const [detectorModel, setDetectorModel] = useState<DetectorModelType>('yolov8n');
  const [trackerType, setTrackerType] = useState<TrackerType>('sort');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.45);
  const [iouThreshold, setIouThreshold] = useState<number>(0.3);

  // Tracker Engine Config
  const [trackerConfig, setTrackerConfig] = useState<TrackerConfig>({
    maxAge: 30,
    minHits: 2,
    iouThreshold: 0.3,
    confidenceThreshold: 0.45,
    appearanceWeight: 0.4,
    trailLength: 20,
  });

  // Canvas Overlay Toggles
  const [overlayConfig, setOverlayConfig] = useState<OverlayConfig>({
    showBoundingBoxes: true,
    showTrackIds: true,
    showClassLabels: true,
    showConfidence: true,
    showMotionTrails: true,
    showVelocityVectors: true,
    showCountingLines: true,
    showROIZones: true,
    showDensityHeatmap: false,
    boxStyle: 'sharp',
    trailStyle: 'solid',
  });

  // Telemetry & Results
  const [stats, setStats] = useState<TelemetryStats>({
    fps: 30.0,
    latencyMs: 18,
    totalDetections: 0,
    activeTracksCount: 0,
    totalUniqueObjectsSeen: 0,
    classCounts: {},
    lineCrossings: { totalIn: 0, totalOut: 0 },
    systemStatus: 'running',
    backendMode: 'WebGPU / WebGL',
  });

  const [activeTracks, setActiveTracks] = useState<TrackedObject[]>([]);
  const [eventLogs, setEventLogs] = useState<EventLogEntry[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<TrackedObject | null>(null);

  // Modals & Drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGeminiOpen, setIsGeminiOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Line Crossings & ROI Setup
  const [lines, setLines] = useState<LineCrossingBoundary[]>([
    {
      id: 'line-main',
      name: 'Central Traffic Line',
      p1: { x: 0.1, y: 0.5 },
      p2: { x: 0.9, y: 0.5 },
      countIn: 4,
      countOut: 2,
      color: '#38BDF8',
    },
  ]);

  const [zones, setZones] = useState<ROIZone[]>([
    {
      id: 'zone-entry',
      name: 'Intersection ROI',
      x: 0.25,
      y: 0.25,
      width: 0.5,
      height: 0.5,
      color: '#F59E0B',
      objectCount: 0,
    },
  ]);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Engines
  const trackerEngineRef = useRef<OBTrackerEngine>(new OBTrackerEngine());
  const simulatorRef = useRef<ProceduralVideoObjectSimulator>(new ProceduralVideoObjectSimulator('traffic'));

  // FPS & Latency Measurement
  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);

  // Fetch Sample Videos Metadata from Express Server
  useEffect(() => {
    fetch('/api/sample-videos')
      .then((res) => res.json())
      .then((data) => {
        if (data.samples) {
          setSampleVideos(data.samples);
        }
      })
      .catch((err) => console.warn('Could not load sample video metadata:', err));
  }, []);

  // Pre-load TensorFlow.js COCO-SSD
  useEffect(() => {
    initializeCocoDetector().catch((err) => console.log('TFJS pre-load notification:', err));
  }, []);

  // Initialize Source (Webcam / Upload / Sample)
  useEffect(() => {
    if (sourceType === 'webcam') {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } })
          .then((stream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play();
            }
          })
          .catch((err) => {
            console.error('Webcam access error:', err);
            setSourceType('sample');
          });
      }
    } else if (sourceType === 'sample') {
      const sample = sampleVideos.find((s) => s.id === selectedSampleId);
      if (sample && videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = sample.url;
        videoRef.current.play().catch((e) => console.log('Video play error:', e));
      }
      simulatorRef.current.initScene(selectedSampleId, 800, 500);
    }
  }, [sourceType, selectedSampleId, sampleVideos]);

  // Main Processing Loop
  const processFrameStep = useCallback(async () => {
    if (!isPlaying) return;

    const startTime = performance.now();

    // 1. Get raw detections (either via TFJS on video or procedural simulator)
    let detections: Detection[] = [];

    if (videoRef.current && videoRef.current.readyState >= 2 && detectorModel === 'coco_ssd') {
      detections = await detectVideoFrame(videoRef.current, confidenceThreshold);
    } else {
      // High-performance detection simulator matching current model settings
      detections = simulatorRef.current.getNextFrameDetections(800, 500, 0.05);
    }

    // 2. Feed detections into Tracker Engine
    const trackerResult = trackerEngineRef.current.processFrame(
      detections,
      trackerType,
      { ...trackerConfig, confidenceThreshold, iouThreshold },
      lines,
      zones,
      800,
      500
    );

    // 3. Update telemetry stats
    const endTime = performance.now();
    const frameLatency = Math.max(1, Math.round(endTime - startTime));

    frameCountRef.current++;
    const now = performance.now();
    const elapsed = (now - lastFrameTimeRef.current) / 1000;
    let currentFps = stats.fps;

    if (elapsed >= 0.5) {
      currentFps = Math.min(60, Math.round((frameCountRef.current / elapsed) * 10) / 10);
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
    }

    // Class Counts
    const counts: Record<string, number> = {};
    trackerResult.activeTracks.forEach((t) => {
      counts[t.classLabel] = (counts[t.classLabel] || 0) + 1;
    });

    // Line Crossings
    const totalIn = lines.reduce((acc, l) => acc + l.countIn, 0);
    const totalOut = lines.reduce((acc, l) => acc + l.countOut, 0);

    setActiveTracks(trackerResult.activeTracks);

    if (trackerResult.eventLogs.length > 0) {
      setEventLogs((prev) => [...prev, ...trackerResult.eventLogs].slice(-50)); // keep last 50
    }

    setStats({
      fps: currentFps,
      latencyMs: frameLatency,
      totalDetections: detections.length,
      activeTracksCount: trackerResult.activeTracks.length,
      totalUniqueObjectsSeen: trackerResult.totalUniqueObjects,
      classCounts: counts,
      lineCrossings: { totalIn, totalOut },
      systemStatus: 'running',
      backendMode: detectorModel === 'coco_ssd' ? 'WebGPU / WebGL' : 'WASM / CPU',
    });
  }, [isPlaying, detectorModel, trackerType, confidenceThreshold, iouThreshold, trackerConfig, lines, zones, stats.fps]);

  // RequestAnimationFrame Loop Trigger
  useEffect(() => {
    let animId: number;

    const loop = () => {
      processFrameStep();
      animId = requestAnimationFrame(loop);
    };

    if (isPlaying) {
      animId = requestAnimationFrame(loop);
    }

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, processFrameStep]);

  // File Upload Handler
  const handleFileUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.play();
    }
    setSourceType('upload');
  };

  // Reset Session
  const handleResetSession = () => {
    trackerEngineRef.current.reset();
    setActiveTracks([]);
    setEventLogs([]);
    setLines((prev) =>
      prev.map((l) => ({ ...l, countIn: 0, countOut: 0 }))
    );
  };

  // CSV Export
  const handleExportCSV = () => {
    if (activeTracks.length === 0) return;

    const headers = ['Track_ID', 'Class', 'Confidence', 'Speed_px_per_frame', 'Direction_deg', 'Frame_Age', 'Box_X', 'Box_Y', 'Box_W', 'Box_H'];
    const rows = activeTracks.map((t) => [
      t.trackId,
      t.classLabel,
      t.confidence,
      t.velocity.speed,
      t.velocity.angleDeg,
      t.age,
      Math.round(t.currentBox.x),
      Math.round(t.currentBox.y),
      Math.round(t.currentBox.width),
      Math.round(t.currentBox.height),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OBTrack-telemetry-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export
  const handleExportJSON = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      stats,
      activeTracks,
      eventLogs,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `OBTrack-log-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Header Bar */}
      <Header
        stats={stats}
        detectorModel={detectorModel}
        trackerType={trackerType}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGeminiModal={() => setIsGeminiOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-4">
        {/* Video Stage Container */}
        <VideoCanvas
          videoRef={videoRef}
          canvasRef={canvasRef}
          activeTracks={activeTracks}
          overlayConfig={overlayConfig}
          lines={lines}
          zones={zones}
          isWebcam={sourceType === 'webcam'}
          isVideoLoaded={Boolean(videoRef.current)}
          onSelectTrack={(track) => setSelectedTrack(track)}
          selectedTrackId={selectedTrack?.trackId}
        />

        {/* Live Telemetry Stats Bar */}
        <StatsBar stats={stats} />

        {/* Control Panel */}
        <ControlPanel
          isPlaying={isPlaying}
          sourceType={sourceType}
          selectedSampleId={selectedSampleId}
          sampleVideos={sampleVideos}
          detectorModel={detectorModel}
          trackerType={trackerType}
          confidenceThreshold={confidenceThreshold}
          iouThreshold={iouThreshold}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onStepFrame={processFrameStep}
          onReset={handleResetSession}
          onChangeSourceType={setSourceType}
          onChangeSampleVideo={setSelectedSampleId}
          onFileUpload={handleFileUpload}
          onChangeDetectorModel={setDetectorModel}
          onChangeTrackerType={setTrackerType}
          onChangeConfidenceThreshold={setConfidenceThreshold}
          onChangeIoUThreshold={setIouThreshold}
        />

        {/* Tracking Logs & Analytics Panel */}
        <AnalyticsPanel
          activeTracks={activeTracks}
          eventLogs={eventLogs}
          onSelectTrack={(track) => setSelectedTrack(track)}
          onExportCSV={handleExportCSV}
          onExportJSON={handleExportJSON}
        />
      </main>

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        trackerConfig={trackerConfig}
        overlayConfig={overlayConfig}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateTrackerConfig={setTrackerConfig}
        onUpdateOverlayConfig={setOverlayConfig}
        onResetDefaults={() => {
          setTrackerConfig({
            maxAge: 30,
            minHits: 2,
            iouThreshold: 0.3,
            confidenceThreshold: 0.45,
            appearanceWeight: 0.4,
            trailLength: 20,
          });
          setOverlayConfig({
            showBoundingBoxes: true,
            showTrackIds: true,
            showClassLabels: true,
            showConfidence: true,
            showMotionTrails: true,
            showVelocityVectors: true,
            showCountingLines: true,
            showROIZones: true,
            showDensityHeatmap: false,
            boxStyle: 'sharp',
            trailStyle: 'solid',
          });
        }}
      />

      {/* Gemini AI Modal */}
      <GeminiAnalysisModal
        isOpen={isGeminiOpen}
        canvasRef={canvasRef}
        onClose={() => setIsGeminiOpen(false)}
      />

      {/* Object Inspector Modal */}
      <ObjectInspectorModal
        track={selectedTrack}
        onClose={() => setSelectedTrack(null)}
      />

      {/* Help & PRD Modal */}
      <HelpPRDModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
