import { useState, useMemo } from 'react';
import { Wallet, Smartphone, Landmark, ArrowUpRight, ArrowDownRight, Calendar, ChevronDown } from 'lucide-react';
import { formatCurrency, formatDate, cn, nowPartsIST, computeRunningBalances } from '../lib/utils';

// Custom Dropdown Picker Component
const CustomDropdown = ({ value, options, onChange, label, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={cn("relative", className)}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-8 sm:h-9 px-3 sm:px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border whitespace-nowrap flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95",
          isOpen ? "bg-primary/10 border-primary/30 text-primary" : "bg-slate-50 border-slate-200/70 text-slate-700 hover:bg-slate-100"
        )}
      >
        <span>{options.find(o => o.value === value)?.label || label}</span>
        <ChevronDown size={14} className={cn("transition-transform text-slate-400", isOpen && "rotate-180")} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 right-0 z-50 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden py-2 min-w-[130px] animate-in fade-in zoom-in-95 duration-200">
            <div className="max-h-60 overflow-y-auto no-scrollbar">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer",
                    value === opt.value ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Dashboard = ({ entries = [], setActiveTab, onEntryClick, syncStatus }) => {
  const ist = nowPartsIST();
  const [selectedMonth, setSelectedMonth] = useState(ist.month); // 1-12
  const [selectedYear, setSelectedYear] = useState(ist.year);
  const [isAllTime, setIsAllTime] = useState(false);
  
  // Calculate Running Balances for ALL entries purely
  const entriesWithRunningBalance = useMemo(() => computeRunningBalances(entries), [entries]);

  // Calculate Opening Balance (Everything before the selected month/year)
  const firstDayOfRange = selectedMonth === 'all' 
    ? `${selectedYear}-01-01` 
    : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;

  const lastEntryBeforeRange = useMemo(() => {
    return [...entriesWithRunningBalance]
      .filter(e => e.date < firstDayOfRange)
      .sort((a, b) => new Date(b.date) - new Date(a.date) || (b.id || 0) - (a.id || 0))[0];
  }, [entriesWithRunningBalance, firstDayOfRange]);

  const openingCash = lastEntryBeforeRange ? lastEntryBeforeRange.runningCash : 0;
  const openingOnline = lastEntryBeforeRange ? lastEntryBeforeRange.runningOnline : 0;

  // Filter entries for the selected period
  const monthFilter = selectedMonth === 'all' ? `${selectedYear}` : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  
  const filteredEntries = useMemo(() => {
    return entriesWithRunningBalance.filter(e => isAllTime || e.date.startsWith(monthFilter));
  }, [entriesWithRunningBalance, isAllTime, monthFilter]);

  const dashboardTransactions = useMemo(() => {
    return [...filteredEntries].reverse();
  }, [filteredEntries]);
  
  // Detect if there's an explicit "Opening Balance" entry in the current filtered period
  const periodOpeningEntries = useMemo(() => {
    return filteredEntries.filter(e => e.remark?.toLowerCase().includes('opening balance'));
  }, [filteredEntries]);
  
  const periodOpeningCash = periodOpeningEntries.reduce((acc, e) => acc + Number(e.cashIncome || 0), 0);
  const periodOpeningOnline = periodOpeningEntries.reduce((acc, e) => acc + Number(e.onlineIncome || 0), 0);

  const monthCashIncome = filteredEntries.reduce((acc, e) => acc + Number(e.cashIncome || 0), 0);
  const monthOnlineIncome = filteredEntries.reduce((acc, e) => acc + Number(e.onlineIncome || 0), 0);
  const monthIncome = monthCashIncome + monthOnlineIncome;
  const monthCashSpend = filteredEntries.reduce((acc, e) => acc + Number(e.cashSpend || 0), 0);
  const monthOnlineSpend = filteredEntries.reduce((acc, e) => acc + Number(e.onlineSpend || 0), 0);
  const monthSpend = monthCashSpend + monthOnlineSpend;
  
  // Closing Balance (Latest available balance in the range)
  const lastEntryOfRange = [...filteredEntries].sort((a, b) => new Date(b.date) - new Date(a.date) || (b.id || 0) - (a.id || 0))[0];
  const displayCashBalance = lastEntryOfRange ? lastEntryOfRange.runningCash : (isAllTime ? (entriesWithRunningBalance[entriesWithRunningBalance.length-1]?.runningCash || 0) : openingCash);
  const displayOnlineBalance = lastEntryOfRange ? lastEntryOfRange.runningOnline : (isAllTime ? (entriesWithRunningBalance[entriesWithRunningBalance.length-1]?.runningOnline || 0) : openingOnline);
  const displayTotalBalance = displayCashBalance + displayOnlineBalance;

  // Opening Balance for the selection (Carry Forward + Current Period's Initial Opening Balance)
  const displayOpeningCash = (isAllTime ? 0 : openingCash) + periodOpeningCash;
  const displayOpeningOnline = (isAllTime ? 0 : openingOnline) + periodOpeningOnline;

  const availableYears = useMemo(() => {
    const years = [...new Set((entries || []).map(e => new Date(e.date).getFullYear()))];
    const currentYear = ist.year;
    if (!years.includes(currentYear)) years.push(currentYear);
    return years.sort((a, b) => b - a);
  }, [entries, ist.year]);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return (
    <div className="container mx-auto px-3 sm:px-6 pb-6 max-w-5xl space-y-6 sm:space-y-8">
      {/* Sticky Mobile-Touch Aligned Header */}
      <div className="sticky top-0 z-30 -mx-3 px-3 sm:-mx-6 sm:px-6 pt-2 pb-3 sm:pt-4 sm:pb-4 bg-background/90 backdrop-blur-md">
        <header className="bg-white/95 backdrop-blur-xl px-3.5 py-2.5 sm:px-6 sm:py-3.5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100/90 flex items-center justify-between gap-2.5 min-h-[52px] sm:min-h-[60px] transition-all">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div>
              <h1 className="text-sm sm:text-lg font-black text-slate-800 tracking-tight leading-tight">
                DaalRoti <span className="text-primary">Tracker</span>
              </h1>
              <p className="text-slate-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider hidden sm:block">
                Financial Overview
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {!isAllTime && (
              <CustomDropdown 
                value={selectedMonth}
                options={[
                  { label: 'All Months', value: 'all' },
                  ...months
                    .map((m, i) => ({ label: m, value: i + 1 }))
                    .filter(m => selectedYear < ist.year || m.value <= ist.month)
                    .reverse()
                ]}
                onChange={setSelectedMonth}
                label="Month"
              />
            )}
            <CustomDropdown 
              value={isAllTime ? 'all' : selectedYear}
              options={[
                { label: 'All Time', value: 'all' },
                ...availableYears.map(y => ({ label: String(y), value: y }))
              ]}
              onChange={(val) => {
                if (val === 'all') {
                  setIsAllTime(true);
                } else {
                  setIsAllTime(false);
                  setSelectedYear(Number(val));
                }
              }}
              label="Year"
            />
            {syncStatus}
          </div>
        </header>
      </div>


      {/* Main Dashboard Summary Cards (Unified 3-Card System) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* 1. Main Balance Card */}
        <div className="p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl relative overflow-hidden flex flex-col justify-between group hover:scale-[1.01] transition-all">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5 blur-xl pointer-events-none" />
          
          <div>
            <div className="flex justify-between items-start mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                <Landmark size={18} className="text-amber-400" />
              </div>
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full text-slate-300">
                Available Now
              </span>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Closing Balance</h3>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
              {formatCurrency(displayTotalBalance)}
            </div>
          </div>

          {/* Small Compact Cash + Online Split */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-white/10">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Wallet size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-400 truncate">Cash (In Hand)</p>
                <p className="text-xs sm:text-sm font-black text-amber-400 truncate">{formatCurrency(displayCashBalance)}</p>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Smartphone size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-400 truncate">Online (Bank)</p>
                <p className="text-xs sm:text-sm font-black text-emerald-400 truncate">{formatCurrency(displayOnlineBalance)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Total Income Combined Card */}
        <div className="p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-emerald-800 via-income to-emerald-950 text-white shadow-xl relative overflow-hidden flex flex-col justify-between group hover:scale-[1.01] transition-all">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
          
          <div>
            <div className="flex justify-between items-start mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <ArrowUpRight size={18} className="text-white" />
              </div>
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full text-white/90">
                {isAllTime ? 'All Time Income' : (selectedMonth === 'all' ? `${selectedYear} Income` : 'Monthly Income')}
              </span>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-white/80">Total Income</h3>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
              +{formatCurrency(monthIncome)}
            </div>
          </div>

          {/* Small Compact Cash Income + Online Income Split */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-white/15">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-black/10 border border-white/10 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                <Wallet size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white/70 truncate">Cash Income</p>
                <p className="text-xs sm:text-sm font-black text-white truncate">{formatCurrency(monthCashIncome)}</p>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-black/10 border border-white/10 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                <Smartphone size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white/70 truncate">Online Income</p>
                <p className="text-xs sm:text-sm font-black text-white truncate">{formatCurrency(monthOnlineIncome)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Total Expense Combined Card */}
        <div className="p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-rose-800 via-spend to-rose-950 text-white shadow-xl relative overflow-hidden flex flex-col justify-between group hover:scale-[1.01] transition-all">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
          
          <div>
            <div className="flex justify-between items-start mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <ArrowDownRight size={18} className="text-white" />
              </div>
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full text-white/90">
                {isAllTime ? 'All Time Spend' : (selectedMonth === 'all' ? `${selectedYear} Spend` : 'Monthly Spend')}
              </span>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-white/80">Total Expense</h3>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
              -{formatCurrency(monthSpend)}
            </div>
          </div>

          {/* Small Compact Cash Spend + Online Spend Split */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-white/15">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-black/10 border border-white/10 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                <Wallet size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white/70 truncate">Cash Spent</p>
                <p className="text-xs sm:text-sm font-black text-white truncate">{formatCurrency(monthCashSpend)}</p>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-black/10 border border-white/10 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                <Smartphone size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white/70 truncate">Online Spent</p>
                <p className="text-xs sm:text-sm font-black text-white truncate">{formatCurrency(monthOnlineSpend)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Recent Transactions</h2>
            <button 
              onClick={() => setActiveTab('reports')}
              className="text-primary text-xs font-bold uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-full hover:bg-primary/10 transition-colors"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            {/* Opening Balance (Carry Forward) Row */}
            <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 bg-white/5 w-24 h-24 rounded-full" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Carry Forward</p>
                    <h4 className="text-lg font-black text-white leading-tight">Opening Balance</h4>
                  </div>
                </div>
                
                 <div className="flex gap-6">
                    <div className="text-right border-r border-white/10 pr-6">
                      <p className="text-[10px] font-bold text-white/30 uppercase mb-1 whitespace-nowrap">Cash In Hand</p>
                      <p className="text-lg font-black text-primary leading-none">{formatCurrency(displayOpeningCash)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-white/30 uppercase mb-1 whitespace-nowrap">Online/Bank</p>
                      <p className="text-lg font-black text-income leading-none">{formatCurrency(displayOpeningOnline)}</p>
                    </div>
                 </div>
              </div>
            </div>

            {dashboardTransactions.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                <p className="text-slate-400 font-bold">No entries for {selectedMonth === 'all' ? 'All Months' : months[selectedMonth - 1]} {selectedYear}</p>
              </div>
            ) : (
              dashboardTransactions.slice(0, 4).map((entry) => {
                const totalDelta = entry.cashDelta + entry.onlineDelta;
                const isPositive = totalDelta >= 0;

                return (
                  <div 
                    key={entry.id} 
                    onClick={() => onEntryClick(entry.id)}
                    className="bg-white p-6 rounded-[2.5rem] shadow-premium border border-slate-50 transition-all hover:scale-[1.01] cursor-pointer active:scale-95 group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                                  isPositive ? "bg-income/5 text-income" : "bg-spend/10 text-spend"
                            )}>
                                {isPositive ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-800">{formatDate(entry.date)}</span>
                                {new Date(entry.date + 'T00:00:00').getDay() === 2 && (
                                  <span className="text-[7px] font-black text-spend uppercase tracking-tighter mt-0.5 bg-spend/5 px-1.5 py-0.5 rounded-md self-start border border-spend/10">
                                    Shop Closed
                                  </span>
                                )}
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate max-w-[150px]">
                                  {entry.remark || (isPositive ? 'Income' : 'Spend')}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex flex-row md:items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                            <div className="flex gap-6">
                                {entry.cashDelta !== 0 && (
                                    <div className="text-left md:text-right">
                                        <p className="text-[8px] font-black text-slate-300 uppercase">Cash</p>
                                        <p className={cn("text-sm font-black", entry.cashDelta > 0 ? "text-income/70" : "text-spend")}>
                                            {entry.cashDelta > 0 ? '+' : ''}{formatCurrency(entry.cashDelta)}
                                        </p>
                                    </div>
                                )}
                                {entry.onlineDelta !== 0 && (
                                    <div className="text-left md:text-right">
                                        <p className="text-[8px] font-black text-slate-300 uppercase">Online</p>
                                        <p className={cn("text-sm font-black", entry.onlineDelta > 0 ? "text-income/70" : "text-spend")}>
                                            {entry.onlineDelta > 0 ? '+' : ''}{formatCurrency(entry.onlineDelta)}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="text-right pl-4 border-l border-slate-50">
                                <p className="text-[8px] font-black text-slate-400 uppercase">Closing</p>
                                <p className="text-base font-black text-slate-800">{formatCurrency(entry.runningTotal)}</p>
                            </div>
                        </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="hidden lg:block space-y-6">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Balance Summary</h2>
          <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-50 h-[400px] flex flex-col items-center justify-center text-center">
            {/* Donut Chart using Conic Gradient */}
            <div 
              className="w-64 h-64 rounded-full flex items-center justify-center relative shadow-inner group"
              style={{
                background: `conic-gradient(
                  #F59E0B 0deg ${Math.max((displayCashBalance / (displayTotalBalance || 1)) * 360, 0)}deg, 
                  #10B981 ${Math.max((displayCashBalance / (displayTotalBalance || 1)) * 360, 0)}deg 360deg
                )`
              }}
            >
               {/* Inner Circle to make it a Donut */}
               <div className="absolute inset-[20px] bg-white rounded-full shadow-premium flex flex-col items-center justify-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Available Funds</p>
                  <p className="text-3xl font-black text-slate-800">{formatCurrency(displayTotalBalance)}</p>
                   <div className="mt-4 space-y-1">
                    <p className="text-xs font-bold text-slate-700 flex items-center justify-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm" /> 
                      Cash: <span className="text-primary font-black">{formatCurrency(displayCashBalance)}</span>
                    </p>
                    <p className="text-xs font-bold text-slate-700 flex items-center justify-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-income shadow-sm" /> 
                      Online: <span className="text-income font-black">{formatCurrency(displayOnlineBalance)}</span>
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-8 text-slate-400 font-bold text-sm max-w-[250px]">
                {selectedYear} statistics based on closing balances of that period.
              </p>
            </div>
          </section>
        </div>
      </div>
    );
  };

export default Dashboard;
