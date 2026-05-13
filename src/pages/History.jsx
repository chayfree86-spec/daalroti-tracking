import React, { useState } from 'react';
import { Search, Trash2, Calendar, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../lib/utils';

const History = ({ entries, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

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
  }).reverse();

  const filteredEntries = entriesWithBalance.filter(entry => {
    const matchesSearch = entry.remark?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         entry.date.includes(searchTerm);
    const matchesMonth = filterMonth ? entry.date.startsWith(filterMonth) : true;
    return matchesSearch && matchesMonth;
  });

  return (
    <div className="container mx-auto p-6 pt-12 space-y-8 max-w-5xl pb-24">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Reports</h1>
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border border-primary/20">
            {filteredEntries.length} Entries
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
           <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase">Records Found</p>
              <p className="text-lg font-black text-slate-800">{filteredEntries.length}</p>
           </div>
           <div className="p-3 bg-white rounded-2xl shadow-premium border border-slate-100 text-primary">
              <Filter size={20} />
           </div>
        </div>
      </header>

      {/* Sticky Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sticky top-4 z-40">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by remark or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white shadow-premium border border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-slate-700 h-[60px]"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar h-[60px] items-center bg-white px-2 rounded-2xl shadow-premium border border-slate-100">
          <button 
            onClick={() => setFilterMonth('')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${!filterMonth ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            All
          </button>
          {['2026-05', '2026-04', '2026-03'].map(month => (
            <button 
              key={month}
              onClick={() => setFilterMonth(month)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterMonth === month ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              {new Date(month).toLocaleDateString('en-IN', { month: 'short' })}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEntries.length === 0 ? (
          <div className="md:col-span-2 text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
               <Search size={32} />
            </div>
            <p className="text-slate-400 font-black uppercase text-sm tracking-widest">No matching records found</p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const totalDelta = entry.cashDelta + entry.onlineDelta;
            const isPositive = totalDelta >= 0;

            return (
              <div key={entry.id} className="bg-white p-8 rounded-[3rem] shadow-premium border border-slate-50 relative overflow-hidden group hover:scale-[1.01] transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        isPositive ? "bg-income/10 text-income" : "bg-spend/10 text-spend"
                    )}>
                      {isPositive ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                    </div>
                    <div className="flex flex-col">
                      <div className="bg-slate-100 self-start px-3 py-1 rounded-lg mb-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase leading-none tracking-wider">{formatDate(entry.date)}</span>
                      </div>
                      <p className="text-base font-bold text-slate-400 leading-tight truncate max-w-[280px]">{entry.remark || 'Transaction'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onDelete(entry.id)}
                    className="p-3 text-slate-300 hover:text-spend transition-colors bg-slate-50 rounded-2xl"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Transaction Amount Badges (Very prominent now) */}
                <div className="flex flex-wrap gap-4 mt-2 mb-8">
                    {entry.cashDelta !== 0 && (
                        <div className={cn(
                            "text-xl font-black tracking-tight",
                            entry.cashDelta > 0 ? "text-income" : "text-spend"
                        )}>
                            {entry.cashDelta > 0 ? '+' : ''}{formatCurrency(entry.cashDelta)}
                            <span className="text-[10px] uppercase ml-1 opacity-50 font-black">Cash</span>
                        </div>
                    )}
                    {entry.onlineDelta !== 0 && (
                        <div className={cn(
                            "text-xl font-black tracking-tight",
                            entry.onlineDelta > 0 ? "text-income" : "text-spend"
                        )}>
                            {entry.onlineDelta > 0 ? '+' : ''}{formatCurrency(entry.onlineDelta)}
                            <span className="text-[10px] uppercase ml-1 opacity-50 font-black">Online</span>
                        </div>
                    )}
                </div>

                {/* Closing Balances Grid */}
                <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-50">
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Closing Cash</p>
                    <p className="text-sm font-black text-slate-600 leading-none">{formatCurrency(entry.runningCash)}</p>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Closing Online</p>
                    <p className="text-sm font-black text-slate-600 leading-none">{formatCurrency(entry.runningOnline)}</p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-2xl shadow-lg shadow-slate-900/10">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Final Total</p>
                    <p className="text-sm font-black text-white leading-none">{formatCurrency(entry.runningTotal)}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default History;
