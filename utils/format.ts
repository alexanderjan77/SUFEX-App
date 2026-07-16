export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateShort(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function parseCurrencyInput(raw: string): number {
  const cleaned = raw.replace(/[^\d]/g, "");
  return parseInt(cleaned || "0", 10) / 100;
}

export function formatCurrencyInput(value: number): string {
  const cents = Math.round(value * 100);
  const formatted = (cents / 100).toFixed(2);
  const [intPart, decPart] = formatted.split(".");
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${withDots},${decPart}`;
}

export function formatCSVValue(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(";") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function formatCurrencyCSV(value: number): string {
  return value.toFixed(2).replace(".", ",");
}
