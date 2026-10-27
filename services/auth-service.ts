import type * as S from '@/server/services/auth-service'
import { invoke } from './bridge'

export { ROLE_HOME } from '@/lib/roles'

export const login = invoke<typeof S.login>('auth', 'login')
export const register = invoke<typeof S.register>('auth', 'register')
export const logout = invoke<typeof S.logout>('auth', 'logout')
export const requestPasswordReset = invoke<typeof S.requestPasswordReset>('auth', 'requestPasswordReset')
export const resetPassword = invoke<typeof S.resetPassword>('auth', 'resetPassword')
export const changePassword = invoke<typeof S.changePassword>('auth', 'changePassword')
export const logoutAllDevices = invoke<typeof S.logoutAllDevices>('auth', 'logoutAllDevices')
