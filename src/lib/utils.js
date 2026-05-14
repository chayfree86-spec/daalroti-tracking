import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    // Handle YYYY-MM-DD or DD-MM-YYYY
    let parsedDate;
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        parsedDate = new Date(dateStr + 'T00:00:00');
      } else {
        // DD-MM-YYYY
        parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
      }
    } else {
      parsedDate = new Date(dateStr);
    }

    if (isNaN(parsedDate.getTime())) return 'Invalid Date';
    
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    return parsedDate.toLocaleDateString('en-IN', options);
  } catch (e) {
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

/**
 * Normalize an entry object so all keys are in consistent camelCase.
 * Handles data coming from Google Sheets (lowercase) or localStorage (camelCase).
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
    if (!entry.hasOwnProperty(normalizedKey)) {
      entry[normalizedKey] = raw[key];
    }
  });

  // Ensure id is a number for consistent sorting
  if (entry.id !== undefined) {
    entry.id = Number(entry.id) || entry.id;
  }

  return entry;
}
