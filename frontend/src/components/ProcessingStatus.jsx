import React from 'react';
import { 
  UploadCloud, 
  FileAudio, 
  Sparkles, 
  BrainCircuit, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

const STEPS = [
  { id: 'upload', label: 'Uploading Media', icon: UploadCloud, desc: 'Sending file to server' },
  { id: 'ffmpeg', label: 'FFmpeg Processing', icon: FileAudio, desc: 'Extracting clean audio stream' },
  { id: 'gemini', label: 'Gemini Transcription', icon: BrainCircuit, desc: 'Transcribing speech & detecting language' },
  { id: 'agnes', label: 'Agnes AI Summarization', icon: Sparkles, desc: 'Generating multi-dimensional analysis' },
];

const ProcessingStatus = ({ currentStep, uploadPercent }) => {
  const getStepIndex = (step) => {
    switch (step) {
      case 'upload': return 0;
      case 'ffmpeg': return 1;
      case 'gemini': return 2;
      case 'agnes': return 3;
      case 'complete': return 4;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="bg-white border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-sm my-6 relative overflow-hidden">
      {/* Subtle top indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-sky-100 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-sky-500 to-sky-600 transition-all duration-500 ease-out animate-pulse"
          style={{ width: `${Math.min(100, Math.max(15, (currentIndex + 1) * 25))}%` }}
        />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
            AI Processing in Progress...
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Please wait while our dual-AI pipeline transcribes and summarizes your recording.
          </p>
        </div>

        {currentStep === 'upload' && (
          <span className="text-sm font-semibold text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
            {uploadPercent}%
          </span>
        )}
      </div>

      {/* Steps visualization */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {STEPS.map((step, idx) => {
          const isDone = currentIndex > idx;
          const isCurrent = currentIndex === idx;
          const isPending = currentIndex < idx;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`p-4 rounded-2xl border transition-all ${
                isCurrent
                  ? 'bg-sky-50/70 border-sky-400 shadow-sm'
                  : isDone
                  ? 'bg-slate-50/70 border-slate-200 opacity-90'
                  : 'bg-white border-slate-100 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isCurrent
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : isDone
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                )}
              </div>
              <div className="text-xs font-bold text-slate-800">{step.label}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{step.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessingStatus;

