import React from 'react';
import { Sparkles, Mic, FileText, CheckCircle2, AlertCircle, Settings } from 'lucide-react';

const Navbar = ({ apiStatus, onOpenSettings }) => {
  return (
    <header className="bg-white border-b border-sky-100 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-sky-900 to-sky-700 bg-clip-text text-transparent tracking-tight">
              AI Voice Summarizer
            </h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Speech-to-Text & Intelligent Multi-dimensional Summaries
            </p>
          </div>
        </div>

        {/* Status Indicators & Settings Button */}
        <div className="flex items-center space-x-3">
          {apiStatus && (
            <div className="hidden md:flex items-center space-x-2 text-xs">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium border ${
                apiStatus.gemini_configured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {apiStatus.gemini_configured ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                )}
                Gemini
              </span>

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium border ${
                apiStatus.agnes_configured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {apiStatus.agnes_configured ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                )}
                Agnes AI
              </span>
            </div>
          )}

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100/80 text-sky-900 text-xs font-bold shadow-sm transition hover:scale-[1.02]"
            title="Configure API Keys & Test Connection"
          >
            <Settings className="w-4 h-4 text-sky-600" />
            <span>API Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

