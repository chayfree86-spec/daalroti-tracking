import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

/**
 * Resolves whether a given theme preference results in dark mode.
 */
function resolveIsDark(themeValue) {
  if (themeValue === 'dark') return true;
  if (themeValue === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }
  return false;
}

/**
 * Imperatively applies dark/light class to <html> and <body>.
 * This is the SINGLE source of truth for DOM mutations.
 */
function applyDarkClass(isDark) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  if (isDark) {
    root.classList.add('dark');
    body?.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    body?.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }

  // Update PWA / browser chrome color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', isDark ? '#0b0f19' : '#F8FAFC');
  }
}

export const ThemeProvider = ({ children }) => {
  // Read saved preference once
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem('daalroti_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  const [isDark, setIsDark] = useState(() => resolveIsDark(
    (() => { try { return localStorage.getItem('daalroti_theme') || 'light'; } catch { return 'light'; } })()
  ));

  /**
   * Public setter — called by UI buttons in Settings.
   */
  const setTheme = useCallback((newTheme) => {
    // 1. Persist
    try { 
      localStorage.setItem('daalroti_theme', newTheme); 
    } catch {}

    // 2. Resolve & apply to DOM immediately
    const dark = resolveIsDark(newTheme);
    applyDarkClass(dark);

    // 3. Update React state
    setIsDark(dark);
    setThemeState(newTheme);
  }, []);

  /**
   * Quick toggle between light and dark modes.
   */
  const toggleTheme = useCallback(() => {
    const nextDark = !resolveIsDark(theme);
    const nextTheme = nextDark ? 'dark' : 'light';
    setTheme(nextTheme);
  }, [theme, setTheme]);

  /**
   * Effect: ensures DOM stays in sync if theme state changes or on initial mount.
   */
  useEffect(() => {
    const dark = resolveIsDark(theme);
    applyDarkClass(dark);
    setIsDark(dark);
  }, [theme]);

  /**
   * Listen for OS-level theme changes when user chose "system".
   */
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      const dark = e.matches;
      applyDarkClass(dark);
      setIsDark(dark);
    };

    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else if (mq.addListener) {
      mq.addListener(handler);
      return () => mq.removeListener(handler);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;

