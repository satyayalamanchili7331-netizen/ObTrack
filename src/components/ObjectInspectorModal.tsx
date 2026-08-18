import React from 'react';
import { X, Target, Clock, Navigation, Hash, ShieldCheck, Activity, Eye } from 'lucide-react';
import { TrackedObject } from '../types';

interface ObjectInspectorModalProps {
  track: TrackedObject | null;
  onClose: () => void;
}

export const ObjectInspectorModal: React.FC<ObjectInspectorModalProps> = ({ track, onClose }) => {
  if (!track) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#161B22] border border-[#30363D] text-white rounded-2xl shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${track.color}20`, border: `1px solid ${track.color}` }}>
              <Target className="w-5 h-5" style={{ color: track.color }} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold font-mono" style={{ color: track.color }}>
                  Track #{track.trackId}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#21262D] text-gray-300 border border-[#30363D]">
                  {track.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 capitalize">{track.classLabel} Object Telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#21262D] hover:bg-[#30363D] text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          {/* Confidence */}
          <div className="p-3 rounded-xl bg-[#0D1117] border border-[#30363D]">
            <div className="text-gray-400 text-[10px] uppercase font-bold flex items-center space-x-1 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Confidence</span>
            </div>
            <div className="text-lg font-bold text-emerald-400">{Math.round(track.confidence * 100)}%</div>
          </div>

          {/* Speed */}
          <div className="p-3 rounded-xl bg-[#0D1117] border border-[#30363D]">
            <div className="text-gray-400 text-[10px] uppercase font-bold flex items-center space-x-1 mb-1">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Speed Vector</span>
            </div>
            <div className="text-lg font-bold text-amber-400">{track.velocity.speed} px/f</div>
          </div>

          {/* Motion Direction */}
          <div className="p-3 rounded-xl bg-[#0D1117] border border-[#30363D]">
            <div className="text-gray-400 text-[10px] uppercase font-bold flex items-center space-x-1 mb-1">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>Direction</span>
            </div>
            <div className="text-lg font-bold text-cyan-400">{track.velocity.angleDeg}°</div>
          </div>

          {/* Track Age */}
          <div className="p-3 rounded-xl bg-[#0D1117] border border-[#30363D]">
            <div className="text-gray-400 text-[10px] uppercase font-bold flex items-center space-x-1 mb-1">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>Frames Active</span>
            </div>
            <div className="text-lg font-bold text-purple-400">{track.age} frames</div>
          </div>
        </div>

        {/* Bounding Box Coordinates */}
        <div className="p-3 rounded-xl bg-[#0D1117] border border-[#30363D] text-xs font-mono">
          <div className="text-gray-400 text-[10px] uppercase font-bold mb-1">Current Bounding Box [X, Y, W, H]</div>
          <div className="text-cyan-300">
            X: {Math.round(track.currentBox.x)} | Y: {Math.round(track.currentBox.y)} | W: {Math.round(track.currentBox.width)} | H:{' '}
            {Math.round(track.currentBox.height)}
          </div>
        </div>

        {/* Trajectory Trail History Points */}
        <div className="p-3 rounded-xl bg-[#0D1117] border border-[#30363D] text-xs font-mono space-y-1">
          <div className="text-gray-400 text-[10px] uppercase font-bold">Trajectory Points ({track.history.length})</div>
          <div className="max-h-20 overflow-y-auto space-y-1 text-[11px] text-gray-300 scrollbar-thin scrollbar-thumb-gray-700">
            {track.history.map((pt, i) => (
              <div key={i} className="flex justify-between">
                <span>Point #{i + 1}</span>
                <span className="text-gray-400">
                  ({Math.round(pt.x)}, {Math.round(pt.y)})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
