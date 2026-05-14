import React, { useState } from 'react';
import { Wallet, Smartphone, Landmark, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { formatCurrency, formatDate, cn, numberToWords } from '../lib/utils';

const Dashboard = ({ entries, setEntries, setActiveTab, onEntryClick, syncStatus }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isAllTime, setIsAllTime] = useState(false);
  
  // Sort entries by date and then by ID (timestamp) to ensure consistent running balance
  const sortedEntries = entries ? [...entries].sort((a, b) => {
    if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
    return a.id - b.id;
  }) : [];

  // Remove the early return to show dashboard design even when empty
  // if (!entries || entries.length === 0) { ... }

  // Calculate Running Balances for ALL entries
  let runningCash = 0;
  let runningOnline = 0;
  const entriesWithRunningBalance = sortedEntries.map(entry => {
    const cashDelta = (Number(entry.cashIncome || 0) - Number(entry.cashSpend || 0));
    const onlineDelta = (Number(entry.onlineIncome || 0) - Number(entry.onlineSpend || 0));
    
    // Use sheet values if available, otherwise fallback to local calculation
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
  });

  // Calculate Opening Balance (Everything before the selected month/year)
  const firstDayOfRange = selectedMonth === 'all' 
    ? `${selectedYear}-01-01` 
    : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;

  const lastEntryBeforeRange = [...entriesWithRunningBalance]
    .filter(e => e.date < firstDayOfRange)
    .sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id)[0];

  const openingCash = lastEntryBeforeRange ? lastEntryBeforeRange.runningCash : 0;
  const openingOnline = lastEntryBeforeRange ? lastEntryBeforeRange.runningOnline : 0;
  const openingTotal = openingCash + openingOnline;

  // Filter entries for the selected period
  const monthFilter = selectedMonth === 'all' ? `${selectedYear}` : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const dashboardTransactions = [...entriesWithRunningBalance]
    .filter(e => isAllTime || e.date.startsWith(monthFilter))
    .reverse();

  // Current Selection Summary
  const filteredEntries = entriesWithRunningBalance.filter(e => isAllTime || e.date.startsWith(monthFilter));
  
  // Detect if there's an explicit "Opening Balance" entry in the current filtered period
  const periodOpeningEntries = filteredEntries.filter(e => 
    e.remark?.toLowerCase().includes('opening balance')
  );
  
  const periodOpeningCash = periodOpeningEntries.reduce((acc, e) => acc + Number(e.cashIncome || 0), 0);
  const periodOpeningOnline = periodOpeningEntries.reduce((acc, e) => acc + Number(e.onlineIncome || 0), 0);

  const monthCashIncome = filteredEntries.reduce((acc, e) => acc + Number(e.cashIncome || 0), 0);
  const monthOnlineIncome = filteredEntries.reduce((acc, e) => acc + Number(e.onlineIncome || 0), 0);
  const monthIncome = monthCashIncome + monthOnlineIncome;
  const monthSpend = filteredEntries.reduce((acc, e) => acc + Number(e.cashSpend || 0) + Number(e.onlineSpend || 0), 0);
  
  // Closing Balance (Latest available balance in the range)
  const lastEntryOfRange = [...filteredEntries].sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id)[0];
  const displayCashBalance = lastEntryOfRange ? lastEntryOfRange.runningCash : (isAllTime ? (entriesWithRunningBalance[entriesWithRunningBalance.length-1]?.runningCash || 0) : openingCash);
  const displayOnlineBalance = lastEntryOfRange ? lastEntryOfRange.runningOnline : (isAllTime ? (entriesWithRunningBalance[entriesWithRunningBalance.length-1]?.runningOnline || 0) : openingOnline);
  const displayTotalBalance = displayCashBalance + displayOnlineBalance;

  // Opening Balance for the selection (Carry Forward + Current Period's Initial Opening Balance)
  const displayOpeningCash = (isAllTime ? 0 : openingCash) + periodOpeningCash;
  const displayOpeningOnline = (isAllTime ? 0 : openingOnline) + periodOpeningOnline;
  const displayOpeningTotal = displayOpeningCash + displayOpeningOnline;

  const availableYears = [...new Set(entries.map(e => new Date(e.date).getFullYear()))];
  const currentYear = new Date().getFullYear();
  if (!availableYears.includes(currentYear)) availableYears.push(currentYear);
  availableYears.sort((a, b) => b - a);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const SummaryCard = ({ title, amount, icon: Icon, gradient, subtitle, small, footer, hideWords }) => (
    <div className={cn(
      "rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group transition-all hover:scale-[1.02] h-full",
      gradient,
      small ? "p-5" : "py-5 px-6"
    )}>
      <div className="absolute -right-4 -top-4 bg-white/10 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500" />
      <div className="flex justify-between items-start mb-3">
        <div className={cn("rounded-xl backdrop-blur-sm", small ? "p-1.5 bg-white/10" : "p-2 bg-white/20")}>
          <Icon size={small ? 18 : 22} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{subtitle}</span>
      </div>
      <h3 className={cn("font-bold opacity-90 mb-0.5", small ? "text-[10px] uppercase tracking-wider" : "text-xs")}>{title}</h3>
      <div className={cn("font-black tracking-tight", small ? "text-xl" : "text-3xl")}>{formatCurrency(amount)}</div>
      
      {!hideWords && (
        <div className="text-[8px] font-black uppercase tracking-[0.15em] opacity-40 mt-1 truncate">
          {numberToWords(amount)}
        </div>
      )}
      
      {footer && (
        <div className="mt-2 flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-70">
          {footer}
        </div>
      )}
    </div>
  );
  const CustomDropdown = ({ value, options, onChange, label, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div className={cn("relative", className)}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border whitespace-nowrap",
            isOpen ? "bg-white border-primary text-primary shadow-lg" : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
          )}
        >
          {options.find(o => o.value === value)?.label || label}
        </button>
        
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full mt-2 right-0 z-50 bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden py-2 min-w-[140px] animate-in fade-in zoom-in-95 duration-200">
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-colors",
                      value === opt.value ? "bg-primary/10 text-primary" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
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

  return (
    <div className="container mx-auto p-6 pt-6 space-y-8 max-w-5xl">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-[2.5rem] shadow-premium border border-slate-50 gap-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">DaalRoti <span className="text-primary">Tracker</span></h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase mt-0.5 tracking-wider">
                Financial Overview
              </p>
            </div>
            {syncStatus}
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {!isAllTime && (
              <CustomDropdown 
                value={selectedMonth}
                options={[
                  { label: 'All Months', value: 'all' },
                  ...months
                    .map((m, i) => ({ label: m, value: i + 1 }))
                    .filter(m => selectedYear < new Date().getFullYear() || m.value <= new Date().getMonth() + 1)
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
          </div>
        </div>
      </header>


      {/* Main Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Balance Card */}
        <div className="md:col-span-4">
          <SummaryCard 
            title="Closing Balance" 
            amount={displayTotalBalance} 
            icon={Landmark} 
            gradient="bg-gradient-to-br from-slate-800 to-slate-950"
            subtitle="Available Now"
            hideWords={true}
            footer={
              <>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Cash: {formatCurrency(displayCashBalance)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-income" />
                  <span>Online: {formatCurrency(displayOnlineBalance)}</span>
                </div>
              </>
            }
          />
        </div>

        {/* Income Breakdown */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <SummaryCard 
            title="Cash Income" 
            amount={monthCashIncome} 
            icon={Wallet} 
            gradient="bg-gradient-to-br from-primary to-amber-600"
            subtitle="Monthly Cash"
          />
          <SummaryCard 
            title="Online Income" 
            amount={monthOnlineIncome} 
            icon={Smartphone} 
            gradient="bg-gradient-to-br from-income to-emerald-600"
            subtitle="Monthly Online"
          />
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
                <p className="text-slate-400 font-bold">No entries for {months[selectedMonth - 1]} {selectedYear}</p>
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
