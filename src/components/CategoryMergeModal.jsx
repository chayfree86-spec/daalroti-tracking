import { useState, useMemo } from 'react';
import { 
  X, Check, GitMerge, Split, 
  Search, ArrowRight,
  Layers
} from 'lucide-react';
import { cn } from '../lib/utils';

// Helper: Levenshtein distance between two strings
function levenshteinDistance(s1, s2) {
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Helper: Phonetic & normalized similarity test
function areCategoriesSimilar(cat1, cat2) {
  if (!cat1 || !cat2) return false;
  const c1 = cat1.toLowerCase().trim();
  const c2 = cat2.toLowerCase().trim();
  if (c1 === c2) return false; // Already identical

  // 1. Prefix / Substring match (e.g., "Salary&Expenses" and "Salary&Expenses-July")
  if (c1.includes(c2) || c2.includes(c1)) return true;

  // 2. Normalize common phonetic substitutions (B <-> V, EE <-> I, OO <-> U)
  const norm1 = c1.replace(/v/g, 'b').replace(/ee/g, 'i').replace(/oo/g, 'u').replace(/[^a-z0-9]/g, '');
  const norm2 = c2.replace(/v/g, 'b').replace(/ee/g, 'i').replace(/oo/g, 'u').replace(/[^a-z0-9]/g, '');
  if (norm1 === norm2) return true;

  // 3. Normalized Levenshtein distance
  const dist = levenshteinDistance(norm1, norm2);
  const maxLen = Math.max(norm1.length, norm2.length);
  if (maxLen <= 3) return dist === 0;
  if (maxLen <= 6) return dist <= 1;
  if (maxLen <= 10) return dist <= 2;
  return dist <= 3;
}

export const CategoryMergeModal = ({ 
  isOpen, 
  onClose, 
  rawCategories = [], 
  mergedGroups = {}, 
  onSaveMergedGroups 
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [customGroupName, setCustomGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Find all auto-suggestions of similar categories
  const smartSuggestions = useMemo(() => {
    const suggestions = [];
    const paired = new Set();

    // Only inspect categories not already in a merged group
    const standaloneCategories = rawCategories.filter(c => !mergedGroups[c]);

    for (let i = 0; i < standaloneCategories.length; i++) {
      for (let j = i + 1; j < standaloneCategories.length; j++) {
        const c1 = standaloneCategories[i];
        const c2 = standaloneCategories[j];
        const key = [c1, c2].sort().join(':::');

        if (!paired.has(key) && areCategoriesSimilar(c1, c2)) {
          paired.add(key);
          suggestions.push({
            categories: [c1, c2],
            suggestedName: c1.length <= c2.length ? c1 : c2
          });
        }
      }
    }
    return suggestions;
  }, [rawCategories, mergedGroups]);

  // Group the active merged groups for display
  // mergedGroups is a map: { "ravkant": "Ravikant", "Ravikant": "Ravikant" }
  const activeGroups = useMemo(() => {
    const groups = {}; // primaryName -> [item1, item2, ...]
    Object.entries(mergedGroups).forEach(([raw, primary]) => {
      if (!groups[primary]) groups[primary] = [];
      if (!groups[primary].includes(raw)) groups[primary].push(raw);
    });
    return Object.entries(groups).map(([primary, items]) => ({
      primaryName: primary,
      items
    }));
  }, [mergedGroups]);

  // Available categories for manual selection: Standalone unmerged categories + Active merged group names
  const availableCategories = useMemo(() => {
    const set = new Set();
    
    // 1. Standalone unmerged categories (exclude anything that was merged)
    rawCategories.forEach(c => {
      if (!mergedGroups[c]) {
        set.add(c);
      }
    });

    // 2. Active merged primary group names only
    Object.values(mergedGroups).forEach(primary => {
      if (primary && typeof primary === 'string') {
        set.add(primary.trim());
      }
    });

    const list = Array.from(set).sort((a, b) => a.localeCompare(b));
    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(c => c.toLowerCase().includes(term));
  }, [rawCategories, mergedGroups, searchTerm]);

  // Toggle selection
  const toggleItem = (cat) => {
    setSelectedItems(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Merge selected items
  const handleMergeSelected = (itemsToMerge, nameToUse) => {
    const primary = (nameToUse || customGroupName || itemsToMerge[0]).trim();
    if (!primary || itemsToMerge.length < 2) return;

    const newMap = { ...mergedGroups };

    // If any item being merged is already an active merged group,
    // update all its sub-members so they map to the new final primary name!
    Object.entries(mergedGroups).forEach(([raw, existingPrimary]) => {
      if (itemsToMerge.includes(existingPrimary)) {
        newMap[raw] = primary;
      }
    });

    itemsToMerge.forEach(item => {
      newMap[item] = primary;
    });

    onSaveMergedGroups(newMap);
    setSelectedItems([]);
    setCustomGroupName('');
  };

  // Split / Unmerge a group
  const handleSplitGroup = (primaryName) => {
    const newMap = { ...mergedGroups };
    Object.entries(newMap).forEach(([raw, primary]) => {
      if (primary.toLowerCase() === primaryName.toLowerCase()) {
        delete newMap[raw];
      }
    });
    onSaveMergedGroups(newMap);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-slate-50 w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-white/60 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-7 bg-white border-b border-slate-100 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-xs shrink-0">
              <Layers size={22} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Merge & Split Categories</h2>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                Combine similar categories or typos into a single group without altering transaction dates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6 flex-1 no-scrollbar">

          {/* 1. Similarity Suggestions */}
          {smartSuggestions.length > 0 && (
            <div className="p-4 sm:p-5 rounded-[2rem] bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-amber-950 font-black text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                    <GitMerge size={14} />
                  </div>
                  <span>Similarity Suggestions</span>
                </div>
                <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full font-bold self-start sm:self-auto">
                  {smartSuggestions.length} pairs detected
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500">
                We found categories with similar names or spelling variations. Click to merge them instantly:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {smartSuggestions.map((sug, idx) => (
                  <div 
                    key={idx}
                    className="p-3 sm:p-3.5 rounded-2xl bg-white border border-amber-200/80 shadow-xs flex items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {sug.categories.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-black border border-slate-200 truncate max-w-[130px] sm:max-w-[150px]">
                            {c}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1 truncate">
                        <ArrowRight size={10} className="shrink-0" /> Merge into: <span className="font-black text-slate-800 truncate">{sug.suggestedName}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleMergeSelected(sug.categories, sug.suggestedName)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-xs shrink-0 flex items-center gap-1"
                    >
                      <GitMerge size={12} />
                      Merge
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Active Merged Groups (With Split / Unmerge Button) */}
          {activeGroups.length > 0 && (
            <div className="bg-white p-5 sm:p-6 rounded-[2rem] shadow-premium border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                    <Split size={16} className="text-primary" />
                    Active Merged Groups ({activeGroups.length})
                  </h3>
                  <p className="text-xs font-bold text-slate-400">
                    Categories currently combined together. Click Split to restore them as separate categories.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeGroups.map((grp) => (
                  <div 
                    key={grp.primaryName}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800 text-sm">{grp.primaryName}</span>
                        <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {grp.items.length} merged
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {grp.items.map((item, i) => (
                          <span key={i} className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSplitGroup(grp.primaryName)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shrink-0 flex items-center gap-1"
                      title="Split back into separate categories"
                    >
                      <Split size={12} />
                      Split
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Manual Category Multi-Selection & Merge */}
          <div className="bg-white p-5 sm:p-6 rounded-[2rem] shadow-premium border border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800">
                  Manual Category Merge
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  Select 2 or more categories below to combine into one custom group name
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-primary/40"
                />
              </div>
            </div>

            {/* Selection Action Bar */}
            {selectedItems.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center">
                    {selectedItems.length}
                  </span>
                  <span className="text-xs font-black text-slate-800">categories selected</span>
                </div>

                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <input
                    type="text"
                    value={customGroupName}
                    onChange={(e) => setCustomGroupName(e.target.value)}
                    placeholder={`Name (e.g. ${selectedItems[0]})`}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => handleMergeSelected(selectedItems, customGroupName)}
                    disabled={selectedItems.length < 2}
                    className="px-4 py-1.5 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-wider hover:bg-primary-dark transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs whitespace-nowrap"
                  >
                    Merge Selected
                  </button>
                </div>
              </div>
            )}

            {/* Categories Multi-Select Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto no-scrollbar p-1">
              {availableCategories.map((cat) => {
                const isSelected = selectedItems.includes(cat);
                const isMergedGroup = activeGroups.some(g => g.primaryName.toLowerCase() === cat.toLowerCase());
                const groupMeta = activeGroups.find(g => g.primaryName.toLowerCase() === cat.toLowerCase());

                return (
                  <div
                    key={cat}
                    onClick={() => toggleItem(cat)}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-between gap-2 select-none",
                      isSelected ? "bg-primary text-white border-primary shadow-xs" : 
                      isMergedGroup ? "bg-amber-50/70 border-amber-300/80 text-amber-950 hover:bg-amber-100/60" :
                      "bg-white border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate">{cat}</p>
                      {isMergedGroup && !isSelected && (
                        <p className="text-[9px] font-bold text-amber-700 truncate">
                          Merged ({groupMeta?.items.length || 2} categories)
                        </p>
                      )}
                    </div>
                    <div className={cn(
                      "w-4 h-4 rounded-md border flex items-center justify-center shrink-0",
                      isSelected ? "bg-white text-primary border-white" : "border-slate-300 bg-white"
                    )}>
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer active:scale-95 shadow-md"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
export default CategoryMergeModal;
