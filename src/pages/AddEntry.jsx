import React, { useState, useRef, useEffect } from 'react';
import { Save, Wallet, Smartphone, MessageSquare, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatDate, toTitleCase, todayIST, nowIST } from '../lib/utils';
import CustomCalendar from '../components/CustomCalendar';
import CustomAlert from '../components/CustomAlert';

const AddEntry = ({ onSave, editData, onCancel, entries = [] }) => {
  const [formData, setFormData] = useState({
    date: todayIST(),
    cashIncome: '',
    onlineIncome: '',
    cashSpend: '',
    onlineSpend: '',
    incomeRemark: 'Income',
    spendRemark: 'Spend',
  });

  const [existingIncomeId, setExistingIncomeId] = useState(null);
  const [existingSpendId, setExistingSpendId] = useState(null);

  const [activeSuggestionField, setActiveSuggestionField] = useState(null);
  const uniqueRemarks = Array.from(new Set(entries.map(e => e.remark).filter(Boolean)));

  useEffect(() => {
    if (editData) {
      setFormData({
        date: editData.date || todayIST(),
        cashIncome: editData.cashIncome !== undefined && editData.cashIncome !== null && editData.cashIncome !== '' ? String(editData.cashIncome) : '',
        onlineIncome: editData.onlineIncome !== undefined && editData.onlineIncome !== null && editData.onlineIncome !== '' ? String(editData.onlineIncome) : '',
        cashSpend: editData.cashSpend !== undefined && editData.cashSpend !== null && editData.cashSpend !== '' ? String(editData.cashSpend) : '',
        onlineSpend: editData.onlineSpend !== undefined && editData.onlineSpend !== null && editData.onlineSpend !== '' ? String(editData.onlineSpend) : '',
        incomeRemark: editData.incomeRemark || editData.remark || 'Income',
        spendRemark: editData.spendRemark || editData.remark || 'Spend',
      });
      if (Number(editData.cashIncome || 0) > 0 || Number(editData.onlineIncome || 0) > 0) {
        setExistingIncomeId(editData.id);
        setExistingSpendId(null);
      } else {
        setExistingSpendId(editData.id);
        setExistingIncomeId(null);
      }
    } else {
      const existingIncome = entries.find(e => e.date === formData.date && (Number(e.cashIncome || 0) > 0 || Number(e.onlineIncome || 0) > 0));

      setFormData(prev => ({
        ...prev,
        cashIncome: existingIncome ? String(existingIncome.cashIncome || '') : '',
        onlineIncome: existingIncome ? String(existingIncome.onlineIncome || '') : '',
        incomeRemark: existingIncome ? (existingIncome.remark || 'Income') : 'Income',
        cashSpend: '',
        onlineSpend: '',
        spendRemark: 'Spend',
      }));
      setExistingIncomeId(existingIncome ? existingIncome.id : null);
      setExistingSpendId(null);
    }
  }, [editData, formData.date, entries]);

  const changeDate = (days) => {
    // Parse as local midnight (NOT UTC) so day arithmetic never shifts by a day.
    const [y, m, d] = formData.date.split('-').map(Number);
    const current = new Date(y, m - 1, d);
    current.setDate(current.getDate() + days);
    const ny = current.getFullYear();
    const nm = String(current.getMonth() + 1).padStart(2, '0');
    const nd = String(current.getDate()).padStart(2, '0');
    setFormData(prev => ({ ...prev, date: `${ny}-${nm}-${nd}` }));
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
      
      // If it's a button, click it. Otherwise focus.
      if (nextRef.current?.tagName === 'BUTTON') {
        nextRef.current.click();
      } else {
        nextRef.current?.focus();
      }
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
      remark: toTitleCase(formData.incomeRemark.trim()) || 'Income',
      id: existingIncomeId || Date.now(),
      timestamp: nowIST(),
    };
    onSave(entry);
    
    setFormData(prev => ({ 
      ...prev, 
      cashIncome: '', 
      onlineIncome: '', 
      incomeRemark: 'Income' 
    }));
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
      remark: toTitleCase(formData.spendRemark.trim()) || 'Spend',
      id: existingSpendId || Date.now(),
      timestamp: nowIST(),
    };
    onSave(entry);
    
    setFormData(prev => ({ 
      ...prev, 
      cashSpend: '', 
      onlineSpend: '', 
      spendRemark: 'Spend' 
    }));
  };

  return (
    <div className="container mx-auto p-6 pt-6 max-w-4xl">
      <header className="bg-white p-6 rounded-[2.5rem] shadow-premium border border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{editData ? 'Edit Entry' : 'Add Entry'}</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase mt-0.5 tracking-wider">Daily Revenue Tracking</p>
          </div>
          {editData && (
             <button 
               onClick={onCancel}
               className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
             >
               Cancel
             </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entry Date</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => changeDate(-1)}
                className="w-10 h-[50px] rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              
              <button
                type="button"
                onClick={() => setShowCalendar(true)}
                className="px-6 h-[50px] rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center gap-4 hover:border-primary/30 transition-all font-bold text-slate-700 min-w-[160px]"
              >
                <span className="text-sm">{formatDate(formData.date)}</span>
                <Calendar size={18} className="text-primary/40" />
              </button>

              <button 
                onClick={() => changeDate(1)}
                className="w-10 h-[50px] rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conditional Forms Rendering */}
      <div className={cn(
        "grid gap-8 animate-fade-in",
        (!editData) ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 max-w-2xl mx-auto"
      )}>
        {(!editData || (editData.cashIncome || editData.onlineIncome)) && (
        <form onSubmit={handleSaveIncome} className="order-2 md:order-1 bg-white p-8 rounded-[3rem] shadow-premium border border-slate-50 flex flex-col justify-between min-h-[450px]">
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
                  autoFocus={!!(editData && (editData.cashIncome || editData.onlineIncome))}
                  type="number"
                  name="cashIncome"
                  value={formData.cashIncome}
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => handleKeyDown(e, onlineIncomeRef)}
                  onWheel={(e) => e.target.blur()}
                  placeholder="0"
                  inputMode="decimal"
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
                  onWheel={(e) => e.target.blur()}
                  placeholder="0"
                  inputMode="decimal"
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
                        type="button"
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
            type="submit"
            className="w-full h-16 bg-income text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-income/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Save size={18} />
            {editData ? 'Update Income' : 'Save Income'}
          </button>
        </form>
        )}

        {(!editData || (editData.cashSpend || editData.onlineSpend)) && (
        <form onSubmit={handleSaveSpend} className="order-1 md:order-2 bg-white p-8 rounded-[3rem] shadow-premium border border-slate-50 flex flex-col justify-between min-h-[450px]">
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
                    onWheel={(e) => e.target.blur()}
                    placeholder="0"
                    inputMode="decimal"
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
                    autoFocus={!editData || !!(editData.cashSpend || editData.onlineSpend)}
                    type="number"
                    name="onlineSpend"
                    value={formData.onlineSpend}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => handleKeyDown(e, spendRemarkRef)}
                    onWheel={(e) => e.target.blur()}
                    placeholder="0"
                    inputMode="decimal"
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
                          type="button"
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
            type="submit"
            className="mt-8 w-full h-[70px] rounded-3xl bg-spend text-white font-black text-lg shadow-xl shadow-spend/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 hover:brightness-110"
          >
            <Save size={20} className="rotate-180" />
            {editData ? 'Update Spend' : 'Save Spend'}
          </button>
        </form>
        )}
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
