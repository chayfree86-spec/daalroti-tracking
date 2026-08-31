import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../lib/utils';

const CustomAlert = ({ type = 'info', title, message, onConfirm, onCancel, show }) => {
  if (!show) return null;

  const icons = {
    info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10' },
    success: { icon: CheckCircle2, color: 'text-income', bg: 'bg-income/10' },
    error: { icon: AlertCircle, color: 'text-spend', bg: 'bg-spend/10' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  };

  // Fall back to 'info' for any unknown type so an alert never crashes the app.
  const { icon: Icon, color, bg } = icons[type] || icons.info;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[200] p-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 p-8 text-center space-y-6 transition-colors">
        <div className={cn("w-20 h-20 rounded-[2rem] mx-auto flex items-center justify-center mb-2", bg)}>
          <Icon size={40} className={color} />
        </div>
        
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{title}</h3>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-2">{message}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-600 text-white font-black text-sm uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all cursor-pointer"
          >
            {onCancel ? 'Confirm' : 'Got it'}
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 font-black text-sm uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;
