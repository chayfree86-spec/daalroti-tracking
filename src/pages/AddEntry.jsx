import React, { useState, useRef, useEffect } from 'react';
import { Save, Wallet, Smartphone, MessageSquare, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatDate } from '../lib/utils';
import CustomCalendar from '../components/CustomCalendar';
import CustomAlert from '../components/CustomAlert';

const AddEntry = ({ onSave, editData, onCancel, entries = [] }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    cashIncome: '',
    onlineIncome: '',
    cashSpend: '',
    onlineSpend: '',
    incomeRemark: 'Income',
    spendRemark: 'Spend',
  });

  const [activeSuggestionField, setActiveSuggestionField] = useState(null);
  const uniqueRemarks = Array.from(new Set(entries.map(e => e.remark).filter(Boolean)));

  useEffect(() => {
    if (editData) {
      setFormData({
        date: editData.date,
        cashIncome: editData.cashIncome || '',
        onlineIncome: editData.onlineIncome || '',
        cashSpend: editData.cashSpend || '',
        onlineSpend: editData.onlineSpend || '',
        incomeRemark: editData.incomeRemark || editData.remark || 'Income',
        spendRemark: editData.spendRemark || editData.remark || 'Spend',
      });
    }
  }, [editData]);

  const changeDate = (days) => {
    const currentDate = new Date(formData.date);
    currentDate.setDate(currentDate.getDate() + days);
    setFormData(prev => ({ ...prev, date: currentDate.toISOString().split('T')[0] }));
  };

  const [showCalendar, setShowCalendar] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '' });

  const cashIncomeRef = useRef(null);
  const onlineIncomeRef = useRef(null);
  const incomeRemarkRef = useRef(null);
  const incomeSubmitRef = useRef(null);
  
  const cashSpendRef = useRef(null);
  const onlineSpendRef = useRef(null);
  const spendRemarkRef = useRef(null);
  const spendSubmitRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      if (activeSuggestionField) return;
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  const selectSuggestion = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setActiveSuggestionField(null);
  };

  const handleSaveIncome = (e) => {
    e.preventDefault();
    if (!formData.cashIncome && !formData.onlineIncome) {
        setAlert({
            show: true,
            type: 'error',
            title: 'Empty Income',
            message: 'Please enter at least one income amount.'
        });
        return;
    }
    
    const entry = {
      date: formData.date,
      cashIncome: formData.cashIncome,
      onlineIncome: formData.onlineIncome,
      cashSpend: '',
      onlineSpend: '',
      remark: formData.incomeRemark.trim() || 'Income',
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };
    onSave(entry);
    
    setFormData(prev => ({ 
      ...prev, 
      cashIncome: '', 
      onlineIncome: '', 
      incomeRemark: 'Income' 
    }));
    
    setAlert({
        show: true,
        type: 'success',
        title: 'Income Saved!',
        message: `Income entry for ${formatDate(formData.date)} recorded.`
    });
  };

  const handleSaveSpend = (e) => {
    e.preventDefault();
    if (!formData.cashSpend && !formData.onlineSpend) {
        setAlert({
            show: true,
            type: 'error',
            title: 'Empty Spend',
            message: 'Please enter at least one spend amount.'
        });
        return;
    }
    
    const entry = {
      date: formData.date,
      cashIncome: '',
      onlineIncome: '',
      cashSpend: formData.cashSpend,
      onlineSpend: formData.onlineSpend,
      remark: formData.spendRemark.trim() || 'Spend',
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };
    onSave(entry);
    
    setFormData(prev => ({ 
      ...prev, 
      cashSpend: '', 
      onlineSpend: '', 
      spendRemark: 'Spend' 
    }));

    setAlert({
        show: true,
        type: 'success',
        title: editData ? 'Spend Updated!' : 'Spend Saved!',
        message: `Spend entry for ${formatDate(formData.date)} recorded.`
    });
  };

  return (
    <div className="container mx-auto p-6 pt-12 space-y-8 max-w-5xl pb-24">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <h1 className="text-4xl font-black text-slate-800 tracking-tight">{editData ? 'Edit Entry' : 'Add Entry'}</h1>
             {editData && (
                <button 
                  onClick={onCancel}
                  className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
             )}
          </div>
          <p className="text-slate-400 font-bold text-sm uppercase">Daily Revenue Tracking</p>
        </div>

        <div className="space-y-2 min-w-[200px] flex flex-col items-end">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 justify-end">
            Entry Date
            <Calendar size={12} className="text-primary" />
          </label>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => changeDate(-1)}
              className="w-10 h-[50px] rounded-xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 transition-all shadow-premium"
            >
              <ChevronLeft size={18} />
            </button>
            
            <button
              type="button"
              onClick={() => setShowCalendar(true)}
              className="px-6 h-[50px] rounded-2xl bg-white border-2 border-slate-100 flex justify-end items-center gap-4 hover:border-primary/30 transition-all font-bold text-slate-700 shadow-premium min-w-[160px]"
            >
              <span>{formatDate(formData.date)}</span>
              <Calendar size={18} className="text-primary/40" />
            </button>

            <button 
              onClick={() => changeDate(1)}
              className="w-10 h-[50px] rounded-xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 transition-all shadow-premium"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
        <div className="bg-white p-8 rounded-[3rem] shadow-premium border border-slate-50 flex flex-col justify-between min-h-[450px]">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-income/10 text-income flex items-center justify-center">
                <Save size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Income Details</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  Cash Income
                  <Wallet size={12} className="text-primary" />
                </label>
                <input
                  ref={cashIncomeRef}
                  autoFocus
                  type="number"
                  name="cashIncome"
                  value={formData.cashIncome}
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => handleKeyDown(e, onlineIncomeRef)}
                  placeholder="0"
                  className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 h-[60px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  Online Income
                  <Smartphone size={12} className="text-income" />
                </label>
                <input
                  ref={onlineIncomeRef}
                  type="number"
                  name="onlineIncome"
                  value={formData.onlineIncome}
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => handleKeyDown(e, incomeRemarkRef)}
                  placeholder="0"
                  className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-income/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 h-[60px]"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-50 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                Remark / Reason
                <MessageSquare size={12} className="text-primary" />
              </label>
              <input
                ref={incomeRemarkRef}
                type="text"
                name="incomeRemark"
                value={formData.incomeRemark}
                onChange={handleChange}
                onFocus={(e) => {
                   e.target.select();
                   setActiveSuggestionField('income');
                }}
                onBlur={() => setTimeout(() => setActiveSuggestionField(null), 200)}
                onKeyDown={(e) => handleKeyDown(e, incomeSubmitRef)}
                placeholder="E.g. Salary, Gift, Bonus..."
                autoComplete="off"
                className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-income/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 h-[60px]"
              />
              
              <AnimatePresence>
                {activeSuggestionField === 'income' && uniqueRemarks.filter(r => r.toLowerCase().includes(formData.incomeRemark.toLowerCase())).length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 left-0 right-0 top-[100%] mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
                  >
                    {uniqueRemarks.filter(r => r.toLowerCase().includes(formData.incomeRemark.toLowerCase())).slice(0, 5).map((rem, i) => (
                      <button
                        key={i}
                        onClick={() => selectSuggestion('incomeRemark', rem)}
                        className="w-full text-left px-6 py-4 hover:bg-slate-50 font-bold text-slate-600 text-sm border-b border-slate-50 last:border-0 transition-colors"
                      >
                        {rem}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button
            ref={incomeSubmitRef}
            onClick={handleSaveIncome}
            className="w-full h-16 bg-income text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-income/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Save size={18} />
            {editData ? 'Update Income' : 'Save Income'}
          </button>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-premium border border-slate-50 flex flex-col justify-between min-h-[450px]">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-spend/10 text-spend flex items-center justify-center">
                <Save size={24} className="rotate-180" />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Spend Details</h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Cash Spend
                    <Wallet size={12} className="text-primary" />
                  </label>
                  <input
                    ref={cashSpendRef}
                    type="number"
                    name="cashSpend"
                    value={formData.cashSpend}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => handleKeyDown(e, onlineSpendRef)}
                    placeholder="0"
                    className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 h-[60px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Online Spend
                    <Smartphone size={12} className="text-spend" />
                  </label>
                  <input
                    ref={onlineSpendRef}
                    type="number"
                    name="onlineSpend"
                    value={formData.onlineSpend}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => handleKeyDown(e, spendRemarkRef)}
                    placeholder="0"
                    className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-spend/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 h-[60px]"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-50 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  Remark / Reason
                  <MessageSquare size={12} className="text-primary" />
                </label>
                <input
                  ref={spendRemarkRef}
                  type="text"
                  name="spendRemark"
                  value={formData.spendRemark}
                  onChange={handleChange}
                  onFocus={(e) => {
                     e.target.select();
                     setActiveSuggestionField('spend');
                  }}
                  onBlur={() => setTimeout(() => setActiveSuggestionField(null), 200)}
                  onKeyDown={(e) => handleKeyDown(e, spendSubmitRef)}
                  placeholder="E.g. Dinner, Salary, Rent..."
                  autoComplete="off"
                  className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 h-[60px]"
                />

                <AnimatePresence>
                  {activeSuggestionField === 'spend' && uniqueRemarks.filter(r => r.toLowerCase().includes(formData.spendRemark.toLowerCase())).length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 left-0 right-0 top-[100%] mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
                    >
                      {uniqueRemarks.filter(r => r.toLowerCase().includes(formData.spendRemark.toLowerCase())).slice(0, 5).map((rem, i) => (
                        <button
                          key={i}
                          onClick={() => selectSuggestion('spendRemark', rem)}
                          className="w-full text-left px-6 py-4 hover:bg-slate-50 font-bold text-slate-600 text-sm border-b border-slate-50 last:border-0 transition-colors"
                        >
                          {rem}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <button
            ref={spendSubmitRef}
            onClick={handleSaveSpend}
            className="mt-8 w-full h-[70px] rounded-3xl bg-spend text-white font-black text-lg shadow-xl shadow-spend/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 hover:brightness-110"
          >
            <Save size={24} className="rotate-180" />
            {editData ? 'Update Spend' : 'Save Spend'}
          </button>
        </div>
      </div>

      {showCalendar && (
        <CustomCalendar 
          selectedDate={formData.date}
          onSelect={(date) => setFormData(prev => ({ ...prev, date }))}
          onClose={() => setShowCalendar(false)}
        />
      )}

      <CustomAlert 
        show={alert.show}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={() => setAlert({ ...alert, show: false })}
      />
    </div>
  );
};

export default AddEntry;
