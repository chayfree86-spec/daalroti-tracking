import { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Landmark, Activity, ChevronDown, 
  Smartphone, Wallet, Tag, ArrowUpRight, ArrowDownRight, Award 
} from 'lucide-react';
import { formatCurrency, formatDate, cn, nowPartsIST } from '../lib/utils';

// Transparent modern colorful pastel palette for Categories
const categoryPillStyles = [
  'bg-amber-500/10 text-amber-900 border-amber-300/60',
  'bg-blue-500/10 text-blue-900 border-blue-300/60',
  'bg-emerald-500/10 text-emerald-900 border-emerald-300/60',
  'bg-purple-500/10 text-purple-900 border-purple-300/60',
  'bg-rose-500/10 text-rose-900 border-rose-300/60',
  'bg-indigo-500/10 text-indigo-900 border-indigo-300/60',
  'bg-teal-500/10 text-teal-900 border-teal-300/60',
  'bg-orange-500/10 text-orange-900 border-orange-300/60',
  'bg-cyan-500/10 text-cyan-900 border-cyan-300/60',
  'bg-fuchsia-500/10 text-fuchsia-900 border-fuchsia-300/60',
];

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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
          <div className="absolute top-full mt-2 right-0 z-50 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden py-2 min-w-[140px] animate-in fade-in zoom-in-95 duration-200">
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

