import React, { useState, useRef, useEffect } from 'react';
import { Save, Wallet, Smartphone, MessageSquare, Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Edit3, Trash2, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatDate, toTitleCase, todayIST, nowIST, formatCurrency } from '../lib/utils';
import CustomCalendar from '../components/CustomCalendar';
import CustomAlert from '../components/CustomAlert';

// Transparent modern colorful pastel palette for Quick Chips
const pillColorStyles = [
  'bg-amber-500/10 text-amber-900 border-amber-300/60 hover:bg-amber-500/20',
  'bg-blue-500/10 text-blue-900 border-blue-300/60 hover:bg-blue-500/20',
  'bg-emerald-500/10 text-emerald-900 border-emerald-300/60 hover:bg-emerald-500/20',
  'bg-purple-500/10 text-purple-900 border-purple-300/60 hover:bg-purple-500/20',
  'bg-rose-500/10 text-rose-900 border-rose-300/60 hover:bg-rose-500/20',
  'bg-indigo-500/10 text-indigo-900 border-indigo-300/60 hover:bg-indigo-500/20',
  'bg-teal-500/10 text-teal-900 border-teal-300/60 hover:bg-teal-500/20',
  'bg-orange-500/10 text-orange-900 border-orange-300/60 hover:bg-orange-500/20',
  'bg-cyan-500/10 text-cyan-900 border-cyan-300/60 hover:bg-cyan-500/20',
  'bg-fuchsia-500/10 text-fuchsia-900 border-fuchsia-300/60 hover:bg-fuchsia-500/20',
];

// Time part of a timestamp like "17/06/2026, 22:57:53" -> "22:57"
const timePart = (ts) => {
  const m = String(ts || '').match(/(\d{1,2}:\d{2})(:\d{2})?/);
  return m ? m[1] : '';
};

