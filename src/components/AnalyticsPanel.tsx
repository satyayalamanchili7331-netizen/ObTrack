import React, { useState } from 'react';
import { Table, ListFilter, Download, FileJson, Clock, Eye, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { TrackedObject, EventLogEntry } from '../types';

interface AnalyticsPanelProps {
  activeTracks: TrackedObject[];
  eventLogs: EventLogEntry[];
  onSelectTrack: (track: TrackedObject) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  activeTracks,
  eventLogs,
  onSelectTrack,
  onExportCSV,
  onExportJSON,
}) => {
  const [activeTab, setActiveTab] = useState<'tracks' | 'logs'>('tracks');

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 text-white shadow-xl flex flex-col gap-3">
      {/* Tab Switcher & Export Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363D] pb-3">
        <div className="flex items-center space-x-2 bg-[#0D1117] p-1 rounded-lg border border-[#30363D]">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'tracks' ? 'bg-[#21262D] text-cyan-400 shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Active Tracks ({activeTracks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'logs' ? 'bg-[#21262D] text-amber-400 shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Event Timeline ({eventLogs.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onExportCSV}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-gray-200 text-xs font-medium transition-colors cursor-pointer"
            title="Download CSV Tracking Telemetry Log"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onExportJSON}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] text-gray-200 text-xs font-medium transition-colors cursor-pointer"
            title="Download JSON Telemetry Log"
          >
            <FileJson className="w-3.5 h-3.5 text-purple-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Tab Content 1: Active Tracks Table */}
      {activeTab === 'tracks' && (
        <div className="overflow-x-auto max-h-64 scrollbar-thin scrollbar-thumb-gray-700">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0D1117] text-gray-400 uppercase tracking-wider text-[10px] sticky top-0">
              <tr>
                <th className="px-3 py-2">Track ID</th>
                <th className="px-3 py-2">Class</th>
                <th className="px-3 py-2">Confidence</th>
                <th className="px-3 py-2">Speed</th>
                <th className="px-3 py-2">Direction</th>
                <th className="px-3 py-2">Frame Age</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363D]/50 text-gray-200">
              {activeTracks.length > 0 ? (
                activeTracks.map((track) => (
                  <tr key={track.trackId} className="hover:bg-[#21262D] transition-colors">
                    <td className="px-3 py-2 font-bold" style={{ color: track.color }}>
                      #{track.trackId}
                    </td>
                    <td className="px-3 py-2 capitalize">{track.classLabel}</td>
                    <td className="px-3 py-2">{Math.round(track.confidence * 100)}%</td>
                    <td className="px-3 py-2 text-amber-300">{track.velocity.speed} px/f</td>
                    <td className="px-3 py-2 text-gray-300">{track.velocity.angleDeg}°</td>
                    <td className="px-3 py-2">{track.age} f</td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          track.status === 'active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {track.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => onSelectTrack(track)}
                        className="p-1 rounded bg-[#30363D] hover:bg-[#484f58] text-cyan-400 transition-colors cursor-pointer"
                        title="View Object Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-gray-500 font-sans">
                    No active tracked objects in current frame.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content 2: Event Timeline */}
      {activeTab === 'logs' && (
        <div className="max-h-64 overflow-y-auto space-y-2 font-mono text-xs scrollbar-thin scrollbar-thumb-gray-700">
          {eventLogs.length > 0 ? (
            [...eventLogs].reverse().map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-[#0D1117] border border-[#30363D] flex items-center justify-between gap-3 hover:border-gray-500 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: log.badgeColor || '#38BDF8' }} />
                  <div>
                    <div className="font-semibold text-gray-200">{log.message}</div>
                    <div className="text-[10px] text-gray-400 flex items-center space-x-2">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span>{log.timestamp}</span>
                      </span>
                      <span>• Frame {log.frameNumber}</span>
                    </div>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#21262D] text-gray-300 border border-[#30363D]">
                  {log.type.replace('_', ' ')}
                </span>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-gray-500 font-sans">No events logged yet.</div>
          )}
        </div>
      )}
    </div>
  );
};
