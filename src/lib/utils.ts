import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStockColor(change: string) {
  if (change.startsWith('+')) return 'text-red-500';
  if (change.startsWith('-')) return 'text-green-500';
  return 'text-on-surface';
}

export function getOpinionColor(opinion: string) {
  if (opinion.includes('利空') || opinion.includes('卖出') || opinion.includes('回避') || opinion.includes('风险')) return 'text-red-500';
  if (opinion.includes('利好') || opinion.includes('买入') || opinion.includes('机会') || opinion.includes('推荐')) return 'text-green-500';
  if (opinion.includes('预警') || opinion.includes('观望') || opinion.includes('中性')) return 'text-yellow-500';
  return 'text-on-surface';
}

export function getOpinionBgColor(opinion: string) {
  if (opinion.includes('利空') || opinion.includes('卖出') || opinion.includes('回避') || opinion.includes('风险')) return 'bg-red-500/20 text-red-500 border-red-500/30';
  if (opinion.includes('利好') || opinion.includes('买入') || opinion.includes('机会') || opinion.includes('推荐')) return 'bg-green-500/20 text-green-500 border-green-500/30';
  if (opinion.includes('预警') || opinion.includes('观望') || opinion.includes('中性')) return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
  return 'bg-outline/20 text-outline border-outline/30';
}