const Analytics = ({ entries = [], syncStatus }) => {
  const ist = nowPartsIST();
  const [selectedMonth, setSelectedMonth] = useState(ist.month); // 1-12 or 'all'
  const [selectedYear, setSelectedYear] = useState(ist.year);
  const [isAllTime, setIsAllTime] = useState(false);
  const [chartViewMode, setChartViewMode] = useState('weekly'); // 'weekly' or 'daily'

  // Core Data Processing & Stats Aggregation
  const stats = useMemo(() => {
    if (!entries || !entries.length) {
      return {
        monthlyData: [],
        dailyData: [],
        weeklyData: [],
        totalIncome: 0,
        cashIncome: 0,
        onlineIncome: 0,
        totalSpend: 0,
        cashSpend: 0,
        onlineSpend: 0,
        netSavings: 0,
        cashBalance: 0,
        onlineBalance: 0,
        openingBalance: 0,
        closingBalance: 0,
        highValueEntries: [],
        categoryBreakdown: [],
        activeDaysCount: 0,
      };
    }

    const monthMap = {};
    const dailyMap = {};
    const categoryMap = {};

    const weeklyBuckets = [
      { week: '1-7', label: '1 - 7', income: 0, spend: 0 },
      { week: '8-14', label: '8 - 14', income: 0, spend: 0 },
      { week: '15-21', label: '15 - 21', income: 0, spend: 0 },
      { week: '22-28', label: '22 - 28', income: 0, spend: 0 },
      { week: '29+', label: '29 - 31', income: 0, spend: 0 },
    ];

    let totalIncome = 0;
    let cashIncome = 0;
    let onlineIncome = 0;

    let totalSpend = 0;
    let cashSpend = 0;
    let onlineSpend = 0;

    const filterStr = selectedMonth === 'all' ? `${selectedYear}` : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

    // Sort chronologically for running balance accuracy
    const sorted = [...entries].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.id || 0) - (b.id || 0);
    });

    sorted.forEach(entry => {
      const entryMonth = entry.date.slice(0, 7);
      const isMatch = isAllTime || entry.date.startsWith(filterStr);

      const cIn = Number(entry.cashIncome || 0);
      const oIn = Number(entry.onlineIncome || 0);
      const cOut = Number(entry.cashSpend || 0);
      const oOut = Number(entry.onlineSpend || 0);
      const inc = cIn + oIn;
      const spd = cOut + oOut;

      // Global month map for trends
      if (!monthMap[entryMonth]) {
        monthMap[entryMonth] = { month: entryMonth, income: 0, spend: 0, cashNet: 0, onlineNet: 0, cashBal: 0, onlineBal: 0 };
      }
      monthMap[entryMonth].income += inc;
      monthMap[entryMonth].spend += spd;
      monthMap[entryMonth].cashNet += (cIn - cOut);
      monthMap[entryMonth].onlineNet += (oIn - oOut);

      // Period Specific Aggregations
      if (isMatch) {
        totalIncome += inc;
        cashIncome += cIn;
        onlineIncome += oIn;

        totalSpend += spd;
        cashSpend += cOut;
        onlineSpend += oOut;

        // Daily chart data
        if (!dailyMap[entry.date]) {
          dailyMap[entry.date] = { 
            date: entry.date, 
            displayDate: `${entry.date.slice(8, 10)} ${months[parseInt(entry.date.slice(5, 7), 10) - 1]?.slice(0, 3)}`,
            income: 0, 
            spend: 0 
          };
        }
        dailyMap[entry.date].income += inc;
        dailyMap[entry.date].spend += spd;

        // Weekly buckets calculation for the selected month
        const dayNum = parseInt(entry.date.slice(8, 10), 10);
        if (dayNum >= 1 && dayNum <= 7) {
          weeklyBuckets[0].income += inc;
          weeklyBuckets[0].spend += spd;
        } else if (dayNum >= 8 && dayNum <= 14) {
          weeklyBuckets[1].income += inc;
          weeklyBuckets[1].spend += spd;
        } else if (dayNum >= 15 && dayNum <= 21) {
          weeklyBuckets[2].income += inc;
          weeklyBuckets[2].spend += spd;
        } else if (dayNum >= 22 && dayNum <= 28) {
          weeklyBuckets[3].income += inc;
          weeklyBuckets[3].spend += spd;
        } else if (dayNum >= 29) {
          weeklyBuckets[4].income += inc;
          weeklyBuckets[4].spend += spd;
        }

        // Category/Vendor breakdown
        if (spd > 0) {
          const rawRemark = (entry.remark || 'General Spend').trim();
          const catName = rawRemark.toLowerCase() === 'spend' ? 'General Spend' : rawRemark;
          if (!categoryMap[catName]) {
            categoryMap[catName] = {
              name: catName,
              totalSpend: 0,
              cashSpend: 0,
              onlineSpend: 0,
              count: 0
            };
          }
          categoryMap[catName].totalSpend += spd;
          categoryMap[catName].cashSpend += cOut;
          categoryMap[catName].onlineSpend += oOut;
          categoryMap[catName].count += 1;
        }
      }
    });

    const monthlyData = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    // Cumulative running balance computation
    let rCash = 0;
    let rOnline = 0;
    monthlyData.forEach(m => {
      rCash += m.cashNet;
      rOnline += m.onlineNet;
      m.cashBal = rCash;
      m.onlineBal = rOnline;
    });

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
    const netSavings = totalIncome - totalSpend;

    const dailyData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    const highValueEntries = entries
      .filter(e => isAllTime || e.date.startsWith(filterStr))
      .map(e => ({
        ...e,
        total: Number(e.cashIncome || 0) + Number(e.onlineIncome || 0) + Number(e.cashSpend || 0) + Number(e.onlineSpend || 0),
        isIncome: (Number(e.cashIncome || 0) + Number(e.onlineIncome || 0)) > 0
      }))
      .filter(e => e.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);

    const categoryBreakdown = Object.values(categoryMap)
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .map(c => ({
        ...c,
        percentage: totalSpend > 0 ? Math.round((c.totalSpend / totalSpend) * 100) : 0
      }));

    return {
      monthlyData,
      dailyData,
      weeklyData: weeklyBuckets,
      totalIncome,
      cashIncome,
      onlineIncome,
      totalSpend,
      cashSpend,
      onlineSpend,
      netSavings,
      cashBalance,
      onlineBalance,
      openingBalance,
      closingBalance,
      highValueEntries,
      categoryBreakdown,
      activeDaysCount: dailyData.length,
    };
  }, [entries, selectedMonth, selectedYear, isAllTime]);

  const years = Array.from({ length: 5 }, (_, i) => ist.year - i);

  const periodLabel = isAllTime 
    ? 'All Time' 
    : (selectedMonth === 'all' ? `Year ${selectedYear}` : `${months[selectedMonth - 1]} ${selectedYear}`);

  return (
    <div className="container mx-auto px-3 sm:px-6 pb-8 max-w-5xl space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header with Month / Year Filters */}
      <div className="sticky top-0 z-30 -mx-3 px-3 sm:-mx-6 sm:px-6 pt-2 pb-3 sm:pt-4 sm:pb-4 bg-background/90 backdrop-blur-md">
        <header className="bg-white/95 backdrop-blur-xl px-3.5 py-2.5 sm:px-6 sm:py-3.5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100/90 flex items-center justify-between gap-2.5 min-h-[52px] sm:min-h-[60px] transition-all">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div>
              <h1 className="text-sm sm:text-lg font-black text-slate-800 tracking-tight leading-tight">
                Business <span className="text-primary">Analytics</span>
              </h1>
              <p className="text-slate-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider hidden sm:block">
                Financial Insights & Category Reports
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
            {syncStatus}
          </div>
        </header>
      </div>

      {/* 2. Executive 3-Card Summary Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Card 1: Net Available Balance */}
        <div className="p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl relative overflow-hidden flex flex-col justify-between group hover:scale-[1.01] transition-all">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5 blur-xl pointer-events-none" />
          <div>
            <div className="flex justify-between items-start mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                <Landmark size={18} className="text-amber-400" />
              </div>
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full text-slate-300">
                Closing Balance
              </span>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Net Balance</h3>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
              {formatCurrency(stats.closingBalance)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-white/10">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Wallet size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-400 truncate">Cash In Hand</p>
                <p className="text-xs sm:text-sm font-black text-amber-400 truncate">{formatCurrency(stats.cashBalance)}</p>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Smartphone size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-400 truncate">Online / Bank</p>
                <p className="text-xs sm:text-sm font-black text-emerald-400 truncate">{formatCurrency(stats.onlineBalance)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Total Period Income */}
        <div className="p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-emerald-800 via-income to-emerald-950 text-white shadow-xl relative overflow-hidden flex flex-col justify-between group hover:scale-[1.01] transition-all">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div>
            <div className="flex justify-between items-start mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <ArrowUpRight size={18} className="text-white" />
              </div>
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full text-white/90">
                {periodLabel}
              </span>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-white/80">Total Income</h3>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
              +{formatCurrency(stats.totalIncome)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-white/15">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-black/10 border border-white/10 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                <Wallet size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white/70 truncate">Cash Income</p>
                <p className="text-xs sm:text-sm font-black text-white truncate">{formatCurrency(stats.cashIncome)}</p>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-black/10 border border-white/10 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                <Smartphone size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white/70 truncate">Online Income</p>
                <p className="text-xs sm:text-sm font-black text-white truncate">{formatCurrency(stats.onlineIncome)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Total Period Expense & Net Savings */}
        <div className="p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-rose-800 via-spend to-rose-950 text-white shadow-xl relative overflow-hidden flex flex-col justify-between group hover:scale-[1.01] transition-all">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div>
            <div className="flex justify-between items-start mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <ArrowDownRight size={18} className="text-white" />
              </div>
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full text-white/90">
                {periodLabel}
              </span>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-white/80">Total Expense</h3>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
              -{formatCurrency(stats.totalSpend)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-white/15">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-black/10 border border-white/10 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                <Wallet size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white/70 truncate">Cash Spent</p>
                <p className="text-xs sm:text-sm font-black text-white truncate">{formatCurrency(stats.cashSpend)}</p>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-black/10 border border-white/10 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                <Smartphone size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white/70 truncate">Online Spent</p>
                <p className="text-xs sm:text-sm font-black text-white truncate">{formatCurrency(stats.onlineSpend)}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Category & Vendor Expense Breakdown (The Core Highlight) */}
      <section className="bg-white p-5 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] shadow-premium border border-slate-100/90 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-spend/10 text-spend flex items-center justify-center">
                <Tag size={16} />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
                Category & Vendor Expenses
              </h2>
            </div>
            <p className="text-slate-400 text-xs font-bold">
              {periodLabel} expense breakdown across vendors & items
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-xl">
              {stats.categoryBreakdown.length} Categories
            </span>
            <span className="text-[10px] sm:text-xs font-black text-spend bg-spend/10 border border-spend/20 px-3 py-1.5 rounded-xl">
              Total: -{formatCurrency(stats.totalSpend)}
            </span>
          </div>
        </div>

        {stats.categoryBreakdown.length === 0 ? (
          <div className="text-center py-10 text-slate-400 font-bold uppercase text-xs tracking-widest bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            No expenses recorded for this period
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {stats.categoryBreakdown.map((cat, idx) => {
              const colorStyle = categoryPillStyles[idx % categoryPillStyles.length];
              return (
                <div 
                  key={cat.name}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between gap-3 hover:bg-white hover:shadow-sm hover:border-slate-200 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-200/80 text-slate-600 flex items-center justify-center text-[10px] font-black shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className={cn(
                          "inline-block px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black border truncate max-w-[170px] sm:max-w-[210px]",
                          colorStyle
                        )}>
                          {cat.name}
                        </span>
                        <span className="ml-2 text-[10px] font-bold text-slate-400">
                          {cat.count} {cat.count === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-slate-800 tracking-tight">
                        -{formatCurrency(cat.totalSpend)}
                      </p>
                      <span className="text-[10px] font-black text-spend uppercase">
                        {cat.percentage}% of total
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-spend h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(3, cat.percentage))}%` }}
                      />
                    </div>

                    {/* Cash vs Online Split */}
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Wallet size={11} className="text-amber-500" />
                        Cash: {formatCurrency(cat.cashSpend)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Smartphone size={11} className="text-blue-500" />
                        Online: {formatCurrency(cat.onlineSpend)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Financial Health & Income vs Spend Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Income vs Expense Trend (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] shadow-premium border border-slate-100/90 space-y-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="space-y-0.5">
              <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
                Income vs Expense Flow
              </h2>
              <p className="text-slate-400 text-xs font-bold">
                {isAllTime ? 'Month-by-month cashflow trend' : (chartViewMode === 'weekly' ? 'Weekly breakdown (1-7, 8-14, 15-21, 22-28, 29+)' : `Day-by-day activity for ${periodLabel}`)}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Legend Badges */}
              <div className="flex items-center gap-3 text-xs font-bold mr-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-income" />
                  <span className="text-slate-600 text-[11px]">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-spend" />
                  <span className="text-slate-600 text-[11px]">Expense</span>
                </div>
              </div>

              {/* Weekly vs Daily Toggle when viewing single month */}
              {!isAllTime && (
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setChartViewMode('weekly')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      chartViewMode === 'weekly' ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartViewMode('daily')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      chartViewMode === 'daily' ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    Daily
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {isAllTime ? (
                <BarChart data={stats.monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                    tickFormatter={(val) => new Date(val + '-01').toLocaleDateString('en-IN', { month: 'short' })}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(v) => `₹${v >= 100000 ? (v/100000).toFixed(1) + 'L' : (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v)}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
                    formatter={(val) => formatCurrency(val)}
                  />
                  <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="spend" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              ) : (
                <BarChart 
                  data={chartViewMode === 'weekly' ? stats.weeklyData : stats.dailyData} 
                  barGap={chartViewMode === 'weekly' ? 8 : 2}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey={chartViewMode === 'weekly' ? "label" : "displayDate"}
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(v) => `₹${v >= 100000 ? (v/100000).toFixed(1) + 'L' : (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v)}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
                    formatter={(val) => formatCurrency(val)}
                  />
                  <Bar 
                    dataKey="income" 
                    name="Income" 
                    fill="#10B981" 
                    radius={[4, 4, 0, 0]} 
                    barSize={chartViewMode === 'weekly' ? 24 : 10} 
                  />
                  <Bar 
                    dataKey="spend" 
                    name="Expense" 
                    fill="#EF4444" 
                    radius={[4, 4, 0, 0]} 
                    barSize={chartViewMode === 'weekly' ? 24 : 10} 
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Cash vs Online Asset Ratio (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] shadow-premium border border-slate-100/90 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Asset Ratio</h2>
            <p className="text-slate-400 text-xs font-bold">Cash in Hand vs Online Bank</p>
          </div>

          <div className="h-44 flex items-center justify-center relative my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Cash', value: Math.max(0, stats.cashBalance) },
                    { name: 'Online', value: Math.max(0, stats.onlineBalance) }
                  ]}
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={8}
                  dataKey="value"
                >
                  <Cell fill="#F59E0B" stroke="none" />
                  <Cell fill="#10B981" stroke="none" />
                </Pie>
                <Tooltip formatter={(val) => formatCurrency(val)} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Cash Ratio</span>
              <span className="text-2xl font-black text-slate-800">
                {Math.round((stats.cashBalance / ((stats.cashBalance + stats.onlineBalance) || 1)) * 100)}%
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs font-bold text-slate-700">Cash in hand</span>
              </div>
              <span className="text-xs font-black text-amber-700">{formatCurrency(stats.cashBalance)}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-700">Online / Bank</span>
              </div>
              <span className="text-xs font-black text-emerald-700">{formatCurrency(stats.onlineBalance)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Key Highlights: Biggest Transactions & Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top High Value Transactions */}
        <div className="bg-white p-5 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] shadow-premium border border-slate-100/90 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Award size={16} />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-800">Top Major Entries</h2>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{periodLabel}</span>
          </div>

          <div className="space-y-2.5">
            {stats.highValueEntries.map((entry, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100/80 hover:bg-white hover:shadow-xs transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    entry.isIncome ? "bg-income/10 text-income" : "bg-spend/10 text-spend"
                  )}>
                    {entry.isIncome ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-black text-slate-800 truncate leading-tight">
                      {entry.remark || (entry.isIncome ? 'Income' : 'Spend')}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      {formatDate(entry.date)}
                    </p>
                  </div>
                </div>
                <p className={cn(
                  "text-sm sm:text-base font-black shrink-0",
                  entry.isIncome ? "text-income" : "text-slate-800"
                )}>
                  {entry.isIncome ? '+' : '-'}{formatCurrency(entry.total)}
                </p>
              </div>
            ))}

            {stats.highValueEntries.length === 0 && (
              <p className="text-center text-slate-400 py-8 font-bold uppercase text-xs tracking-widest">
                No entries recorded for this period
              </p>
            )}
          </div>
        </div>

        {/* Daily Performance & Saving Efficiency */}
        <div className="bg-white p-5 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] shadow-premium border border-slate-100/90 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-income/10 text-income flex items-center justify-center">
                <Activity size={16} />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-800">Financial Efficiency</h2>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Averages</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
              <p className="text-emerald-700 text-[10px] font-black uppercase tracking-wider">Savings Rate</p>
              <p className="text-2xl font-black text-emerald-800">
                {Math.max(0, Math.round(((stats.totalIncome - stats.totalSpend) / (stats.totalIncome || 1)) * 100))}%
              </p>
              <p className="text-[9px] font-bold text-emerald-600">Saved from income</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Active Days</p>
              <p className="text-2xl font-black text-white">
                {stats.activeDaysCount} Days
              </p>
              <p className="text-[9px] font-bold text-slate-400">Transactions recorded</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 space-y-1">
              <p className="text-amber-700 text-[10px] font-black uppercase tracking-wider">Avg Daily Income</p>
              <p className="text-base sm:text-lg font-black text-amber-800">
                {formatCurrency(Math.round(stats.totalIncome / (stats.activeDaysCount || 1)))}
              </p>
              <p className="text-[9px] font-bold text-amber-600">Per active day</p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 space-y-1">
              <p className="text-rose-700 text-[10px] font-black uppercase tracking-wider">Avg Daily Spend</p>
              <p className="text-base sm:text-lg font-black text-rose-800">
                {formatCurrency(Math.round(stats.totalSpend / (stats.activeDaysCount || 1)))}
              </p>
              <p className="text-[9px] font-bold text-rose-600">Per active day</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Analytics;
