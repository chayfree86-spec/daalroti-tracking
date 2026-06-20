import React, { useState, useEffect, useCallback, useRef } from 'react';
import Dashboard from './pages/Dashboard';
import AddEntry from './pages/AddEntry';
import History from './pages/History';
import Analytics from './pages/Analytics';
import BottomNav from './components/BottomNav';
import CustomAlert from './components/CustomAlert';
import { AnimatePresence, motion } from 'framer-motion';
import { getApiUrl, fetchEntries, fetchRev, createEntry, updateEntry, removeEntry, subscribeToChanges } from './lib/api';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { cn, normalizeEntry, timeIST } from './lib/utils';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingEntry, setEditingEntry] = useState(null);
  const [returnTab, setReturnTab] = useState('dashboard');
  // DB-direct: entries live in MySQL only — nothing is persisted to localStorage.
  const [entries, setEntries] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState('Never');
  const [highlightedEntryId, setHighlightedEntryId] = useState(null);
  const [appAlert, setAppAlert] = useState({ show: false, type: 'success', title: '', message: '' });

  // Refs mirror state so the stable SSE/poll callbacks read fresh values
  // without re-subscribing on every change.
  const isSyncingRef = useRef(false);
  const editingRef = useRef(false);
  useEffect(() => { isSyncingRef.current = isSyncing; }, [isSyncing]);
  useEffect(() => { editingRef.current = !!editingEntry; }, [editingEntry]);

  const handleTabChange = (tabId) => {
    // Always clear editing state when navigating via tabs, 
    // unless it's the 'add' tab and we are intentionally editing (which is handled by handleEdit)
    if (tabId !== 'add') {
      setEditingEntry(null);
    }
    setActiveTab(tabId);
  };

  // Load all entries directly from the database.
  const loadEntries = useCallback(async (showError = true) => {
    if (!getApiUrl()) return;
    try {
      const data = await fetchEntries();
      if (Array.isArray(data)) {
        setEntries(data.map(normalizeEntry));
      }
      setLastSynced(timeIST());
    } catch (error) {
      console.error('Load failed', error);
      if (showError) {
        setAppAlert({ show: true, type: 'error', title: 'Load Failed!', message: 'Server se data nahi aaya. Server URL/connection check karein.' });
      }
    }
  }, []);

  // Initial load on app mount. Also purge any legacy localStorage from the old
  // offline-first version — transaction data now lives only in the database.
  useEffect(() => {
    localStorage.removeItem('dr_entries');
    localStorage.removeItem('dr_last_sync');
    loadEntries();
  }, [loadEntries]);

  // MULTI-DEVICE SYNC: cheap "revision" polling (count + last-change time).
  // Every few seconds we fetch a tiny signature; only when it changes do we pull
  // the full dataset. Works everywhere incl. shared hosting. SSE (when enabled,
  // e.g. dev/VPS) adds instant push on top.
  const lastRevRef = useRef(null);
  useEffect(() => {
    if (!getApiUrl()) return;

    const refresh = () => {
      // Skip while saving or editing to avoid clobbering in-progress work.
      if (isSyncingRef.current || editingRef.current) return;
      loadEntries(false); // silent — no alert on transient failure
    };

    const checkRev = async () => {
      if (isSyncingRef.current || editingRef.current) return;
      try {
        const rev = await fetchRev();
        if (rev !== null && lastRevRef.current !== null && rev !== lastRevRef.current) {
          refresh();
        }
        if (rev !== null) lastRevRef.current = rev;
      } catch {
        // transient — ignore, try again next tick
      }
    };

    const unsubscribe = subscribeToChanges(refresh); // instant push (if SSE on)
    const interval = setInterval(checkRev, 4000);     // cheap rev poll (~4s)

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [loadEntries]);

  // Create or update an entry DIRECTLY in the database (no local persistence).
  const addEntry = async (entry) => {
    const wasEdit = !!editingEntry;
    const id = wasEdit ? editingEntry.id : entry.id;
    setIsSyncing(true);
    try {
      if (wasEdit) {
        await updateEntry(id, { ...entry, id });
      } else {
        await createEntry(entry);
      }
      await loadEntries();
      setAppAlert({
        show: true,
        type: 'success',
        title: (entry.cashIncome || entry.onlineIncome) ? 'Income Saved!' : 'Spend Saved!',
        message: 'Transaction database mein save ho gaya.',
      });
    } catch (error) {
      console.error('Save failed', error);
      setAppAlert({ show: true, type: 'error', title: 'Save Failed!', message: 'Database mein save nahi hua. Server connection check karein.' });
    } finally {
      setIsSyncing(false);
      if (wasEdit) setEditingEntry(null);
    }
  };

  const deleteEntry = (id) => {
    setDeleteConfirm({ show: true, id });
  };

  // Delete an entry DIRECTLY from the database.
  const confirmDelete = async () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ show: false, id: null });
    setIsSyncing(true);
    try {
      await removeEntry(id);
      await loadEntries();
      setAppAlert({ show: true, type: 'success', title: 'Deleted!', message: 'Entry database se hata di gayi.' });
    } catch (error) {
      console.error('Delete failed', error);
      setAppAlert({ show: true, type: 'error', title: 'Delete Failed!', message: 'Database se delete nahi hua. Server connection check karein.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEdit = (entry) => {
    setReturnTab(activeTab);
    setEditingEntry(entry);
    setActiveTab('add');
  };

  const SyncStatus = ({ compact }) => (
    <div className={cn(
      "px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all backdrop-blur-md self-center",
      isSyncing ? 'bg-primary/20 border-primary/30' : 'bg-slate-50/50 border-slate-100',
      compact ? "px-2 py-1" : ""
    )}>
      {isSyncing ? (
        <RefreshCw size={12} className="text-primary animate-spin" />
      ) : getApiUrl() ? (
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
            const wasEdit = !!editingEntry;
            // addEntry writes straight to the DB and shows its own success/error alert.
            addEntry(entry);
            if (wasEdit) {
              setTimeout(() => handleTabChange(returnTab), 100);
              setReturnTab('dashboard');
            }
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

      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

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
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: null })}
      />
    </div>
  );
}

export default App;
