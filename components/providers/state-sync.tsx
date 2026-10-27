'use client'

import { useEffect, useRef } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { loadState } from '@/app/actions/service'
import { setDb } from '@/services/mock-db'

/** Loads the signed-in user's view of the server state and keeps it fresh across devices. */
export function StateSync() {
  const warned = useRef(false)
  const { data, error } = useSWR('app-state', () => loadState(), {
    refreshInterval: 5000,
    revalidateOnFocus: true,
  })

  useEffect(() => {
    if (data) {
      warned.current = false
      setDb(data)
    }
  }, [data])

  useEffect(() => {
    if (error && !warned.current) {
      warned.current = true
      toast.error('Could not reach the server. Retrying…')
    }
  }, [error])

  return null
}