const AddEntry = ({ onSave, editData, onCancel, entries = [], onEdit, onDelete }) => {
  const [entryMode, setEntryMode] = useState('spend'); // 'spend' (Frequent default) or 'income'
  const [isDayListExpanded, setIsDayListExpanded] = useState(false); // Toggle to show current date's detail transactions
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

  // Dynamic top & frequently used spend remarks computed from transaction history + user's core vendor list
  const topSpendRemarks = React.useMemo(() => {
    const priorityDefaults = ['Ravikant Kirana', 'Amarchand Kirana', 'Trilokinath', 'Sip'];
    const counts = {};
    
    entries.forEach(e => {
      // Check spend entries
      if (Number(e.cashSpend || 0) > 0 || Number(e.onlineSpend || 0) > 0 || e.cashDelta < 0 || e.onlineDelta < 0) {
        const r = (e.remark || '').trim();
        if (r && r.toLowerCase() !== 'spend' && r.toLowerCase() !== 'income') {
          counts[r] = (counts[r] || 0) + 1;
        }
      }
    });

    // Sort by actual usage frequency
    const sortedFromHistory = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    
    // Combine priority vendor defaults + sorted history remarks (deduplicated)
    const seen = new Set();
    const result = [];

    // Core priority vendors
    for (const item of priorityDefaults) {
      const key = item.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }

    // Top frequently used remarks from user's history
    for (const item of sortedFromHistory) {
      const key = item.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }

    return result.slice(0, 8); // Top 8 most used chips
  }, [entries]);

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

  const dayIncomeTotal = dayIncomeEntries.reduce((sum, e) => sum + Number(e.cashIncome || 0) + Number(e.onlineIncome || 0), 0);
  const daySpendTotal = daySpendEntries.reduce((sum, e) => sum + Number(e.cashSpend || 0) + Number(e.onlineSpend || 0), 0);

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
      const isInc = Number(editData.cashIncome || 0) > 0 || Number(editData.onlineIncome || 0) > 0;
      setEntryMode(isInc ? 'income' : 'spend');
      if (isInc) {
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

  // List of this date's transactions of one type, with clean expandable container and safe touch-friendly action buttons
  const renderDayList = (list, kind) => {
    const isIncome = kind === 'income';
    const emptyLabel = isIncome ? 'No income recorded for this date' : 'No expenses recorded for this date';
    const dayTotal = list.reduce((sum, entry) => {
      const cashAmt = Number(isIncome ? entry.cashIncome : entry.cashSpend) || 0;
      const onlineAmt = Number(isIncome ? entry.onlineIncome : entry.onlineSpend) || 0;
      return sum + cashAmt + onlineAmt;
    }, 0);

    return (
      <div className="bg-white rounded-[2rem] shadow-premium border border-slate-100 overflow-hidden transition-all">
        {/* Clickable Header Card that reveals today's detail transactions */}
        <button
          type="button"
          onClick={() => setIsDayListExpanded(!isDayListExpanded)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0",
              isIncome ? "bg-income/10 text-income" : "bg-spend/10 text-spend"
            )}>
              {list.length}
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-800 tracking-tight">
                {formatDate(formData.date)} · {isIncome ? 'Income' : 'Expenses'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400">
                {list.length > 0 ? (isDayListExpanded ? 'Tap to hide detail entries' : 'Tap to view detail entries') : 'No entries recorded'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {list.length > 0 && (
              <span className={cn(
                "text-xs sm:text-sm font-black px-3 py-1.5 rounded-xl border shadow-xs",
                isIncome ? "text-income bg-income/10 border-income/20" : "text-spend bg-spend/10 border-spend/20"
              )}>
                {isIncome ? '+' : '-'}{formatCurrency(dayTotal)}
              </span>
            )}
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              {isDayListExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        </button>

        {/* Expanded Transaction Details */}
        {isDayListExpanded && (
          <div className="p-4 sm:p-5 pt-0 border-t border-slate-100/80 bg-slate-50/50 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="pt-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>{formatDate(formData.date)} Entries ({list.length})</span>
              <span>Day Total: {isIncome ? '+' : '-'}{formatCurrency(dayTotal)}</span>
            </div>

            {list.length === 0 ? (
              <p className="text-xs font-bold text-slate-300 text-center py-6">{emptyLabel}</p>
            ) : (
              list.map((entry) => {
                const cashAmt = Number(isIncome ? entry.cashIncome : entry.cashSpend) || 0;
                const onlineAmt = Number(isIncome ? entry.onlineIncome : entry.onlineSpend) || 0;
                const total = cashAmt + onlineAmt;
                return (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-100 shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-black text-slate-700 truncate">
                        {entry.remark || (isIncome ? 'Income' : 'Spend')}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {cashAmt > 0 && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-lg">
                            <Wallet size={10} /> {formatCurrency(cashAmt)}
                          </span>
                        )}
                        {onlineAmt > 0 && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-lg">
                            <Smartphone size={10} /> {formatCurrency(onlineAmt)}
                          </span>
                        )}
                        {timePart(entry.timestamp) && (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                            {timePart(entry.timestamp)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className={cn("text-sm sm:text-base font-black tracking-tight mr-1", isIncome ? "text-income" : "text-spend")}>
                        {isIncome ? '+' : '-'}{formatCurrency(total)}
                      </span>
                      
                      {/* Generous Safe Mobile Touch Target Action Buttons */}
                      {onEdit && (
                        <button 
                          type="button" 
                          onClick={() => onEdit(entry)} 
                          className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center cursor-pointer active:scale-90 shadow-xs"
                          title="Edit Entry"
                        >
                          <Edit3 size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          type="button" 
                          onClick={() => onDelete(entry.id)} 
                          className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center cursor-pointer active:scale-90 shadow-xs"
                          title="Delete Entry"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-3 sm:px-6 pb-6 max-w-4xl">
      {/* Sticky Mobile-Touch Optimized Header */}
      <div className="sticky top-0 z-30 -mx-3 px-3 sm:-mx-6 sm:px-6 pt-2 pb-3 sm:pt-4 sm:pb-4 bg-background/90 backdrop-blur-md">
        <header className="bg-white/95 backdrop-blur-xl px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100/90 flex items-center justify-between gap-2.5 min-h-[52px] sm:min-h-[56px] transition-all">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div>
              <h1 className="text-sm sm:text-base font-black text-slate-800 tracking-tight leading-tight">
                {editData ? 'Edit Entry' : 'Add Entry'}
              </h1>
              <p className="text-slate-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider hidden sm:block">
                Daily Revenue
              </p>
            </div>
            {editData && (
              <button 
                onClick={onCancel}
                className="bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Mobile Touch-Friendly Calendar & Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              type="button"
              onClick={() => changeDate(-1)}
              className="w-10 h-10 sm:w-10 sm:h-10 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/70 flex items-center justify-center text-slate-600 hover:text-primary transition-all active:scale-90 cursor-pointer shrink-0"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft size={18} />
            </button>
            
            <button
              type="button"
              onClick={() => setShowCalendar(true)}
              className="h-10 sm:h-10 px-3.5 sm:px-4 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/70 flex items-center gap-2 hover:border-primary/40 transition-all font-black text-xs sm:text-sm text-slate-800 shadow-sm active:scale-95 cursor-pointer"
              title="Open Calendar"
            >
              <span className="whitespace-nowrap">{formatDate(formData.date)}</span>
              <Calendar size={16} className="text-primary shrink-0" />
            </button>

            <button 
              type="button"
              onClick={() => changeDate(1)}
              className="w-10 h-10 sm:w-10 sm:h-10 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/70 flex items-center justify-center text-slate-600 hover:text-primary transition-all active:scale-90 cursor-pointer shrink-0"
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </header>
      </div>

      {/* Top Segmented Mode Switcher (Clean, Modern & Mobile Touch-Friendly) */}
      {!editData && (
        <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/80 mb-5 sm:mb-6 max-w-md mx-auto shadow-inner gap-1.5">
          <button
            type="button"
            onClick={() => {
              setEntryMode('spend');
              setTimeout(() => (onlineSpendRef.current || cashSpendRef.current)?.focus(), 50);
            }}
            className={cn(
              "min-h-[48px] sm:min-h-[52px] px-3 sm:px-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2.5 transition-all cursor-pointer select-none active:scale-95",
              entryMode === 'spend'
                ? "bg-spend text-white shadow-md shadow-spend/30 ring-2 ring-spend/20 font-black"
                : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60"
            )}
          >
            <div className={cn(
              "w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors shrink-0",
              entryMode === 'spend' ? "bg-white/20 text-white" : "bg-rose-100 text-spend"
            )}>
              <ArrowDownRight size={16} />
            </div>
            <span className="truncate">Add Expense</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEntryMode('income');
              setTimeout(() => (cashIncomeRef.current || onlineIncomeRef.current)?.focus(), 50);
            }}
            className={cn(
              "min-h-[48px] sm:min-h-[52px] px-3 sm:px-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2.5 transition-all cursor-pointer select-none active:scale-95",
              entryMode === 'income'
                ? "bg-income text-white shadow-md shadow-income/30 ring-2 ring-income/20 font-black"
                : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60"
            )}
          >
            <div className={cn(
              "w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors shrink-0",
              entryMode === 'income' ? "bg-white/20 text-white" : "bg-emerald-100 text-income"
            )}>
              <ArrowUpRight size={16} />
            </div>
            <span className="truncate">Daily Income</span>
          </button>
        </div>
      )}

      {/* Main Form Rendering based on Active Mode */}
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* ================= SPEND FORM (DEFAULT) ================= */}
        {entryMode === 'spend' && (
          <div className="space-y-4 sm:space-y-6">
            <form onSubmit={handleSaveSpend} className="bg-white p-5 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] shadow-premium border border-slate-50 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-spend/10 text-spend flex items-center justify-center">
                      <ArrowDownRight size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">Record Expense / Spend</h2>
                      <p className="text-[11px] font-black text-spend uppercase tracking-wider mt-0.5">
                        Date Total: -{formatCurrency(daySpendTotal)} ({daySpendEntries.length} {daySpendEntries.length === 1 ? 'item' : 'items'})
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      Online Spend (UPI / Bank)
                      <Smartphone size={12} className="text-spend" />
                    </label>
                    <input
                      ref={onlineSpendRef}
                      autoFocus={true}
                      type="number"
                      name="onlineSpend"
                      value={formData.onlineSpend}
                      onChange={handleChange}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => handleKeyDown(e, cashSpendRef)}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0"
                      inputMode="decimal"
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-spend/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 h-[50px] text-base"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      Cash Spend (In Hand)
                      <Wallet size={12} className="text-primary" />
                    </label>
                    <input
                      ref={cashSpendRef}
                      type="number"
                      name="cashSpend"
                      value={formData.cashSpend}
                      onChange={handleChange}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => handleKeyDown(e, spendRemarkRef)}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0"
                      inputMode="decimal"
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 h-[50px] text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-50 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    Expense Reason / Item Name
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
                    placeholder="E.g. Kirana, Sabji, Doodh, Gas, Wages..."
                    autoComplete="off"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-spend/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 h-[50px]"
                  />

                  {/* Fast Mobile-Optimized 1-Tap Expense Suggestion Chips */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Quick Select:</span>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                      {topSpendRemarks.map((chip, idx) => {
                        const colorStyle = pillColorStyles[idx % pillColorStyles.length];
                        const isSelected = formData.spendRemark === chip;
                        return (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => selectSuggestion('spendRemark', chip)}
                            className={cn(
                              "min-h-[42px] sm:min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer border shadow-xs active:scale-95 flex items-center justify-center",
                              isSelected
                                ? "bg-spend text-white border-spend shadow-md shadow-spend/30 font-black scale-105"
                                : colorStyle
                            )}
                          >
                            {chip}
                          </button>
                        );
                      })}
                    </div>
                  </div>

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
                            className="w-full text-left px-5 py-3 hover:bg-slate-50 font-bold text-slate-600 text-sm border-b border-slate-50 last:border-0 transition-colors cursor-pointer"
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
                ref={spendSubmitRef}
                type="submit"
                className="mt-6 w-full h-12 sm:h-14 min-h-[48px] sm:min-h-[54px] bg-spend hover:bg-spend-dark active:bg-spend-dark text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.15em] shadow-lg shadow-spend/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0"
              >
                <Save size={18} className="rotate-180" />
                <span>{editData ? 'Update Expense' : 'Save Expense'}</span>
              </button>
            </form>

            {renderDayList(daySpendEntries, 'spend')}
          </div>
        )}

        {/* ================= INCOME FORM (1 / DAY) ================= */}
        {entryMode === 'income' && (
          <div className="space-y-4 sm:space-y-6">
            <form onSubmit={handleSaveIncome} className="bg-white p-5 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] shadow-premium border border-slate-50 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-income/10 text-income flex items-center justify-center">
                    <ArrowUpRight size={20} />
                  </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">Record Daily Income</h2>
                      <p className="text-[11px] font-black text-income uppercase tracking-wider mt-0.5">
                        Date Total: +{formatCurrency(dayIncomeTotal)} ({dayIncomeEntries.length} {dayIncomeEntries.length === 1 ? 'item' : 'items'})
                      </p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      Cash Income (Collection)
                      <Wallet size={12} className="text-primary" />
                    </label>
                    <input
                      ref={cashIncomeRef}
                      autoFocus={true}
                      type="number"
                      name="cashIncome"
                      value={formData.cashIncome}
                      onChange={handleChange}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => handleKeyDown(e, onlineIncomeRef)}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0"
                      inputMode="decimal"
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 h-[50px] text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      Online Income (UPI / QR)
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
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-income/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 h-[50px] text-base"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-50 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    Remark / Description
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
                    placeholder="E.g. Daily Revenue, Counter, Catering..."
                    autoComplete="off"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-income/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 h-[50px]"
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
                            className="w-full text-left px-5 py-3 hover:bg-slate-50 font-bold text-slate-600 text-sm border-b border-slate-50 last:border-0 transition-colors cursor-pointer"
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
                className="mt-6 w-full h-12 sm:h-14 min-h-[48px] sm:min-h-[54px] bg-income hover:bg-income-dark active:bg-income-dark text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.15em] shadow-lg shadow-income/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0"
              >
                <Save size={18} />
                <span>{editData ? 'Update Income' : 'Save Daily Income'}</span>
              </button>
            </form>

            {renderDayList(dayIncomeEntries, 'income')}
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
