import { callService, loadState } from '@/app/actions/service'
import { setDb } from './mock-db'

export async function refreshState() {
  setDb(await loadState())
}

/** Client stub for a server service: same signature, executed on the server. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function invoke<F extends (...args: any[]) => Promise<any>>(service: string, method: string): F {
  return (async (...args: unknown[]) => {
    const res = await callService(service, method, args)
    await refreshState().catch(() => {})
    if (!res.ok) throw new Error(res.error)
    return res.result
  }) as F
}
