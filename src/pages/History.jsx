import { useState, useEffect, useMemo } from 'react';
import { Search, Trash2, Calendar, ArrowUpRight, ArrowDownRight, Edit3, Landmark, Smartphone, Wallet, ChevronDown } from 'lucide-react';
import { formatCurrency, formatDate, cn, todayIST, computeRunningBalances } from '../lib/utils';

const History = ({ entries = [], onDelete, onEdit, highlightedEntryId, setHighlightedEntryId, syncStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const currentMonthStr = todayIST().slice(0, 7);
  const [filterMonth, setFilterMonth] = useState(currentMonthStr);
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'spend'
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [expandedDates, setExpandedDates] = useState(() => new Set()); // dates expanded to show their entries

  const toggleDate = (date) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  };

  // Sort and Calculate Running Balances purely
  const entriesWithBalance = useMemo(() => {
    return computeRunningBalances(entries).reverse();
  }, [entries]);

  const filteredEntries = entriesWithBalance.filter(entry => {
    const s = searchTerm.toLowerCase();
    const normalizedS = s.replace(/[/.]/g, '-');
    
    const matchesRemark = (entry.remark || '').toLowerCase().includes(s);
    
    // Flexible Date Matching
    const entryDateObj = new Date(entry.date + 'T00:00:00');
    const dd = String(entryDateObj.getDate());
    const mm = String(entryDateObj.getMonth() + 1);
    const yyyy = String(entryDateObj.getFullYear());
    const yy = yyyy.slice(-2);
    const dmy = `${dd}-${mm}-${yyyy}`;
    const dmy_short = `${dd}-${mm}-${yy}`;
    const dm = `${dd}-${mm}`;

    const matchesDate = entry.date.includes(s) || 
                       formatDate(entry.date).toLowerCase().includes(s) ||
                       dmy.includes(normalizedS) ||
                       dmy_short.includes(normalizedS) ||
                       dm === normalizedS;
    
    // Check if searchTerm matches any amount field
    const cashIn = String(entry.cashIncome || '');
    const onlineIn = String(entry.onlineIncome || '');
    const cashOut = String(entry.cashSpend || '');
    const onlineOut = String(entry.onlineSpend || '');
    const totalIn = String(Number(entry.cashIncome || 0) + Number(entry.onlineIncome || 0));
    const totalOut = String(Number(entry.cashSpend || 0) + Number(entry.onlineSpend || 0));
    
    const matchesAmount = cashIn.includes(s) || onlineIn.includes(s) || cashOut.includes(s) || onlineOut.includes(s) || totalIn.includes(s) || totalOut.includes(s);

    const matchesSearch = matchesRemark || matchesDate || matchesAmount;
    const matchesMonth = filterMonth ? entry.date.startsWith(filterMonth) : true;
    
    const isIncome = (entry.cashDelta > 0 || entry.onlineDelta > 0);
    const isSpend = (entry.cashDelta < 0 || entry.onlineDelta < 0);
    
    const matchesType = filterType === 'all' ? true : 
                       filterType === 'income' ? isIncome : isSpend;

    return matchesSearch && matchesMonth && matchesType;
  });

  // Inject Virtual Tuesdays
  const finalDisplayEntries = (() => {
    const result = [...filteredEntries];
    // Show virtual Tuesdays only in the unfiltered "all" view — they are neither
    // income nor spend, so they must not appear when filtering by type.
    if (searchTerm === '' && filterMonth && filterType === 'all') {
      const [year, month] = filterMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      // "Today" in IST as a local-midnight Date, end-of-day, so future days are skipped correctly.
      const [ty, tm, td] = todayIST().split('-').map(Number);
      const today = new Date(ty, tm - 1, td);
      today.setHours(23, 59, 59, 999); // End of today (IST)

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const d = new Date(dateStr + 'T00:00:00');
        
        // Skip future dates
        if (d > today) continue;

        if (d.getDay() === 2) {
          // Check if this Tuesday already has an entry that matches the current filter (income/spend/all)
          const hasMatchingEntry = filteredEntries.some(e => e.date === dateStr);
          if (!hasMatchingEntry) {
            result.push({
              id: `virtual-tue-${dateStr}`,
              date: dateStr,
              remark: 'Shop Closed',
              cashDelta: 0,
              onlineDelta: 0,
              runningTotal: 0, 
              isVirtual: true
            });
          }
        }
      }
    }
    return result.sort((a, b) => {
      const dateA = new Date(a.date + 'T00:00:00').getTime();
      const dateB = new Date(b.date + 'T00:00:00').getTime();
      if (dateA !== dateB) return dateB - dateA;
      return (b.id || 0) - (a.id || 0);
    });
  })();

  // Group display entries by date. Each group is one combined row; clicking it
  // expands to show that day's individual entries. finalDisplayEntries is already
  // sorted (date desc, id desc), so the first entry per date is the day's latest
  // and its runningTotal = the day's closing balance.
  const groupedByDate = (() => {
    const map = new Map();
    const order = [];
    for (const entry of finalDisplayEntries) {
      if (!map.has(entry.date)) {
        map.set(entry.date, {
          date: entry.date,
          entries: [],
          cashDelta: 0,
          onlineDelta: 0,
          income: 0,
          expense: 0,
          runningTotal: entry.runningTotal, // latest entry of the day (first seen)
          isVirtual: !!entry.isVirtual,
        });
        order.push(entry.date);
      }
      const g = map.get(entry.date);
      g.entries.push(entry);
      g.cashDelta += (entry.cashDelta || 0);
      g.onlineDelta += (entry.onlineDelta || 0);
      g.income += Number(entry.cashIncome || 0) + Number(entry.onlineIncome || 0);
      g.expense += Number(entry.cashSpend || 0) + Number(entry.onlineSpend || 0);
    }
    return order.map(d => map.get(d));
  })();

  // Calculate Summary for the filtered period
  const periodCashIncome = filteredEntries.reduce((acc, entry) => acc + (Number(entry.cashIncome) || 0), 0);
  const periodOnlineIncome = filteredEntries.reduce((acc, entry) => acc + (Number(entry.onlineIncome) || 0), 0);
  const periodTotalIncome = periodCashIncome + periodOnlineIncome;

  const periodCashSpend = Math.abs(filteredEntries.reduce((acc, entry) => acc + (entry.cashDelta < 0 ? entry.cashDelta : 0), 0));
  const periodOnlineSpend = Math.abs(filteredEntries.reduce((acc, entry) => acc + (entry.onlineDelta < 0 ? entry.onlineDelta : 0), 0));
  const periodTotalSpend = periodCashSpend + periodOnlineSpend;
    // Auto-scroll and highlight logic
  useEffect(() => {
    if (!highlightedEntryId) return;
    const entry = entries.find(e => e.id === highlightedEntryId);
    if (!entry) return;

    const timer = setTimeout(() => {
      const entryMonth = entry.date.slice(0, 7);
      setFilterMonth(prev => (prev !== entryMonth ? entryMonth : prev));
      setExpandedDates(prev => prev.has(entry.date) ? prev : new Set(prev).add(entry.date));

      const element = document.getElementById(`entry-${highlightedEntryId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);

    const clearTimer = setTimeout(() => {
      setHighlightedEntryId(null);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(clearTimer);
    };
  }, [highlightedEntryId, entries, setHighlightedEntryId]);
  // Latest running balances for the filtered period
  const latestEntry = filteredEntries[0]; 
  const currentCashBal = latestEntry ? latestEntry.runningCash : 0;
  const currentOnlineBal = latestEntry ? latestEntry.runningOnline : 0;
  const netBalance = currentCashBal + currentOnlineBal;

  // Generate dynamic month list from entries
  const availableMonths = useMemo(() => {
    return [...new Set(entries.filter(e => e.date).map(e => String(e.date).substring(0, 7)))].sort().reverse();
  }, [entries]);

  // Render a single entry row (standalone or nested inside a day group)
  const renderEntryRow = (entry, isDetail = false) => {
    const totalDelta = (entry.cashDelta || 0) + (entry.onlineDelta || 0);
    const isPositive = totalDelta >= 0;
    const isTuesday = new Date(entry.date + 'T00:00:00').getDay() === 2;
    const income = Number(entry.cashIncome || 0) + Number(entry.onlineIncome || 0);
    const expense = Number(entry.cashSpend || 0) + Number(entry.onlineSpend || 0);
    const cashAmt = Number(entry.cashIncome || 0) + Number(entry.cashSpend || 0);
    const onlineAmt = Number(entry.onlineIncome || 0) + Number(entry.onlineSpend || 0);
    const amount = income > 0 ? income : expense;

    return (
      <div
        key={entry.id}
        id={`entry-${entry.id}`}
        className={cn(
          "transition-all duration-300",
          isDetail
            ? "p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 shadow-xs hover:border-primary/30 flex items-center justify-between gap-3"
            : "p-4 sm:px-6 sm:py-4 rounded-2xl md:rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-premium flex items-center justify-between gap-3",
          entry.isVirtual && "bg-slate-50/70 dark:bg-slate-800/40 border-dashed opacity-75",
          highlightedEntryId === entry.id && "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 ring-2 ring-primary/20 scale-[1.01] shadow-lg z-10"
        )}
      >
        {/* Left: Icon, Remark, Payment Mode Pill */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={cn(
            "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            entry.isVirtual 
              ? "bg-slate-100 dark:bg-slate-800 text-slate-400" 
              : (isPositive ? "bg-income/10 text-income" : "bg-spend/10 text-spend")
          )}>
            {entry.isVirtual ? <Calendar size={16} /> : (isPositive ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white truncate">
                {entry.remark || (entry.isVirtual ? 'Shop Closed (Tuesday)' : (isPositive ? 'Income' : 'Spend'))}
              </p>
              {!isDetail && !entry.isVirtual && (
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hidden sm:inline">
                  · {formatDate(entry.date)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              {!isDetail && (
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 sm:hidden">
                  {formatDate(entry.date)}
                </span>
              )}
              {cashAmt > 0 && (
                <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-black uppercase text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-200/50 dark:border-amber-500/20">
                  <Wallet size={10} /> Cash {formatCurrency(cashAmt)}
                </span>
              )}
              {onlineAmt > 0 && (
                <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-black uppercase text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-200/50 dark:border-blue-500/20">
                  <Smartphone size={10} /> Online {formatCurrency(onlineAmt)}
                </span>
              )}
              {isTuesday && !isDetail && (
                <span className="text-[7px] font-black text-spend uppercase bg-spend/5 px-1.5 py-0.5 rounded border border-spend/10">
                  Shop Closed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Amount & Actions */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <div className="text-right">
            <p className={cn("text-xs sm:text-sm font-black tracking-tight", isPositive ? "text-income" : "text-spend")}>
              {entry.isVirtual ? '₹0' : (isPositive ? '+' : '-') + formatCurrency(amount)}
            </p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500">
              Bal: {formatCurrency(entry.runningTotal)}
            </p>
          </div>

          {!entry.isVirtual && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); onEdit(entry); }} 
                  className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                  title="Edit Entry"
                >
                  <Edit3 size={15} />
                </button>
              )}
              {onDelete && (
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }} 
                  className="p-1.5 text-slate-400 hover:text-spend hover:bg-spend/5 dark:hover:bg-spend/10 rounded-lg transition-colors cursor-pointer"
                  title="Delete Entry"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render the combined summary row for a day with multiple entries
  const renderGroupRow = (group, expanded) => {
    const totalDelta = group.cashDelta + group.onlineDelta;
    const isPositive = totalDelta >= 0;
    const isTuesday = new Date(group.date + 'T00:00:00').getDay() === 2;
    const count = group.entries.length;

    return (
      <button
        type="button"
        onClick={() => toggleDate(group.date)}
        className={cn(
          "w-full text-left p-4 sm:px-6 sm:py-4 transition-all cursor-pointer flex items-center justify-between gap-3",
          expanded ? "bg-primary/[0.03] dark:bg-primary/[0.08]" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
        )}
      >
        {/* Left: Chevron, Date, Entry Count */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={cn(
            "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300",
            isPositive ? "bg-income/10 text-income" : "bg-spend/10 text-spend"
          )}>
            <ChevronDown size={18} className={cn("transition-transform duration-300", expanded && "rotate-180")} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                {formatDate(group.date)}
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                {count} entries
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                Closing Bal: {formatCurrency(group.runningTotal)}
              </span>
              {isTuesday && (
                <span className="text-[7px] font-black text-spend uppercase bg-spend/5 px-1.5 py-0.5 rounded border border-spend/10">
                  Shop Closed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Net Day Total */}
        <div className="flex items-center gap-2 text-right flex-shrink-0">
          <div>
            <div className="flex items-center justify-end gap-1.5">
              {group.income > 0 && (
                <span className="text-xs sm:text-sm font-black text-income">
                  +{formatCurrency(group.income)}
                </span>
              )}
              {group.expense > 0 && (
                <span className="text-xs sm:text-sm font-black text-spend">
                  -{formatCurrency(group.expense)}
                </span>
              )}
            </div>
            <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              {expanded ? 'Click to collapse' : 'Click to view details'}
            </p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="container mx-auto px-3 sm:px-6 pb-6 space-y-6 sm:space-y-8 max-w-5xl">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 pt-2 pb-2 sm:pt-4 sm:pb-3 pointer-events-none">
        <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 py-2.5 sm:px-6 sm:py-3 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100/90 dark:border-slate-800/90 flex items-center justify-between gap-2.5 min-h-[56px] sm:min-h-[64px] transition-all pointer-events-auto">
          <div>
            <h1 className="text-sm sm:text-lg font-black text-slate-800 dark:text-white tracking-tight leading-tight">Financial Ledger</h1>
            <p className="text-slate-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider hidden sm:block">Reports & Analysis</p>
          </div>

        <div className="flex items-center gap-2">
          {/* Month Dropdown inside Header */}
          <div className="relative group">
            <button 
              onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
              className={cn(
                "h-8 sm:h-9 px-3 sm:px-4 rounded-xl border transition-all flex items-center gap-2 text-xs font-black cursor-pointer shadow-xs active:scale-95",
                filterMonth || isMonthDropdownOpen 
                  ? "bg-primary/10 border-primary/30 text-primary" 
                  : "bg-slate-50 dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              <span>
                {filterMonth ? new Date(filterMonth + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) : 'All Time'}
              </span>
              <ChevronDown size={14} className={cn("transition-transform text-slate-400", isMonthDropdownOpen && "rotate-180")} />
            </button>
            
            {isMonthDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsMonthDropdownOpen(false)} />
                <div className="absolute top-full right-0 mt-2 min-w-[150px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-40 animate-in fade-in zoom-in-95 duration-200">
                  <div className="max-h-64 overflow-y-auto no-scrollbar py-2">
                    <button 
                      onClick={() => { setFilterMonth(''); setIsMonthDropdownOpen(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                        !filterMonth ? "bg-primary text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      All Time
                    </button>
                    {availableMonths.map(month => (
                      <button 
                        key={month}
                        onClick={() => { setFilterMonth(month); setIsMonthDropdownOpen(false); }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                          filterMonth === month ? "bg-primary text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        {new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {syncStatus}
        </div>
      </header>
      </div>

      {/* Summary Stats Grid (Unified Cards with Breakup) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* 1. Main Combined Balance Card */}
        <div className="p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5 blur-xl pointer-events-none" />
          
          <div>
            <div className="flex justify-between items-start mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                <Landmark size={18} className="text-amber-400" />
              </div>
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full text-slate-300">
                Total Savings
              </span>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Net Balance</h3>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
              {formatCurrency(netBalance)}
            </div>
          </div>

          {/* Small Compact Cash + Online Split */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-white/10">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Wallet size={12} className="sm:w-[13px] sm:h-[13px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-400 truncate">Cash In Hand</p>
                <p className="text-xs sm:text-sm font-black text-amber-400 whitespace-nowrap leading-tight">{formatCurrency(currentCashBal)}</p>
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Smartphone size={12} className="sm:w-[13px] sm:h-[13px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-400 truncate">Online Bank</p>
                <p className="text-xs sm:text-sm font-black text-emerald-400 whitespace-nowrap leading-tight">{formatCurrency(currentOnlineBal)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Total Income Combined Card */}
        <div className="p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-emerald-800 via-income to-emerald-950 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
          
          <div>
            <div className="flex justify-between items-start mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <ArrowUpRight size={18} className="text-white" />
              </div>
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full text-white/90">
                {filterMonth ? 'Period Income' : 'All Time Income'}
              </span>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-white/80">Total Income</h3>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
              +{formatCurrency(periodTotalIncome)}
            </div>
          </div>

          {/* Small Compact Cash Income + Online Income Split */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-white/15">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-black/10 border border-white/10 flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                <Wallet size={12} className="sm:w-[13px] sm:h-[13px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white/70 truncate">Cash Income</p>
                <p className="text-xs sm:text-sm font-black text-white whitespace-nowrap leading-tight">{formatCurrency(periodCashIncome)}</p>
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-black/10 border border-white/10 flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                <Smartphone size={12} className="sm:w-[13px] sm:h-[13px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white/70 truncate">Online Income</p>
                <p className="text-xs sm:text-sm font-black text-white whitespace-nowrap leading-tight">{formatCurrency(periodOnlineIncome)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Total Expense Combined Card */}
        <div className="p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-rose-800 via-spend to-rose-950 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
          
          <div>
            <div className="flex justify-between items-start mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <ArrowDownRight size={18} className="text-white" />
              </div>
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full text-white/90">
                {filterMonth ? 'Period Spend' : 'All Time Spend'}
              </span>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-white/80">Total Expense</h3>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
              -{formatCurrency(periodTotalSpend)}
            </div>
          </div>

          {/* Small Compact Cash Spend + Online Spend Split */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-white/15">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-black/10 border border-white/10 flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                <Wallet size={12} className="sm:w-[13px] sm:h-[13px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white/70 truncate">Cash Spent</p>
                <p className="text-xs sm:text-sm font-black text-white whitespace-nowrap leading-tight">{formatCurrency(periodCashSpend)}</p>
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-black/10 border border-white/10 flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                <Smartphone size={12} className="sm:w-[13px] sm:h-[13px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white/70 truncate">Online Spent</p>
                <p className="text-xs sm:text-sm font-black text-white whitespace-nowrap leading-tight">{formatCurrency(periodOnlineSpend)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Filters Row */}
      <div className="sticky top-4 z-40 flex flex-col md:flex-row gap-3 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl p-3 rounded-[2rem] shadow-premium border border-white/50 dark:border-slate-800 items-stretch md:items-center transition-colors">
        
        {/* 1. Type Filter */}
        <div className="flex p-1 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/80 h-[50px] md:w-64 flex-shrink-0">
           {['all', 'income', 'spend'].map((type) => (
             <button
               key={type}
               onClick={() => setFilterType(type)}
               className={cn(
                 "flex-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer",
                 filterType === type 
                   ? (type === 'income' ? "bg-income text-white shadow-lg shadow-income/20" : 
                      type === 'spend' ? "bg-spend text-white shadow-lg shadow-spend/20" : 
                      "bg-slate-900 dark:bg-amber-500 text-white shadow-lg shadow-slate-900/20 dark:shadow-amber-500/20")
                   : "text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
               )}
             >
               {type}
             </button>
           ))}
        </div>

        {/* 2. Search Bar */}
        <div className="relative md:w-72 md:ml-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-bold text-slate-700 dark:text-white h-[50px] text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
          {finalDisplayEntries.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-500">
                 <Search size={32} />
              </div>
              <p className="text-slate-400 font-black uppercase text-sm tracking-widest">No matching records found</p>
            </div>
          ) : (
            groupedByDate.map((group) => {
              // Single-entry day (or a virtual "Shop Closed" row) — show directly.
              if (group.entries.length === 1) {
                return renderEntryRow(group.entries[0]);
              }
              // Multi-entry day — one combined card container that expands to show entries INSIDE.
              const expanded = expandedDates.has(group.date);
              return (
                <div 
                  key={group.date} 
                  className={cn(
                    "bg-white dark:bg-slate-900 rounded-2xl md:rounded-[2rem] shadow-premium border border-slate-100/90 dark:border-slate-800 overflow-hidden transition-all duration-300",
                    expanded && "ring-1 ring-primary/20 border-primary/30 shadow-md"
                  )}
                >
                  {renderGroupRow(group, expanded)}
                  {expanded && (
                    <div className="bg-slate-50/60 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 p-2.5 sm:p-4 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="px-2 py-0.5 flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        <span>{formatDate(group.date)} · Transactions</span>
                        <span>{group.entries.length} Entries</span>
                      </div>
                      {group.entries.map((e) => renderEntryRow(e, true))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  export default History;
