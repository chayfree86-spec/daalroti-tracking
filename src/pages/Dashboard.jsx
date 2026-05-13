import React, { useState } from 'react';
import { Wallet, Smartphone, Landmark, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../lib/utils';

const Dashboard = ({ entries, setActiveTab }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Sort entries by date and then by ID (timestamp) to ensure consistent running balance
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
    return a.id - b.id;
  });

  // Extract unique years from entries
  const availableYears = [...new Set(entries.map(e => new Date(e.date).getFullYear()))];
  const currentYear = new Date().getFullYear();
  if (!availableYears.includes(currentYear)) availableYears.push(currentYear);
  availableYears.sort((a, b) => b - a);

  // Filter entries by selected year
  const filteredYearEntries = sortedEntries.filter(entry => 
    new Date(entry.date).getFullYear() === selectedYear
  );

  // Calculate Running Balances for ALL entries (to get accurate closing balance)
  let runningCash = 0;
  let runningOnline = 0;
  const entriesWithRunningBalance = sortedEntries.map(entry => {
    const cashDelta = (Number(entry.cashIncome || 0) - Number(entry.cashSpend || 0));
    const onlineDelta = (Number(entry.onlineIncome || 0) - Number(entry.onlineSpend || 0));
    
    runningCash += cashDelta;
    runningOnline += onlineDelta;
    
    return {
      ...entry,
      cashDelta,
      onlineDelta,
      runningCash,
      runningOnline,
      runningTotal: runningCash + runningOnline
    };
  });

  // Get the summary for the selected year (as of the end of that year)
  // Find the last entry in the selected year
  const lastEntryOfYear = [...entriesWithRunningBalance]
    .filter(e => new Date(e.date).getFullYear() === selectedYear)
    .sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id)[0];

  // If no entries for that year, we need to find the state at the end of the previous year
  let displayCashBalance = 0;
  let displayOnlineBalance = 0;

  if (lastEntryOfYear) {
    displayCashBalance = lastEntryOfYear.runningCash;
    displayOnlineBalance = lastEntryOfYear.runningOnline;
  } else {
    // If selecting a future year or a year with no data, show the latest overall balance if the year is >= current
    // or show 0 if it's a past year with no data.
    const latestOverall = entriesWithRunningBalance[entriesWithRunningBalance.length - 1];
    if (latestOverall && selectedYear >= new Date(latestOverall.date).getFullYear()) {
      displayCashBalance = latestOverall.runningCash;
      displayOnlineBalance = latestOverall.runningOnline;
    }
  }

  const displayTotalBalance = displayCashBalance + displayOnlineBalance;

  // Filter transactions to show for the selected year
  const dashboardTransactions = [...entriesWithRunningBalance]
    .filter(e => new Date(e.date).getFullYear() === selectedYear)
    .reverse(); // Newest first

  const SummaryCard = ({ title, amount, icon: Icon, gradient, subtitle }) => (
    <div className={`p-6 rounded-[2.5rem] text-white shadow-xl ${gradient} relative overflow-hidden group h-full`}>
      <div className="absolute -right-4 -top-4 bg-white/10 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500" />
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
          <Icon size={24} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider opacity-80">{subtitle}</span>
      </div>
      <h3 className="text-sm font-medium opacity-90 mb-1">{title}</h3>
      <div className="text-3xl font-black">{formatCurrency(amount)}</div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 pt-12 space-y-8 max-w-5xl pb-24">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">DaalRoti <span className="text-primary">Tracker</span></h1>
          <p className="text-slate-400 font-bold text-sm uppercase mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
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
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-200 scale-105" 
                  : "bg-white text-slate-400 hover:bg-slate-50 border border-slate-100"
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <SummaryCard 
            title="Total Balance" 
            amount={displayTotalBalance} 
            icon={Landmark} 
            gradient="bg-gradient-to-br from-slate-800 to-slate-900"
            subtitle={`${selectedYear} Net`}
          />
        </div>
        <div className="md:col-span-1">
          <SummaryCard 
            title="Cash Balance" 
            amount={displayCashBalance} 
            icon={Wallet} 
            gradient="bg-gradient-to-br from-primary to-orange-600"
            subtitle="In Hand"
          />
        </div>
        <div className="md:col-span-1">
          <SummaryCard 
            title="Online Balance" 
            amount={displayOnlineBalance} 
            icon={Smartphone} 
            gradient="bg-gradient-to-br from-income to-emerald-600"
            subtitle="Digital"
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
            {dashboardTransactions.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                <p className="text-slate-400 font-bold">No entries for {selectedYear}</p>
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
