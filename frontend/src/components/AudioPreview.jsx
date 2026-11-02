import React, { useEffect, useState } from 'react';
import { Volume2, PlayCircle, Video } from 'lucide-react';

const AudioPreview = ({ file }) => {
  const [audioUrl, setAudioUrl] = useState(null);
  const ext = file?.name?.split('.').pop()?.toLowerCase();
  const isVideo = ['wmv', 'mp4', 'webm'].includes(ext);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!file || !audioUrl) return null;

  if (isVideo) {
    return (
      <div className="mt-4 p-3 bg-sky-50/80 border border-sky-100 rounded-xl flex items-center gap-3 text-xs text-sky-800">
        <div className="w-8 h-8 rounded-lg bg-sky-200/60 flex items-center justify-center text-sky-700 flex-shrink-0">
          <Video className="w-4 h-4" />
        </div>
        <div>
          <span className="font-semibold block text-sky-900">Video Container Detected ({ext?.toUpperCase()})</span>
          <span className="text-sky-700">FFmpeg will automatically extract the clear audio track for speech recognition.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 bg-sky-50/80 border border-sky-100 rounded-xl">
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-sky-900">
        <Volume2 className="w-4 h-4 text-sky-600" />
        <span>Audio Player Preview</span>
      </div>
      <audio controls className="w-full h-9 rounded-lg outline-none" src={audioUrl}>
        Your browser does not support audio playback.
      </audio>
    </div>
  );
};

export default AudioPreview;

