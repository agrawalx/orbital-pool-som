import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  
  if (num >= 1e9) {
    return (num / 1e9).toFixed(decimals) + 'B'
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(decimals) + 'M'
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(decimals) + 'K'
  }
  
  return num.toFixed(decimals)
}

export function formatCurrency(value: number | string, currency: string = 'USD'): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '$0.00'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(num)
}

export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function calculatePriceImpact(
  inputAmount: number,
  outputAmount: number,
  inputReserve: number,
  outputReserve: number
): number {
  if (!inputAmount || !outputAmount || !inputReserve || !outputReserve) return 0
  
  const expectedOutput = (inputAmount * outputReserve) / (inputReserve + inputAmount)
  const priceImpact = ((expectedOutput - outputAmount) / expectedOutput) * 100
  
  return Math.max(0, priceImpact)
}

export function calculateSlippage(
  expectedAmount: number,
  actualAmount: number
): number {
  if (!expectedAmount || !actualAmount) return 0
  return Math.abs((expectedAmount - actualAmount) / expectedAmount) * 100
}