import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Camera as SnapIcon, Move, Maximize2, Layers, Crosshair, HelpCircle } from 'lucide-react';
import { TrackedObject, OverlayConfig, LineCrossingBoundary, ROIZone } from '../types';

interface VideoCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  activeTracks: TrackedObject[];
  overlayConfig: OverlayConfig;
  lines: LineCrossingBoundary[];
  zones: ROIZone[];
  isWebcam: boolean;
  isVideoLoaded: boolean;
  onSelectTrack: (track: TrackedObject) => void;
  onAddCountingLine?: () => void;
  onAddROIZone?: () => void;
  selectedTrackId?: number;
}

export const VideoCanvas: React.FC<VideoCanvasProps> = ({
  videoRef,
  canvasRef,
  activeTracks,
  overlayConfig,
  lines,
  zones,
  isWebcam,
  isVideoLoaded,
  onSelectTrack,
  selectedTrackId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredTrack, setHoveredTrack] = useState<TrackedObject | null>(null);

  // ResizeObserver to match video dimensions cleanly
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = Math.round((w * 9) / 16); // 16:9 ratio
        setDimensions({ width: w, height: h });
      }
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Main Render Loop for Bounding Boxes, Motion Trails, Vectors, and Lines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / dimensions.width;
    const scaleY = canvas.height / dimensions.height;

    // 1. Draw Density Heatmap if enabled
    if (overlayConfig.showDensityHeatmap) {
      drawDensityHeatmap(ctx, activeTracks, canvas.width, canvas.height);
    }

    // 2. Draw ROI Zones
    if (overlayConfig.showROIZones && zones.length > 0) {
      zones.forEach((zone) => {
        const zX = zone.x * canvas.width;
        const zY = zone.y * canvas.height;
        const zW = zone.width * canvas.width;
        const zH = zone.height * canvas.height;

        ctx.strokeStyle = zone.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(zX, zY, zW, zH);
        ctx.setLineDash([]);

        ctx.fillStyle = `${zone.color}20`; // translucent fill
        ctx.fillRect(zX, zY, zW, zH);

        // Zone Badge
        ctx.fillStyle = zone.color;
        ctx.fillRect(zX, zY - 22, 140, 22);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`${zone.name}: ${zone.objectCount} obj`, zX + 6, zY - 6);
      });
    }

    // 3. Draw Line Crossing Boundaries
    if (overlayConfig.showCountingLines && lines.length > 0) {
      lines.forEach((line) => {
        const x1 = line.p1.x * canvas.width;
        const y1 = line.p1.y * canvas.height;
        const x2 = line.p2.x * canvas.width;
        const y2 = line.p2.y * canvas.height;

        // Line
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // End caps
        ctx.fillStyle = line.color;
        ctx.beginPath();
        ctx.arc(x1, y1, 5, 0, Math.PI * 2);
        ctx.arc(x2, y2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Counter Badge
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        ctx.fillStyle = '#161B22';
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(midX - 55, midY - 14, 110, 28, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`IN: ${line.countIn} | OUT: ${line.countOut}`, midX, midY + 4);
        ctx.textAlign = 'left';
      });
    }

    // 4. Draw Active Tracked Objects
    activeTracks.forEach((track) => {
      const box = track.currentBox;
      const isSelected = selectedTrackId === track.trackId;
      const mainColor = isSelected ? '#38BDF8' : track.color || '#00F0FF';

      // A. Motion History Trails
      if (overlayConfig.showMotionTrails && track.history.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = isSelected ? 3 : 2;

        for (let i = 0; i < track.history.length; i++) {
          const pt = track.history[i];
          const alpha = (i + 1) / track.history.length;
          ctx.globalAlpha = alpha * 0.8;

          if (i === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Draw trajectory dots
        track.history.forEach((pt, i) => {
          if (i % 3 === 0) {
            ctx.fillStyle = mainColor;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // B. Bounding Boxes
      if (overlayConfig.showBoundingBoxes) {
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = isSelected ? 3.5 : 2;

        if (overlayConfig.boxStyle === 'glow') {
          ctx.shadowColor = mainColor;
          ctx.shadowBlur = isSelected ? 12 : 6;
        }

        if (overlayConfig.boxStyle === 'corners_only') {
          drawCornerBox(ctx, box.x, box.y, box.width, box.height, 14, mainColor);
        } else if (overlayConfig.boxStyle === 'rounded') {
          ctx.beginPath();
          ctx.roundRect(box.x, box.y, box.width, box.height, 8);
          ctx.stroke();
        } else {
          ctx.strokeRect(box.x, box.y, box.width, box.height);
        }

        ctx.shadowBlur = 0; // Reset shadow

        // Translucent background fill
        ctx.fillStyle = `${mainColor}15`;
        ctx.fillRect(box.x, box.y, box.width, box.height);
      }

      // C. Velocity Vector Arrow
      if (overlayConfig.showVelocityVectors && track.velocity) {
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        const endX = cx + track.velocity.vx * 6;
        const endY = cy + track.velocity.vy * 6;

        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Arrow tip
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(endX, endY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // D. Header Badge (Track ID + Label + Confidence)
      if (overlayConfig.showTrackIds || overlayConfig.showClassLabels) {
        const idText = overlayConfig.showTrackIds ? `#${track.trackId}` : '';
        const labelText = overlayConfig.showClassLabels ? track.classLabel : '';
        const confText = overlayConfig.showConfidence ? `${Math.round(track.confidence * 100)}%` : '';

        const badgeText = `${idText} ${labelText} ${confText}`.trim();
        ctx.font = 'bold 12px sans-serif';
        const textWidth = ctx.measureText(badgeText).width;

        const badgeY = box.y - 22 < 0 ? box.y + box.height : box.y - 22;

        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.roundRect(box.x, badgeY, textWidth + 14, 20, [4, 4, 0, 0]);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.fillText(badgeText, box.x + 7, badgeY + 14);
      }
    });
  }, [activeTracks, overlayConfig, lines, zones, dimensions, selectedTrackId]);

  // Corner Bounding Box Renderer
  const drawCornerBox = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    len: number,
    color: string
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(x, y + len);
    ctx.lineTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(x + w - len, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + len);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(x, y + h - len);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + len, y + h);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(x + w - len, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - len);
    ctx.stroke();
  };

  // Density Heatmap
  const drawDensityHeatmap = (
    ctx: CanvasRenderingContext2D,
    tracks: TrackedObject[],
    width: number,
    height: number
  ) => {
    tracks.forEach((track) => {
      const cx = track.currentBox.x + track.currentBox.width / 2;
      const cy = track.currentBox.y + track.currentBox.height / 2;

      const gradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, 80);
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)'); // Red center
      gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)'); // Yellow mid
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // Handle Canvas Clicks to Select Track
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Find track whose box contains click
    const clickedTrack = activeTracks.find((t) => {
      const b = t.currentBox;
      return clickX >= b.x && clickX <= b.x + b.width && clickY >= b.y && clickY <= b.y + b.height;
    });

    if (clickedTrack) {
      onSelectTrack(clickedTrack);
    }
  };

  // Capture Annotated Snapshot
  const handleCaptureSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `OBTrack-snapshot-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="relative w-full bg-[#0D1117] rounded-xl border border-[#30363D] overflow-hidden shadow-2xl">
      {/* Video Canvas Container */}
      <div ref={containerRef} className="relative w-full aspect-video bg-black flex items-center justify-center">
        {/* Underlying HTML5 Video */}
        <video
          ref={videoRef as any}
          playsInline
          muted
          loop
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* Foreground Overlay Canvas */}
        <canvas
          ref={canvasRef as any}
          width={dimensions.width}
          height={dimensions.height}
          onClick={handleCanvasClick}
          className="absolute inset-0 w-full h-full object-contain cursor-crosshair z-10"
        />

        {/* Floating Controls Overlay */}
        <div className="absolute top-3 right-3 z-20 flex items-center space-x-2">
          <button
            onClick={handleCaptureSnapshot}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#161B22]/80 hover:bg-[#21262D] backdrop-blur-md border border-[#30363D] text-white text-xs font-medium shadow-md transition-colors cursor-pointer"
            title="Download Annotated Frame Snapshot"
          >
            <SnapIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Snapshot</span>
          </button>
        </div>

        {/* Quick Canvas Tip Overlay when active */}
        {activeTracks.length > 0 && (
          <div className="absolute bottom-3 left-3 z-20 px-3 py-1 rounded-md bg-[#161B22]/80 backdrop-blur-md border border-[#30363D] text-gray-300 text-[11px] font-mono flex items-center space-x-1.5">
            <Crosshair className="w-3 h-3 text-cyan-400" />
            <span>Click any box on screen to inspect telemetry</span>
          </div>
        )}
      </div>
    </div>
  );
};
