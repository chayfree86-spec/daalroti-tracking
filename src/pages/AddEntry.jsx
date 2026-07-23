import React, { useState, useRef, useEffect } from 'react';
import { Save, Wallet, Smartphone, MessageSquare, Calendar, ChevronLeft, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatDate, toTitleCase, todayIST, nowIST, formatCurrency } from '../lib/utils';
import CustomCalendar from '../components/CustomCalendar';
import CustomAlert from '../components/CustomAlert';

// Time part of a timestamp like "17/06/2026, 22:57:53" -> "22:57"
const timePart = (ts) => {
  const m = String(ts || '').match(/(\d{1,2}:\d{2})(:\d{2})?/);
  return m ? m[1] : '';
};

const AddEntry = ({ onSave, editData, onCancel, entries = [], onEdit, onDelete }) => {
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

  // Guards so a background `entries` refresh (multi-device sync) never wipes what
  // the user is actively typing. `dirtyRef` = user has touched a field since the
  // last (re)init; `prevDateRef`/`prevEditRef` detect a real context switch.
  const dirtyRef = useRef(false);
  const prevDateRef = useRef(null);
  const prevEditRef = useRef(undefined);

  const [activeSuggestionField, setActiveSuggestionField] = useState(null);
  const uniqueRemarks = Array.from(new Set(entries.map(e => e.remark).filter(Boolean)));

  const selectedMonthStr = formData.date.slice(0, 7);
  const monthName = new Date(formData.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' });

  const totalIncomeForMonth = entries
    .filter(e => e.date && e.date.startsWith(selectedMonthStr))
    .reduce((sum, e) => sum + Number(e.cashIncome || 0) + Number(e.onlineIncome || 0), 0);

  const totalSpendForMonth = entries
    .filter(e => e.date && e.date.startsWith(selectedMonthStr))
    .reduce((sum, e) => sum + Number(e.cashSpend || 0) + Number(e.onlineSpend || 0), 0);

  // This date's individual transactions, split by type, for the lists below each card.
  const dayIncomeEntries = entries.filter(e => e.date === formData.date && (Number(e.cashIncome || 0) > 0 || Number(e.onlineIncome || 0) > 0));
  const daySpendEntries = entries.filter(e => e.date === formData.date && (Number(e.cashSpend || 0) > 0 || Number(e.onlineSpend || 0) > 0));

  useEffect(() => {
    const dateChanged = prevDateRef.current !== formData.date;
    const editChanged = prevEditRef.current !== editData;
    prevDateRef.current = formData.date;
    prevEditRef.current = editData;

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
      dirtyRef.current = false;
    } else {
      // Re-init only on a real context switch (date/edit change) or while the form
      // is still pristine — so a background sync never clobbers in-progress typing.
      if (!dateChanged && !editChanged && dirtyRef.current) return;

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
      dirtyRef.current = false;
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
    dirtyRef.current = true; // user is typing — protect from background-sync resets
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
    dirtyRef.current = true;
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

  // List of this date's transactions of one type, shown below its card.
  const renderDayList = (list, kind) => {
    const isIncome = kind === 'income';
    const emptyLabel = isIncome ? 'Is date ke liye koi income entry nahi hai' : 'Is date ke liye koi spend entry nahi hai';
    return (
      <div className="bg-white p-6 rounded-[2rem] shadow-premium border border-slate-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {formatDate(formData.date)} · {isIncome ? 'Income' : 'Spend'} Entries
          </h3>
          <span className={cn(
            "text-[10px] font-black px-2 py-1 rounded-lg",
            isIncome ? "text-income bg-income/10" : "text-spend bg-spend/10"
          )}>
            {list.length}
          </span>
        </div>

        {list.length === 0 ? (
          <p className="text-xs font-bold text-slate-300 text-center py-6">{emptyLabel}</p>
        ) : (
          <div className="space-y-2">
            {list.map((entry) => {
              const cashAmt = Number(isIncome ? entry.cashIncome : entry.cashSpend) || 0;
              const onlineAmt = Number(isIncome ? entry.onlineIncome : entry.onlineSpend) || 0;
              const total = cashAmt + onlineAmt;
              return (
                <div key={entry.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/60 border border-slate-100">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-600 truncate">{entry.remark || (isIncome ? 'Income' : 'Spend')}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {cashAmt > 0 && (
                        <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          <Wallet size={9} /> {formatCurrency(cashAmt)}
                        </span>
                      )}
                      {onlineAmt > 0 && (
                        <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          <Smartphone size={9} /> {formatCurrency(onlineAmt)}
                        </span>
                      )}
                      {timePart(entry.timestamp) && (
                        <span className="text-[8px] font-bold text-slate-300">{timePart(entry.timestamp)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={cn("text-sm font-black mr-1", isIncome ? "text-income" : "text-spend")}>
                      {isIncome ? '+' : '-'}{formatCurrency(total)}
                    </span>
                    {onEdit && (
                      <button type="button" onClick={() => onEdit(entry)} className="p-1.5 text-slate-200 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg">
                        <Edit3 size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button type="button" onClick={() => onDelete(entry.id)} className="p-1.5 text-slate-200 hover:text-spend transition-colors hover:bg-spend/5 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
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
        <div className="order-2 md:order-1 space-y-6">
        <form onSubmit={handleSaveIncome} className="bg-white p-8 rounded-[3rem] shadow-premium border border-slate-50 flex flex-col justify-between min-h-[450px]">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-income/10 text-income flex items-center justify-center">
                <Save size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Income Details</h2>
                <p className="text-[10px] font-black text-income mt-0.5 uppercase tracking-wider">
                  {monthName} Total: +{formatCurrency(totalIncomeForMonth)}
                </p>
              </div>
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
        {renderDayList(dayIncomeEntries, 'income')}
        </div>
        )}

        {(!editData || (editData.cashSpend || editData.onlineSpend)) && (
        <div className="order-1 md:order-2 space-y-6">
        <form onSubmit={handleSaveSpend} className="bg-white p-8 rounded-[3rem] shadow-premium border border-slate-50 flex flex-col justify-between min-h-[450px]">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-spend/10 text-spend flex items-center justify-center">
                <Save size={24} className="rotate-180" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Spend Details</h2>
                <p className="text-[10px] font-black text-spend mt-0.5 uppercase tracking-wider">
                  {monthName} Total: -{formatCurrency(totalSpendForMonth)}
                </p>
              </div>
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
        {renderDayList(daySpendEntries, 'spend')}
        </div>
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
