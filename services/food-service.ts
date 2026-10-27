import type * as S from '@/server/services/food-service'
import { invoke } from './bridge'

export { validateFoodInput, type FoodInput } from '@/lib/food-input'

export const createFood = invoke<typeof S.createFood>('food', 'createFood')
export const updateFood = invoke<typeof S.updateFood>('food', 'updateFood')
export const setFoodStatus = invoke<typeof S.setFoodStatus>('food', 'setFoodStatus')
export const deleteFood = invoke<typeof S.deleteFood>('food', 'deleteFood')
