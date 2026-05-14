const SYNC_URL_KEY = 'dr_sync_url';

export const getSyncUrl = () => localStorage.getItem(SYNC_URL_KEY) || '';
export const setSyncUrl = (url) => localStorage.setItem(SYNC_URL_KEY, url);

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
