import 'server-only'
import type { Food, FoodStatus } from '@/types'
import { calculateQualityScore, ratingToScore } from '@/lib/quality'
import { validateFoodInput, type FoodInput } from '@/lib/food-input'
import { commit, getDb } from './mock-db'
import { registerStock, setServerStock } from './stock-api'
import { delay, requireUser, ServiceError, uid } from './utils'

export type { FoodInput }

function requireOwnFood(foodId: string) {
  const user = requireUser('restaurant')
  const food = getDb().foods.find((f) => f.id === foodId)
  if (!food) throw new ServiceError('Listing not found.')
  if (food.restaurantId !== user.restaurantId) throw new ServiceError('You can only manage your own listings.')
  return { user, food }
}

export async function createFood(input: FoodInput): Promise<Food> {
  await delay(600)
  const user = requireUser('restaurant')
  const errors = validateFoodInput(input)
  if (Object.keys(errors).length) throw new ServiceError(Object.values(errors)[0])
  const restaurant = getDb().restaurants.find((r) => r.id === user.restaurantId)
  if (!restaurant) throw new ServiceError('Restaurant profile not found.')
  if (restaurant.verification !== 'approved') throw new ServiceError('Your restaurant must be verified before publishing listings.')

  const food: Food = {
    id: uid('f'),
    restaurantId: restaurant.id,
    name: input.name.trim(),
    category: input.category,
    description: input.description.trim(),
    image: input.image,
    originalPrice: input.originalPrice,
    price: input.price,
    quantity: input.quantity,
    pickupStart: input.pickupStart,
    pickupEnd: input.pickupEnd,
    ingredients: input.ingredients,
    mainIngredients: input.mainIngredients,
    allergens: input.allergens,
    donationAvailable: input.donationAvailable,
    rating: 0,
    ratingCount: 0,
    soldCount: 0,
    weightKg: input.weightKg,
    quality: calculateQualityScore({
      freshness: input.freshness,
      packaging: input.packaging,
      restaurantRating: ratingToScore(restaurant.rating || 4),
      customerFeedback: 80,
    }),
    status: 'active',
    createdAt: new Date().toISOString(),
  }
  await registerStock([{ foodId: food.id, quantity: food.quantity }])
  commit((d) => {
    d.foods.unshift(food)
  })
  return food
}

export async function updateFood(foodId: string, input: FoodInput) {
  await delay(500)
  const { food } = requireOwnFood(foodId)
  const errors = validateFoodInput(input)
  if (Object.keys(errors).length) throw new ServiceError(Object.values(errors)[0])
  // Only overwrite the shared stock when the restaurant actually changed it, so a purchase made meanwhile is kept.
  if (input.quantity !== food.quantity) await setServerStock(foodId, input.quantity)
  commit((d) => {
    const f = d.foods.find((x) => x.id === foodId)!
    Object.assign(f, {
      name: input.name.trim(),
      category: input.category,
      description: input.description.trim(),
      image: input.image,
      originalPrice: input.originalPrice,
      price: input.price,
      quantity: input.quantity,
      pickupStart: input.pickupStart,
      pickupEnd: input.pickupEnd,
      ingredients: input.ingredients,
      mainIngredients: input.mainIngredients,
      allergens: input.allergens,
      donationAvailable: input.donationAvailable,
      weightKg: input.weightKg,
      quality: calculateQualityScore({
        freshness: input.freshness,
        packaging: input.packaging,
        restaurantRating: food.quality.restaurantRating,
        customerFeedback: food.quality.customerFeedback,
      }),
    })
  })
}

export async function setFoodStatus(foodId: string, status: Exclude<FoodStatus, 'disabled'>) {
  await delay(300)
  const { food } = requireOwnFood(foodId)
  if (food.status === 'disabled') throw new ServiceError('This listing was disabled by an admin.')
  commit((d) => {
    d.foods.find((x) => x.id === foodId)!.status = status
  })
}

export async function deleteFood(foodId: string) {
  await delay(400)
  requireOwnFood(foodId)
  const active = getDb().orders.some(
    (o) => o.items.some((i) => i.foodId === foodId) && !['Completed', 'Cancelled'].includes(o.status),
  )
  if (active) throw new ServiceError('This listing has active orders. Pause it instead of deleting.')
  commit((d) => {
    d.foods = d.foods.filter((f) => f.id !== foodId)
    d.carts = Object.fromEntries(Object.entries(d.carts).map(([k, v]) => [k, v.filter((c) => c.foodId !== foodId)]))
  })
}
