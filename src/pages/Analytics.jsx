import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area 
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, PieChart as PieIcon, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

const Analytics = ({ entries }) => {
  const [timeRange, setTimeRange] = useState('monthly'); // 'daily', 'weekly', 'monthly'

  // Data Processing
  const stats = useMemo(() => {
    if (!entries.length) return null;

    // 1. Group by Month for the bar chart
    const monthMap = {};
    const categoryMap = { income: {}, spend: {} };
    let totalIncome = 0;
    let totalSpend = 0;

    entries.forEach(entry => {
      const dateObj = new Date(entry.date);
      let groupKey;
      
      if (timeRange === 'yearly') {
        groupKey = entry.date.slice(0, 4); // YYYY
      } else {
        groupKey = entry.date.slice(0, 7); // YYYY-MM
      }

      const income = Number(entry.cashIncome || 0) + Number(entry.onlineIncome || 0);
      const spend = Number(entry.cashSpend || 0) + Number(entry.onlineSpend || 0);

      if (!monthMap[groupKey]) {
        monthMap[groupKey] = { month: groupKey, income: 0, spend: 0, net: 0 };
      }
      monthMap[groupKey].income += income;
      monthMap[groupKey].spend += spend;
      monthMap[groupKey].net += (income - spend);

      totalIncome += income;
      totalSpend += spend;

      // Category breakdown
      const type = income > 0 ? 'income' : 'spend';
      const remark = entry.remark || (type === 'income' ? 'General Income' : 'General Spend');
      if (income > 0) {
        categoryMap.income[remark] = (categoryMap.income[remark] || 0) + income;
      }
      if (spend > 0) {
        categoryMap.spend[remark] = (categoryMap.spend[remark] || 0) + spend;
      }
    });

    const monthlyData = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
    
    const pieData = [
      { name: 'Income', value: totalIncome },
      { name: 'Spend', value: totalSpend }
    ].filter(item => item.value > 0);

    return { monthlyData, pieData, totalIncome, totalSpend };
  }, [entries, timeRange]);

  if (!stats) {
    return (
      <div className="container mx-auto p-6 pt-12 text-center h-[80vh] flex flex-col items-center justify-center space-y-6">
        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
          <Activity size={48} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">No Data Yet</h2>
          <p className="text-slate-400 font-bold mt-2">Add some transactions to see analytics</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

  const formatValue = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val}`;
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-5xl pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Financial Insights</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Data-driven wealth tracking</p>
        </div>
        
        <div className="flex p-1.5 bg-slate-100/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 h-[54px] w-full md:w-auto">
          {['daily', 'weekly', 'monthly', 'yearly'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                timeRange === range ? "bg-white text-slate-900 shadow-md border border-slate-200" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100 group transition-all hover:shadow-2xl hover:-translate-y-1">
          <div className="w-14 h-14 bg-income/10 rounded-2xl flex items-center justify-center text-income mb-6 transition-transform group-hover:scale-110">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Revenue</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(stats.totalIncome)}</h3>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100 group transition-all hover:shadow-2xl hover:-translate-y-1">
          <div className="w-14 h-14 bg-spend/10 rounded-2xl flex items-center justify-center text-spend mb-6 transition-transform group-hover:scale-110">
            <TrendingDown size={28} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Expenses</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(stats.totalSpend)}</h3>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group transition-all hover:shadow-primary/20 hover:-translate-y-1">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl transition-transform group-hover:scale-150" />
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary mb-6">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Net Savings</p>
            <h3 className="text-3xl font-black text-white tracking-tight">{formatCurrency(stats.totalIncome - stats.totalSpend)}</h3>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Comparison Bar Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Income vs Spend</h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-income" />
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Income</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-spend" />
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Spend</span>
               </div>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyData} margin={{ top: 20, right: 0, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  dy={15}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                  tickFormatter={(val) => {
                    if (val.length === 4) return val; 
                    return new Date(val + '-01').toLocaleDateString('en-IN', { month: 'short' });
                  }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  dx={-10}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                  tickFormatter={formatValue}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 10 }}
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', padding: '1.25rem' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                />
                <Bar dataKey="income" fill="#10B981" radius={[8, 8, 0, 0]} barSize={24} />
                <Bar dataKey="spend" fill="#EF4444" radius={[8, 8, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Flow Distribution Donut Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Flow Distribution</h3>
            <PieIcon size={20} className="text-slate-300" />
          </div>
          
          <div className="h-[320px] w-full flex items-center justify-center relative group">
            {/* Center Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
              <span className="text-4xl font-black text-slate-800 tracking-tighter leading-none">
                {(() => {
                  if (stats.totalIncome === 0) return '0%';
                  const ratio = Math.round((stats.totalSpend / stats.totalIncome) * 100);
                  return `${ratio}%`;
                })()}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">
                Spend Ratio
              </span>
            </div>

            <svg width="240" height="240" viewBox="0 0 100 100" className="transform -rotate-90 filter drop-shadow-2xl relative z-10">
              {(() => {
                const total = stats.pieData.reduce((acc, curr) => acc + curr.value, 0);
                let currentOffset = 0;

                return stats.pieData.map((entry, index) => {
                  const percentage = (entry.value / total) * 100;
                  const strokeDasharray = `${percentage} ${100 - percentage}`;
                  const strokeDashoffset = -currentOffset;
                  currentOffset += percentage;

                  return (
                    <circle
                      key={entry.name}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={entry.name === 'Income' ? '#10B981' : '#EF4444'}
                      strokeWidth="12"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 cursor-pointer hover:stroke-[14px]"
                    />
                  );
                });
              })()}
            </svg>
          </div>
          
          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-6">
              {stats.pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.name === 'Income' ? '#10B981' : '#EF4444' }} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-700 leading-none mb-1">
                      {entry.name}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 leading-none">
                      {formatCurrency(entry.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      {/* Line Chart - Savings Trend */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-slate-100 space-y-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Savings Growth Trend</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Monthly financial velocity</p>
          </div>
          <div className="bg-primary/10 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-primary border border-primary/10">
            Performance
          </div>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.monthlyData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                dy={15}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                tickFormatter={(val) => {
                  if (val.length === 4) return val; 
                  return new Date(val + '-01').toLocaleDateString('en-IN', { month: 'short' });
                }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                dx={-10}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                tickFormatter={formatValue}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', padding: '1.25rem' }}
              />
              <Area 
                type="monotone" 
                dataKey="net" 
                stroke="#F59E0B" 
                strokeWidth={5}
                fillOpacity={1} 
                fill="url(#colorNet)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default Analytics;
