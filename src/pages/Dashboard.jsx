import React, { useState } from 'react';
import { Wallet, Smartphone, Landmark, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { formatCurrency, formatDate, cn, numberToWords } from '../lib/utils';

const Dashboard = ({ entries, setActiveTab }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Sort entries by date and then by ID (timestamp) to ensure consistent running balance
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
    return a.id - b.id;
  });

  // Calculate Running Balances for ALL entries
  let runningCash = 0;
  let runningOnline = 0;
  const entriesWithRunningBalance = sortedEntries.map(entry => {
    const cashDelta = (Number(entry.cashIncome || 0) - Number(entry.cashSpend || 0));
    const onlineDelta = (Number(entry.onlineIncome || 0) - Number(entry.onlineSpend || 0));
    
    // Use sheet values if available, otherwise fallback to local calculation
    const currentEntryCashBal = entry.cashBalance !== undefined ? Number(entry.cashBalance) : (runningCash + cashDelta);
    const currentEntryOnlineBal = entry.onlineBalance !== undefined ? Number(entry.onlineBalance) : (runningOnline + onlineDelta);
    
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
  const firstDayOfMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
  const lastEntryBeforeMonth = [...entriesWithRunningBalance]
    .filter(e => e.date < firstDayOfMonth)
    .sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id)[0];

  const openingCash = lastEntryBeforeMonth ? lastEntryBeforeMonth.runningCash : 0;
  const openingOnline = lastEntryBeforeMonth ? lastEntryBeforeMonth.runningOnline : 0;
  const openingTotal = openingCash + openingOnline;

  // Filter entries for the selected month and year
  const monthFilter = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const dashboardTransactions = [...entriesWithRunningBalance]
    .filter(e => e.date.startsWith(monthFilter))
    .reverse();

  // Current Month Summary (In-Month totals)
  const currentMonthEntries = entriesWithRunningBalance.filter(e => e.date.startsWith(monthFilter));
  const monthIncome = currentMonthEntries.reduce((acc, e) => acc + Number(e.cashIncome || 0) + Number(e.onlineIncome || 0), 0);
  const monthSpend = currentMonthEntries.reduce((acc, e) => acc + Number(e.cashSpend || 0) + Number(e.onlineSpend || 0), 0);
  
  const monthCashIncome = currentMonthEntries.reduce((acc, e) => acc + Number(e.cashIncome || 0), 0);
  const monthOnlineIncome = currentMonthEntries.reduce((acc, e) => acc + Number(e.onlineIncome || 0), 0);
  const monthCashSpend = currentMonthEntries.reduce((acc, e) => acc + Number(e.cashSpend || 0), 0);
  const monthOnlineSpend = currentMonthEntries.reduce((acc, e) => acc + Number(e.onlineSpend || 0), 0);

  // Closing Balance (Last entry of current month OR opening if no entries)
  const lastEntryOfMonth = [...entriesWithRunningBalance]
    .filter(e => e.date.startsWith(monthFilter))
    .sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id)[0];

  const displayCashBalance = lastEntryOfMonth ? lastEntryOfMonth.runningCash : openingCash;
  const displayOnlineBalance = lastEntryOfMonth ? lastEntryOfMonth.runningOnline : openingOnline;
  const displayTotalBalance = displayCashBalance + displayOnlineBalance;

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

  return (
    <div className="container mx-auto p-6 pt-12 space-y-8 max-w-5xl pb-24">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">DaalRoti <span className="text-primary">Tracker</span></h1>
            <p className="text-slate-400 font-bold text-sm uppercase mt-1">
              {months[selectedMonth - 1]} {selectedYear} Overview
            </p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0 scroll-smooth">
            {availableYears.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={cn(
                  "px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  selectedYear === year 
                    ? "bg-slate-900 text-white shadow-lg scale-105" 
                    : "bg-white text-slate-400 hover:bg-slate-50 border border-slate-100"
                )}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 scroll-smooth bg-slate-50 p-2 rounded-2xl border border-slate-100">
          {months.map((month, idx) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(idx + 1)}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                selectedMonth === idx + 1 
                  ? "bg-primary text-slate-900 shadow-md" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {month}
            </button>
          ))}
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
                     <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Cash In Hand</p>
                     <p className="text-lg font-black text-primary leading-none">{formatCurrency(openingCash)}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Online/Bank</p>
                     <p className="text-lg font-black text-income leading-none">{formatCurrency(openingOnline)}</p>
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
                    onClick={() => setActiveTab('reports')}
                    className="bg-white p-6 rounded-[2.5rem] shadow-premium border border-slate-50 transition-all hover:scale-[1.01] cursor-pointer active:scale-95 group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                  "rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                                  isPositive 
                                  ? "w-10 h-10 bg-income/5 text-income/60 group-hover:bg-income group-hover:text-white" 
                                  : "w-12 h-12 bg-spend/10 text-spend group-hover:bg-spend group-hover:text-white"
                            )}>
                                {isPositive ? <ArrowUpRight size={20} /> : <ArrowDownRight size={24} />}
                            </div>
                            <div className="overflow-hidden flex flex-col">
                                <div className="bg-slate-100 self-start px-3 py-1 rounded-lg mb-2">
                                  <span className="text-[10px] font-black text-slate-500 uppercase leading-none tracking-wider">{formatDate(entry.date)}</span>
                                </div>
                                <p className="text-sm font-bold text-slate-400 leading-tight truncate">
                                  {entry.remark || (isPositive ? 'Income' : 'Spend')}
                                </p>
                                
                                {/* Delta Details (Prominent Amount) */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {entry.cashDelta !== 0 && (
                                        <span className={cn(
                                          "tracking-tight", 
                                          entry.cashDelta > 0 ? "text-lg font-bold text-income/70" : "text-xl font-black text-spend"
                                        )}>
                                            {entry.cashDelta > 0 ? '+' : ''}{formatCurrency(entry.cashDelta)}
                                            <span className="text-[10px] uppercase ml-1 opacity-50 font-bold">Cash</span>
                                        </span>
                                    )}
                                    {entry.onlineDelta !== 0 && (
                                        <span className={cn(
                                          "tracking-tight", 
                                          entry.onlineDelta > 0 ? "text-lg font-bold text-income/70" : "text-xl font-black text-spend"
                                        )}>
                                            {entry.onlineDelta > 0 ? '+' : ''}{formatCurrency(entry.onlineDelta)}
                                            <span className="text-[10px] uppercase ml-1 opacity-50 font-bold">Online</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-6 items-center justify-end">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Closing Bal.</p>
                                <p className="text-xl font-black text-slate-800 leading-none">{formatCurrency(entry.runningTotal)}</p>
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
