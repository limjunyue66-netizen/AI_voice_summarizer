import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  FileAudio, 
  FileVideo, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Info
} from 'lucide-react';
import AudioPreview from './AudioPreview';

const SUPPORTED_AUDIO = ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'wma'];
const SUPPORTED_VIDEO = ['wmv', 'mp4', 'webm'];
const ALL_SUPPORTED = [...SUPPORTED_AUDIO, ...SUPPORTED_VIDEO];
const MAX_FILE_SIZE_MB = 250;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileUpload = ({ selectedFile, onFileSelect, onFileRemove, onError, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const validateAndSetFile = (file) => {
    if (!file) return;

    // Check extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALL_SUPPORTED.includes(ext)) {
      onError(`Unsupported file format '.${ext || 'unknown'}'. Please upload one of: ${ALL_SUPPORTED.join(', ').toUpperCase()}`);
      return;
    }

    // Check size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      onError(`File size (${formatFileSize(file.size)}) exceeds the maximum allowed limit of ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    if (file.size === 0) {
      onError('Selected file is empty. Please choose a valid recording.');
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const triggerBrowse = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.value = null;
      fileInputRef.current.click();
    }
  };

  const ext = selectedFile?.name?.split('.').pop()?.toLowerCase();
  const isVideo = SUPPORTED_VIDEO.includes(ext || '');

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".mp3,.wav,.m4a,.aac,.flac,.ogg,.wma,.wmv,.mp4,.webm,audio/*,video/*"
        onChange={handleFileInputChange}
        disabled={disabled}
      />

      {!selectedFile ? (
        /* Drag and Drop Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerBrowse}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer relative overflow-hidden group ${
            isDragging
              ? 'border-sky-500 bg-sky-50/80 scale-[1.01]'
              : 'border-sky-200 hover:border-sky-400 bg-white hover:bg-sky-50/30 shadow-sm hover:shadow-md'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {/* Decorative radial blur */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-sky-100 rounded-full blur-3xl opacity-60 pointer-events-none group-hover:opacity-100 transition-opacity"></div>

          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="w-20 h-20 mb-5 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white transition-all duration-200 shadow-inner">
              <UploadCloud className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Drag & Drop your audio or video file here
            </h3>
            <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
              Upload recordings in high quality. We'll extract speech and generate comprehensive structured AI summaries.
            </p>

            <button
              type="button"
              disabled={disabled}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md shadow-sky-600/25 hover:shadow-lg hover:shadow-sky-600/35 transition-all duration-150"
            >
              <UploadCloud className="w-4 h-4" />
              Browse Files
            </button>
          </div>
        </div>
      ) : (
        /* Selected File Card */
        <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-4 min-w-0">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                isVideo ? 'bg-indigo-50 text-indigo-600' : 'bg-sky-50 text-sky-600'
              }`}>
                {isVideo ? <FileVideo className="w-7 h-7" /> : <FileAudio className="w-7 h-7" />}
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-slate-900 truncate" title={selectedFile.name}>
                  {selectedFile.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{formatFileSize(selectedFile.size)}</span>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium text-slate-600 uppercase">
                    {ext}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Ready for AI
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={triggerBrowse}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                title="Replace with another file"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Replace
              </button>
              <button
                type="button"
                onClick={onFileRemove}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors disabled:opacity-50"
                title="Remove uploaded file"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          </div>

          {/* Audio Player Preview */}
          <AudioPreview file={selectedFile} />
        </div>
      )}

      {/* Supported Formats Section */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 px-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-500 flex-shrink-0" />
          <span>
            <b>Supported Audio:</b> {SUPPORTED_AUDIO.map(s => s.toUpperCase()).join(', ')}
          </span>
          <span className="text-slate-300">|</span>
          <span>
            <b>Supported Video:</b> {SUPPORTED_VIDEO.map(s => s.toUpperCase()).join(', ')} (Audio auto-extracted)
          </span>
        </div>
        <div>
          Max file size: <span className="font-semibold text-slate-700">{MAX_FILE_SIZE_MB}MB</span>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;

