import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Mic, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Zap,
  FileCheck
} from 'lucide-react';

import Navbar from './components/Navbar';
import FileUpload from './components/FileUpload';
import LanguageSelector from './components/LanguageSelector';
import ProcessingStatus from './components/ProcessingStatus';
import SummaryDisplay from './components/SummaryDisplay';
import ErrorAlert from './components/ErrorAlert';
import SettingsModal from './components/SettingsModal';

import { checkHealth, processMedia, downloadSummaryPDF } from './services/api';

function App() {
  const [apiStatus, setApiStatus] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [summaryLanguage, setSummaryLanguage] = useState('english');
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('upload'); // upload | ffmpeg | gemini | agnes | complete
  const [uploadPercent, setUploadPercent] = useState(0);

  // Result state
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await checkHealth();
      setApiStatus(data);
    } catch (err) {
      console.warn('Backend health check error:', err);
    }
  };

  // Initial health check
  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setError(null);
    setResult(null);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
  };

  const handleSummarize = async () => {
    if (!selectedFile) {
      setError('Please select or drop an audio/video recording first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setCurrentStep('upload');
    setUploadPercent(0);

    // Simulated progress transitions to reflect real backend phases
    let phaseTimer1, phaseTimer2, phaseTimer3;

    try {
      phaseTimer1 = setTimeout(() => {
        setCurrentStep('ffmpeg');
      }, 1500);

      phaseTimer2 = setTimeout(() => {
        setCurrentStep('gemini');
      }, 4000);

      phaseTimer3 = setTimeout(() => {
        setCurrentStep('agnes');
      }, 9000);

      const data = await processMedia(
        selectedFile,
        summaryLanguage,
        (percent) => {
          setUploadPercent(percent);
          if (percent >= 100) {
            setCurrentStep('ffmpeg');
          }
        }
      );

      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      clearTimeout(phaseTimer3);

      setCurrentStep('complete');
      setResult(data);
    } catch (err) {
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      clearTimeout(phaseTimer3);

      const msg = err.response?.data?.message || err.response?.data?.detail || err.message || 'Processing failed. Please check backend configuration.';
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    setIsDownloadingPDF(true);
    try {
      await downloadSummaryPDF({
        filename: result.filename,
        detected_language: result.detected_language,
        summary_language: result.summary_language,
        summary_data: result.summary,
        original_transcript: result.transcript,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download PDF summary document.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50/40 via-white to-slate-50">
      {/* Top Navigation */}
      <Navbar 
        apiStatus={apiStatus} 
        onOpenSettings={() => setIsSettingsOpen(true)} 
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsUpdated={fetchStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm border border-sky-200">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            Powered by Google Gemini & Agnes AI
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Transcribe & Summarize <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">
              Any Voice or Video Recording
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Upload voice memos, interviews, meetings, or WMV videos. Get accurate speech transcription and structured, multi-topic executive summaries in English, Chinese, or Malay.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <ErrorAlert 
            message={error} 
            onClose={() => setError(null)} 
            onRetry={selectedFile ? handleSummarize : null} 
          />
        )}

        {/* Upload & Configuration Card */}
        <div className="bg-white border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Section 1: Upload */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mic className="w-4 h-4 text-sky-600" />
                Step 1: Upload Audio or Video
              </h2>
              {selectedFile && !isProcessing && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Start Over
                </button>
              )}
            </div>

            <FileUpload
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              onError={(msg) => setError(msg)}
              disabled={isProcessing}
            />
          </div>

          {/* Section 2: Language Selection */}
          <div className="pt-2 border-t border-slate-100">
            <LanguageSelector
              selectedLanguage={summaryLanguage}
              onChange={setSummaryLanguage}
              disabled={isProcessing}
            />
          </div>

          {/* Section 3: Summarize Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero database storage. Files are automatically deleted after processing.</span>
            </div>

            <button
              type="button"
              onClick={handleSummarize}
              disabled={!selectedFile || isProcessing}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all duration-200 ${
                !selectedFile || isProcessing
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/30 hover:shadow-lg hover:shadow-sky-600/40 hover:-translate-y-0.5'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isProcessing ? 'Processing Audio...' : 'Summarize Recording'}</span>
              {!isProcessing && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <ProcessingStatus
            currentStep={currentStep}
            uploadPercent={uploadPercent}
          />
        )}

        {/* Results Section */}
        {result && (
          <div className="mt-10">
            <SummaryDisplay
              result={result}
              onDownloadPDF={handleDownloadPDF}
              isDownloadingPDF={isDownloadingPDF}
            />
          </div>
        )}

        {/* Trust Badges Footer */}
        <div className="mt-14 pt-8 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs text-slate-500">
          <div className="flex items-center justify-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <span>FFmpeg Media Extraction</span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <span>Multilingual PDF Export</span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>No Database & Privacy Guaranteed</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/60 text-center text-xs text-slate-400">
        AI Voice Summarizer &copy; {new Date().getFullYear()} — Built with React, FastAPI, Google Gemini & Agnes AI
      </footer>
    </div>
  );
}

export default App;
