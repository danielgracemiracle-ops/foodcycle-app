import { integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const foodStock = pgTable('food_stock', {
  foodId: text('food_id').primaryKey(),
  quantity: integer('quantity').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type CheckoutStatus = 'held' | 'paid' | 'released' | 'expired'

export const checkouts = pgTable('checkouts', {
  idempotencyKey: text('idempotency_key').primaryKey(),
  holderId: text('holder_id').notNull(),
  status: text('status').$type<CheckoutStatus>().notNull().default('held'),
  orderIds: jsonb('order_ids').$type<string[]>().notNull().default([]),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const stockHolds = pgTable('stock_holds', {
  id: serial('id').primaryKey(),
  checkoutKey: text('checkout_key').notNull(),
  foodId: text('food_id').notNull(),
  quantity: integer('quantity').notNull(),
})
