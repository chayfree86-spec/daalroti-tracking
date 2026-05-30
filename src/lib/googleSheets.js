const SYNC_URL_KEY = 'dr_sync_url';
const DEFAULT_SYNC_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL
  || 'https://script.google.com/macros/s/AKfycbwFDwYOR4LaNQlxoUyNgt0TW9ugyb0Ea64ay3lNvWWCUTfZXEPcxKfkp7OK5djwMhA/exec';

export const getSyncUrl = () => {
  const savedUrl = localStorage.getItem(SYNC_URL_KEY);
  return savedUrl?.trim() || DEFAULT_SYNC_URL.trim();
};

export const setSyncUrl = (url) => {
  const cleanUrl = url?.trim() || '';
  if (cleanUrl) {
    localStorage.setItem(SYNC_URL_KEY, cleanUrl);
  } else {
    localStorage.removeItem(SYNC_URL_KEY);
  }
};

export const fetchFromSheet = async () => {
  const url = getSyncUrl();
  if (!url) return null;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export const syncToSheet = async (entries) => {
  const url = getSyncUrl();
  if (!url) return null;

  try {
    // We use a simple fetch. Google Apps Script requires a redirect, 
    // and standard CORS can be tricky with doPost.
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(entries),
    });
    return true;
  } catch (error) {
    console.error('Sync error:', error);
    throw error;
  }
};
