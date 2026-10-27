import type * as S from '@/server/services/profile-service'
import { invoke } from './bridge'


export const updateProfile = invoke<typeof S.updateProfile>('profile', 'updateProfile')
export const updatePreferences = invoke<typeof S.updatePreferences>('profile', 'updatePreferences')
export const updateRestaurant = invoke<typeof S.updateRestaurant>('profile', 'updateRestaurant')
export const updateInstitution = invoke<typeof S.updateInstitution>('profile', 'updateInstitution')
