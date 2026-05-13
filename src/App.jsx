import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import AddEntry from './pages/AddEntry';
import History from './pages/History';
import Analytics from './pages/Analytics';
import BottomNav from './components/BottomNav';
import CustomAlert from './components/CustomAlert';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingEntry, setEditingEntry] = useState(null);
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem('dr_entries');
    return saved ? JSON.parse(saved) : [];
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  const handleTabChange = (tabId) => {
    if (tabId !== 'add') {
      setEditingEntry(null);
    }
    setActiveTab(tabId);
  };

  useEffect(() => {
    localStorage.setItem('dr_entries', JSON.stringify(entries));
  }, [entries]);

  const addEntry = (entry) => {
    if (editingEntry) {
      setEntries(entries.map(e => e.id === editingEntry.id ? { ...entry, id: editingEntry.id } : e));
      setEditingEntry(null);
    } else {
      setEntries([entry, ...entries]);
    }
    setActiveTab('dashboard');
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

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard entries={entries} setActiveTab={setActiveTab} />;
      case 'analytics':
        return <Analytics entries={entries} />;
      case 'add':
        return <AddEntry onSave={addEntry} editData={editingEntry} onCancel={() => { setEditingEntry(null); setActiveTab('reports'); }} />;
      case 'reports':
        return <History entries={entries} onDelete={deleteEntry} onEdit={handleEdit} />;
      default:
        return <Dashboard entries={entries} />;
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
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
