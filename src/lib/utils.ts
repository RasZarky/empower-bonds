import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0]; // Format the date to YYYY-MM-DD
};

export const oneDay = 24 * 60 * 60 * 1000;

export function getInitials(name: string | null | undefined): string {
  if (!name) return ''

  // Remove extra spaces and split into parts
  const parts = name.trim().split(/\s+/)

  // Get first letter of first word
  const firstInitial = parts[0]?.[0]?.toUpperCase() || ''

  // Get first letter of last word (if different from first)
  const lastInitial = parts.length > 1
    ? parts[parts.length - 1]?.[0]?.toUpperCase()
    : ''

  return `${firstInitial}${lastInitial}`
}

export const formatPercentage = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100) // Divide by 100 as getSavingsRateAction returns 0-100
}

export const formatCurrency = (value: string | number, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(value.toString()))
}