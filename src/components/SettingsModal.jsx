import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Lock, LogOut, Check, Eye, EyeOff, Shield, User, KeyRound, SunMedium, Moon, Monitor } from 'lucide-react';
import { getCredentials, updateCredentials, logout } from '../lib/auth';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

const SettingsModal = ({ isOpen, onClose, onLogoutSuccess, onAlert }) => {
  const { theme, setTheme } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState('appearance'); // 'appearance' | 'account' | 'password'
  
  // Account (Mobile) State
  const [currentMobile, setCurrentMobile] = useState(() => getCredentials().mobile);
  const [newMobile, setNewMobile] = useState(() => getCredentials().mobile);
  
  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  
  // Logout Confirm state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Sync credentials on open
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      const creds = getCredentials();
      setCurrentMobile(creds.mobile);
      setNewMobile(creds.mobile);
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateMobile = (e) => {
    e.preventDefault();
    const cleanMobile = newMobile.trim();
    if (!cleanMobile || cleanMobile.length !== 10) {
      onAlert({
        show: true,
        type: 'error',
        title: 'Invalid Mobile',
        message: 'Please enter a valid 10-digit mobile number.',
      });
      return;
    }

    updateCredentials({ mobile: cleanMobile });
    setCurrentMobile(cleanMobile);
    onAlert({
      show: true,
      type: 'success',
      title: 'Mobile Updated!',
      message: 'Your login mobile number has been updated successfully.',
    });
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    const creds = getCredentials();

    if (!oldPassword.trim()) {
      onAlert({
        show: true,
        type: 'error',
        title: 'Old Password Required',
        message: 'Please enter your current password.',
      });
      return;
    }

    if (oldPassword.trim() !== creds.password) {
      onAlert({
        show: true,
        type: 'error',
        title: 'Incorrect Password',
        message: 'The current password you entered does not match.',
      });
      return;
    }

    if (!newPassword.trim() || newPassword.length < 3) {
      onAlert({
        show: true,
        type: 'error',
        title: 'Weak Password',
        message: 'New password must be at least 3 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      onAlert({
        show: true,
        type: 'error',
        title: 'Password Mismatch',
        message: 'New password and confirm password do not match.',
      });
      return;
    }

    updateCredentials({ password: newPassword });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onAlert({
      show: true,
      type: 'success',
      title: 'Password Changed!',
      message: 'Your login password has been changed successfully.',
    });
  };

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    onClose();
    onLogoutSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 max-w-lg w-full overflow-hidden relative z-10 font-nunito transition-colors"
      >
        {/* Header */}
        <div className="p-6 bg-slate-800 dark:bg-slate-950 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Security & Settings</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Theme, Login & Credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub Tabs */}
        <div className="flex border-b border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/70 p-2 gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveSubTab('appearance')}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              activeSubTab === 'appearance'
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <SunMedium size={14} className="shrink-0 text-amber-500" />
            <span>Theme</span>
          </button>

          <button
            onClick={() => setActiveSubTab('account')}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              activeSubTab === 'account'
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <User size={14} className="shrink-0 text-blue-500" />
            <span>Mobile</span>
          </button>

          <button
            onClick={() => setActiveSubTab('password')}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              activeSubTab === 'password'
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <KeyRound size={14} className="shrink-0 text-emerald-500" />
            <span>Password</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6">
          {/* 1. Appearance / Theme Tab */}
          {activeSubTab === 'appearance' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 ml-1">
                  Display Theme Mode
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose how DaalRoti Tracker looks on this device:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
                {/* Light Option */}
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={cn(
                    "p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden group active:scale-95",
                    theme === 'light'
                      ? "bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white shadow-md ring-2 ring-amber-500/30"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <SunMedium size={18} />
                    </div>
                    {theme === 'light' && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Light Mode</p>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">Classic crisp layout</p>
                  </div>
                </button>

                {/* Dark Option */}
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={cn(
                    "p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden group active:scale-95",
                    theme === 'dark'
                      ? "bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white shadow-md ring-2 ring-amber-500/30"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Moon size={18} />
                    </div>
                    {theme === 'dark' && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Dark Mode</p>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">Onyx midnight theme</p>
                  </div>
                </button>

                {/* System Option */}
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={cn(
                    "p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden group active:scale-95",
                    theme === 'system'
                      ? "bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white shadow-md ring-2 ring-amber-500/30"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-slate-500/20 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                      <Monitor size={18} />
                    </div>
                    {theme === 'system' && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">System Auto</p>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">Sync with device</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'account' && (
            <form onSubmit={handleUpdateMobile} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
                  Current Registered Mobile
                </label>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center gap-2.5">
                  <Phone size={16} className="text-amber-500" />
                  <span>+91 {currentMobile}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
                  New Mobile Number
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-400 pointer-events-none">
                    <Phone size={16} />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter new 10-digit mobile"
                    maxLength={10}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Check size={16} className="text-amber-400 dark:text-white" />
                <span>Save New Mobile</span>
              </button>
            </form>
          )}

          {activeSubTab === 'password' && (
            <form onSubmit={handleUpdatePassword} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 ml-1">
                  Current Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-400 pointer-events-none">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-11 pr-11 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 ml-1">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-400 pointer-events-none">
                    <KeyRound size={16} />
                  </div>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-11 pr-11 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 ml-1">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-400 pointer-events-none">
                    <KeyRound size={16} />
                  </div>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Check size={16} className="text-amber-400 dark:text-white" />
                <span>Update Password</span>
              </button>
            </form>
          )}

          {/* Divider and Logout Action */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-800 dark:text-slate-200">Sign Out</p>
              <p className="text-[10px] font-bold text-slate-400">End your active session on this device</p>
            </div>

            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="px-4 py-2.5 rounded-2xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-500/30 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Logout Confirmation Sub-Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-w-sm w-full relative z-10 text-center font-nunito"
            >
              <div className="w-14 h-14 rounded-3xl bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
                <LogOut size={26} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">Confirm Logout</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-6">
                Are you sure you want to sign out from DaalRoti Tracker?
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/20 transition-all cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsModal;
