import { useState, useEffect, useCallback, useRef } from 'react';
import Dashboard from './pages/Dashboard';
import AddEntry from './pages/AddEntry';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import BottomNav from './components/BottomNav';
import CustomAlert from './components/CustomAlert';
import SettingsModal from './components/SettingsModal';
import { AnimatePresence, motion } from 'framer-motion';
import { getApiUrl, fetchEntries, fetchRev, createEntry, updateEntry, removeEntry, subscribeToChanges } from './lib/api';
import { getCurrentUser } from './lib/auth';
import { useTheme } from './context/ThemeContext';
import { RefreshCw, Settings, SunMedium, Moon } from 'lucide-react';
import { cn, normalizeEntry } from './lib/utils';
import SteamBackground from './components/SteamBackground';

function App() {
  const { theme, setTheme, isDark } = useTheme();
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingEntry, setEditingEntry] = useState(null);
  const [returnTab, setReturnTab] = useState('dashboard');
  // DB-direct: entries live in MySQL only — nothing is persisted to localStorage.
  const [entries, setEntries] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [isSyncing, setIsSyncing] = useState(false);
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
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  // Ensure scroll position resets to top on every tab switch
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [activeTab]);

  // Load all entries directly from the database.
  const loadEntries = useCallback(async (showError = true) => {
    if (!getApiUrl()) return;
    try {
      const data = await fetchEntries();
      if (Array.isArray(data)) {
        setEntries(data.map(normalizeEntry));
      }
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
    const timer = setTimeout(() => {
      loadEntries();
    }, 0);
    return () => clearTimeout(timer);
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
    const wasEdit = !!editingEntry || entries.some(e => e.id === entry.id);
    const id = entry.id;
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
      if (editingEntry) setEditingEntry(null);
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

  const SyncStatus = () => (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      {isSyncing && (
        <div className="px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-1.5 transition-all">
          <RefreshCw size={12} className="text-primary animate-spin" />
          <span className="text-[9px] font-black uppercase tracking-wider text-primary whitespace-nowrap hidden sm:inline">
            Syncing...
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsSettingsOpen(true)}
        className="w-9 h-9 sm:w-auto sm:px-3 sm:h-9 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
        title="Settings & Security"
      >
        <Settings size={15} />
        <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Settings</span>
      </button>
    </div>
  );

  // If user is not authenticated, display Login screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background dark:bg-[#0b0f19] font-nunito transition-colors">
        <Login
          onLoginSuccess={(userData) => {
            setCurrentUser(userData);
            loadEntries();
          }}
        />
        <CustomAlert
          show={appAlert.show}
          type={appAlert.type}
          title={appAlert.title}
          message={appAlert.message}
          onConfirm={() => setAppAlert({ ...appAlert, show: false })}
        />
      </div>
    );
  }

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
          onEdit={handleEdit}
          onDelete={deleteEntry}
          {...commonProps}
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
    <div className={cn("min-h-screen bg-background dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-24 relative")}>
      <SteamBackground />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="relative z-10"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogoutSuccess={() => setCurrentUser(null)}
        onAlert={setAppAlert}
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
