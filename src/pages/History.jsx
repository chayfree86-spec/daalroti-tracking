import React, { useState, useEffect, useRef } from 'react';
import { Search, Trash2, Calendar, Filter, ArrowUpRight, ArrowDownRight, Edit3, Landmark, Smartphone, Wallet } from 'lucide-react';
import { formatCurrency, formatDate, cn, numberToWords } from '../lib/utils';

const History = ({ entries, onDelete, onEdit, highlightedEntryId, setHighlightedEntryId, syncStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [filterMonth, setFilterMonth] = useState(currentMonthStr);
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'spend'
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);

  // Sort and Calculate Running Balances before filtering to keep consistency
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
    return a.id - b.id;
  });

  let runningCash = 0;
  let runningOnline = 0;
  const entriesWithBalance = sortedEntries.map(entry => {
    const cashDelta = (Number(entry.cashIncome || 0) - Number(entry.cashSpend || 0));
    const onlineDelta = (Number(entry.onlineIncome || 0) - Number(entry.onlineSpend || 0));
    
    // Use sheet values if available (from sync), otherwise calculate locally
    // Important: check for empty string or null/undefined
    const hasCashBal = entry.cashBalance !== undefined && entry.cashBalance !== "" && entry.cashBalance !== null;
    const hasOnlineBal = entry.onlineBalance !== undefined && entry.onlineBalance !== "" && entry.onlineBalance !== null;

    const currentEntryCashBal = hasCashBal ? Number(entry.cashBalance) : (runningCash + cashDelta);
    const currentEntryOnlineBal = hasOnlineBal ? Number(entry.onlineBalance) : (runningOnline + onlineDelta);

    runningCash = currentEntryCashBal;
    runningOnline = currentEntryOnlineBal;
    
    return {
      ...entry,
      cashDelta,
      onlineDelta,
      runningCash,
      runningOnline,
      runningTotal: runningCash + runningOnline
    };
  }).reverse();

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
    // Show virtual Tuesdays if no search is active and a month is selected
    if (searchTerm === '' && filterMonth) {
      const [year, month] = filterMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

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

  // Calculate Summary for the filtered period
  const periodCashSpend = Math.abs(filteredEntries.reduce((acc, entry) => acc + (entry.cashDelta < 0 ? entry.cashDelta : 0), 0));
  const periodOnlineSpend = Math.abs(filteredEntries.reduce((acc, entry) => acc + (entry.onlineDelta < 0 ? entry.onlineDelta : 0), 0));
  
  // Auto-scroll and highlight logic
  useEffect(() => {
    if (highlightedEntryId) {
      const entry = entries.find(e => e.id === highlightedEntryId);
      if (entry) {
        // Change month filter if needed
        const entryMonth = entry.date.slice(0, 7);
        if (entryMonth !== filterMonth) {
          setFilterMonth(entryMonth);
        }
        
        // Use a small timeout to ensure DOM is updated after potential filter change
        const timer = setTimeout(() => {
          const element = document.getElementById(`entry-${highlightedEntryId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Clear highlight after 3 seconds
            const clearTimer = setTimeout(() => {
              setHighlightedEntryId(null);
            }, 3000);
            return () => clearTimeout(clearTimer);
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightedEntryId, entries, filterMonth, setHighlightedEntryId]);
  // Latest running balances for the filtered period
  const latestEntry = filteredEntries[0]; 
  const currentCashBal = latestEntry ? latestEntry.runningCash : 0;
  const currentOnlineBal = latestEntry ? latestEntry.runningOnline : 0;
  const netBalance = currentCashBal + currentOnlineBal;

  // Generate dynamic month list from entries
  const availableMonths = [...new Set(entries.filter(e => e.date).map(e => String(e.date).substring(0, 7)))].sort().reverse();

  const SummaryCard = ({ title, amount, icon: Icon, gradient, subtitle, light, hideWords, footer }) => (
    <div className={cn(
      "p-5 rounded-[2.5rem] shadow-xl relative overflow-hidden group transition-all hover:scale-[1.02] h-full",
      gradient,
      light ? "text-slate-800 border border-slate-100" : "text-white"
    )}>
      <div className={cn(
        "absolute -right-4 -top-4 w-20 h-20 rounded-full group-hover:scale-110 transition-transform duration-500",
        light ? "bg-slate-50" : "bg-white/10"
      )} />
      <div className="flex justify-between items-start mb-3">
        <div className={cn(
          "p-2 rounded-xl backdrop-blur-sm",
          light ? "bg-slate-50" : "bg-white/20"
        )}>
          <Icon size={18} />
        </div>
        <span className={cn(
          "text-[8px] font-black uppercase tracking-widest opacity-60",
          light ? "text-slate-400" : "text-white/60"
        )}>{subtitle}</span>
      </div>
      <h3 className={cn(
        "text-[10px] font-black uppercase tracking-wider mb-1 opacity-80",
        light ? "text-slate-500" : "text-white/80"
      )}>{title}</h3>
      <div className="text-xl font-black tracking-tight">{formatCurrency(amount)}</div>
      
      {!hideWords && (
        <div className={cn(
          "text-[7px] font-black uppercase tracking-[0.15em] mt-1 truncate",
          light ? "text-slate-300" : "opacity-30"
        )}>
          {numberToWords(amount)}
        </div>
      )}

      {footer && (
        <div className="mt-2 flex justify-between items-center text-[8px] font-black uppercase tracking-widest opacity-70">
          {footer}
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-6 pt-6 space-y-8 max-w-5xl">
      <header className="bg-white p-6 rounded-[2.5rem] shadow-premium border border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Financial Ledger</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase mt-0.5 tracking-wider">Reports & Analysis</p>
          </div>
          {syncStatus}
        </div>
        
        <div className="bg-slate-50/50 px-5 py-3 rounded-2xl border border-slate-100 flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{filteredEntries.length} Transactions</span>
        </div>
      </header>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Balance Card */}
        <div className="md:col-span-4">
          <SummaryCard 
            title="Net Balance" 
            amount={netBalance} 
            icon={Landmark} 
            gradient="bg-gradient-to-br from-slate-800 to-slate-950"
            subtitle="Total Savings"
          />
        </div>

        {/* Breakdown Grid */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard 
            title="Cash Bal" 
            amount={currentCashBal} 
            icon={Wallet} 
            gradient="bg-gradient-to-br from-primary to-amber-600"
            subtitle="In Hand"
          />
          <SummaryCard 
            title="Online Bal" 
            amount={currentOnlineBal} 
            icon={Smartphone} 
            gradient="bg-gradient-to-br from-income to-emerald-600"
            subtitle="Bank"
          />
          <SummaryCard 
            title="Cash Spend" 
            amount={periodCashSpend} 
            icon={ArrowDownRight} 
            gradient="bg-gradient-to-br from-spend/80 to-spend"
            subtitle="Spent"
          />
          <SummaryCard 
            title="Online Spend" 
            amount={periodOnlineSpend} 
            icon={Smartphone} 
            gradient="bg-gradient-to-br from-spend/80 to-spend"
            subtitle="Spent"
          />
        </div>
      </div>

      {/* Sticky Filters Row */}
      <div className="sticky top-4 z-40 flex flex-col md:flex-row gap-3 bg-white/80 backdrop-blur-xl p-3 rounded-[2rem] shadow-premium border border-white/50 items-stretch md:items-center">
        
        {/* 1. Months Dropdown (Custom UI) */}
        <div className="relative group md:w-48 flex-shrink-0">
          <button 
            onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
            className={cn(
              "w-full flex items-center justify-between px-6 h-[50px] rounded-2xl border transition-all",
              filterMonth || isMonthDropdownOpen 
                ? "bg-primary/10 border-primary/20 text-primary" 
                : "bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-white"
            )}
          >
            <span className="text-[10px] font-black uppercase tracking-widest">
              {filterMonth ? new Date(filterMonth + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) : 'All Time'}
            </span>
            <div className={cn(
              "w-2 h-2 rounded-full transition-all",
              filterMonth ? "bg-primary shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-slate-300"
            )} />
          </button>
          
          {isMonthDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMonthDropdownOpen(false)} />
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                <div className="max-h-64 overflow-y-auto no-scrollbar py-2">
                  <button 
                    onClick={() => { setFilterMonth(''); setIsMonthDropdownOpen(false); }}
                    className={cn(
                      "w-full text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                      !filterMonth ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    All Time
                  </button>
                  {availableMonths.map(month => (
                    <button 
                      key={month}
                      onClick={() => { setFilterMonth(month); setIsMonthDropdownOpen(false); }}
                      className={cn(
                        "w-full text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                        filterMonth === month ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"
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

        {/* 2. Type Filter */}
        <div className="flex p-1 bg-slate-50/50 rounded-2xl border border-slate-100 h-[50px] md:w-56 flex-shrink-0">
           {['all', 'income', 'spend'].map((type) => (
             <button
               key={type}
               onClick={() => setFilterType(type)}
               className={cn(
                 "flex-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                 filterType === type 
                   ? (type === 'income' ? "bg-income text-white shadow-lg shadow-income/20" : 
                      type === 'spend' ? "bg-spend text-white shadow-lg shadow-spend/20" : 
                      "bg-slate-900 text-white shadow-lg shadow-slate-900/20")
                   : "text-slate-400 hover:text-slate-600"
               )}
             >
               {type}
             </button>
           ))}
        </div>

        {/* 3. Search Bar */}
        <div className="relative md:w-64 md:ml-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-slate-700 h-[50px] text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        {/* Table Header - Visible on Desktop */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Description</div>
          <div className="col-span-2 text-right">Cash</div>
          <div className="col-span-2 text-right">Online</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-1 text-right">Balance</div>
          <div className="col-span-1"></div>
        </div>

        <div className="space-y-3">
          {finalDisplayEntries.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                 <Search size={32} />
              </div>
              <p className="text-slate-400 font-black uppercase text-sm tracking-widest">No matching records found</p>
            </div>
          ) : (
            finalDisplayEntries.map((entry) => {
              const totalDelta = (entry.cashDelta || 0) + (entry.onlineDelta || 0);
              const isPositive = totalDelta >= 0;
              const isTuesday = new Date(entry.date + 'T00:00:00').getDay() === 2;

              return (
                <div 
                  key={entry.id} 
                  id={`entry-${entry.id}`}
                  className={cn(
                    "px-6 md:px-8 py-4 rounded-2xl md:rounded-[2rem] shadow-premium border transition-all duration-700",
                    entry.isVirtual ? "bg-slate-50/50 border-slate-100 opacity-60" : "bg-white border-slate-50 group hover:border-primary/40 hover:bg-slate-50 hover:shadow-md hover:scale-[1.01] cursor-default",
                    highlightedEntryId === entry.id && "bg-amber-50 border-amber-200 ring-2 ring-primary/20 scale-[1.02] shadow-2xl z-10"
                  )}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    
                    {/* Date & Icon */}
                    <div className="col-span-1 md:col-span-2 flex items-center gap-3">
                      <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                          entry.isVirtual ? "bg-slate-200 text-slate-400" : (isPositive ? "bg-income/5 text-income/60" : "bg-spend/10 text-spend")
                      )}>
                        {entry.isVirtual ? <Calendar size={16} /> : (isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 whitespace-nowrap">{formatDate(entry.date)}</span>
                        {isTuesday && (
                          <span className="text-[7px] font-black text-spend uppercase tracking-tighter mt-0.5 bg-spend/5 px-1.5 py-0.5 rounded-md self-start border border-spend/10">
                            Shop Closed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="col-span-1 md:col-span-2">
                      <p className="text-sm font-bold text-slate-600 truncate">
                        {entry.remark || (isPositive ? 'Income' : 'Spend')}
                      </p>
                    </div>

                    {/* Cash Amount */}
                    <div className="col-span-1 md:col-span-2 md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-slate-50">
                      <div className="flex flex-row md:flex-col justify-between items-center md:items-end">
                        <span className="md:hidden text-[9px] font-black text-slate-300 uppercase">Cash</span>
                        <p className={cn(
                          "text-sm font-black tracking-tight",
                          entry.cashDelta > 0 ? "text-amber-500" : entry.cashDelta < 0 ? "text-spend" : "text-slate-300"
                        )}>
                          {entry.cashDelta !== 0 ? (entry.cashDelta > 0 ? '+' : '') + formatCurrency(entry.cashDelta) : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Online Amount */}
                    <div className="col-span-1 md:col-span-2 md:text-right">
                      <div className="flex flex-row md:flex-col justify-between items-center md:items-end">
                        <span className="md:hidden text-[9px] font-black text-slate-300 uppercase">Online</span>
                        <p className={cn(
                          "text-sm font-black tracking-tight",
                          entry.onlineDelta > 0 ? "text-income/70" : entry.onlineDelta < 0 ? "text-spend" : "text-slate-300"
                        )}>
                          {entry.onlineDelta !== 0 ? (entry.onlineDelta > 0 ? '+' : '') + formatCurrency(entry.onlineDelta) : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Total (Cash + Online) */}
                    <div className="col-span-1 md:col-span-2 md:text-right">
                      <div className="flex flex-row md:flex-col justify-between items-center md:items-end">
                        <span className="md:hidden text-[9px] font-black text-slate-400 uppercase">Total</span>
                        <p className={cn(
                          "text-sm font-black tracking-tight",
                          totalDelta > 0 ? "text-income" : totalDelta < 0 ? "text-spend" : "text-slate-300"
                        )}>
                          {totalDelta !== 0 ? (totalDelta > 0 ? '+' : '') + formatCurrency(totalDelta) : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Closing Balance */}
                    <div className="col-span-1 md:col-span-1 md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-slate-50">
                      <div className="flex flex-row md:flex-col justify-between items-center md:items-end bg-slate-50 md:bg-transparent p-2 md:p-0 rounded-lg">
                        <span className="md:hidden text-[9px] font-black text-slate-400 uppercase">Closing</span>
                        <p className="text-xs font-black text-slate-800">{formatCurrency(entry.runningTotal)}</p>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="col-span-1 md:col-span-1 flex justify-end gap-2">
                      {!entry.isVirtual && (
                        <>
                          <button 
                            onClick={() => onEdit(entry)}
                            className="p-2 text-slate-200 hover:text-primary transition-colors hover:bg-primary/5 rounded-xl"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => onDelete(entry.id)}
                            className="p-2 text-slate-200 hover:text-spend transition-colors hover:bg-spend/5 rounded-xl"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
