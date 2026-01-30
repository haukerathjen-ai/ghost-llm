// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

import Link from 'next/link';
import { Settings, Clock, Activity } from 'lucide-react';
import { useElectronIPC } from '@/hooks/useElectronIPC';
import StatusIndicator from '@/components/StatusIndicator';
import RecordingButton from '@/components/RecordingButton';

export default function DashboardPage() {
  const { status, strategy, historyPreview } = useElectronIPC();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Activity className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Ghost LLM
            </h1>
          </div>
          
          <Link 
            href="/settings"
            className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-110"
          >
            <Settings className="w-6 h-6" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Status & Controls */}
          <div className="space-y-6">
            {/* Status Indicator Card */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-8 shadow-2xl hover:bg-white/10 transition-all duration-300">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                System Status
              </h2>
              <StatusIndicator status={status} size="large" />
            </div>

            {/* Recording Button Card */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-8 shadow-2xl hover:bg-white/10 transition-all duration-300">
              <RecordingButton />
            </div>

            {/* Current Strategy Card */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 shadow-2xl hover:bg-white/10 transition-all duration-300">
              <h3 className="text-sm font-medium text-white/60 mb-2">Active Strategy</h3>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-xl font-semibold">
                  {strategy || 'No strategy loaded'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - History Preview */}
          <div className="space-y-6">
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  Recent Activity
                </h2>
                <Link 
                  href="/history"
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors duration-200 hover:underline"
                >
                  View All
                </Link>
              </div>

              {/* History Items */}
              <div className="space-y-3">
                {historyPreview && historyPreview.length > 0 ? (
                  historyPreview.slice(0, 5).map((item: any, index: number) => (
                    <div
                      key={item.id || index}
                      className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-200 hover:scale-[1.02] cursor-pointer animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/90 truncate">
                            {item.prompt || 'No prompt'}
                          </p>
                          <p className="text-xs text-white/50 mt-1 line-clamp-2">
                            {item.response || 'No response'}
                          </p>
                        </div>
                        <span className="text-xs text-white/40 whitespace-nowrap">
                          {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : '--:--'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-white/40">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs mt-1">Start recording to see history</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}