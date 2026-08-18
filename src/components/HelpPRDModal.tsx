import React from 'react';
import { X, BookOpen, Target, ShieldCheck, Cpu, Layers } from 'lucide-react';

interface HelpPRDModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpPRDModal: React.FC<HelpPRDModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#161B22] border border-[#30363D] text-white rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col gap-4 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">OBTrack — Product Requirements & User Manual</h2>
              <p className="text-xs text-gray-400">Master architecture, detection models, and tracking guidelines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#21262D] hover:bg-[#30363D] text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto space-y-4 text-xs font-sans text-gray-300 pr-2 scrollbar-thin scrollbar-thumb-gray-700">
          <div className="p-4 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-2">
            <h3 className="font-bold text-cyan-400 text-sm flex items-center space-x-1.5">
              <Target className="w-4 h-4" />
              <span>Executive Summary & Architecture</span>
            </h3>
            <p className="leading-relaxed">
              OBTrack combines deep learning object detectors (YOLOv8, Faster R-CNN, TFJS COCO-SSD, Gemini 3.6) with multi-object tracking algorithms (SORT / DeepSORT) to assign persistent tracking IDs, calculate motion vectors, and count line crossings in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-1.5">
              <h4 className="font-bold text-amber-400 flex items-center space-x-1.5">
                <Cpu className="w-4 h-4" />
                <span>Detection Models</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li><strong className="text-gray-200">YOLOv8 (Nano/Small/Med):</strong> Ultralytics real-time COCO detector.</li>
                <li><strong className="text-gray-200">Faster R-CNN:</strong> Two-stage detector with high precision.</li>
                <li><strong className="text-gray-200">TFJS COCO-SSD:</strong> Client-side local WebGL/WASM model.</li>
                <li><strong className="text-gray-200">Gemini 3.6 Vision:</strong> Server-side zero-shot prompt detection.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-1.5">
              <h4 className="font-bold text-purple-400 flex items-center space-x-1.5">
                <Layers className="w-4 h-4" />
                <span>Tracking Engines</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li><strong className="text-gray-200">SORT:</strong> Kalman Filter state prediction + Hungarian algorithm IoU assignment.</li>
                <li><strong className="text-gray-200">DeepSORT:</strong> Kalman Filter + Cosine feature embedding distance for occlusion re-ID.</li>
              </ul>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-1.5">
            <h4 className="font-bold text-emerald-400 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Interactive Controls Guide</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li><strong>Click Canvas Boxes:</strong> Inspect object telemetry (Track ID, velocity, angle, trajectory coordinates).</li>
              <li><strong>Snapshot Button:</strong> Download current frame with bounding box and telemetry overlays as PNG.</li>
              <li><strong>Export CSV/JSON:</strong> Download session tracking logs for academic or research reports.</li>
              <li><strong>Counting Lines & ROI:</strong> Monitor vehicles or pedestrians crossing designated screen boundaries.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#30363D] text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
