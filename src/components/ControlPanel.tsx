import React, { useRef } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Camera, Upload, Film, Sliders, Cpu, Activity, ShieldCheck } from 'lucide-react';
import { DetectorModelType, TrackerType, SampleVideo } from '../types';

interface ControlPanelProps {
  isPlaying: boolean;
  sourceType: 'webcam' | 'upload' | 'sample';
  selectedSampleId: string;
  sampleVideos: SampleVideo[];
  detectorModel: DetectorModelType;
  trackerType: TrackerType;
  confidenceThreshold: number;
  iouThreshold: number;
  onTogglePlay: () => void;
  onStepFrame: () => void;
  onReset: () => void;
  onChangeSourceType: (type: 'webcam' | 'upload' | 'sample') => void;
  onChangeSampleVideo: (sampleId: string) => void;
  onFileUpload: (file: File) => void;
  onChangeDetectorModel: (model: DetectorModelType) => void;
  onChangeTrackerType: (tracker: TrackerType) => void;
  onChangeConfidenceThreshold: (val: number) => void;
  onChangeIoUThreshold: (val: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isPlaying,
  sourceType,
  selectedSampleId,
  sampleVideos,
  detectorModel,
  trackerType,
  confidenceThreshold,
  iouThreshold,
  onTogglePlay,
  onStepFrame,
  onReset,
  onChangeSourceType,
  onChangeSampleVideo,
  onFileUpload,
  onChangeDetectorModel,
  onChangeTrackerType,
  onChangeConfidenceThreshold,
  onChangeIoUThreshold,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 text-white shadow-xl flex flex-col gap-4">
      {/* Top Bar: Playback Controls & Main Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#30363D]">
        {/* Play / Pause / Step / Reset */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onTogglePlay}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-xs shadow-lg transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Pause Stream' : 'Start Session'}</span>
          </button>

          <button
            onClick={onStepFrame}
            disabled={isPlaying}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#21262D] hover:bg-[#30363D] disabled:opacity-40 border border-[#30363D] text-gray-200 text-xs font-medium transition-colors cursor-pointer"
            title="Step Next Frame (when paused)"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-gray-300 text-xs font-medium transition-colors cursor-pointer"
            title="Reset Trackers & Clear History"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Source Mode Selector */}
        <div className="flex items-center bg-[#0D1117] p-1 rounded-lg border border-[#30363D]">
          <button
            onClick={() => onChangeSourceType('webcam')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              sourceType === 'webcam' ? 'bg-[#21262D] text-cyan-400 font-semibold shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>

          <button
            onClick={() => onChangeSourceType('sample')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              sourceType === 'sample' ? 'bg-[#21262D] text-cyan-400 font-semibold shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Sample Clips</span>
          </button>

          <button
            onClick={() => {
              onChangeSourceType('upload');
              fileInputRef.current?.click();
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              sourceType === 'upload' ? 'bg-[#21262D] text-cyan-400 font-semibold shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Video</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/avi"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Grid: Detector & Tracker Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        {/* Sample Video Dropdown (shown when sample mode active) */}
        {sourceType === 'sample' && (
          <div className="flex flex-col space-y-1 md:col-span-1">
            <label className="text-gray-400 font-medium flex items-center space-x-1">
              <Film className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select Sample Clip</span>
            </label>
            <select
              value={selectedSampleId}
              onChange={(e) => onChangeSampleVideo(e.target.value)}
              className="bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {sampleVideos.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  {sample.name} ({sample.category})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Model Selector */}
        <div className="flex flex-col space-y-1">
          <label className="text-gray-400 font-medium flex items-center space-x-1">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Detection Model</span>
          </label>
          <select
            value={detectorModel}
            onChange={(e) => onChangeDetectorModel(e.target.value as DetectorModelType)}
            className="bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="yolov8n">YOLOv8 Nano (Fastest, Light)</option>
            <option value="yolov8s">YOLOv8 Small (Balanced)</option>
            <option value="yolov8m">YOLOv8 Medium (High Accuracy)</option>
            <option value="faster_rcnn">Faster R-CNN (ResNet-50)</option>
            <option value="coco_ssd">TensorFlow.js COCO-SSD</option>
            <option value="gemini_ai">Gemini 3.6 Vision AI (Zero-Shot)</option>
          </select>
        </div>

        {/* Tracker Selector */}
        <div className="flex flex-col space-y-1">
          <label className="text-gray-400 font-medium flex items-center space-x-1">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Tracking Algorithm</span>
          </label>
          <select
            value={trackerType}
            onChange={(e) => onChangeTrackerType(e.target.value as TrackerType)}
            className="bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="sort">SORT (Kalman + Hungarian IoU)</option>
            <option value="deepsort">DeepSORT (Kalman + Cosine Re-ID)</option>
          </select>
        </div>

        {/* Confidence Threshold Slider */}
        <div className="flex flex-col space-y-1">
          <div className="flex justify-between text-gray-400 font-medium">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Confidence Threshold</span>
            </span>
            <span className="text-cyan-400 font-mono font-bold">
              {Math.round(confidenceThreshold * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.10"
            max="0.95"
            step="0.05"
            value={confidenceThreshold}
            onChange={(e) => onChangeConfidenceThreshold(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer h-1.5 rounded-lg bg-[#0D1117]"
          />
        </div>

        {/* IoU Threshold Slider */}
        <div className="flex flex-col space-y-1">
          <div className="flex justify-between text-gray-400 font-medium">
            <span className="flex items-center space-x-1">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>IoU Match Threshold</span>
            </span>
            <span className="text-purple-400 font-mono font-bold">
              {Math.round(iouThreshold * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.10"
            max="0.80"
            step="0.05"
            value={iouThreshold}
            onChange={(e) => onChangeIoUThreshold(parseFloat(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer h-1.5 rounded-lg bg-[#0D1117]"
          />
        </div>
      </div>
    </div>
  );
};
