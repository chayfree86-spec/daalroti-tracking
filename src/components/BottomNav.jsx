import React from 'react';
import { LayoutDashboard, PlusCircle, BarChart3, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

const BottomNav = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'add', label: 'Add', icon: PlusCircle },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'analytics', label: 'Insights', icon: Activity },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-[2.5rem] flex gap-10 items-center z-50 shadow-2xl max-w-fit mx-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-3 transition-all duration-500 relative px-4 py-2 rounded-2xl group",
              isActive ? "text-primary bg-primary/10" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <div className="relative">
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="transition-transform group-active:scale-90" />
              {isActive && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </div>
            <span className={cn(
              "text-xs font-black uppercase tracking-widest overflow-hidden transition-all duration-500",
              isActive ? "w-auto opacity-100 ml-1" : "w-0 opacity-0"
            )}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
