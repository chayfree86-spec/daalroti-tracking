import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import AddEntry from './pages/AddEntry';
import History from './pages/History';
import BottomNav from './components/BottomNav';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem('dr_entries');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('dr_entries', JSON.stringify(entries));
  }, [entries]);

  const addEntry = (entry) => {
    setEntries([entry, ...entries]);
    setActiveTab('dashboard');
  };

  const deleteEntry = (id) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard entries={entries} setActiveTab={setActiveTab} />;
      case 'add':
        return <AddEntry onSave={addEntry} />;
      case 'reports':
        return <History entries={entries} onDelete={deleteEntry} />;
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

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
