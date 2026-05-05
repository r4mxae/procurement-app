// Locale + UI configuration constants

export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'AED', symbol: 'AED ', label: 'UAE Dirham' },
  { code: 'SAR', symbol: 'SAR ', label: 'Saudi Riyal' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
  { code: 'CHF', symbol: 'CHF ', label: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan' },
];

export const ACCENT_PRESETS = [
  { id: 'theme', name: 'Theme default', color: null },
  { id: 'amber', name: 'Amber', color: '#d4a574' },
  { id: 'teal', name: 'Teal', color: '#2a9d8f' },
  { id: 'rose', name: 'Rose', color: '#e8889a' },
  { id: 'copper', name: 'Copper', color: '#d4946b' },
  { id: 'sapphire', name: 'Sapphire', color: '#5b8bd9' },
  { id: 'violet', name: 'Violet', color: '#a78bfa' },
  { id: 'lime', name: 'Lime', color: '#a3c969' },
  { id: 'sunset', name: 'Sunset', color: '#e76f51' },
];

export const DATE_FORMATS = [
  { id: 'short', label: 'Short', sample: 'Jan 5' },
  { id: 'medium', label: 'Medium', sample: 'Jan 5, 2026' },
  { id: 'long', label: 'Long', sample: 'January 5, 2026' },
  { id: 'iso', label: 'ISO', sample: '2026-01-05' },
];

export const LIGHT_THEMES = ['porcelain', 'mono'];
export const isLightTheme = (themeId) => LIGHT_THEMES.includes(themeId);

export const THEMES = [
  { id: 'obsidian', name: 'Obsidian', hint: 'Charcoal & amber', dot: '#d4a574' },
  { id: 'porcelain', name: 'Porcelain', hint: 'Cream & teal', dot: '#2a7e76' },
  { id: 'midnight', name: 'Midnight', hint: 'Indigo & rose', dot: '#e8889a' },
  { id: 'forest', name: 'Forest', hint: 'Pine & copper', dot: '#d4946b' },
  { id: 'mono', name: 'Mono', hint: 'High contrast · minimalist', dot: '#000000' },
  { id: 'mono-dark', name: 'Mono Dark', hint: 'High contrast · pure black', dot: '#ffffff' },
];
