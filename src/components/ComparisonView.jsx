import { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  ChevronDown, ArrowUpRight, ArrowDownRight, 
  Landmark, TrendingUp, TrendingDown,
  Award, Layers, ArrowLeft, Tag,
  PieChart as PieIcon, Wallet, Smartphone, Calendar,
  Receipt, ArrowRight, Search, X
} from 'lucide-react';
import { formatCurrency, formatDate, nowPartsIST, cn } from '../lib/utils';
import CategoryMergeModal from './CategoryMergeModal';

const monthsList = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const shortMonthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Transparent modern colorful pastel palette for Categories
const categoryColorPalette = [
  '#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#f43f5e', 
  '#6366f1', '#14b8a6', '#f97316', '#06b6d4', '#ec4899', 
  '#84cc16', '#eab308'
];

const categoryPillStyles = [
  'bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-300/60 dark:border-amber-500/40',
  'bg-blue-500/10 text-blue-900 dark:text-blue-300 border-blue-300/60 dark:border-blue-500/40',
  'bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-500/40',
  'bg-purple-500/10 text-purple-900 dark:text-purple-300 border-purple-300/60 dark:border-purple-500/40',
  'bg-rose-500/10 text-rose-900 dark:text-rose-300 border-rose-300/60 dark:border-rose-500/40',
  'bg-indigo-500/10 text-indigo-900 dark:text-indigo-300 border-indigo-300/60 dark:border-indigo-500/40',
  'bg-teal-500/10 text-teal-900 dark:text-teal-300 border-teal-300/60 dark:border-teal-500/40',
  'bg-orange-500/10 text-orange-900 dark:text-orange-300 border-orange-300/60 dark:border-orange-500/40',
  'bg-cyan-500/10 text-cyan-900 dark:text-cyan-300 border-cyan-300/60 dark:border-cyan-500/40',
  'bg-fuchsia-500/10 text-fuchsia-900 dark:text-fuchsia-300 border-fuchsia-300/60 dark:border-fuchsia-500/40',
];

