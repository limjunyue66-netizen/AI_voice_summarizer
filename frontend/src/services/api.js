import axios from 'axios';

// Automatically adapt baseURL for both Vite dev server (port 5173) and Apache / static hosting
const isViteDev = window.location.port === '5173';
const baseURL = isViteDev ? '/api' : 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: baseURL,
  timeout: 180000, // 3 minutes timeout for large audio transcribing
});

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const getApiSettings = async () => {
  const response = await api.get('/settings/get-keys');
  return response.data;
};

export const saveApiKeys = async (geminiKey, agnesKey) => {
  const response = await api.post('/settings/save-keys', {
    gemini_api_key: geminiKey,
    agnes_api_key: agnesKey,
  });
  return response.data;
};

export const testApiConnections = async (geminiKey, agnesKey, testTarget = 'all') => {
  const response = await api.post('/settings/test-connection', {
    gemini_api_key: geminiKey,
    agnes_api_key: agnesKey,
    test_target: testTarget,
  });
  return response.data;
};

export const processMedia = async (file, language, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('language', language);

  const response = await api.post('/process', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      }
    },
  });

  return response.data;
};

export const downloadSummaryPDF = async (payload) => {
  const response = await api.post('/download-pdf', payload, {
    responseType: 'blob',
  });

  // Create browser download URL
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const cleanName = (payload.filename || 'recording').replace(/\.[^/.]+$/, '');
  link.setAttribute('download', `Summary_${cleanName}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default api;

