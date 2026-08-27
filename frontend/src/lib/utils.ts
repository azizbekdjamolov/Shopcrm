import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS'
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('uz-UZ')
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('uz-UZ')
}
