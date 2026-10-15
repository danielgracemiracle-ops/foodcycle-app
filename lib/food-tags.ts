import type { Food } from '@/types'

export const MAIN_INGREDIENTS = [
  { value: 'nasi', label: 'Nasi', keywords: ['nasi', 'rice', 'uduk', 'rendang'] },
  { value: 'mie', label: 'Mie', keywords: ['mie', 'noodle', 'ramen', 'kwetiau', 'bihun', 'pasta'] },
  { value: 'ayam', label: 'Ayam', keywords: ['ayam', 'chicken'] },
  { value: 'sapi', label: 'Daging Sapi', keywords: ['sapi', 'beef', 'rendang', 'daging'] },
  { value: 'ikan', label: 'Ikan', keywords: ['ikan', 'fish', 'tuna', 'salmon'] },
  { value: 'seafood', label: 'Seafood', keywords: ['udang', 'shrimp', 'prawn', 'cumi', 'squid', 'seafood', 'dimsum'] },
  { value: 'telur', label: 'Telur', keywords: ['telur', 'egg'] },
  { value: 'sayur', label: 'Sayur', keywords: ['sayur', 'vegetable', 'salad', 'gado', 'cucumber', 'carrot', 'lettuce', 'spinach', 'edamame', 'quinoa', 'kale', 'cabbage', 'tofu', 'tempe'] },
  { value: 'buah', label: 'Buah', keywords: ['buah', 'fruit', 'banana', 'pisang', 'mango', 'berry', 'apple'] },
  { value: 'roti', label: 'Roti & Kue', keywords: ['roti', 'bread', 'croissant', 'cake', 'kue', 'pastry', 'bun'] },
  { value: 'minuman', label: 'Minuman', keywords: ['kopi', 'coffee', 'tea', 'teh', 'smoothie', 'juice', 'jus', 'es '] },
] as const

export type MainIngredient = (typeof MAIN_INGREDIENTS)[number]['value']

const LABELS = new Map<string, string>(MAIN_INGREDIENTS.map((m) => [m.value, m.label]))
export const mainIngredientLabel = (v: MainIngredient) => LABELS.get(v) ?? v

function foodText(food: Pick<Food, 'name' | 'ingredients' | 'description'>) {
  return ` ${[food.name, food.description, ...food.ingredients].join(' ').toLowerCase()} `
}

/** Uses the tags chosen by the restaurant; falls back to keyword inference for older listings. */
export function getMainIngredients(food: Pick<Food, 'name' | 'ingredients' | 'description' | 'mainIngredients'>): MainIngredient[] {
  if (food.mainIngredients?.length) return food.mainIngredients
  const text = foodText(food)
  return MAIN_INGREDIENTS.filter((m) => m.keywords.some((k) => text.includes(k))).map((m) => m.value)
}

export type HealthLevel = 'healthy' | 'balanced' | 'treat'

export interface HealthResult {
  score: number
  level: HealthLevel
  label: string
  reasons: string[]
}

const FRIED = ['goreng', 'fried', 'crispy', 'risoles', 'gorengan', 'katsu', 'nugget']
const SUGARY = ['gula', 'sugar', 'syrup', 'sirup', 'chocolate', 'cokelat', 'cream', 'krim', 'susu kental', 'condensed', 'caramel', 'manis', 'sweet']
const PROCESSED = ['sosis', 'sausage', 'kornet', 'instant', 'instan', 'ham ']

export const HEALTH_LABELS: Record<HealthLevel, string> = {
  healthy: 'Sehat',
  balanced: 'Seimbang',
  treat: 'Nikmati sesekali',
}

/**
 * Simple "Isi Piringku"-inspired score (0–100). Informational only, not a medical claim.
 * Rewards vegetables, fruit and lean protein; penalises frying, added sugar and processed items.
 */
export function calculateHealthScore(food: Pick<Food, 'name' | 'ingredients' | 'description' | 'category' | 'mainIngredients'>): HealthResult {
  const tags = getMainIngredients(food)
  const text = foodText(food)
  const reasons: string[] = []
  let score = 55

  if (tags.includes('sayur')) { score += 18; reasons.push('Mengandung sayur') }
  if (tags.includes('buah')) { score += 10; reasons.push('Mengandung buah') }
  if (tags.includes('ikan') || tags.includes('seafood')) { score += 8; reasons.push('Protein ikan/seafood') }
  else if (tags.includes('ayam') || tags.includes('telur')) { score += 5; reasons.push('Sumber protein') }
  if (['quinoa', 'brown rice', 'beras merah', 'oat', 'whole'].some((k) => text.includes(k))) { score += 8; reasons.push('Biji-bijian utuh') }

  if (FRIED.some((k) => text.includes(k))) { score -= 20; reasons.push('Digoreng') }
  if (SUGARY.some((k) => text.includes(k))) { score -= 12; reasons.push('Gula tambahan') }
  if (PROCESSED.some((k) => text.includes(k))) { score -= 10; reasons.push('Bahan olahan') }
  if (food.category === 'Snacks' || food.category === 'Bakery') score -= 8
  if (tags.length >= 3) score += 4

  score = Math.max(0, Math.min(100, Math.round(score)))
  const level: HealthLevel = score >= 70 ? 'healthy' : score >= 45 ? 'balanced' : 'treat'
  return { score, level, label: HEALTH_LABELS[level], reasons }
}
