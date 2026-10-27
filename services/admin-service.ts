import type * as S from '@/server/services/admin-service'
import { invoke } from './bridge'


export const setUserStatus = invoke<typeof S.setUserStatus>('admin', 'setUserStatus')
export const setRestaurantVerification = invoke<typeof S.setRestaurantVerification>('admin', 'setRestaurantVerification')
export const setInstitutionVerification = invoke<typeof S.setInstitutionVerification>('admin', 'setInstitutionVerification')
export const setFoodDisabled = invoke<typeof S.setFoodDisabled>('admin', 'setFoodDisabled')
export const respondToComplaint = invoke<typeof S.respondToComplaint>('admin', 'respondToComplaint')
export const updateSystemSettings = invoke<typeof S.updateSystemSettings>('admin', 'updateSystemSettings')
