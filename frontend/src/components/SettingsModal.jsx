import React, { useState, useEffect } from 'react';
import { 
  X, 
  KeyRound, 
  Sparkles, 
  BrainCircuit, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  Save, 
  ExternalLink,
  ShieldAlert,
  Radio
} from 'lucide-react';
import { getApiSettings, saveApiKeys, testApiConnections } from '../services/api';

const SettingsModal = ({ isOpen, onClose, onSettingsUpdated }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [agnesKey, setAgnesKey] = useState('');
  const [maskedKeys, setMaskedKeys] = useState({ gemini_masked: '', agnes_masked: '' });
  
  const [showGemini, setShowGemini] = useState(false);
  const [showAgnes, setShowAgnes] = useState(false);

  // Testing states
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [isTestingAgnes, setIsTestingAgnes] = useState(false);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [testResults, setTestResults] = useState({ gemini: null, agnes: null });

  // Save states
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadCurrentSettings();
    }
  }, [isOpen]);

  const loadCurrentSettings = async () => {
    try {
      const data = await getApiSettings();
      setMaskedKeys({
        gemini_masked: data.gemini_masked,
        agnes_masked: data.agnes_masked,
      });
      setTestResults({
        gemini: data.gemini_configured ? { success: true, message: 'Gemini API is configured.' } : null,
        agnes: data.agnes_configured ? { success: true, message: 'Agnes AI is configured and authenticated.' } : null,
      });
      setStatusMessage(null);
    } catch (err) {
      console.warn('Failed to load settings:', err);
    }
  };

  if (!isOpen) return null;

  const handleTestConnection = async (target = 'all') => {
    setStatusMessage(null);
    if (target === 'gemini') setIsTestingGemini(true);
    else if (target === 'agnes') setIsTestingAgnes(true);
    else setIsTestingAll(true);

    try {
      const res = await testApiConnections(geminiKey || undefined, agnesKey || undefined, target);
      setTestResults(prev => ({
        ...prev,
        ...(target === 'gemini' ? { gemini: res.gemini } : {}),
        ...(target === 'agnes' ? { agnes: res.agnes } : {}),
        ...(target === 'all' ? res : {}),
      }));
    } catch (err) {
      const errDetail = err.response?.data?.message || err.message || 'Connection test failed';
      if (target === 'gemini' || target === 'all') {
        setTestResults(prev => ({ ...prev, gemini: { success: false, message: errDetail } }));
      }
      if (target === 'agnes' || target === 'all') {
        setTestResults(prev => ({ ...prev, agnes: { success: false, message: errDetail } }));
      }
    } finally {
      setIsTestingGemini(false);
      setIsTestingAgnes(false);
      setIsTestingAll(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      await saveApiKeys(geminiKey || undefined, agnesKey || undefined);
      setStatusMessage({ type: 'success', text: 'API keys saved and applied successfully!' });
      setGeminiKey('');
      setAgnesKey('');
      await loadCurrentSettings();
      if (onSettingsUpdated) {
        onSettingsUpdated();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save settings';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-sky-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-sky-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">API Key Configuration</h3>
              <p className="text-xs text-slate-500">Configure & test connections for Gemini and Agnes AI</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status Message Alert */}
          {statusMessage && (
            <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* 1. Google Gemini Section */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <BrainCircuit className="w-4 h-4 text-sky-600" />
                <span>Google Gemini API Key</span>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1 hover:underline"
              >
                Get API Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showGemini ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder={maskedKeys.gemini_masked ? `Current: ${maskedKeys.gemini_masked} (Type new key to change)` : 'Paste your Gemini API key (AIzaSy...)'}
                className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl text-xs text-slate-800 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowGemini(!showGemini)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Test result status for Gemini */}
            {testResults.gemini && (
              <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                testResults.gemini.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {testResults.gemini.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" /> : <XCircle className="w-4 h-4 text-rose-600 mt-0.5" />}
                <span className="flex-1">{testResults.gemini.message}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleTestConnection('gemini')}
                disabled={isTestingGemini || isTestingAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold transition disabled:opacity-50"
              >
                {isTestingGemini ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5 text-sky-600" />}
                Test Gemini Connection
              </button>
            </div>
          </div>

          {/* 2. Agnes AI Section */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>Agnes AI API Key</span>
              </div>
              <a
                href="https://apihub.agnes-ai.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1 hover:underline"
              >
                Get API Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showAgnes ? 'text' : 'password'}
                value={agnesKey}
                onChange={(e) => setAgnesKey(e.target.value)}
                placeholder={maskedKeys.agnes_masked ? `Current: ${maskedKeys.agnes_masked} (Type new key to change)` : 'Paste your Agnes API key (sk-...)'}
                className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl text-xs text-slate-800 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowAgnes(!showAgnes)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showAgnes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Test result status for Agnes */}
            {testResults.agnes && (
              <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                testResults.agnes.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {testResults.agnes.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" /> : <XCircle className="w-4 h-4 text-rose-600 mt-0.5" />}
                <span className="flex-1">{testResults.agnes.message}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleTestConnection('agnes')}
                disabled={isTestingAgnes || isTestingAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold transition disabled:opacity-50"
              >
                {isTestingAgnes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5 text-sky-600" />}
                Test Agnes AI Connection
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleTestConnection('all')}
            disabled={isTestingAll || isTestingGemini || isTestingAgnes}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition disabled:opacity-50"
          >
            {isTestingAll ? <Loader2 className="w-4 h-4 animate-spin text-sky-600" /> : <Radio className="w-4 h-4 text-sky-600" />}
            Test All Connections
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/25 transition disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save API Keys
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

