import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type AllocationFrequency =
  | "DAILY"
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMI_ANNUALLY"
  | "ANNUALLY";

export function getAllocationPeriod(frequency: AllocationFrequency) {
  const now = new Date();

  switch (frequency) {
    case "DAILY": {
      const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      return { periodStart, periodEnd };
    }
    case "MONTHLY": {
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { periodStart, periodEnd };
    }
    case "QUARTERLY": {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      const periodStart = new Date(now.getFullYear(), quarterStartMonth, 1);
      const periodEnd = new Date(now.getFullYear(), quarterStartMonth + 3, 1);
      return { periodStart, periodEnd };
    }
    case "SEMI_ANNUALLY": {
      const halfStartMonth = now.getMonth() < 6 ? 0 : 6;
      const periodStart = new Date(now.getFullYear(), halfStartMonth, 1);
      const periodEnd = new Date(now.getFullYear(), halfStartMonth + 6, 1);
      return { periodStart, periodEnd };
    }
    case "ANNUALLY": {
      const periodStart = new Date(now.getFullYear(), 0, 1);
      const periodEnd = new Date(now.getFullYear() + 1, 0, 1);
      return { periodStart, periodEnd };
    }
    default: {
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { periodStart, periodEnd };
    }
  }
}
