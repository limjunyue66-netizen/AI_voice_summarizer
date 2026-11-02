import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Download, 
  ListChecks, 
  Layers, 
  Compass, 
  Target, 
  FileCode, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Loader2,
  Share2
} from 'lucide-react';

const SummaryDisplay = ({ result, onDownloadPDF, isDownloadingPDF }) => {
  const [copied, setCopied] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  if (!result || !result.summary) return null;

  const {
    filename,
    detected_language,
    summary_language,
    transcript,
    summary
  } = result;

  const {
    overall_summary = '',
    key_points = [],
    important_details = [],
    main_topics = [],
    conclusions = []
  } = summary;

  // Build formatted text for clipboard copying
  const handleCopySummary = () => {
    let text = `AI VOICE SUMMARY: ${filename}\n`;
    text += `Detected Spoken Language: ${detected_language}\n`;
    text += `Summary Language: ${summary_language.toUpperCase()}\n`;
    text += `==========================================\n\n`;

    if (overall_summary) {
      text += `1. OVERALL SUMMARY\n${overall_summary}\n\n`;
    }

    if (key_points && key_points.length > 0) {
      text += `2. KEY POINTS\n`;
      key_points.forEach((kp) => {
        text += `• ${kp}\n`;
      });
      text += `\n`;
    }

    if (important_details && important_details.length > 0) {
      text += `3. IMPORTANT DETAILS\n`;
      important_details.forEach((det) => {
        text += `• ${det}\n`;
      });
      text += `\n`;
    }

    if (main_topics && main_topics.length > 0) {
      text += `4. MAIN TOPICS\n`;
      main_topics.forEach((t) => {
        if (typeof t === 'object') {
          text += `• ${t.topic}: ${t.description}\n`;
        } else {
          text += `• ${t}\n`;
        }
      });
      text += `\n`;
    }

    if (conclusions && conclusions.length > 0) {
      text += `5. CONCLUSIONS\n`;
      conclusions.forEach((c) => {
        text += `• ${c}\n`;
      });
      text += `\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="bg-white border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8 animate-fadeIn">
      {/* Header bar with meta and action buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Analysis Completed
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              Source: <b className="text-slate-700">{filename}</b>
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-sky-600" />
            Executive AI Summary
          </h2>

          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
            <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
              Spoken: <b className="text-slate-800">{detected_language}</b>
            </span>
            <span className="bg-sky-50 text-sky-800 px-2.5 py-1 rounded-lg font-semibold border border-sky-100">
              Summary Lang: {summary_language.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 self-start lg:self-center">
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm hover:shadow transition-all"
            title="Copy full summary to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onDownloadPDF}
            disabled={isDownloadingPDF}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/25 hover:shadow-lg hover:shadow-sky-600/35 transition-all disabled:opacity-60"
            title="Download full report as PDF"
          >
            {isDownloadingPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1. Overall Summary */}
      {overall_summary && (
        <section className="bg-sky-50/50 border border-sky-100 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-3 text-sky-900 font-bold text-base">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            <h3>1. Overall Summary</h3>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line pl-1">
            {overall_summary}
          </p>
        </section>
      )}

      {/* 2. Key Points */}
      {key_points && key_points.length > 0 && (
        <section className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 mb-4 text-slate-900 font-bold text-base">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <ListChecks className="w-4 h-4" />
            </div>
            <h3>2. Key Points</h3>
          </div>
          <ul className="space-y-2.5 pl-1">
            {key_points.map((kp, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 leading-normal">
                <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="flex-1">{kp}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 3. Important Details */}
      {important_details && important_details.length > 0 && (
        <section className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 mb-4 text-slate-900 font-bold text-base">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            <h3>3. Important Details</h3>
          </div>
          <ul className="space-y-2.5 pl-1">
            {important_details.map((detail, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 leading-normal">
                <span className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                <span className="flex-1">{detail}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4. Main Topics */}
      {main_topics && main_topics.length > 0 && (
        <section className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 mb-4 text-slate-900 font-bold text-base">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Compass className="w-4 h-4" />
            </div>
            <h3>4. Main Topics</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pl-1">
            {main_topics.map((t, idx) => {
              const isObj = typeof t === 'object' && t !== null;
              const topicTitle = isObj ? t.topic : `Topic ${idx + 1}`;
              const topicDesc = isObj ? t.description : t;

              return (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-200 transition-colors">
                  <div className="font-bold text-slate-900 text-sm mb-1 text-teal-800">
                    {topicTitle}
                  </div>
                  {topicDesc && (
                    <div className="text-xs text-slate-600 leading-relaxed">
                      {topicDesc}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Conclusions */}
      {conclusions && conclusions.length > 0 && (
        <section className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 mb-4 text-slate-900 font-bold text-base">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Target className="w-4 h-4" />
            </div>
            <h3>5. Conclusions</h3>
          </div>
          <ul className="space-y-2.5 pl-1">
            {conclusions.map((c, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 leading-normal">
                <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                <span className="flex-1 font-medium">{c}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Original Transcript Drawer */}
      {transcript && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-sky-600" />
              View Original Audio Transcript ({detected_language})
            </span>
            {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showTranscript && (
            <div className="mt-3 p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap selection:bg-sky-500 shadow-inner">
              {transcript}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SummaryDisplay;

