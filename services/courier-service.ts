import type * as S from '@/server/services/courier-service'
import { invoke } from './bridge'

export const requestCourierPayout = invoke<typeof S.requestCourierPayout>('courier', 'requestCourierPayout')
export const setCourierVerification = invoke<typeof S.setCourierVerification>('courier', 'setCourierVerification')
export const resolveCourierPayout = invoke<typeof S.resolveCourierPayout>('courier', 'resolveCourierPayout')
