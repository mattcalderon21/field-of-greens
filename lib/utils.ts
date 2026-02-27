import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCurrencyFull(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00')
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateFull(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00')
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getTournamentStatus(tournament: {
  is_active: boolean
  is_completed: boolean
}): 'upcoming' | 'active' | 'completed' {
  if (tournament.is_completed) return 'completed'
  if (tournament.is_active) return 'active'
  return 'upcoming'
}

export function isPickDeadlinePassed(teeTimeR1: string | null | undefined): boolean {
  if (!teeTimeR1) return false
  return new Date() > new Date(teeTimeR1)
}

export function getEarliestTeeTime(fields: { tee_time_r1: string | null }[]): string | null {
  const times = fields
    .map((f) => f.tee_time_r1)
    .filter((t): t is string => t !== null)
    .sort()
  return times[0] ?? null
}

export function formatCountdown(deadline: string | null): string {
  if (!deadline) return 'No deadline set'
  const now = new Date()
  const target = new Date(deadline)
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return 'Deadline passed'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (days > 0) return `${days}d ${hours}h ${minutes}m until deadline`
  if (hours > 0) return `${hours}h ${minutes}m until deadline`
  return `${minutes}m until deadline`
}

export function getPurseDisplay(purse: number | null): string {
  if (purse === null || purse === 0) return 'TBD'
  return formatCurrency(purse)
}

export const SEASON_START = '2026-01-15'
export const SEASON_END = '2026-08-20'
export const TOTAL_TOURNAMENTS = 36
