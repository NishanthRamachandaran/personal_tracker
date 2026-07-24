export interface CurrencyOption {
  symbol: string;
  code: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { symbol: "₹", code: "INR", name: "Indian Rupee (₹)" },
  { symbol: "$", code: "USD", name: "US Dollar ($)" },
  { symbol: "€", code: "EUR", name: "Euro (€)" },
  { symbol: "£", code: "GBP", name: "British Pound (£)" },
  { symbol: "A$", code: "AUD", name: "Australian Dollar (A$)" },
  { symbol: "C$", code: "CAD", name: "Canadian Dollar (C$)" },
  { symbol: "¥", code: "JPY", name: "Japanese Yen (¥)" },
];

export function getStoredCurrency(): CurrencyOption {
  try {
    const saved = localStorage.getItem("pulse_user_currency");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.symbol && parsed?.code) return parsed;
    }
  } catch {}

  // Auto-detect based on user country/timeZone
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (timeZone.includes("America") || timeZone.includes("New_York") || timeZone.includes("Los_Angeles")) {
      return { symbol: "$", code: "USD", name: "US Dollar ($)" };
    }
    if (timeZone.includes("Europe/London")) {
      return { symbol: "£", code: "GBP", name: "British Pound (£)" };
    }
    if (timeZone.includes("Europe")) {
      return { symbol: "€", code: "EUR", name: "Euro (€)" };
    }
  } catch {}

  // Default to India INR (₹)
  return { symbol: "₹", code: "INR", name: "Indian Rupee (₹)" };
}

export function setStoredCurrency(currency: CurrencyOption) {
  try {
    localStorage.setItem("pulse_user_currency", JSON.stringify(currency));
    window.dispatchEvent(new Event("pulse_currency_changed"));
  } catch (e) {
    console.error("Failed to set user currency", e);
  }
}

export function formatCurrency(amount: number): string {
  const currency = getStoredCurrency();
  const locale = currency.code === "INR" ? "en-IN" : "en-US";

  const formattedAmount = amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${currency.symbol}${formattedAmount}`;
}