// Custom Year Dropdown Component
const YearDropdown = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border whitespace-nowrap flex items-center gap-2 cursor-pointer shadow-xs active:scale-95",
          isOpen 
            ? "bg-primary/10 border-primary/30 text-primary" 
            : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
        )}
      >
        <span>Year {value}</span>
        <ChevronDown size={14} className={cn("transition-transform text-slate-400", isOpen && "rotate-180")} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 right-0 z-50 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden py-1 min-w-[120px] animate-in fade-in zoom-in-95 duration-150">
            {options.map((yr) => (
              <button
                key={yr}
                onClick={() => {
                  onChange(yr);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer",
                  value === yr ? "bg-primary text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {yr}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Custom Month Dropdown Component for Drilldown
const MonthDropdown = ({ value, onChange, selectedYear }) => {
  const ist = nowPartsIST();
  const [isOpen, setIsOpen] = useState(false);

  const availableMonths = useMemo(() => {
    return monthsList
      .map((m, idx) => ({ label: m, value: idx + 1 }))
      .filter(m => selectedYear < ist.year || m.value <= ist.month)
      .reverse();
  }, [selectedYear, ist.year, ist.month]);
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border whitespace-nowrap flex items-center gap-2 cursor-pointer shadow-xs active:scale-95",
          isOpen 
            ? "bg-primary/10 border-primary/30 text-primary" 
            : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
        )}
      >
        <span>{value === 'all' ? 'All Months' : monthsList[Number(value) - 1]}</span>
        <ChevronDown size={14} className={cn("transition-transform text-slate-400", isOpen && "rotate-180")} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 right-0 z-50 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden py-1 min-w-[140px] max-h-64 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => { onChange('all'); setIsOpen(false); }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer",
                value === 'all' ? "bg-primary text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              All Months
            </button>
            {availableMonths.map((m) => (
              <button
                key={m.value}
                onClick={() => {
                  onChange(m.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer",
                  value === m.value ? "bg-primary text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Custom Tooltip for 12-Month Bar Chart
const CustomComparisonTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload || {};
    const income = Number(data.income) || 0;
    const expense = Number(data.expense) || 0;
    const net = Number(data.net !== undefined ? data.net : (income - expense));
    const title = data.monthName || label;

    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-white/10 text-xs min-w-[190px] space-y-2">
        <p className="font-black text-slate-300 text-sm border-b border-white/10 pb-1 flex items-center justify-between">
          <span>{title}</span>
          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", net >= 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300")}>
            {net >= 0 ? 'Surplus' : 'Deficit'}
          </span>
        </p>
        <div className="space-y-1.5 font-bold pt-0.5">
          <div className="flex justify-between items-center text-emerald-400">
            <span className="text-[11px] text-slate-400 flex items-center gap-1"><ArrowUpRight size={12}/> Income:</span>
            <span className="font-black">+{formatCurrency(income)}</span>
          </div>
          <div className="flex justify-between items-center text-rose-400">
            <span className="text-[11px] text-slate-400 flex items-center gap-1"><ArrowDownRight size={12}/> Expense:</span>
            <span className="font-black">-{formatCurrency(expense)}</span>
          </div>
          <div className="flex justify-between items-center text-amber-300 border-t border-white/10 pt-1.5">
            <span className="text-[11px] text-slate-300 font-bold">Net Savings:</span>
            <span className="font-black">{formatCurrency(net)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const ComparisonView = ({ onBack, entries = [] }) => {
  const ist = nowPartsIST();
  const [selectedYear, setSelectedYear] = useState(ist.year);
  const [activeMetric, setActiveMetric] = useState('all'); // 'all' | 'income-expense' | 'savings'
  const [comparisonSection, setComparisonSection] = useState('all'); // 'all' | 'categories' | 'table'
  const [selectedCategory, setSelectedCategory] = useState(null); // Category Name when drilled down
  const [drilldownMonthFilter, setDrilldownMonthFilter] = useState('all'); // 'all' | 1-12
  const [categorySearchQuery, setCategorySearchQuery] = useState(''); // Search filter for Category Cards

  // Category Merge & Split Persistence
  const [mergedGroups, setMergedGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('daalroti_merged_categories');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  const handleSaveMergedGroups = (newMap) => {
    setMergedGroups(newMap);
    try {
      localStorage.setItem('daalroti_merged_categories', JSON.stringify(newMap));
      window.dispatchEvent(new Event('category_merges_updated'));
    } catch (e) {
      console.error(e);
    }
  };

  // Extract available years from entries
  const availableYears = useMemo(() => {
    const yrs = new Set();
    yrs.add(ist.year);
    entries.forEach(e => {
      if (e.date) {
        const y = new Date(e.date).getFullYear();
        if (!isNaN(y) && y > 2000) yrs.add(y);
      }
    });
    return Array.from(yrs).sort((a, b) => b - a);
  }, [entries, ist.year]);

  // Extract all distinct raw categories for Year / All Entries
  const rawCategoriesList = useMemo(() => {
    const catSet = new Set();
    entries.forEach(e => {
      const cashExp = Number(e.cash_spend || e.cashSpend) || 0;
      const onlineExp = Number(e.online_spend || e.onlineSpend) || 0;
      if (cashExp + onlineExp > 0) {
        const cat = (e.category || e.remark || 'Miscellaneous').trim();
        if (cat) catSet.add(cat);
      }
    });
    return Array.from(catSet).sort();
  }, [entries]);

  // Aggregate monthly metrics and Category-wise spending for selectedYear (Respecting Merges)
  const { monthlyData, categoryComparison, annualSummary } = useMemo(() => {
    const monthlyStats = Array.from({ length: 12 }, (_, i) => {
      const monthIndex = i + 1; // 1-12
      return {
        monthIndex,
        monthName: monthsList[i],
        shortName: shortMonthsList[i],
        income: 0,
        cashIncome: 0,
        onlineIncome: 0,
        expense: 0,
        cashSpend: 0,
        onlineSpend: 0,
        net: 0,
        savingsRate: 0,
        entryCount: 0,
        categorySpendMap: {} // categoryName -> amount
      };
    });

    const categoryTotals = {}; // categoryName -> { total: number, monthly: { [monthIdx]: number }, count: number, subCategories: Set }

    entries.forEach(e => {
      if (!e.date) return;
      const d = new Date(e.date);
      if (isNaN(d.getTime()) || d.getFullYear() !== selectedYear) return;

      const mIdx = d.getMonth(); // 0-11
      const item = monthlyStats[mIdx];
      if (!item) return;

      item.entryCount += 1;
      const cashIn = Number(e.cash_income || e.cashIncome) || 0;
      const onlineIn = Number(e.online_income || e.onlineIncome) || 0;
      const cashExp = Number(e.cash_spend || e.cashSpend) || 0;
      const onlineExp = Number(e.online_spend || e.onlineSpend) || 0;

      item.cashIncome += cashIn;
      item.onlineIncome += onlineIn;
      item.income += (cashIn + onlineIn);

      item.cashSpend += cashExp;
      item.onlineSpend += onlineExp;
      const totalExp = cashExp + onlineExp;
      item.expense += totalExp;

      // Category breakdown (With Merged mapping)
      if (totalExp > 0) {
        const rawCat = (e.category || e.remark || 'Miscellaneous').trim();
        const primaryCat = mergedGroups[rawCat] || rawCat;

        item.categorySpendMap[primaryCat] = (item.categorySpendMap[primaryCat] || 0) + totalExp;

        if (!categoryTotals[primaryCat]) {
          categoryTotals[primaryCat] = {
            name: primaryCat,
            total: 0,
            monthly: {},
            transactionCount: 0,
            subCategories: new Set()
          };
        }
        categoryTotals[primaryCat].total += totalExp;
        categoryTotals[primaryCat].monthly[mIdx] = (categoryTotals[primaryCat].monthly[mIdx] || 0) + totalExp;
        categoryTotals[primaryCat].transactionCount += 1;
        categoryTotals[primaryCat].subCategories.add(rawCat);
      }
    });

    // Calculate Net, Savings Rate and MoM Growth
    let prevIncome = 0;
    let prevExpense = 0;

    const formattedMonthlyData = monthlyStats.map((m, idx) => {
      m.net = m.income - m.expense;
      m.savingsRate = m.income > 0 ? Math.round((m.net / m.income) * 100) : 0;
      
      if (idx > 0 && prevIncome > 0) {
        m.incomeMoM = Math.round(((m.income - prevIncome) / prevIncome) * 100);
      } else {
        m.incomeMoM = null;
      }

      if (idx > 0 && prevExpense > 0) {
        m.expenseMoM = Math.round(((m.expense - prevExpense) / prevExpense) * 100);
      } else {
        m.expenseMoM = null;
      }

      if (m.income > 0) prevIncome = m.income;
      if (m.expense > 0) prevExpense = m.expense;

      return m;
    });

    // Format Annual Summary
    let totalAnnualIncome = 0;
    let totalAnnualExpense = 0;
    let bestIncomeMonth = null;
    let highestSpendMonth = null;
    let activeMonthsCount = 0;

    formattedMonthlyData.forEach(m => {
      totalAnnualIncome += m.income;
      totalAnnualExpense += m.expense;

      if (m.income > 0 || m.expense > 0) {
        activeMonthsCount += 1;
      }

      if (!bestIncomeMonth || m.income > bestIncomeMonth.income) {
        bestIncomeMonth = m;
      }

      if (!highestSpendMonth || m.expense > highestSpendMonth.expense) {
        highestSpendMonth = m;
      }
    });

    const netSavings = totalAnnualIncome - totalAnnualExpense;
    const avgMonthlyIncome = activeMonthsCount > 0 ? Math.round(totalAnnualIncome / activeMonthsCount) : 0;
    const avgMonthlyExpense = activeMonthsCount > 0 ? Math.round(totalAnnualExpense / activeMonthsCount) : 0;
    const savingsMargin = totalAnnualIncome > 0 ? Math.round((netSavings / totalAnnualIncome) * 100) : 0;

    // Process Category Comparison Ranking
    const sortedCategories = Object.values(categoryTotals)
      .sort((a, b) => b.total - a.total)
      .map((cat, idx) => {
        let peakMonthIdx = null;
        let peakMonthSpend = 0;

        Object.entries(cat.monthly).forEach(([mStr, val]) => {
          if (val > peakMonthSpend) {
            peakMonthSpend = val;
            peakMonthIdx = Number(mStr);
          }
        });

        const subList = Array.from(cat.subCategories || []);
        const isMergedGroup = subList.length > 1;

        return {
          ...cat,
          subCategories: subList,
          isMergedGroup,
          percentageOfTotal: totalAnnualExpense > 0 ? Math.round((cat.total / totalAnnualExpense) * 100) : 0,
          peakMonthName: peakMonthIdx !== null ? monthsList[peakMonthIdx] : '—',
          peakMonthSpend,
          avgMonthlySpend: activeMonthsCount > 0 ? Math.round(cat.total / activeMonthsCount) : 0,
          color: categoryColorPalette[idx % categoryColorPalette.length],
          pillStyle: categoryPillStyles[idx % categoryPillStyles.length]
        };
      });

    const topCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;

    return {
      monthlyData: formattedMonthlyData,
      categoryComparison: sortedCategories,
      annualSummary: {
        totalIncome: totalAnnualIncome,
        totalExpense: totalAnnualExpense,
        netSavings,
        avgMonthlyIncome,
        avgMonthlyExpense,
        savingsMargin,
        bestIncomeMonth,
        highestSpendMonth,
        topCategory,
        activeMonthsCount
      }
    };
  }, [entries, selectedYear, mergedGroups]);

  // Filter Category Comparison results by search query
  const filteredCategoryComparison = useMemo(() => {
    if (!categorySearchQuery.trim()) return categoryComparison;
    const q = categorySearchQuery.toLowerCase().trim();
    return categoryComparison.filter(cat => {
      const matchName = cat.name.toLowerCase().includes(q);
      const matchSub = cat.subCategories?.some(sub => sub.toLowerCase().includes(q));
      return matchName || matchSub;
    });
  }, [categoryComparison, categorySearchQuery]);

  // Specific Category Drilldown Transactions (Including all merged sub-categories, sorted chronologically)
  const { drilldownEntries, drilldownTotals, drilldownCategoryMeta } = useMemo(() => {
    if (!selectedCategory) return { 
      drilldownEntries: [], 
      drilldownTotals: { totalSpend: 0, cashSpend: 0, onlineSpend: 0, count: 0 },
      drilldownCategoryMeta: null
    };

    const activeMeta = categoryComparison.find(c => c.name.toLowerCase() === selectedCategory.toLowerCase());

    let totalCash = 0;
    let totalOnline = 0;

    const filtered = entries.filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date);
      if (isNaN(d.getTime()) || d.getFullYear() !== selectedYear) return false;
      if (drilldownMonthFilter !== 'all' && (d.getMonth() + 1) !== Number(drilldownMonthFilter)) return false;

      const rawCat = (e.category || e.remark || 'Miscellaneous').trim();
      const primaryCat = mergedGroups[rawCat] || rawCat;
      const cashExp = Number(e.cash_spend || e.cashSpend) || 0;
      const onlineExp = Number(e.online_spend || e.onlineSpend) || 0;

      const isMatch = primaryCat.toLowerCase() === selectedCategory.toLowerCase() && (cashExp + onlineExp) > 0;
      if (isMatch) {
        totalCash += cashExp;
        totalOnline += onlineExp;
      }
      return isMatch;
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Perfect date-wise order

    return {
      drilldownEntries: filtered,
      drilldownTotals: {
        totalSpend: totalCash + totalOnline,
        cashSpend: totalCash,
        onlineSpend: totalOnline,
        totalCash,
        totalOnline,
        count: filtered.length
      },
      drilldownCategoryMeta: activeMeta
    };
  }, [entries, selectedCategory, selectedYear, drilldownMonthFilter, mergedGroups, categoryComparison]);

  // ==========================================
  // VIEW 1: CATEGORY TRANSACTION DRILLDOWN VIEW
  // ==========================================
  if (selectedCategory) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
        
        {/* Top Drilldown Header */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-3.5 py-2.5 sm:px-6 sm:py-3 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100/90 dark:border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 min-h-[56px] sm:min-h-[64px] transition-all">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={() => {
                setSelectedCategory(null);
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs shrink-0"
              title="Back to Categories"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className={cn("px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-xl text-xs font-black border uppercase tracking-wider truncate max-w-[140px] sm:max-w-none", drilldownCategoryMeta?.pillStyle || 'bg-rose-50 text-rose-800 border-rose-200')}>
                  {selectedCategory}
                </span>
                {drilldownCategoryMeta?.isMergedGroup && (
                  <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Layers size={10} /> Merged ({drilldownCategoryMeta.subCategories.length})
                  </span>
                )}
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  Year {selectedYear}
                </span>
              </div>
              <p className="text-slate-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider truncate mt-0.5 hidden sm:block">
                All individual date-wise transactions recorded under {selectedCategory}
              </p>
            </div>
          </div>

          {/* Month Filter for Drilldown */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-center">
            <MonthDropdown 
              value={drilldownMonthFilter} 
              onChange={setDrilldownMonthFilter} 
              selectedYear={selectedYear}
            />
            <button
              onClick={() => {
                setSelectedCategory(null);
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }}
              className="h-9 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <X size={14} />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Drilldown Summary KPI Card */}
        <div className="p-5 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl relative overflow-hidden flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full text-slate-300">
                {drilldownMonthFilter === 'all' ? `Year ${selectedYear} Total` : `${monthsList[Number(drilldownMonthFilter)-1]} ${selectedYear}`}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                -{formatCurrency(drilldownTotals.totalSpend)}
              </h2>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                {drilldownTotals.count} Transactions recorded
              </p>
            </div>

            {/* Cash vs Online Split */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 shrink-0">
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Wallet size={14} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Cash Spent</p>
                  <p className="text-xs sm:text-sm font-black text-amber-400 whitespace-nowrap">{formatCurrency(drilldownTotals.cashSpend)}</p>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Smartphone size={14} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Online Spent</p>
                  <p className="text-xs sm:text-sm font-black text-emerald-400 whitespace-nowrap">{formatCurrency(drilldownTotals.onlineSpend)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drilldown Detailed Transaction Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-premium border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="p-5 sm:p-7 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Receipt size={18} className="text-primary" />
                <span>Transactions Ledger</span>
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                Exact date, category tags, payment split & amounts
              </p>
            </div>
            <span className="text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl">
              {drilldownEntries.length} Items
            </span>
          </div>

          {drilldownEntries.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-bold text-sm">
              No transactions recorded for this category in selected period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-slate-800/90 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="py-4 px-4 sm:px-6">Date</th>
                    <th className="py-4 px-4 sm:px-6">Description / Item</th>
                    <th className="py-4 px-4 sm:px-6">Payment Mode</th>
                    <th className="py-4 px-4 sm:px-6 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
                  {drilldownEntries.map((entry, idx) => {
                    const cash = Number(entry.cash_spend || entry.cashSpend) || 0;
                    const online = Number(entry.online_spend || entry.onlineSpend) || 0;
                    const total = cash + online;
                    const originalTag = entry.category || entry.remark;

                    return (
                      <tr key={entry.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Date */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar size={13} className="text-slate-400" />
                            <span className="font-black text-slate-800 dark:text-white text-xs sm:text-sm">
                              {formatDate(entry.date)}
                            </span>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="space-y-0.5">
                            <p className="font-black text-slate-800 dark:text-white text-sm">
                              {entry.remark || entry.category || 'Expense'}
                            </p>
                            {drilldownCategoryMeta?.isMergedGroup && originalTag && originalTag.toLowerCase() !== selectedCategory.toLowerCase() && (
                              <span className="inline-block text-[10px] font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                                Original: {originalTag}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Mode */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {cash > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-black border border-amber-200/60 dark:border-amber-800/60">
                                <Wallet size={11} />
                                Cash: ₹{cash.toLocaleString()}
                              </span>
                            )}
                            {online > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-black border border-emerald-200/60 dark:border-emerald-800/60">
                                <Smartphone size={11} />
                                Online: ₹{online.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                          <span className="font-black text-rose-600 dark:text-rose-400 text-sm sm:text-base">
                            -{formatCurrency(total)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    );
  }

  // ==========================================
  // VIEW 2: MAIN 12-MONTH COMPARISON OVERVIEW
  // ==========================================
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* 1. Top In-Page Header & Navigation Bar */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-3.5 py-2.5 sm:px-6 sm:py-3 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100/90 dark:border-slate-800/90 flex items-center justify-between gap-2.5 min-h-[56px] sm:min-h-[64px] transition-all">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={onBack}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs shrink-0"
            title="Back to Monthly Analytics"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-black text-slate-800 dark:text-white tracking-tight leading-tight truncate">
              12-Month <span className="text-primary">Comparison</span>
            </h2>
            <p className="text-slate-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider truncate hidden sm:block">
              Annual analytics, monthly comparisons & category spending
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Desktop Only Inline Segmented Tabs */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setComparisonSection('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
                comparisonSection === 'all' ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              )}
            >
              Full Overview
            </button>
            <button
              onClick={() => setComparisonSection('table')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
                comparisonSection === 'table' ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              )}
            >
              12-Month Table
            </button>
            <button
              onClick={() => setComparisonSection('categories')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
                comparisonSection === 'categories' ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              )}
            >
              Categories ({categoryComparison.length})
            </button>
          </div>

          <YearDropdown 
            value={selectedYear} 
            options={availableYears} 
            onChange={setSelectedYear} 
          />
        </div>
      </div>

      {/* Mobile-Only Clean Segmented Tab Control */}
      <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl md:hidden text-center -mt-2">
        <button
          onClick={() => setComparisonSection('all')}
          className={cn(
            "py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer truncate",
            comparisonSection === 'all' ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setComparisonSection('table')}
          className={cn(
            "py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer truncate",
            comparisonSection === 'table' ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
          )}
        >
          Table
        </button>
        <button
          onClick={() => setComparisonSection('categories')}
          className={cn(
            "py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer truncate",
            comparisonSection === 'categories' ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
          )}
        >
          Categories ({categoryComparison.length})
        </button>
      </div>

      {/* 2. Unified Master Annual Executive Summary Card with Color-Coded Stats Breakdown */}
      <div className="p-5 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl relative overflow-hidden space-y-4 sm:space-y-6">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        
        {/* Master Hero: Net Annual Surplus */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center backdrop-blur-md">
                <Landmark size={16} />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full text-amber-300">
                Annual Financial Performance ({selectedYear})
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">
              Net Annual Savings
            </p>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-0.5">
              {formatCurrency(annualSummary.netSavings)}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="px-3.5 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-black">
              Margin: {annualSummary.savingsMargin}% Saved
            </span>
          </div>
        </div>

        {/* 4-Item Color-Coded Breakdown Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 pt-3 sm:pt-4 border-t border-white/10 relative z-10">
          
          {/* 1. Annual Income (Green) */}
          <div className="p-3 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-300">
                Annual Income
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <ArrowUpRight size={13} />
              </div>
            </div>
            <div>
              <p className="text-base sm:text-xl font-black text-emerald-400 leading-tight">
                +{formatCurrency(annualSummary.totalIncome)}
              </p>
              <p className="text-[9px] sm:text-[10px] font-bold text-emerald-300/70 truncate mt-0.5">
                Avg: {formatCurrency(annualSummary.avgMonthlyIncome)}/mo
              </p>
            </div>
          </div>

          {/* 2. Annual Expense (Rose/Red) */}
          <div className="p-3 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col justify-between space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-rose-300">
                Annual Expense
              </span>
              <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center">
                <ArrowDownRight size={13} />
              </div>
            </div>
            <div>
              <p className="text-base sm:text-xl font-black text-rose-400 leading-tight">
                -{formatCurrency(annualSummary.totalExpense)}
              </p>
              <p className="text-[9px] sm:text-[10px] font-bold text-rose-300/70 truncate mt-0.5">
                Avg: {formatCurrency(annualSummary.avgMonthlyExpense)}/mo
              </p>
            </div>
          </div>

          {/* 3. Peak Earning Month (Amber) */}
          <div className="p-3 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-300">
                Peak Month
              </span>
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <TrendingUp size={13} />
              </div>
            </div>
            <div>
              <p className="text-base sm:text-xl font-black text-amber-400 leading-tight truncate">
                {annualSummary.bestIncomeMonth && annualSummary.bestIncomeMonth.income > 0 ? annualSummary.bestIncomeMonth.monthName : '—'}
              </p>
              <p className="text-[9px] sm:text-[10px] font-bold text-amber-300/70 truncate mt-0.5">
                {annualSummary.bestIncomeMonth && annualSummary.bestIncomeMonth.income > 0 ? `+${formatCurrency(annualSummary.bestIncomeMonth.income)}` : 'No Income'}
              </p>
            </div>
          </div>

          {/* 4. Peak Expense Month (Indigo/Purple) */}
          <div className="p-3 sm:p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col justify-between space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-purple-300">
                Peak Expense Month
              </span>
              <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <TrendingDown size={13} />
              </div>
            </div>
            <div>
              <p className="text-base sm:text-xl font-black text-purple-200 leading-tight truncate">
                {annualSummary.highestSpendMonth && annualSummary.highestSpendMonth.expense > 0 ? annualSummary.highestSpendMonth.monthName : '—'}
              </p>
              <p className="text-[9px] sm:text-[10px] font-bold text-purple-300/70 truncate mt-0.5">
                {annualSummary.highestSpendMonth && annualSummary.highestSpendMonth.expense > 0 ? `-${formatCurrency(annualSummary.highestSpendMonth.expense)}` : 'No Expense'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. 12-Month Visual Bar Chart (With Amount Values) */}
      {(comparisonSection === 'all' || comparisonSection === 'table') && (
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-[2.5rem] shadow-premium border border-slate-100 dark:border-slate-800 space-y-5 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Layers size={16} />
                </div>
                12-Month Month-by-Month Graph (With Amounts)
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                Compare Income (Green), Expense (Red), and Net Surplus (Amber) side-by-side with exact amounts
              </p>
            </div>

            {/* Metric Mode Filter */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-center">
              <button
                onClick={() => setActiveMetric('all')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                  activeMetric === 'all' ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                )}
              >
                All (Inc / Exp / Net)
              </button>
              <button
                onClick={() => setActiveMetric('income-expense')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                  activeMetric === 'income-expense' ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                )}
              >
                Income vs Expense
              </button>
              <button
                onClick={() => setActiveMetric('savings')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                  activeMetric === 'savings' ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                )}
              >
                Net Savings Only
              </button>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="h-80 sm:h-96 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={monthlyData} 
                margin={{ top: 20, right: 10, left: -15, bottom: 0 }}
                barGap={3}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="shortName" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                  tickFormatter={(val) => `₹${val >= 100000 ? `${(val/100000).toFixed(1)}L` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomComparisonTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={40} 
                  formatter={(value) => <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mr-4">{value}</span>}
                />

                {(activeMetric === 'all' || activeMetric === 'income-expense') && (
                  <Bar 
                    name="Income" 
                    dataKey="income" 
                    fill="#10b981" 
                    radius={[8, 8, 0, 0]} 
                    maxBarSize={30}
                  />
                )}

                {(activeMetric === 'all' || activeMetric === 'income-expense') && (
                  <Bar 
                    name="Expense" 
                    dataKey="expense" 
                    fill="#f43f5e" 
                    radius={[8, 8, 0, 0]} 
                    maxBarSize={30}
                  />
                )}

                {(activeMetric === 'all' || activeMetric === 'savings') && (
                  <Bar 
                    name="Net Savings" 
                    dataKey="net" 
                    fill="#f59e0b" 
                    radius={[8, 8, 0, 0]} 
                    maxBarSize={30}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. 12-Month Detailed Comparison Table */}
      {(comparisonSection === 'all' || comparisonSection === 'table') && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-premium border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="p-5 sm:p-7 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Award size={18} className="text-primary" />
                12-Month Performance Matrix
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                Complete month-by-month financial summary with Cash/Online breakdown and MoM growth
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3.5 py-1.5 rounded-full font-bold">
              12 Months Breakdown
            </span>
          </div>

          {/* 1. Desktop Full Matrix Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/90 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 px-4 sm:px-6">Month</th>
                  <th className="py-4 px-4 sm:px-6 text-emerald-600 dark:text-emerald-400">Total Income</th>
                  <th className="py-4 px-4 sm:px-6 text-rose-600 dark:text-rose-400">Total Expense</th>
                  <th className="py-4 px-4 sm:px-6 text-slate-700 dark:text-slate-200">Net Profit / Savings</th>
                  <th className="py-4 px-4 sm:px-6 text-center">Savings Rate</th>
                  <th className="py-4 px-4 sm:px-6 text-right">MoM Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
                {monthlyData.map((m) => {
                  const hasData = m.income > 0 || m.expense > 0;
                  return (
                    <tr key={m.monthIndex} className={cn("hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors", !hasData && "opacity-45")}>
                      {/* Month Name */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-black">
                            {m.monthIndex}
                          </span>
                          <span className="font-black text-slate-800 dark:text-white text-sm">{m.monthName}</span>
                        </div>
                      </td>

                      {/* Income */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="space-y-0.5">
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            {m.income > 0 ? `+${formatCurrency(m.income)}` : '₹0.00'}
                          </span>
                          {m.income > 0 && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                              Cash: ₹{m.cashIncome.toLocaleString()} | Online: ₹{m.onlineIncome.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Expense */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="space-y-0.5">
                          <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                            {m.expense > 0 ? `-${formatCurrency(m.expense)}` : '₹0.00'}
                          </span>
                          {m.expense > 0 && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                              Cash: ₹{m.cashSpend.toLocaleString()} | Online: ₹{m.onlineSpend.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Net Savings */}
                      <td className="py-4 px-4 sm:px-6">
                        <span className={cn(
                          "font-black text-sm px-3 py-1 rounded-xl inline-block",
                          m.net > 0 ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" : m.net < 0 ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        )}>
                          {formatCurrency(m.net)}
                        </span>
                      </td>

                      {/* Savings Rate */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                          {hasData && m.income > 0 ? `${m.savingsRate}%` : '—'}
                        </span>
                      </td>

                      {/* MoM Change */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        {m.incomeMoM !== null ? (
                          <span className={cn(
                            "inline-flex items-center gap-0.5 text-[11px] font-black px-2.5 py-0.5 rounded-md",
                            m.incomeMoM >= 0 ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40" : "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40"
                          )}>
                            {m.incomeMoM >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {m.incomeMoM >= 0 ? `+${m.incomeMoM}%` : `${m.incomeMoM}%`}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 font-bold text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 2. Mobile Clean Performance Cards List */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {monthlyData.map((m) => {
              const hasData = m.income > 0 || m.expense > 0;
              return (
                <div key={m.monthIndex} className={cn("p-4 space-y-2.5 transition-colors", !hasData && "opacity-40")}>
                  {/* Month Header Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] font-black">
                        {m.monthIndex}
                      </span>
                      <span className="font-black text-slate-800 dark:text-white text-sm">{m.monthName}</span>
                    </div>
                    
                    {hasData ? (
                      <span className={cn(
                        "font-black text-xs px-2.5 py-0.5 rounded-lg",
                        m.net > 0 ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" : m.net < 0 ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      )}>
                        Net: {formatCurrency(m.net)} {m.income > 0 && `(${m.savingsRate}%)`}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase">No Data</span>
                    )}
                  </div>

                  {/* Income & Expense Split Grid */}
                  {hasData && (
                    <div className="grid grid-cols-2 gap-2">
                      {/* Income Box */}
                      <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100/80 dark:border-emerald-900/40">
                        <p className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">Income</p>
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">+{formatCurrency(m.income)}</p>
                        <p className="text-[8px] font-bold text-emerald-800/60 dark:text-emerald-300/60 truncate mt-0.5">
                          Cash: ₹{m.cashIncome.toLocaleString()} • UPI: ₹{m.onlineIncome.toLocaleString()}
                        </p>
                      </div>

                      {/* Expense Box */}
                      <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100/80 dark:border-rose-900/40">
                        <p className="text-[9px] font-black uppercase text-rose-700 dark:text-rose-400 tracking-wider">Expense</p>
                        <p className="text-sm font-black text-rose-600 dark:text-rose-400">-{formatCurrency(m.expense)}</p>
                        <p className="text-[8px] font-bold text-rose-800/60 dark:text-rose-300/60 truncate mt-0.5">
                          Cash: ₹{m.cashSpend.toLocaleString()} • UPI: ₹{m.onlineSpend.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Category-Wise Expense Comparison Matrix (Positioned at the end) */}
      {(comparisonSection === 'all' || comparisonSection === 'categories') && (
        <section className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-[2.5rem] shadow-premium border border-slate-100 dark:border-slate-800 space-y-6 transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-spend/10 text-spend flex items-center justify-center shrink-0">
                    <PieIcon size={16} />
                  </div>
                  <span>Category-Wise Expense Comparison ({selectedYear})</span>
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 px-3 py-1 rounded-full border border-rose-100 dark:border-rose-900/50 whitespace-nowrap">
                  Total Spend: -{formatCurrency(annualSummary.totalExpense)}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400">
                Click on any category card to view detailed transaction history, or use Merge/Split to group categories
              </p>
            </div>
            
            <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
              {/* Search Category Box */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  placeholder="Search category..."
                  className="pl-8 pr-7 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary/50 focus:bg-white dark:focus:bg-slate-800 w-40 sm:w-48 transition-all h-9"
                />
                {categorySearchQuery && (
                  <button
                    onClick={() => setCategorySearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Merge / Split Categories Button */}
              <button
                onClick={() => setIsMergeModalOpen(true)}
                className="h-9 px-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs whitespace-nowrap shrink-0"
              >
                <Layers size={14} className="text-amber-600 dark:text-amber-400" />
                <span>Merge / Split</span>
                {Object.keys(mergedGroups).length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-black">
                    {Object.keys(mergedGroups).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {categoryComparison.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold text-sm">
              No category expense records found for Year {selectedYear}.
            </div>
          ) : filteredCategoryComparison.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold text-sm bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              No category found matching "<span className="text-slate-700 dark:text-slate-200 font-black">{categorySearchQuery}</span>".
              <button 
                onClick={() => setCategorySearchQuery('')}
                className="block mx-auto mt-2 text-xs font-black text-primary hover:underline cursor-pointer"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategoryComparison.map((cat) => (
                <div 
                  key={cat.name}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setDrilldownMonthFilter('all');
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  }}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/80 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all space-y-3 cursor-pointer active:scale-[0.99] group relative"
                >
                  {/* Category Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className={cn("px-2.5 py-1 rounded-xl text-xs font-black border uppercase tracking-wider truncate", cat.pillStyle)}>
                        {cat.name}
                      </span>
                      {cat.isMergedGroup && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] font-black uppercase flex items-center gap-1">
                          <Layers size={10} className="text-amber-600 dark:text-amber-400" />
                          Merged ({cat.subCategories.length})
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black text-slate-800 dark:text-white shrink-0">
                      {cat.percentageOfTotal}% of Total
                    </span>
                  </div>

                  {/* If Merged Group, show subcategories list */}
                  {cat.isMergedGroup && (
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      {cat.subCategories.map((sub, i) => (
                        <span key={i} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 truncate max-w-[120px]">
                          {sub}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Amount and Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                        -{formatCurrency(cat.total)}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {cat.transactionCount} entries
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.max(cat.percentageOfTotal, 4)}%`, backgroundColor: cat.color }} 
                      />
                    </div>
                  </div>

                  {/* Monthly Stats */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                    <div>
                      <p className="text-slate-400 font-bold text-[9px] uppercase">Peak Month</p>
                      <p className="font-black text-slate-700 dark:text-slate-200 truncate">{cat.peakMonthName} ({formatCurrency(cat.peakMonthSpend)})</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold text-[9px] uppercase">Monthly Avg</p>
                      <p className="font-black text-slate-700 dark:text-slate-200 truncate">{formatCurrency(cat.avgMonthlySpend)} / mo</p>
                    </div>
                  </div>

                  {/* Drilldown indicator */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-black text-primary group-hover:text-primary-dark">
                    <span>View all {cat.transactionCount} transactions</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 6. Category Merge & Split Modal */}
      <CategoryMergeModal 
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        rawCategories={rawCategoriesList}
        mergedGroups={mergedGroups}
        onSaveMergedGroups={handleSaveMergedGroups}
      />

    </div>
  );
};
export default ComparisonView;
