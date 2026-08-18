import React from 'react';
import { Target, Activity, Cpu, Settings, Sparkles, Video, HelpCircle } from 'lucide-react';
import { TelemetryStats, DetectorModelType, TrackerType } from '../types';

interface HeaderProps {
  stats: TelemetryStats;
  detectorModel: DetectorModelType;
  trackerType: TrackerType;
  onOpenSettings: () => void;
  onOpenGeminiModal: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  detectorModel,
  trackerType,
  onOpenSettings,
  onOpenGeminiModal,
  onOpenHelp,
}) => {
  const getModelLabel = (model: DetectorModelType) => {
    switch (model) {
      case 'yolov8n':
        return 'YOLOv8 Nano';
      case 'yolov8s':
        return 'YOLOv8 Small';
      case 'yolov8m':
        return 'YOLOv8 Medium';
      case 'faster_rcnn':
        return 'Faster R-CNN';
      case 'coco_ssd':
        return 'TFJS COCO-SSD';
      case 'gemini_ai':
        return 'Gemini 3.6 Vision AI';
      default:
        return 'YOLOv8';
    }
  };

  return (
    <header className="bg-[#161B22] border-b border-[#30363D] px-4 py-3 text-white flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20 text-white flex items-center justify-center">
          <Target className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              OBTrack
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
              v1.0 Pro
            </span>
          </div>
          <p className="text-xs text-gray-400 font-medium">Real-Time Object Detection & Multi-Object Tracking</p>
        </div>
      </div>

      {/* Model & System Status Pills */}
      <div className="flex items-center space-x-2 text-xs font-mono">
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#21262D] border border-[#30363D]">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-gray-300">Model:</span>
          <span className="text-cyan-300 font-semibold">{getModelLabel(detectorModel)}</span>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#21262D] border border-[#30363D]">
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-gray-300">Tracker:</span>
          <span className="text-amber-300 font-semibold uppercase">{trackerType}</span>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#21262D] border border-[#30363D]">
          <span
            className={`w-2 h-2 rounded-full ${
              stats.systemStatus === 'running'
                ? 'bg-emerald-500 animate-ping'
                : stats.systemStatus === 'paused'
                ? 'bg-amber-500'
                : 'bg-gray-500'
            }`}
          />
          <span className="text-emerald-400 font-semibold uppercase">{stats.systemStatus}</span>
        </div>
      </div>

      {/* Actions & Tools */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenGeminiModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md transition-all cursor-pointer"
          title="Ask Gemini AI for zero-shot detection or scene analysis"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-200" />
          <span>Gemini Vision AI</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-gray-300 hover:text-white transition-colors cursor-pointer"
          title="Configure Tracker & Overlay Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenHelp}
          className="p-2 rounded-lg bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-gray-300 hover:text-white transition-colors cursor-pointer"
          title="Help & PRD Documentation"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
