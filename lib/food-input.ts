import type { FoodCategory } from '@/types'
import type { MainIngredient } from '@/lib/food-tags'

export interface FoodInput {
  name: string
  category: FoodCategory
  description: string
  image: string
  originalPrice: number
  price: number
  quantity: number
  pickupStart: string
  pickupEnd: string
  ingredients: string[]
  mainIngredients: MainIngredient[]
  allergens: string[]
  donationAvailable: boolean
  freshness: number
  packaging: number
  weightKg: number
}

export function validateFoodInput(input: FoodInput): Record<string, string> {
  const errors: Record<string, string> = {}
  if (input.name.trim().length < 3) errors.name = 'Name must be at least 3 characters.'
  if (input.description.trim().length < 10) errors.description = 'Add a short description (10+ characters).'
  if (!input.image) errors.image = 'Please add a photo.'
  if (!(input.originalPrice > 0)) errors.originalPrice = 'Original price must be greater than 0.'
  if (!(input.price > 0)) errors.price = 'Discount price must be greater than 0.'
  else if (input.price >= input.originalPrice) errors.price = 'Discount price must be lower than the original price.'
  if (!Number.isInteger(input.quantity) || input.quantity < 0) errors.quantity = 'Quantity must be 0 or more.'
  if (!input.pickupStart) errors.pickupStart = 'Choose a pickup start time.'
  if (!input.pickupEnd) errors.pickupEnd = 'Choose a pickup deadline.'
  if (input.pickupStart && input.pickupEnd && new Date(input.pickupEnd) <= new Date(input.pickupStart))
    errors.pickupEnd = 'Deadline must be after the pickup start.'
  else if (input.pickupEnd && new Date(input.pickupEnd).getTime() <= Date.now())
    errors.pickupEnd = 'Deadline must be in the future.'
  if (input.ingredients.length === 0) errors.ingredients = 'List at least one ingredient.'
  if (input.mainIngredients.length === 0) errors.mainIngredients = 'Pick at least one main ingredient so customers can filter.'
  return errors
}
