import type { Food, Order, Restaurant } from '@/types'

export const NOW = new Date('2026-11-19T10:00:00.000Z').getTime()
export const hoursFromNow = (h: number) => new Date(NOW + h * 3600_000).toISOString()

export function makeFood(overrides: Partial<Food> = {}): Food {
  return {
    id: 'food-1',
    restaurantId: 'resto-1',
    name: 'Nasi Ayam Bakar',
    category: 'Rice' as Food['category'],
    description: 'Nasi dengan ayam bakar sisa produksi hari ini.',
    image: '/food.jpg',
    originalPrice: 30000,
    price: 15000,
    quantity: 5,
    pickupStart: hoursFromNow(1),
    pickupEnd: hoursFromNow(5),
    ingredients: ['nasi', 'ayam'],
    allergens: [],
    donationAvailable: true,
    rating: 4.5,
    ratingCount: 10,
    soldCount: 3,
    weightKg: 0.4,
    quality: { freshness: 90, packaging: 85, restaurantRating: 90, customerFeedback: 88, score: 89 },
    status: 'active',
    createdAt: hoursFromNow(-2),
    ...overrides,
  }
}

export function makeRestaurant(overrides: Partial<Restaurant> = {}): Restaurant {
  return {
    id: 'resto-1',
    ownerId: 'user-resto',
    name: 'Warung Contoh',
    description: '',
    address: 'Jl. Contoh 1',
    city: 'Jakarta',
    distanceKm: 1.5,
    openTime: '08:00',
    closeTime: '21:00',
    phone: '0800',
    email: 'resto@example.com',
    rating: 4.8,
    reviewCount: 20,
    verification: 'approved',
    defaultPickupMinutes: 60,
    logoColor: '#000000',
    createdAt: hoursFromNow(-100),
    ...overrides,
  }
}

export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    customerId: 'user-1',
    restaurantId: 'resto-1',
    items: [],
    type: 'self',
    status: 'Completed',
    history: [
      { status: 'Payment Confirmed', at: hoursFromNow(-5) },
      { status: 'Picked Up', at: hoursFromNow(-3) },
      { status: 'Completed', at: hoursFromNow(-2) },
    ],
    subtotal: 30000,
    discount: 15000,
    total: 15000,
    pickupStart: hoursFromNow(-4),
    pickupEnd: hoursFromNow(-1),
    paymentId: 'pay-1',
    ...overrides,
  } as Order
}
