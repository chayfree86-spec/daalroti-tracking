import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, UtensilsCrossed } from 'lucide-react';
import { login } from '../lib/auth';

const Login = ({ onLoginSuccess }) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const mobileInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Auto-focus first input on mount
  useEffect(() => {
    mobileInputRef.current?.focus();
  }, []);

  const handleMobileKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      passwordInputRef.current?.focus();
    }
  };

  const handlePasswordKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLoginSubmit(e);
    }
  };

  const handleLoginSubmit = (e) => {
    e?.preventDefault();
    setErrorMsg('');

    if (!mobile.trim()) {
      setErrorMsg('Please enter your mobile number.');
      mobileInputRef.current?.focus();
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Please enter your password.');
      passwordInputRef.current?.focus();
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = login(mobile, password);
      setIsLoading(false);

      if (result.success) {
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(result.error);
        passwordInputRef.current?.focus();
      }
    }, 300);
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-slate-950 p-4 sm:p-6 font-nunito selection:bg-amber-500 selection:text-white">
      {/* Dynamic Warm Food & Steam Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Ambient Warm Radial Lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-amber-500/15 rounded-full blur-[100px] sm:blur-[140px]" />
        <div className="absolute bottom-10 -left-20 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-10 -right-20 w-80 h-80 bg-amber-400/10 rounded-full blur-[100px]" />

        {/* Decorative Food Elements with Rising Steam */}
        <div className="absolute bottom-6 sm:bottom-12 left-1/2 -translate-x-1/2 opacity-25 flex flex-col items-center">
          {/* Animated Steam Trails */}
          <div className="relative w-48 h-36 mb-2 flex justify-center gap-6">
            {/* Steam Wave 1 */}
            <svg className="w-8 h-28 text-amber-200/50 animate-steam-1" viewBox="0 0 24 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 95 C 4 75, 20 60, 10 40 C 0 20, 16 10, 8 2" />
            </svg>
            {/* Steam Wave 2 (Center) */}
            <svg className="w-9 h-32 text-amber-100/60 animate-steam-2 -mt-4" viewBox="0 0 24 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M12 95 C 18 70, 6 55, 16 35 C 24 15, 10 5, 14 2" />
            </svg>
            {/* Steam Wave 3 */}
            <svg className="w-8 h-28 text-amber-200/50 animate-steam-3" viewBox="0 0 24 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 95 C 6 78, 18 62, 10 42 C 2 22, 14 12, 10 2" />
            </svg>
          </div>

          {/* Steaming Hot Pot / Handi Graphic Base */}
          <div className="w-40 sm:w-56 h-12 bg-gradient-to-r from-amber-600/30 via-orange-500/40 to-amber-600/30 rounded-t-full border-t border-amber-400/20 blur-[1px]" />
        </div>

        {/* Subtle Floating Culinary Micro-Particles */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/30 animate-float-slow"
              style={{
                top: `${15 + i * 14}%`,
                left: `${10 + (i * 17) % 80}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${5 + (i % 3) * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl p-7 sm:p-9 relative overflow-hidden">
          {/* Subtle Top Glowing Line */}
          <div className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-80" />

          {/* Brand Header & PWA Logo */}
          <div className="text-center mb-7 flex flex-col items-center">
            {/* PWA Logo Container with glowing ring */}
            <div className="relative mb-4 group">
              <div className="absolute -inset-2 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-3xl blur-md opacity-40 group-hover:opacity-70 transition duration-500" />
              <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-slate-950 border border-white/15 p-2 flex items-center justify-center shadow-xl">
                <img
                  src="./pwa-192x192.png"
                  alt="DaalRoti Tracker"
                  className="w-full h-full object-contain rounded-2xl drop-shadow"
                  onError={(e) => {
                    // Fallback to favicon or vector icon if PWA asset not loaded
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = './favicon.png';
                  }}
                />
              </div>
            </div>

            {/* Title and Subtitle */}
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              DaalRoti <span className="text-primary">Tracker</span>
            </h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
              <UtensilsCrossed size={13} className="text-amber-500" />
              <span>Daily Balance & Expense</span>
            </p>
          </div>

          {/* Error Notification */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Mobile Number Field */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5 ml-1">
                Mobile Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-slate-400 pointer-events-none">
                  <Phone size={18} />
                </div>
                <input
                  ref={mobileInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value.replace(/\D/g, ''));
                    if (errorMsg) setErrorMsg('');
                  }}
                  onKeyDown={handleMobileKeyDown}
                  placeholder="Enter 10-digit mobile"
                  maxLength={10}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-950/60 border border-white/10 rounded-2xl text-white font-bold text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5 ml-1">
                Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-slate-400 pointer-events-none">
                  <Lock size={18} />
                </div>
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  onKeyDown={handlePasswordKeyDown}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-950/60 border border-white/10 rounded-2xl text-white font-bold text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-200 transition-colors p-1 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security badge footer */}
        <div className="text-center mt-5 text-slate-500 text-[11px] font-bold flex items-center justify-center gap-1.5 opacity-80">
          <ShieldCheck size={14} className="text-amber-500/80" />
          <span>Secure Session • DaalRoti Multi-Device Sync</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
