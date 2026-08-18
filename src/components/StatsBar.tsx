import React from 'react';
import { Zap, Clock, Users, Hash, GitCommit, Tag } from 'lucide-react';
import { TelemetryStats } from '../types';

interface StatsBarProps {
  stats: TelemetryStats;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-3 text-white shadow-lg grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* FPS Meter */}
      <div className="bg-[#0D1117] p-2.5 rounded-lg border border-[#30363D] flex items-center space-x-3">
        <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-800/40">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Frame Rate</div>
          <div className="text-lg font-mono font-bold text-emerald-400">{stats.fps.toFixed(1)} <span className="text-xs text-gray-400">FPS</span></div>
        </div>
      </div>

      {/* Latency Meter */}
      <div className="bg-[#0D1117] p-2.5 rounded-lg border border-[#30363D] flex items-center space-x-3">
        <div className="p-2 bg-cyan-950 text-cyan-400 rounded-lg border border-cyan-800/40">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Inference Latency</div>
          <div className="text-lg font-mono font-bold text-cyan-400">{stats.latencyMs} <span className="text-xs text-gray-400">ms</span></div>
        </div>
      </div>

      {/* Active Tracks */}
      <div className="bg-[#0D1117] p-2.5 rounded-lg border border-[#30363D] flex items-center space-x-3">
        <div className="p-2 bg-amber-950 text-amber-400 rounded-lg border border-amber-800/40">
          <Users className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Active Tracks</div>
          <div className="text-lg font-mono font-bold text-amber-400">{stats.activeTracksCount}</div>
        </div>
      </div>

      {/* Total Unique Objects */}
      <div className="bg-[#0D1117] p-2.5 rounded-lg border border-[#30363D] flex items-center space-x-3">
        <div className="p-2 bg-purple-950 text-purple-400 rounded-lg border border-purple-800/40">
          <Hash className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Unique IDs Seen</div>
          <div className="text-lg font-mono font-bold text-purple-400">{stats.totalUniqueObjectsSeen}</div>
        </div>
      </div>

      {/* Line Crossings */}
      <div className="bg-[#0D1117] p-2.5 rounded-lg border border-[#30363D] flex items-center space-x-3">
        <div className="p-2 bg-blue-950 text-blue-400 rounded-lg border border-blue-800/40">
          <GitCommit className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Line Crossings</div>
          <div className="text-sm font-mono font-bold text-blue-300">
            IN: <span className="text-emerald-400">{stats.lineCrossings.totalIn}</span> | OUT: <span className="text-rose-400">{stats.lineCrossings.totalOut}</span>
          </div>
        </div>
      </div>

      {/* Top Classes Breakdown */}
      <div className="bg-[#0D1117] p-2.5 rounded-lg border border-[#30363D] flex flex-col justify-center">
        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center space-x-1 mb-1">
          <Tag className="w-3 h-3 text-cyan-400" />
          <span>Class Counts</span>
        </div>
        <div className="flex flex-wrap gap-1 max-h-8 overflow-y-auto font-mono text-[11px]">
          {Object.entries(stats.classCounts).length > 0 ? (
            Object.entries(stats.classCounts).map(([cls, count]) => (
              <span key={cls} className="px-1.5 py-0.5 rounded bg-[#21262D] text-gray-300 border border-[#30363D]">
                {cls}: <strong className="text-cyan-400">{count}</strong>
              </span>
            ))
          ) : (
            <span className="text-gray-500 text-[10px]">No objects detected</span>
          )}
        </div>
      </div>
    </div>
  );
};
