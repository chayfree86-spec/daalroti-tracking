import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn, todayIST } from '../lib/utils';

const CustomCalendar = ({ selectedDate, onSelect, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));
  
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const years = [];
  const startYear = new Date().getFullYear() - 5;
  for (let i = 0; i <= 10; i++) years.push(startYear + i);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const days = [];
  const totalDays = daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const startDay = firstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());

  // Padding for start of month
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isSelected = selectedDate === dateStr;
    const isToday = todayIST() === dateStr;

    days.push(
      <button
        key={d}
        type="button"
        onClick={() => {
          onSelect(dateStr);
          onClose();
        }}
        className={cn(
          "h-10 w-10 rounded-xl font-bold transition-all flex items-center justify-center text-sm",
          isSelected ? "bg-primary text-white shadow-lg shadow-primary/30" : 
          isToday ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100"
        )}
      >
        {d}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex flex-col">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Date</p>
            <div className="flex items-center gap-4 mt-1">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <ChevronLeft size={20} className="text-white" />
              </button>
              <h3 className="text-xl font-black min-w-[140px] text-center">{months[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
              <button onClick={handleNextMonth} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <ChevronRight size={20} className="text-white" />
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors self-start">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <span key={i} className="text-[10px] font-black text-slate-300 uppercase">{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
          <button 
            type="button"
            onClick={() => {
              onSelect(todayIST());
              onClose();
            }}
            className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
          >
            Today
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomCalendar;
