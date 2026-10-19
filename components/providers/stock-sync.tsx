'use client'

import { useEffect, useRef } from 'react'
import useSWR from 'swr'
import { useDb, useHydrated } from '@/hooks/use-db'
import { commit } from '@/services/mock-db'
import { fetchStock, registerStock, refreshStock, STOCK_KEY } from '@/services/stock-api'

/** Keeps every device's food quantities in line with the shared server stock. */
export function StockSync() {
  const hydrated = useHydrated()
  const db = useDb()
  const registered = useRef(new Set<string>())
  const { data: stock } = useSWR(hydrated ? STOCK_KEY : null, fetchStock, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
  })

  useEffect(() => {
    if (!stock) return
    const unknown = db.foods.filter((f) => !(f.id in stock) && !registered.current.has(f.id))
    if (unknown.length) {
      unknown.forEach((f) => registered.current.add(f.id))
      registerStock(unknown.map((f) => ({ foodId: f.id, quantity: Math.max(0, f.quantity) })))
        .then(() => refreshStock())
        .catch(() => unknown.forEach((f) => registered.current.delete(f.id)))
    }
    if (db.foods.some((f) => f.id in stock && stock[f.id] !== f.quantity)) {
      commit((d) => {
        for (const food of d.foods) if (food.id in stock) food.quantity = stock[food.id]
      })
    }
  }, [stock, db.foods])

  return null
}
