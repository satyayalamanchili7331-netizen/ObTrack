import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle, CheckCircle2, Search, Cpu, Loader2 } from 'lucide-react';
import { GeminiFrameAnalysis } from '../types';

interface GeminiAnalysisModalProps {
  isOpen: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onClose: () => void;
}

export const GeminiAnalysisModal: React.FC<GeminiAnalysisModalProps> = ({
  isOpen,
  canvasRef,
  onClose,
}) => {
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<GeminiFrameAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunAnalysis = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setErrorMsg('Canvas video frame is not available.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);

      const response = await fetch('/api/gemini/analyze-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          customPrompt: customPrompt.trim() || undefined,
          modelName: 'gemini-3.6-flash',
        }),
      });

      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Gemini Vision AI call failed.');
      }

      setAnalysisResult(json.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing Gemini AI zero-shot frame analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#161B22] border border-[#30363D] text-white rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col gap-4 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-950 text-purple-400 border border-purple-800 rounded-xl">
              <Sparkles className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Gemini 3.6 Vision AI — Smart Zero-Shot Frame Analysis</h2>
              <p className="text-xs text-gray-400">Ask Gemini AI to detect custom objects, analyze scenes, or inspect anomalies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#21262D] hover:bg-[#30363D] text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prompt Input Area */}
        <div className="space-y-2">
          <label className="text-xs text-gray-300 font-semibold flex items-center space-x-1">
            <Search className="w-3.5 h-3.5 text-purple-400" />
            <span>Custom Detection / Scene Prompt (Optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., 'Find all workers wearing helmets', 'Detect white delivery vans', 'Count strollers'"
              className="flex-1 bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-sans"
            />
            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition-all cursor-pointer shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{loading ? 'Analyzing...' : 'Analyze Frame'}</span>
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Analysis Results Display */}
        {analysisResult && (
          <div className="overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-gray-700">
            {/* Scene Summary Card */}
            <div className="p-4 rounded-xl bg-[#0D1117] border border-[#30363D]">
              <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-1">Scene Summary</h3>
              <p className="text-sm text-gray-200 leading-relaxed">{analysisResult.sceneSummary}</p>
            </div>

            {/* Anomaly Badge if detected */}
            {analysisResult.anomalyDetected ? (
              <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-200 text-xs flex items-center space-x-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-amber-300">Anomaly / Hazard Alert Detected</div>
                  <div className="text-amber-200/80 text-[11px]">{analysisResult.anomalyReason}</div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Normal scene conditions. No security hazards or anomalies detected.</span>
              </div>
            )}

            {/* Detections List */}
            <div>
              <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-2">
                Gemini Zero-Shot Detections ({analysisResult.detections?.length || 0})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {analysisResult.detections?.map((det, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#0D1117] border border-[#30363D] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-purple-300 capitalize">{det.label}</div>
                      {det.attributes && <div className="text-[10px] text-gray-400">{det.attributes}</div>}
                    </div>
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                      {Math.round(det.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!analysisResult && !loading && (
          <div className="py-12 text-center text-gray-500 text-xs font-sans border-2 border-dashed border-[#30363D] rounded-xl">
            Click <strong className="text-purple-400">"Analyze Frame"</strong> to capture the current frame and run Gemini AI detection.
          </div>
        )}
      </div>
    </div>
  );
};
