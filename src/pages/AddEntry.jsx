import React, { useState, useRef } from 'react';
import { Save, Wallet, Smartphone, MessageSquare, Calendar } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import CustomCalendar from '../components/CustomCalendar';
import CustomAlert from '../components/CustomAlert';

const AddEntry = ({ onSave }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    cashIncome: '',
    onlineIncome: '',
    cashSpend: '',
    onlineSpend: '',
    remark: '',
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '' });

  // Refs for focus management (User Rule Requirement)
  const cashIncomeRef = useRef(null);
  const onlineIncomeRef = useRef(null);
  const cashSpendRef = useRef(null);
  const onlineSpendRef = useRef(null);
  const remarkRef = useRef(null);
  const submitRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.cashIncome && !formData.onlineIncome && !formData.cashSpend && !formData.onlineSpend) {
        setAlert({
            show: true,
            type: 'error',
            title: 'Empty Entry',
            message: 'Please enter at least one income or spend amount.'
        });
        return;
    }
    
    const entry = {
      ...formData,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };
    onSave(entry);
    
    setAlert({
        show: true,
        type: 'success',
        title: 'Saved Successfully!',
        message: `Entry for ${formatDate(formData.date)} has been recorded.`
    });
  };

  return (
    <div className="container mx-auto p-6 pt-12 space-y-8 max-w-5xl pb-24">
      <header className="text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Add New <span className="text-primary">Entry</span></h1>
          <p className="text-slate-400 font-bold text-sm uppercase mt-1">Daily Finance Tracking</p>
        </div>

        {/* Custom Date Picker at Top Right for Web, Center for Mobile */}
        <div className="space-y-2 min-w-[200px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 md:justify-end">
            <Calendar size={12} className="text-primary" />
            Entry Date
          </label>
          <button
            type="button"
            onClick={() => setShowCalendar(true)}
            className="w-full md:w-auto px-6 h-[50px] rounded-2xl bg-white border-2 border-slate-100 flex justify-between items-center gap-4 hover:border-primary/30 transition-all font-bold text-slate-700 shadow-premium"
          >
            <span>{formatDate(formData.date)}</span>
            <Calendar size={18} className="text-primary/40" />
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Income Section */}
          <div className="bg-white p-8 rounded-[3rem] shadow-premium border border-slate-50 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-income/10 text-income flex items-center justify-center">
                <Save size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Income Details</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Wallet size={12} className="text-income" />
                  Cash Income
                </label>
                <input
                  ref={cashIncomeRef}
                  autoFocus
                  type="number"
                  name="cashIncome"
                  value={formData.cashIncome}
                  onChange={handleChange}
                  onKeyDown={(e) => handleKeyDown(e, onlineIncomeRef)}
                  placeholder="0"
                  className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 h-[60px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Smartphone size={12} className="text-income" />
                  Online Income
                </label>
                <input
                  ref={onlineIncomeRef}
                  type="number"
                  name="onlineIncome"
                  value={formData.onlineIncome}
                  onChange={handleChange}
                  onKeyDown={(e) => handleKeyDown(e, cashSpendRef)}
                  placeholder="0"
                  className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 h-[60px]"
                />
              </div>
            </div>
          </div>

          {/* Spend Section (Remark moved here) */}
          <div className="bg-white p-8 rounded-[3rem] shadow-premium border border-slate-50 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-spend/10 text-spend flex items-center justify-center">
                <Save size={24} className="rotate-180" />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Spend Details</h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Wallet size={12} className="text-spend" />
                    Cash Spend
                  </label>
                  <input
                    ref={cashSpendRef}
                    type="number"
                    name="cashSpend"
                    value={formData.cashSpend}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, onlineSpendRef)}
                    placeholder="0"
                    className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 h-[60px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Smartphone size={12} className="text-spend" />
                    Online Spend
                  </label>
                  <input
                    ref={onlineSpendRef}
                    type="number"
                    name="onlineSpend"
                    value={formData.onlineSpend}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, remarkRef)}
                    placeholder="0"
                    className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 h-[60px]"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-50">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={12} className="text-primary" />
                  Remark / Spend Reason
                </label>
                <input
                  ref={remarkRef}
                  type="text"
                  name="remark"
                  value={formData.remark}
                  onChange={handleChange}
                  onKeyDown={(e) => handleKeyDown(e, submitRef)}
                  placeholder="E.g. Dinner, Fuel, Groceries..."
                  className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-primary/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 h-[60px]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center md:justify-end pt-4">
          <button
            ref={submitRef}
            type="submit"
            className="w-full md:w-auto min-w-[250px] h-[70px] rounded-3xl bg-slate-900 text-white font-black text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 hover:bg-slate-800"
          >
            <Save size={24} />
            Save Entry
          </button>
        </div>
      </form>

      {/* Custom Components */}
      {showCalendar && (
        <CustomCalendar 
          selectedDate={formData.date}
          onSelect={(date) => setFormData(prev => ({ ...prev, date }))}
          onClose={() => setShowCalendar(false)}
        />
      )}

      <CustomAlert 
        show={alert.show}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={() => setAlert({ ...alert, show: false })}
      />
    </div>
  );
};

export default AddEntry;
