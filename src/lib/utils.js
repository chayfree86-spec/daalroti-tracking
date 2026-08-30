import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  const val = Number(amount);
  const num = isNaN(val) ? 0 : val;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    let parsedDate;
    const str = String(dateStr).trim();

    // Full ISO string like "2026-04-30T18:30:00.000Z"
    if (str.includes('T')) {
      parsedDate = new Date(str);
    } else if (str.includes('-')) {
      const parts = str.split('-');
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        parsedDate = new Date(str + 'T00:00:00');
      } else {
        // DD-MM-YYYY
        parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
      }
    } else {
      parsedDate = new Date(str);
    }

    if (isNaN(parsedDate.getTime())) return 'Invalid Date';
    
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    return parsedDate.toLocaleDateString('en-IN', options);
  } catch {
    return 'Invalid Date';
  }
}

export function numberToWords(num) {
  if (num === 0) return 'Zero Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const g = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + g(n % 100) : '');
  };

  const make = (n) => {
    let res = '';
    if (n >= 10000000) {
      res += make(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    if (n >= 100000) {
      res += g(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    if (n >= 1000) {
      res += g(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    if (n > 0) res += g(n);
    return res.trim();
  };

  return make(Math.abs(num)) + ' Only';
}
export function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// ---- India Standard Time (IST / Asia/Kolkata) helpers ----------------------
// All "current date / time" must follow India time regardless of the device's
// timezone. Never use new Date().toISOString() for the entry date — that is UTC
// and shifts the day by ±1 around midnight IST.

const IST_TZ = 'Asia/Kolkata';

// Today's date in IST as 'YYYY-MM-DD' (en-CA formats in that order).
export function todayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: IST_TZ });
}

// Current { year, month, day } in IST (month is 1-12).
export function nowPartsIST() {
  const [year, month, day] = todayIST().split('-').map(Number);
  return { year, month, day };
}

// Current timestamp in IST: 'DD/MM/YYYY, HH:MM:SS' (24h).
export function nowIST() {
  return new Date().toLocaleString('en-IN', {
    timeZone: IST_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

// Current clock time in IST (for the "last synced" label).
export function timeIST() {
  return new Date().toLocaleTimeString('en-IN', { timeZone: IST_TZ });
}

/**
 * Normalize an entry object so all keys are in consistent camelCase.
 * Also cleans up date and timestamp fields from Google Sheet format.
 */
export function normalizeEntry(raw) {
  if (!raw || typeof raw !== 'object') return raw;

  // Map of lowercase -> camelCase for known fields
  const keyMap = {
    cashincome: 'cashIncome',
    onlineincome: 'onlineIncome',
    cashspend: 'cashSpend',
    onlinespend: 'onlineSpend',
    cashbalance: 'cashBalance',
    onlinebalance: 'onlineBalance',
    totalbalance: 'totalBalance',
  };

  const entry = {};
  Object.keys(raw).forEach(key => {
    const normalizedKey = keyMap[key.toLowerCase()] || key;
    // Avoid duplicate keys — camelCase version takes priority
    if (!Object.prototype.hasOwnProperty.call(entry, normalizedKey)) {
      entry[normalizedKey] = raw[key];
    }
  });

  // Ensure id is a number for consistent sorting
  if (entry.id !== undefined) {
    entry.id = Number(entry.id) || entry.id;
  }

  // Clean date field: extract YYYY-MM-DD from ISO strings like "2026-04-30T18:30:00.000Z"
  if (entry.date && typeof entry.date === 'string' && entry.date.includes('T')) {
    // Parse ISO and format as local YYYY-MM-DD
    const d = new Date(entry.date);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      entry.date = `${yyyy}-${mm}-${dd}`;
    }
  }

  // Fix timestamp: convert numeric to readable, or clean bad values
  if (entry.timestamp !== undefined) {
    const ts = entry.timestamp;
    if (typeof ts === 'number' && ts > 1000000000000) {
      // Numeric millisecond timestamp
      const d = new Date(ts);
      entry.timestamp = !isNaN(d.getTime())
        ? d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        : '';
    } else if (typeof ts === 'string' && ts.includes('1970')) {
      // Already corrupted 1970 timestamp, clear it
      entry.timestamp = '';
    }
  }

  return entry;
}

/**
 * Compute running balances across entries purely and deterministically without side effects.
 */
export function computeRunningBalances(entries = []) {
  if (!entries || !entries.length) return [];

  const sorted = [...entries].sort((a, b) => {
    if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
    return (Number(a.id) || 0) - (Number(b.id) || 0);
  });

  let runningCash = 0;
  let runningOnline = 0;

  return sorted.map(entry => {
    const cashDelta = Number(entry.cashIncome || 0) - Number(entry.cashSpend || 0);
    const onlineDelta = Number(entry.onlineIncome || 0) - Number(entry.onlineSpend || 0);

    const hasCashBal = entry.cashBalance !== undefined && entry.cashBalance !== "" && entry.cashBalance !== null && !isNaN(Number(entry.cashBalance));
    const hasOnlineBal = entry.onlineBalance !== undefined && entry.onlineBalance !== "" && entry.onlineBalance !== null && !isNaN(Number(entry.onlineBalance));

    const currentEntryCashBal = hasCashBal ? Number(entry.cashBalance) : (runningCash + cashDelta);
    const currentEntryOnlineBal = hasOnlineBal ? Number(entry.onlineBalance) : (runningOnline + onlineDelta);

    runningCash = currentEntryCashBal;
    runningOnline = currentEntryOnlineBal;

    return {
      ...entry,
      cashDelta,
      onlineDelta,
      runningCash,
      runningOnline,
      runningTotal: runningCash + runningOnline,
    };
  });
}

