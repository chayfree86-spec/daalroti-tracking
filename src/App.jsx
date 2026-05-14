import React, { useState, useEffect, useCallback, useRef } from 'react';
import Dashboard from './pages/Dashboard';
import AddEntry from './pages/AddEntry';
import History from './pages/History';
import Analytics from './pages/Analytics';
import BottomNav from './components/BottomNav';
import CustomAlert from './components/CustomAlert';
import { AnimatePresence, motion } from 'framer-motion';
import { getSyncUrl, setSyncUrl, fetchFromSheet, syncToSheet } from './lib/googleSheets';
import { Settings, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { cn, normalizeEntry } from './lib/utils';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingEntry, setEditingEntry] = useState(null);
  const [returnTab, setReturnTab] = useState('dashboard');
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('dr_entries');
      let parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.map(normalizeEntry) : [];
    } catch (e) {
      return [];
    }
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [showSettings, setShowSettings] = useState(false);
  const [syncUrlInput, setSyncUrlInput] = useState(getSyncUrl() || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(localStorage.getItem('dr_last_sync') || 'Never');
  const [highlightedEntryId, setHighlightedEntryId] = useState(null);
  const [appAlert, setAppAlert] = useState({ show: false, type: 'success', title: '', message: '' });
  const skipAutoSync = useRef(false);

  const handleTabChange = (tabId) => {
    // Always clear editing state when navigating via tabs, 
    // unless it's the 'add' tab and we are intentionally editing (which is handled by handleEdit)
    if (tabId !== 'add') {
      setEditingEntry(null);
    }
    setActiveTab(tabId);
  };

  // Sync Logic
  const handleSync = useCallback(async (dataToSync = entries) => {
    if (!getSyncUrl() || dataToSync.length === 0) return;
    setIsSyncing(true);

    // Calculate Running Balances before syncing so they appear in the Sheet
    const sortedForSync = [...dataToSync].sort((a, b) => {
      if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
      return a.id - b.id;
    });

    let runningCash = 0;
    let runningOnline = 0;
    const enrichedData = sortedForSync.map(entry => {
      runningCash += (Number(entry.cashIncome || 0) - Number(entry.cashSpend || 0));
      runningOnline += (Number(entry.onlineIncome || 0) - Number(entry.onlineSpend || 0));
      
      const rawEntry = {
        ...entry,
        cashBalance: runningCash,
        onlineBalance: runningOnline,
        totalBalance: runningCash + runningOnline
      };

      // Fix timestamp: convert numeric to readable string
      if (rawEntry.timestamp && typeof rawEntry.timestamp === 'number') {
        const ts = new Date(rawEntry.timestamp);
        rawEntry.timestamp = isNaN(ts.getTime()) 
          ? '' 
          : ts.toLocaleString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      }

      // Create a new object with all lowercase keys to match Google Sheet
      const syncEntry = {};
      Object.keys(rawEntry).forEach(key => {
        syncEntry[key.toLowerCase()] = rawEntry[key];
      });
      return syncEntry;
    });

    try {
      await syncToSheet(enrichedData);
      const now = new Date().toLocaleTimeString();
      setLastSynced(now);
      localStorage.setItem('dr_last_sync', now);
    } catch (error) {
      console.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [entries]);

  const handleFetch = async () => {
    if (!getSyncUrl()) return;
    setIsSyncing(true);
    try {
      const data = await fetchFromSheet();
      if (data && Array.isArray(data)) {
        const normalized = data.map(normalizeEntry);
        skipAutoSync.current = true; // Don't auto-sync fetched data back
        setEntries(normalized);
      }
    } catch (error) {
      console.error('Fetch failed');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('dr_entries', JSON.stringify(entries));

    // Skip auto-sync if this update came from a fetch
    if (skipAutoSync.current) {
      skipAutoSync.current = false;
      return;
    }

    // Auto-sync after 2 seconds of inactivity
    const timeout = setTimeout(() => {
      handleSync(entries);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [entries, handleSync]);

  const addEntry = (entry) => {
    setEntries(prevEntries => {
      if (editingEntry) {
        return prevEntries.map(e => e.id === editingEntry.id ? { ...entry, id: editingEntry.id } : e);
      }
      return [entry, ...prevEntries];
    });
    if (editingEntry) setEditingEntry(null);
  };

  const deleteEntry = (id) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = () => {
    setEntries(entries.filter(e => e.id !== deleteConfirm.id));
    setDeleteConfirm({ show: false, id: null });
  };

  const handleEdit = (entry) => {
    setReturnTab(activeTab);
    setEditingEntry(entry);
    setActiveTab('add');
  };

  const saveSettings = () => {
    setSyncUrl(syncUrlInput);
    setShowSettings(false);
    handleFetch(); // Initial fetch
  };

  const SyncStatus = ({ compact }) => (
    <div className={cn(
      "px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all backdrop-blur-md self-center",
      isSyncing ? 'bg-primary/20 border-primary/30' : 'bg-slate-50/50 border-slate-100',
      compact ? "px-2 py-1" : ""
    )}>
      {isSyncing ? (
        <RefreshCw size={12} className="text-primary animate-spin" />
      ) : getSyncUrl() ? (
        <Cloud size={12} className="text-income" />
      ) : (
        <CloudOff size={12} className="text-slate-300" />
      )}
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">
        {isSyncing ? 'Syncing...' : lastSynced}
      </span>
    </div>
  );

  const renderScreen = () => {
    const commonProps = { syncStatus: <SyncStatus /> };
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard entries={entries} setEntries={setEntries} setActiveTab={handleTabChange} onEntryClick={(id) => { setHighlightedEntryId(id); handleTabChange('reports'); }} {...commonProps} />;
      case 'add':
        return <AddEntry 
          entries={entries} 
          editData={editingEntry} 
          onSave={(entry) => {
            addEntry(entry);
            setAppAlert({
              show: true,
              type: 'success',
              title: entry.cashIncome || entry.onlineIncome ? 'Income Saved!' : 'Spend Saved!',
              message: 'Transaction has been recorded successfully.'
            });
            setTimeout(() => handleTabChange(returnTab), 100);
            setReturnTab('dashboard');
          }} 
          onCancel={() => {
            setEditingEntry(null);
            setTimeout(() => handleTabChange(returnTab), 100);
            setReturnTab('dashboard');
          }}
        />;
      case 'reports':
        return <History 
          entries={entries} 
          onDelete={deleteEntry} 
          onEdit={handleEdit}
          onSave={(entry) => {
            addEntry(entry);
            setTimeout(() => handleTabChange(returnTab), 100);
            setReturnTab('dashboard');
          }} 
          onCancel={() => {
            setEditingEntry(null);
            setTimeout(() => handleTabChange(returnTab), 100);
            setReturnTab('dashboard');
          }} 
          highlightedEntryId={highlightedEntryId} 
          setHighlightedEntryId={setHighlightedEntryId} 
          {...commonProps} 
        />;
      case 'analytics':
        return <Analytics entries={entries} {...commonProps} />;
      default:
        return <Dashboard entries={entries} setEntries={setEntries} setActiveTab={handleTabChange} onEntryClick={(id) => { setHighlightedEntryId(id); handleTabChange('reports'); }} {...commonProps} />;
    }
  };

  return (
    <div className={cn("min-h-screen bg-background transition-all duration-300 pb-24")}>


      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      {/* Page Footer - Show ONLY on Dashboard */}
      {activeTab === 'dashboard' && (
        <footer className="container mx-auto px-6 py-4 md:py-8 border-t border-slate-100 mt-2 md:mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xl shadow-lg">
                DR
              </div>
              <div>
                <h4 className="text-slate-800 font-black text-lg tracking-tight">DaalRoti Tracker</h4>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Premium Expense Management</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm"
              >
                <Settings size={14} />
                Sync Settings
              </button>
              <div className="text-slate-300 font-black text-[10px] uppercase tracking-widest">
                v2.4.0
              </div>
            </div>
          </div>
          <p className="text-center text-slate-300 font-bold text-[10px] uppercase tracking-widest mt-6">
            Designed for Clarity & Efficiency
          </p>
        </footer>
      )}

      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
      />

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 relative z-10 space-y-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Settings size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sync Settings</h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Connect Google Sheets</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 mb-2 block">Apps Script URL</label>
                  <input 
                    type="text" 
                    value={syncUrlInput}
                    onChange={(e) => setSyncUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/..."
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-slate-700 text-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed text-center px-4">
                  Paste your Google Apps Script Web App URL to sync data across devices.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveSettings}
                  className="flex-1 px-6 py-4 rounded-2xl bg-primary text-slate-900 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Save & Sync
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CustomAlert 
        show={appAlert.show}
        type={appAlert.type}
        title={appAlert.title}
        message={appAlert.message}
        onConfirm={() => setAppAlert({ ...appAlert, show: false })}
      />

      <CustomAlert 
        show={deleteConfirm.show}
        type="error"
        title="Delete Entry?"
        message="This action cannot be undone. Do you want to continue?"
        onConfirm={() => {
          setEntries(entries.filter(e => e.id !== deleteConfirm.id));
          setDeleteConfirm({ show: false, id: null });
          setAppAlert({
            show: true,
            type: 'success',
            title: 'Deleted!',
            message: 'Entry has been removed successfully.'
          });
        }}
        onCancel={() => setDeleteConfirm({ show: false, id: null })}
      />
    </div>
  );
}

export default App;
