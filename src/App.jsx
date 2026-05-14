import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './pages/Dashboard';
import AddEntry from './pages/AddEntry';
import History from './pages/History';
import Analytics from './pages/Analytics';
import BottomNav from './components/BottomNav';
import CustomAlert from './components/CustomAlert';
import { AnimatePresence, motion } from 'framer-motion';
import { getSyncUrl, setSyncUrl, fetchFromSheet, syncToSheet } from './lib/googleSheets';
import { Settings, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { cn } from './lib/utils';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingEntry, setEditingEntry] = useState(null);
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem('dr_entries');
    return saved ? JSON.parse(saved) : [];
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [showSettings, setShowSettings] = useState(false);
  const [syncUrlInput, setSyncUrlInput] = useState(getSyncUrl() || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(localStorage.getItem('dr_last_sync') || 'Never');
  const [highlightedEntryId, setHighlightedEntryId] = useState(null);

  const handleTabChange = (tabId) => {
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
      return {
        ...entry,
        cashBalance: runningCash,
        onlineBalance: runningOnline,
        totalBalance: runningCash + runningOnline
      };
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
        setEntries(data);
      }
    } catch (error) {
      console.error('Fetch failed');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('dr_entries', JSON.stringify(entries));
    // Auto-sync after 2 seconds of inactivity
    const timeout = setTimeout(() => {
      handleSync(entries);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [entries, handleSync]);

  const addEntry = (entry) => {
    if (editingEntry) {
      setEntries(entries.map(e => e.id === editingEntry.id ? { ...entry, id: editingEntry.id } : e));
      setEditingEntry(null);
    } else {
      setEntries([entry, ...entries]);
    }
    // Removed automatic redirect to keep user on the same page for continuous entry
  };

  const deleteEntry = (id) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = () => {
    setEntries(entries.filter(e => e.id !== deleteConfirm.id));
    setDeleteConfirm({ show: false, id: null });
  };

  const handleEdit = (entry) => {
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
        return <AddEntry entries={entries} setEntries={setEntries} editingEntry={editingEntry} onComplete={() => handleTabChange('dashboard')} />;
      case 'reports':
        return <History 
          entries={entries} 
          onDelete={deleteEntry} 
          onEdit={(entry) => { setEditingEntry(entry); handleTabChange('add'); }} 
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
    <div className="min-h-screen pb-24 bg-background">
      {/* Top Header Controls */}
      <div className="fixed top-4 right-4 z-50">
         <button 
           onClick={() => setShowSettings(true)}
           className="p-3 bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm"
         >
           <Settings size={18} />
         </button>
      </div>

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

      <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />

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
        show={deleteConfirm.show}
        type="error"
        title="Delete Entry?"
        message="This action cannot be undone. Do you want to continue?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: null })}
      />
    </div>
  );
}

export default App;
