import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area 
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, PieChart as PieIcon, Activity, ChevronLeft, ChevronRight, Smartphone } from 'lucide-react';
import { formatCurrency, cn, nowPartsIST } from '../lib/utils';

const Analytics = ({ entries, syncStatus }) => {
  const ist = nowPartsIST();
  const [selectedMonth, setSelectedMonth] = useState(ist.month);
  const [selectedYear, setSelectedYear] = useState(ist.year);
  const [isAllTime, setIsAllTime] = useState(false);

  // Data Processing
  const stats = useMemo(() => {
    if (!entries.length) return {
      monthlyData: [],
      dailyData: [],
      totalIncome: 0,
      totalSpend: 0,
      cashBalance: 0,
      onlineBalance: 0,
      openingBalance: 0,
      closingBalance: 0,
      highValueEntries: [],
    };

    const monthMap = {};
    const dailyMap = {};

    let totalIncome = 0;
    let totalSpend = 0;

    const filterStr = selectedMonth === 'all' ? `${selectedYear}` : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

    entries.forEach(entry => {
      const entryMonth = entry.date.slice(0, 7);
      // startsWith handles both a specific month ("2026-05") and a whole year ("2026").
      const isMatch = isAllTime || entry.date.startsWith(filterStr);

      const cashIn = Number(entry.cashIncome || 0);
      const onlineIn = Number(entry.onlineIncome || 0);
      const cashOut = Number(entry.cashSpend || 0);
      const onlineOut = Number(entry.onlineSpend || 0);
      const income = cashIn + onlineIn;
      const spend = cashOut + onlineOut;

      // Group ALL entries by month for the cumulative trend (independent of filter).
      if (!monthMap[entryMonth]) {
        monthMap[entryMonth] = { month: entryMonth, income: 0, spend: 0, cashNet: 0, onlineNet: 0, cashBal: 0, onlineBal: 0 };
      }
      monthMap[entryMonth].income += income;
      monthMap[entryMonth].spend += spend;
      monthMap[entryMonth].cashNet += (cashIn - cashOut);
      monthMap[entryMonth].onlineNet += (onlineIn - onlineOut);

      // Aggregate KPIs only for the selected period.
      if (isMatch) {
        totalIncome += income;
        totalSpend += spend;

        if (!dailyMap[entry.date]) dailyMap[entry.date] = { date: entry.date, income: 0, spend: 0 };
        dailyMap[entry.date].income += income;
        dailyMap[entry.date].spend += spend;
      }
    });

    const monthlyData = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    // Cumulative running balances per month — Cash AND Online tracked separately.
    let rCash = 0;
    let rOnline = 0;
    monthlyData.forEach(m => {
      rCash += m.cashNet;
      rOnline += m.onlineNet;
      m.cashBal = rCash;
      m.onlineBal = rOnline;
    });

    // Actual balance as of the END of the selected period (carries forward),
    // not just the period's own net flow.
    const targetMonth = isAllTime
      ? (monthlyData.length ? monthlyData[monthlyData.length - 1].month : '')
      : (selectedMonth === 'all' ? `${selectedYear}-12` : filterStr);
    let cashBalance = 0;
    let onlineBalance = 0;
    for (const m of monthlyData) {
      if (m.month <= targetMonth) {
        cashBalance = m.cashBal;
        onlineBalance = m.onlineBal;
      }
    }

    // Opening balance = cumulative balance carried forward from BEFORE the period.
    const startMonth = isAllTime
      ? '0000-00'
      : (selectedMonth === 'all' ? `${selectedYear}-01` : filterStr);
    let openCash = 0;
    let openOnline = 0;
    for (const m of monthlyData) {
      if (m.month < startMonth) {
        openCash = m.cashBal;
        openOnline = m.onlineBal;
      }
    }
    const openingBalance = openCash + openOnline;
    const closingBalance = cashBalance + onlineBalance;

    const dailyData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    const highValueEntries = entries
      .filter(e => isAllTime || e.date.startsWith(filterStr))
      .map(e => ({ ...e, total: Number(e.cashIncome || 0) + Number(e.onlineIncome || 0) + Number(e.cashSpend || 0) + Number(e.onlineSpend || 0) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    return {
      monthlyData,
      dailyData,
      totalIncome,
      totalSpend,
      cashBalance,
      onlineBalance,
      openingBalance,
      closingBalance,
      highValueEntries,
    };
  }, [entries, selectedMonth, selectedYear, isAllTime]);



  const formatValue = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val}`;
  };
  const formatDate = (dateStr) => {
    // Parse "YYYY-MM-DD" as local (device = IST) midnight, not UTC, so the day never shifts.
    const s = String(dateStr);
    const d = s.length === 10 ? new Date(s + 'T00:00:00') : new Date(s);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const CustomDropdown = ({ value, options, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border",
            isOpen ? "bg-white border-primary text-primary shadow-lg" : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
          )}
        >
          {options.find(o => o.value === value)?.label || label}
        </button>
        
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full mt-2 left-0 z-50 bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden py-2 min-w-[140px] animate-in fade-in zoom-in-95 duration-200">
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

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = Array.from({ length: 5 }, (_, i) => ist.year - i);

  return (
    <div className="container mx-auto p-6 pt-6 space-y-10 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] shadow-premium border border-slate-50">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Business Intelligence</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-0.5">Detailed tracking & analytics</p>
          </div>
          {syncStatus}
        </div>
        
        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
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
              ...years.map(y => ({ label: String(y), value: y }))
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

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-premium border border-slate-50 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-income/10 rounded-xl flex items-center justify-center text-income"><TrendingUp size={20} /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</span>
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(stats.totalIncome)}</h3>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-premium border border-slate-50 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-spend/10 rounded-xl flex items-center justify-center text-spend"><TrendingDown size={20} /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expenses</span>
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(stats.totalSpend)}</h3>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-premium border border-slate-50 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Activity size={20} /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Savings</span>
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(stats.totalIncome - stats.totalSpend)}</h3>
        </div>

        <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white"><Calendar size={20} /></div>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Active Days</span>
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight">{stats.dailyData.length} active days</h3>
        </div>
      </div>

      {/* Opening → Net → Closing Balance (carry-forward context) */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-premium border border-slate-50">
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-6 sm:gap-2">
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {isAllTime ? 'Starting Balance' : 'Opening Balance'}
            </p>
            <p className="text-2xl font-black text-slate-700">{formatCurrency(stats.openingBalance)}</p>
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Pichle se carry-forward</p>
          </div>

          <div className="text-center border-y sm:border-y-0 sm:border-x border-slate-100 py-4 sm:py-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Is Period Ka Net</p>
            <p className={cn(
              "text-2xl font-black",
              (stats.totalIncome - stats.totalSpend) >= 0 ? "text-income" : "text-spend"
            )}>
              {(stats.totalIncome - stats.totalSpend) >= 0 ? '+' : ''}{formatCurrency(stats.totalIncome - stats.totalSpend)}
            </p>
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Income − Spend</p>
          </div>

          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Closing Balance</p>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.closingBalance)}</p>
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Cash + Online total</p>
          </div>
        </div>
      </div>

      {/* Daily Activity Chart - Detailed Month View */}
      {!isAllTime && (
        <div className="bg-white p-8 rounded-[3rem] shadow-premium border border-slate-50 space-y-8">
           <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Daily Activity - {selectedMonth === 'all' ? 'All Months' : months[selectedMonth-1]}</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Din-ba-din ka kharcha aur kamai</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyData}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorSpe" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                  labelFormatter={(val) => formatDate(val)}
                />
                <Area type="monotone" dataKey="income" stroke="#10B981" fill="url(#colorInc)" strokeWidth={3} />
                <Area type="monotone" dataKey="spend" stroke="#EF4444" fill="url(#colorSpe)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Row: Asset Distribution & High Value Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Distribution Card */}
        <div className="bg-white p-8 rounded-[3rem] shadow-premium border border-slate-50 space-y-8">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Asset Distribution</h3>
          <div className="h-64 flex items-center justify-center relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ name: 'Cash', value: Math.max(0, stats.cashBalance) }, { name: 'Online', value: Math.max(0, stats.onlineBalance) }]}
                    innerRadius={70} outerRadius={90} paddingAngle={10} dataKey="value"
                  >
                    <Cell fill="#F59E0B" stroke="none" />
                    <Cell fill="#3B82F6" stroke="none" />
                  </Pie>
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black text-slate-300 uppercase">Cash Ratio</span>
                <span className="text-3xl font-black text-slate-800">
                  {Math.round((stats.cashBalance / (stats.cashBalance + stats.onlineBalance || 1)) * 100)}%
                </span>
             </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-around bg-slate-50 p-6 rounded-[2rem] gap-4">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Cash in hand</p>
              <p className="text-lg font-black text-primary leading-none">{formatCurrency(stats.cashBalance)}</p>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-200 self-center" />
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Online / Bank</p>
              <p className="text-lg font-black text-blue-500 leading-none">{formatCurrency(stats.onlineBalance)}</p>
            </div>
          </div>
        </div>

        {/* High Value Records */}
        <div className="bg-white p-8 rounded-[3rem] shadow-premium border border-slate-50 space-y-8">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Biggest Records</h3>
          <div className="space-y-4">
            {stats.highValueEntries.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-slate-100 transition-transform hover:scale-[1.02]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
                    {entry.cashIncome || entry.onlineIncome ? <TrendingUp size={20} className="text-income" /> : <TrendingDown size={20} className="text-spend" />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 leading-none mb-1">{entry.remark || 'Misc Entry'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(entry.date)}</p>
                  </div>
                </div>
                <p className="text-lg font-black text-slate-800">{formatCurrency(entry.total)}</p>
              </div>
            ))}
            {stats.highValueEntries.length === 0 && <p className="text-center text-slate-300 py-10 font-bold uppercase text-xs tracking-widest">No major entries this period</p>}
          </div>
        </div>

      </div>

      {/* Long Term Balance Trend */}
      {isAllTime && (
        <div className="bg-white p-8 rounded-[3rem] shadow-premium border border-slate-50 space-y-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Wealth Growth Trend</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Growth of Cash vs Online balances over time</p>
            </div>
            {stats.monthlyData.length < 2 && (
              <div className="bg-blue-50 px-4 py-2 rounded-xl text-[10px] font-black text-blue-500 uppercase tracking-widest border border-blue-100">
                Data building up...
              </div>
            )}
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyData}>
                <defs>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} 
                  tickFormatter={(val) => new Date(val + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} 
                  tickFormatter={formatValue} 
                />
                <Tooltip 
                  contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}}
                  labelFormatter={(val) => new Date(val + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                <Area 
                  type="monotone" 
                  dataKey="cashBal" 
                  name="Cash Balance" 
                  stroke="#F59E0B" 
                  fill="url(#colorCash)"
                  strokeWidth={4} 
                  dot={{r: 6, fill: '#F59E0B', strokeWidth: 3, stroke: '#fff'}}
                  activeDot={{ r: 8 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="onlineBal" 
                  name="Online Balance" 
                  stroke="#3B82F6" 
                  fill="url(#colorOnline)"
                  strokeWidth={4} 
                  dot={{r: 6, fill: '#3B82F6', strokeWidth: 3, stroke: '#fff'}}
                  activeDot={{ r: 8 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Efficiency Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 text-center space-y-2">
           <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Saving Rate</p>
           <h4 className="text-3xl font-black text-emerald-700">
             {Math.max(0, Math.round(((stats.totalIncome - stats.totalSpend) / (stats.totalIncome || 1)) * 100))}%
           </h4>
        </div>
        <div className="bg-amber-50 p-8 rounded-[3rem] border border-amber-100 text-center space-y-2">
           <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest">Avg Daily Income</p>
           <h4 className="text-3xl font-black text-amber-700">
             {formatCurrency(Math.round(stats.totalIncome / (stats.dailyData.length || 1)))}
           </h4>
        </div>
        <div className="bg-rose-50 p-8 rounded-[3rem] border border-rose-100 text-center space-y-2">
           <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest">Avg Daily Spend</p>
           <h4 className="text-3xl font-black text-rose-700">
             {formatCurrency(Math.round(stats.totalSpend / (stats.dailyData.length || 1)))}
           </h4>
        </div>
      </div>

    </div>
  );
};

export default Analytics;
