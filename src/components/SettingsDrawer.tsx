import React from 'react';
import { X, Sliders, Eye, EyeOff, Layers, Palette, RefreshCw } from 'lucide-react';
import { TrackerConfig, OverlayConfig } from '../types';

interface SettingsDrawerProps {
  isOpen: boolean;
  trackerConfig: TrackerConfig;
  overlayConfig: OverlayConfig;
  onClose: () => void;
  onUpdateTrackerConfig: (newConfig: TrackerConfig) => void;
  onUpdateOverlayConfig: (newOverlay: OverlayConfig) => void;
  onResetDefaults: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  trackerConfig,
  overlayConfig,
  onClose,
  onUpdateTrackerConfig,
  onUpdateOverlayConfig,
  onResetDefaults,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-[#161B22] border-l border-[#30363D] text-white p-5 h-full overflow-y-auto flex flex-col justify-between shadow-2xl">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#30363D]">
            <div className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold">Tracker & Overlay Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#21262D] hover:bg-[#30363D] text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section 1: Tracker Parameters */}
          <div className="mt-5 space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Tracking Engine Parameters</span>
            </h3>

            {/* Max Age */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-300">Max Age (Frames)</span>
                <span className="text-cyan-400 font-mono">{trackerConfig.maxAge} f</span>
              </div>
              <input
                type="range"
                min="5"
                max="90"
                value={trackerConfig.maxAge}
                onChange={(e) =>
                  onUpdateTrackerConfig({ ...trackerConfig, maxAge: parseInt(e.target.value) })
                }
                className="w-full accent-cyan-500 h-1.5 bg-[#0D1117] rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-gray-500">
                Maximum frames to remember a lost object before purging its Track ID.
              </p>
            </div>

            {/* Min Hits */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-300">Min Hits (Confirmation)</span>
                <span className="text-cyan-400 font-mono">{trackerConfig.minHits} hits</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                value={trackerConfig.minHits}
                onChange={(e) =>
                  onUpdateTrackerConfig({ ...trackerConfig, minHits: parseInt(e.target.value) })
                }
                className="w-full accent-cyan-500 h-1.5 bg-[#0D1117] rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-gray-500">
                Minimum detection matches before a tentative track turns into an active track.
              </p>
            </div>

            {/* Trajectory Trail Length */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-300">Motion Trail Length</span>
                <span className="text-cyan-400 font-mono">{trackerConfig.trailLength} pts</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={trackerConfig.trailLength}
                onChange={(e) =>
                  onUpdateTrackerConfig({ ...trackerConfig, trailLength: parseInt(e.target.value) })
                }
                className="w-full accent-cyan-500 h-1.5 bg-[#0D1117] rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Section 2: Visual Overlays */}
          <div className="mt-6 space-y-3 pt-4 border-t border-[#30363D]">
            <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400 flex items-center space-x-1.5">
              <Palette className="w-4 h-4 text-purple-400" />
              <span>Canvas Visual Overlays</span>
            </h3>

            {/* Overlay Toggles Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { key: 'showBoundingBoxes', label: 'Bounding Boxes' },
                { key: 'showTrackIds', label: 'Track IDs (#101)' },
                { key: 'showClassLabels', label: 'Class Labels' },
                { key: 'showConfidence', label: 'Confidence %' },
                { key: 'showMotionTrails', label: 'Motion Trails' },
                { key: 'showVelocityVectors', label: 'Velocity Arrows' },
                { key: 'showCountingLines', label: 'Counting Lines' },
                { key: 'showROIZones', label: 'ROI Zones' },
                { key: 'showDensityHeatmap', label: 'Density Heatmap' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() =>
                    onUpdateOverlayConfig({
                      ...overlayConfig,
                      [key]: !overlayConfig[key as keyof OverlayConfig],
                    })
                  }
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    overlayConfig[key as keyof OverlayConfig]
                      ? 'bg-[#21262D] text-cyan-400 border-cyan-800'
                      : 'bg-[#0D1117] text-gray-400 border-[#30363D]'
                  }`}
                >
                  <span>{label}</span>
                  {overlayConfig[key as keyof OverlayConfig] ? (
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-gray-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Box Style Selector */}
            <div className="space-y-1 pt-2">
              <label className="text-xs text-gray-300 font-medium">Box Corner Design</label>
              <select
                value={overlayConfig.boxStyle}
                onChange={(e) =>
                  onUpdateOverlayConfig({
                    ...overlayConfig,
                    boxStyle: e.target.value as any,
                  })
                }
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="sharp">Sharp Full Outline</option>
                <option value="rounded">Rounded Box (8px)</option>
                <option value="corners_only">Cyberpunk Corners Only</option>
                <option value="glow">Glow Box Effect</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#30363D] flex items-center justify-between">
          <button
            onClick={onResetDefaults}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#21262D] hover:bg-[#30363D] text-gray-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
