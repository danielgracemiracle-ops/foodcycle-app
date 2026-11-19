import { describe, expect, it } from 'vitest'
import { type FoodInput, validateFoodInput } from '@/lib/food-input'

const future = (h: number) => new Date(Date.now() + h * 3600_000).toISOString()

const valid: FoodInput = {
  name: 'Roti Coklat',
  category: 'Bakery' as FoodInput['category'],
  description: 'Roti coklat sisa produksi pagi.',
  image: '/roti.jpg',
  originalPrice: 20000,
  price: 10000,
  quantity: 4,
  pickupStart: future(1),
  pickupEnd: future(3),
  ingredients: ['tepung'],
  mainIngredients: ['roti' as never],
  allergens: ['gluten'],
  donationAvailable: false,
  freshness: 90,
  packaging: 80,
  weightKg: 0.2,
}

describe('Restaurant food listing validation (lib/food-input.ts)', () => {
  it('UT-F01: a complete listing has no errors', () => {
    expect(validateFoodInput(valid)).toEqual({})
  })

  it('UT-F02: discount price must be lower than the original price', () => {
    expect(validateFoodInput({ ...valid, price: 25000 }).price).toBeDefined()
  })

  it('UT-F03: pickup deadline must be after start and in the future', () => {
    expect(validateFoodInput({ ...valid, pickupEnd: valid.pickupStart }).pickupEnd).toBeDefined()
    expect(validateFoodInput({ ...valid, pickupStart: future(-3), pickupEnd: future(-1) }).pickupEnd).toBeDefined()
  })

  it('UT-F04: required fields are reported', () => {
    const errors = validateFoodInput({ ...valid, name: 'ab', image: '', ingredients: [], mainIngredients: [], quantity: -1 })
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(['name', 'image', 'ingredients', 'mainIngredients', 'quantity']))
  })
})
