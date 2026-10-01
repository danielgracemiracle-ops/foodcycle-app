import type {
  Complaint,
  Db,
  Donation,
  Food,
  FoodCategory,
  ImpactRecord,
  Notification,
  Order,
  Restaurant,
  Review,
  SocialInstitution,
  User,
  UserPreferences,
} from '@/types'
import { calculateQualityScore, calculateGrade, ratingToScore } from '@/lib/quality'

export const DB_VERSION = 3

/** Demo credentials. In production this lives in Supabase Auth, never in client state. */
export const DEMO_ACCOUNTS = [
  { role: 'customer', email: 'customer@foodcycle.id', password: 'password123', label: 'Customer' },
  { role: 'restaurant', email: 'restaurant@foodcycle.id', password: 'password123', label: 'Restaurant' },
  { role: 'institution', email: 'institution@foodcycle.id', password: 'password123', label: 'Social Institution' },
  { role: 'admin', email: 'admin@foodcycle.id', password: 'password123', label: 'Admin' },
] as const

export function createSeed(nowMs = Date.now()): Db {
  const now = new Date(nowMs)
  const iso = (offsetHours: number) => new Date(nowMs + offsetHours * 36e5).toISOString()
  const daysAgo = (d: number, h = 12) => {
    const date = new Date(now)
    date.setDate(date.getDate() - d)
    date.setHours(h, 0, 0, 0)
    return date.toISOString()
  }
  /** Pickup window anchored to a clock hour today (or tomorrow), falling back to relative times. */
  const windowFrom = (startOffset: number, durationH: number) => ({
    pickupStart: iso(startOffset),
    pickupEnd: iso(startOffset + durationH),
  })

  const users: User[] = [
    { id: 'u-cust', name: 'Raka Pratama', email: 'customer@foodcycle.id', role: 'customer', phone: '+62 812 3456 7890', location: 'Kemang, South Jakarta', status: 'active', createdAt: daysAgo(120) },
    { id: 'u-rest', name: 'Andi Wijaya', email: 'restaurant@foodcycle.id', role: 'restaurant', phone: '+62 811 2233 4455', location: 'Senopati, Jakarta', status: 'active', createdAt: daysAgo(200), restaurantId: 'r-abc' },
    { id: 'u-inst', name: 'Siti Rahmawati', email: 'institution@foodcycle.id', role: 'institution', phone: '+62 813 9988 7766', location: 'Tebet, Jakarta', status: 'active', createdAt: daysAgo(150), institutionId: 'i-harapan' },
    { id: 'u-admin', name: 'Dewi Lestari', email: 'admin@foodcycle.id', role: 'admin', phone: '+62 815 0000 1111', location: 'Jakarta', status: 'active', createdAt: daysAgo(365) },
    { id: 'u-c2', name: 'Maya Putri', email: 'maya@mail.com', role: 'customer', location: 'Tebet', status: 'active', createdAt: daysAgo(60) },
    { id: 'u-c3', name: 'Budi Santoso', email: 'budi@mail.com', role: 'customer', location: 'Cikini', status: 'active', createdAt: daysAgo(40) },
    { id: 'u-c4', name: 'Nadia Kusuma', email: 'nadia@mail.com', role: 'customer', location: 'Menteng', status: 'suspended', createdAt: daysAgo(25) },
    { id: 'u-r2', name: 'Rina Hartono', email: 'dapur@nusantara.id', role: 'restaurant', status: 'active', createdAt: daysAgo(180), restaurantId: 'r-dapur' },
    { id: 'u-r3', name: 'Kevin Tan', email: 'hello@dailybakery.id', role: 'restaurant', status: 'active', createdAt: daysAgo(170), restaurantId: 'r-bakery' },
    { id: 'u-r7', name: 'Yusuf Hakim', email: 'owner@ricecorner.id', role: 'restaurant', status: 'active', createdAt: daysAgo(5), restaurantId: 'r-new' },
  ]

  const restaurants: Restaurant[] = [
    { id: 'r-abc', ownerId: 'u-rest', name: 'ABC Kitchen', description: 'Modern Asian comfort food cooked fresh every day in Senopati.', address: 'Jl. Senopati No. 21', city: 'Jakarta', distanceKm: 1.2, openTime: '10:00', closeTime: '22:00', phone: '+62 21 555 0101', email: 'restaurant@foodcycle.id', rating: 4.8, reviewCount: 214, verification: 'approved', defaultPickupMinutes: 90, logoColor: 'chart-1', createdAt: daysAgo(200) },
    { id: 'r-dapur', ownerId: 'u-r2', name: 'Dapur Nusantara', description: 'Traditional Indonesian home cooking with family recipes.', address: 'Jl. Tebet Raya No. 8', city: 'Jakarta', distanceKm: 2.4, openTime: '09:00', closeTime: '21:00', phone: '+62 21 555 0202', email: 'dapur@nusantara.id', rating: 4.7, reviewCount: 186, verification: 'approved', defaultPickupMinutes: 120, logoColor: 'chart-2', createdAt: daysAgo(180) },
    { id: 'r-bakery', ownerId: 'u-r3', name: 'Daily Bakery', description: 'Artisan breads and pastries baked every morning.', address: 'Jl. Kemang Raya No. 45', city: 'Jakarta', distanceKm: 0.8, openTime: '07:00', closeTime: '20:00', phone: '+62 21 555 0303', email: 'hello@dailybakery.id', rating: 4.9, reviewCount: 302, verification: 'approved', defaultPickupMinutes: 60, logoColor: 'chart-3', createdAt: daysAgo(170) },
    { id: 'r-green', ownerId: 'u-r4', name: 'Green Bowl', description: 'Healthy bowls, salads and cold-pressed drinks.', address: 'Jl. Gunawarman No. 12', city: 'Jakarta', distanceKm: 3.1, openTime: '08:00', closeTime: '21:00', phone: '+62 21 555 0404', email: 'hi@greenbowl.id', rating: 4.6, reviewCount: 98, verification: 'approved', defaultPickupMinutes: 90, logoColor: 'chart-4', createdAt: daysAgo(150) },
    { id: 'r-kopi', ownerId: 'u-r5', name: 'Kopi Senja', description: 'Neighbourhood coffee shop with homemade snacks and cakes.', address: 'Jl. Cikini Raya No. 30', city: 'Jakarta', distanceKm: 1.9, openTime: '07:00', closeTime: '23:00', phone: '+62 21 555 0505', email: 'halo@kopisenja.id', rating: 4.5, reviewCount: 143, verification: 'approved', defaultPickupMinutes: 60, logoColor: 'chart-5', createdAt: daysAgo(140) },
    { id: 'r-sehat', ownerId: 'u-r6', name: 'Warung Sehat', description: 'Affordable, wholesome Indonesian dishes and snacks.', address: 'Jl. Menteng Raya No. 5', city: 'Jakarta', distanceKm: 4.2, openTime: '08:00', closeTime: '20:00', phone: '+62 21 555 0606', email: 'warung@sehat.id', rating: 4.4, reviewCount: 77, verification: 'approved', defaultPickupMinutes: 120, logoColor: 'chart-2', createdAt: daysAgo(130) },
    { id: 'r-new', ownerId: 'u-r7', name: 'Rice Corner', description: 'Rice bowls and noodle dishes for busy city workers.', address: 'Jl. Sudirman Kav. 52', city: 'Jakarta', distanceKm: 2.8, openTime: '10:00', closeTime: '21:00', phone: '+62 21 555 0707', email: 'owner@ricecorner.id', rating: 4.3, reviewCount: 41, verification: 'approved', defaultPickupMinutes: 90, logoColor: 'chart-1', createdAt: daysAgo(5) },
    { id: 'r-pending', ownerId: 'u-r8', name: 'Sate Pak Kumis', description: 'Charcoal-grilled satay since 1998.', address: 'Jl. Sabang No. 17', city: 'Jakarta', distanceKm: 3.6, openTime: '16:00', closeTime: '23:00', phone: '+62 21 555 0808', email: 'sate@pakkumis.id', rating: 0, reviewCount: 0, verification: 'pending', defaultPickupMinutes: 60, logoColor: 'chart-5', createdAt: daysAgo(1) },
  ]

  const institutions: SocialInstitution[] = [
    { id: 'i-harapan', ownerId: 'u-inst', name: 'Panti Asuhan Harapan', description: 'Orphanage caring for 48 children aged 4–17 in Tebet.', address: 'Jl. Tebet Barat No. 14', city: 'Jakarta', phone: '+62 21 830 1122', email: 'institution@foodcycle.id', verification: 'approved', mealsNeeded: 48, acceptingDonations: true, openTime: '07:00', closeTime: '20:00', preferredCategories: ['Rice', 'Bakery', 'Other'], maxDailyCapacity: 60, preferredPickupTime: '17:00–19:00', createdAt: daysAgo(150) },
    { id: 'i-kasih', name: 'Rumah Kasih Lansia', description: 'Elderly care home providing daily meals for 30 residents.', address: 'Jl. Pancoran No. 3', city: 'Jakarta', phone: '+62 21 830 3344', email: 'kasih@lansia.id', verification: 'approved', mealsNeeded: 30, acceptingDonations: true, openTime: '06:00', closeTime: '19:00', preferredCategories: ['Rice', 'Noodles'], maxDailyCapacity: 35, preferredPickupTime: '11:00–13:00', createdAt: daysAgo(120) },
    { id: 'i-pelita', name: 'Yayasan Pelita Anak', description: 'After-school learning centre serving dinner for kids.', address: 'Jl. Manggarai No. 22', city: 'Jakarta', phone: '+62 21 830 5566', email: 'pelita@anak.id', verification: 'approved', mealsNeeded: 25, acceptingDonations: true, openTime: '13:00', closeTime: '21:00', preferredCategories: ['Snacks', 'Bakery', 'Drinks'], maxDailyCapacity: 40, preferredPickupTime: '16:00–18:00', createdAt: daysAgo(90) },
    { id: 'i-bersama', name: 'Dapur Umum Bersama', description: 'Community kitchen supporting families in need.', address: 'Jl. Kampung Melayu No. 9', city: 'Jakarta', phone: '+62 21 830 7788', email: 'dapur@bersama.id', verification: 'pending', mealsNeeded: 80, acceptingDonations: false, openTime: '08:00', closeTime: '18:00', preferredCategories: ['Rice'], maxDailyCapacity: 100, preferredPickupTime: '10:00–12:00', createdAt: daysAgo(2) },
  ]

  type FoodSeed = {
    id: string
    restaurantId: string
    name: string
    category: FoodCategory
    description: string
    image: string
    originalPrice: number
    price: number
    quantity: number
    window: [number, number]
    ingredients: string[]
    allergens: string[]
    donationAvailable: boolean
    freshness: number
    packaging: number
    feedback: number
    rating: number
    ratingCount: number
    soldCount: number
    weightKg: number
  }

  const foodSeeds: FoodSeed[] = [
    { id: 'f-chicken-rice', restaurantId: 'r-abc', name: 'Chicken Rice Bowl', category: 'Rice', description: 'Grilled teriyaki chicken over steamed jasmine rice with cucumber, pickled carrot and toasted sesame.', image: '/foods/chicken-rice-bowl.png', originalPrice: 35000, price: 17500, quantity: 5, window: [0.5, 4.5], ingredients: ['Chicken thigh', 'Jasmine rice', 'Teriyaki sauce', 'Cucumber', 'Sesame'], allergens: ['Soy', 'Sesame'], donationAvailable: true, freshness: 95, packaging: 90, feedback: 92, rating: 4.8, ratingCount: 128, soldCount: 412, weightKg: 0.45 },
    { id: 'f-beef-ramen', restaurantId: 'r-abc', name: 'Spicy Beef Ramen', category: 'Noodles', description: 'Rich beef broth with fresh ramen noodles, soft-boiled egg, scallions and house chili oil.', image: '/foods/beef-ramen.png', originalPrice: 48000, price: 26000, quantity: 3, window: [0, 2.2], ingredients: ['Ramen noodles', 'Beef slices', 'Egg', 'Scallion', 'Chili oil'], allergens: ['Gluten', 'Egg', 'Soy'], donationAvailable: false, freshness: 88, packaging: 85, feedback: 90, rating: 4.7, ratingCount: 84, soldCount: 233, weightKg: 0.6 },
    { id: 'f-dimsum', restaurantId: 'r-abc', name: 'Dimsum Platter', category: 'Snacks', description: 'Assorted steamed siomay, har gow and char siu bao — 9 pieces.', image: '/foods/dimsum.png', originalPrice: 40000, price: 20000, quantity: 4, window: [-0.5, 1.2], ingredients: ['Shrimp', 'Chicken', 'Wheat flour', 'Mushroom'], allergens: ['Shellfish', 'Gluten'], donationAvailable: true, freshness: 78, packaging: 82, feedback: 88, rating: 4.6, ratingCount: 61, soldCount: 180, weightKg: 0.35 },
    { id: 'f-nasi-goreng', restaurantId: 'r-dapur', name: 'Nasi Goreng Kampung', category: 'Rice', description: 'Village-style fried rice with sweet soy, fried egg, shallots, pickles and prawn crackers.', image: '/foods/nasi-goreng.png', originalPrice: 30000, price: 15000, quantity: 8, window: [1, 5], ingredients: ['Rice', 'Egg', 'Shallot', 'Kecap manis', 'Chili'], allergens: ['Egg', 'Soy', 'Shellfish'], donationAvailable: true, freshness: 92, packaging: 88, feedback: 90, rating: 4.7, ratingCount: 152, soldCount: 520, weightKg: 0.45 },
    { id: 'f-rendang', restaurantId: 'r-dapur', name: 'Rendang Rice Box', category: 'Rice', description: 'Slow-cooked beef rendang with white rice, cassava leaves and sambal hijau.', image: '/foods/rendang-rice.png', originalPrice: 45000, price: 24000, quantity: 6, window: [2, 6], ingredients: ['Beef', 'Coconut milk', 'Rice', 'Cassava leaves', 'Spices'], allergens: ['Coconut'], donationAvailable: true, freshness: 94, packaging: 92, feedback: 95, rating: 4.9, ratingCount: 201, soldCount: 610, weightKg: 0.5 },
    { id: 'f-croissant', restaurantId: 'r-bakery', name: 'Croissant Box (4 pcs)', category: 'Bakery', description: 'Four all-butter croissants baked this morning. Best reheated for 3 minutes.', image: '/foods/croissant-box.png', originalPrice: 60000, price: 27000, quantity: 7, window: [0.2, 3.8], ingredients: ['Wheat flour', 'Butter', 'Milk', 'Yeast'], allergens: ['Gluten', 'Dairy'], donationAvailable: true, freshness: 90, packaging: 94, feedback: 96, rating: 4.9, ratingCount: 240, soldCount: 870, weightKg: 0.32 },
    { id: 'f-roti-pandan', restaurantId: 'r-bakery', name: 'Roti Sobek Pandan', category: 'Bakery', description: 'Soft pull-apart milk bread infused with fresh pandan leaf.', image: '/foods/roti-pandan.png', originalPrice: 22000, price: 11000, quantity: 10, window: [20, 4], ingredients: ['Wheat flour', 'Pandan', 'Milk', 'Sugar'], allergens: ['Gluten', 'Dairy', 'Egg'], donationAvailable: true, freshness: 96, packaging: 90, feedback: 91, rating: 4.8, ratingCount: 97, soldCount: 340, weightKg: 0.4 },
    { id: 'f-banana-bread', restaurantId: 'r-kopi', name: 'Chocolate Banana Bread', category: 'Bakery', description: 'Moist banana loaf with dark chocolate chunks — half loaf, 5 slices.', image: '/foods/banana-bread.png', originalPrice: 32000, price: 16000, quantity: 4, window: [0.5, 5], ingredients: ['Banana', 'Dark chocolate', 'Flour', 'Egg'], allergens: ['Gluten', 'Egg', 'Dairy'], donationAvailable: false, freshness: 89, packaging: 86, feedback: 87, rating: 4.6, ratingCount: 58, soldCount: 150, weightKg: 0.38 },
    { id: 'f-quinoa', restaurantId: 'r-green', name: 'Quinoa Salad Bowl', category: 'Other', description: 'Tri-colour quinoa, avocado, chickpeas, cherry tomato and lemon-tahini dressing.', image: '/foods/quinoa-salad.png', originalPrice: 42000, price: 21000, quantity: 3, window: [0, 3.2], ingredients: ['Quinoa', 'Avocado', 'Chickpeas', 'Tomato', 'Tahini'], allergens: ['Sesame'], donationAvailable: false, freshness: 91, packaging: 89, feedback: 86, rating: 4.5, ratingCount: 44, soldCount: 98, weightKg: 0.4 },
    { id: 'f-smoothie', restaurantId: 'r-green', name: 'Green Smoothie', category: 'Drinks', description: 'Spinach, banana, pineapple and chia blended to order. 350ml bottle.', image: '/foods/green-smoothie.png', originalPrice: 35000, price: 18000, quantity: 6, window: [1.5, 4], ingredients: ['Spinach', 'Banana', 'Pineapple', 'Chia seed'], allergens: [], donationAvailable: true, freshness: 86, packaging: 92, feedback: 84, rating: 4.4, ratingCount: 39, soldCount: 120, weightKg: 0.35 },
    { id: 'f-gado', restaurantId: 'r-sehat', name: 'Gado-Gado', category: 'Other', description: 'Blanched vegetables, tofu, tempeh and egg with creamy peanut sauce and krupuk.', image: '/foods/gado-gado.png', originalPrice: 25000, price: 12500, quantity: 9, window: [2, 4], ingredients: ['Vegetables', 'Tofu', 'Tempeh', 'Egg', 'Peanut sauce'], allergens: ['Peanut', 'Soy', 'Egg'], donationAvailable: true, freshness: 87, packaging: 80, feedback: 85, rating: 4.4, ratingCount: 66, soldCount: 205, weightKg: 0.45 },
    { id: 'f-pisang', restaurantId: 'r-sehat', name: 'Pisang Goreng (6 pcs)', category: 'Snacks', description: 'Crispy battered fried bananas, a favourite afternoon snack.', image: '/foods/pisang-goreng.png', originalPrice: 18000, price: 9000, quantity: 12, window: [-0.3, 1.3], ingredients: ['Banana', 'Rice flour', 'Sugar'], allergens: ['Gluten'], donationAvailable: true, freshness: 72, packaging: 75, feedback: 83, rating: 4.3, ratingCount: 51, soldCount: 310, weightKg: 0.3 },
    { id: 'f-risoles', restaurantId: 'r-kopi', name: 'Risoles Mayo Set', category: 'Snacks', description: 'Four crispy risoles filled with smoked beef, egg and mayonnaise.', image: '/foods/risoles.png', originalPrice: 24000, price: 12000, quantity: 5, window: [3, 4], ingredients: ['Smoked beef', 'Egg', 'Mayonnaise', 'Bread crumbs'], allergens: ['Gluten', 'Egg'], donationAvailable: true, freshness: 88, packaging: 84, feedback: 88, rating: 4.5, ratingCount: 72, soldCount: 260, weightKg: 0.28 },
    { id: 'f-kopi-susu', restaurantId: 'r-kopi', name: 'Es Kopi Susu Gula Aren', category: 'Drinks', description: 'Iced espresso with fresh milk and palm sugar syrup. 500ml.', image: '/foods/es-kopi-susu.png', originalPrice: 28000, price: 15000, quantity: 8, window: [4, 3], ingredients: ['Espresso', 'Fresh milk', 'Palm sugar'], allergens: ['Dairy'], donationAvailable: false, freshness: 90, packaging: 90, feedback: 89, rating: 4.6, ratingCount: 112, soldCount: 450, weightKg: 0.5 },
    { id: 'f-mie-ayam', restaurantId: 'r-new', name: 'Mie Ayam Spesial', category: 'Noodles', description: 'Springy egg noodles with sweet soy chicken, bok choy and crispy wonton.', image: '/foods/mie-ayam.png', originalPrice: 25000, price: 13000, quantity: 7, window: [1, 3.5], ingredients: ['Egg noodles', 'Chicken', 'Bok choy', 'Wonton'], allergens: ['Gluten', 'Egg', 'Soy'], donationAvailable: true, freshness: 86, packaging: 83, feedback: 84, rating: 4.3, ratingCount: 29, soldCount: 75, weightKg: 0.5 },
    { id: 'f-kwetiau', restaurantId: 'r-new', name: 'Kwetiau Goreng', category: 'Noodles', description: 'Wok-fried flat rice noodles with egg, choy sum and fish cake.', image: '/foods/kwetiau.png', originalPrice: 28000, price: 14000, quantity: 0, window: [0.5, 3], ingredients: ['Rice noodles', 'Egg', 'Choy sum', 'Fish cake'], allergens: ['Egg', 'Fish', 'Soy'], donationAvailable: true, freshness: 84, packaging: 80, feedback: 82, rating: 4.2, ratingCount: 18, soldCount: 60, weightKg: 0.45 },
    { id: 'f-nasi-uduk', restaurantId: 'r-new', name: 'Nasi Uduk Komplit', category: 'Rice', description: 'Coconut rice with fried chicken, egg, tempeh orek and sambal kacang.', image: '/foods/nasi-uduk.png', originalPrice: 27000, price: 13500, quantity: 6, window: [21, 3], ingredients: ['Coconut rice', 'Chicken', 'Egg', 'Tempeh', 'Peanut'], allergens: ['Peanut', 'Egg', 'Soy', 'Coconut'], donationAvailable: true, freshness: 93, packaging: 87, feedback: 86, rating: 4.4, ratingCount: 33, soldCount: 90, weightKg: 0.5 },
  ]

  const restaurantRating = new Map(restaurants.map((r) => [r.id, r.rating]))

  const foods: Food[] = foodSeeds.map((s, i) => ({
    id: s.id,
    restaurantId: s.restaurantId,
    name: s.name,
    category: s.category,
    description: s.description,
    image: s.image,
    originalPrice: s.originalPrice,
    price: s.price,
    quantity: s.quantity,
    ...windowFrom(s.window[0], s.window[1]),
    ingredients: s.ingredients,
    allergens: s.allergens,
    donationAvailable: s.donationAvailable,
    rating: s.rating,
    ratingCount: s.ratingCount,
    soldCount: s.soldCount,
    weightKg: s.weightKg,
    quality: calculateQualityScore({
      freshness: s.freshness,
      packaging: s.packaging,
      restaurantRating: ratingToScore(restaurantRating.get(s.restaurantId) ?? 4),
      customerFeedback: s.feedback,
    }),
    status: 'active',
    createdAt: iso(-3 - i),
  }))

  const foodById = new Map(foods.map((f) => [f.id, f]))

  const item = (foodId: string, qty: number, idx: number) => {
    const f = foodById.get(foodId)!
    return {
      id: `oi-${foodId}-${idx}`,
      foodId,
      name: f.name,
      image: f.image,
      price: f.price,
      originalPrice: f.originalPrice,
      quantity: qty,
      grade: calculateGrade(f, nowMs),
      category: f.category,
      weightKg: f.weightKg,
    }
  }

  const makeOrder = (
    id: string,
    customerId: string,
    restaurantId: string,
    items: ReturnType<typeof item>[],
    status: Order['status'],
    createdAt: string,
    type: Order['type'] = 'self',
    donationId?: string,
    reviewed = false,
  ): Order => {
    const subtotal = items.reduce((s, it) => s + it.originalPrice * it.quantity, 0)
    const total = items.reduce((s, it) => s + it.price * it.quantity, 0)
    const steps: Order['status'][] = ['Pending', 'Payment Confirmed', 'Restaurant Confirmed', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Completed']
    const upto = status === 'Cancelled' ? 2 : steps.indexOf(status) + 1
    const base = new Date(createdAt).getTime()
    const history = steps.slice(0, upto).map((s, i) => ({ status: s, at: new Date(base + i * 12 * 60000).toISOString() }))
    if (status === 'Cancelled') history.push({ status: 'Cancelled', at: new Date(base + 30 * 60000).toISOString() })
    return {
      id,
      customerId,
      restaurantId,
      items,
      type,
      status,
      history,
      subtotal,
      discount: subtotal - total,
      total,
      pickupStart: createdAt,
      pickupEnd: new Date(base + 2 * 36e5).toISOString(),
      paymentId: `pay-${id}`,
      donationId,
      reviewed,
      createdAt,
    }
  }

  const orders: Order[] = [
    makeOrder('ORD-1042', 'u-cust', 'r-abc', [item('f-chicken-rice', 1, 1)], 'Preparing', iso(-0.4)),
    makeOrder('ORD-1041', 'u-cust', 'r-dapur', [item('f-rendang', 2, 1)], 'Picked Up', iso(-3), 'donation', 'DON-311'),
    makeOrder('ORD-1038', 'u-cust', 'r-bakery', [item('f-croissant', 1, 2)], 'Completed', daysAgo(2, 18), 'self', undefined, false),
    makeOrder('ORD-1031', 'u-cust', 'r-dapur', [item('f-nasi-goreng', 2, 2)], 'Completed', daysAgo(6, 19), 'self', undefined, true),
    makeOrder('ORD-1025', 'u-cust', 'r-kopi', [item('f-risoles', 1, 1), item('f-kopi-susu', 1, 1)], 'Completed', daysAgo(12, 17)),
    makeOrder('ORD-1019', 'u-cust', 'r-abc', [item('f-dimsum', 1, 2)], 'Cancelled', daysAgo(15, 20)),
    makeOrder('ORD-1044', 'u-c2', 'r-abc', [item('f-beef-ramen', 1, 3)], 'Payment Confirmed', iso(-0.1)),
    makeOrder('ORD-1043', 'u-c3', 'r-abc', [item('f-chicken-rice', 2, 4), item('f-dimsum', 1, 4)], 'Ready for Pickup', iso(-1)),
    makeOrder('ORD-1040', 'u-c2', 'r-abc', [item('f-chicken-rice', 3, 5)], 'Restaurant Confirmed', iso(-0.8), 'donation', 'DON-312'),
    makeOrder('ORD-1035', 'u-c3', 'r-abc', [item('f-beef-ramen', 2, 6)], 'Completed', daysAgo(3, 19)),
    makeOrder('ORD-1033', 'u-c2', 'r-abc', [item('f-chicken-rice', 1, 7)], 'Completed', daysAgo(5, 20)),
    makeOrder('ORD-1028', 'u-c3', 'r-abc', [item('f-dimsum', 2, 8)], 'Completed', daysAgo(9, 18)),
    makeOrder('ORD-1020', 'u-c2', 'r-bakery', [item('f-croissant', 2, 9)], 'Completed', daysAgo(14, 18), 'donation', 'DON-298'),
  ]
  const donationHistory = (statuses: Donation['status'][], start: string) =>
    statuses.map((s, i) => ({ status: s, at: new Date(new Date(start).getTime() + i * 20 * 60000).toISOString() }))

  const donations: Donation[] = [
    { id: 'DON-311', orderId: 'ORD-1041', donorId: 'u-cust', restaurantId: 'r-dapur', institutionId: 'i-harapan', foodSummary: 'Rendang Rice Box', quantity: 2, value: 48000, message: 'Selamat makan, adik-adik!', status: 'Delivered', history: donationHistory(['Purchased', 'Restaurant Confirmed', 'Preparing', 'Picked Up', 'Delivered'], iso(-3)), createdAt: iso(-3) },
    { id: 'DON-312', orderId: 'ORD-1040', donorId: 'u-c2', restaurantId: 'r-abc', institutionId: 'i-harapan', foodSummary: 'Chicken Rice Bowl', quantity: 3, value: 52500, message: 'Hope you enjoy the meal.', status: 'Purchased', history: donationHistory(['Purchased'], iso(-0.8)), createdAt: iso(-0.8) },
    { id: 'DON-298', orderId: 'ORD-1020', donorId: 'u-c2', restaurantId: 'r-bakery', institutionId: 'i-harapan', foodSummary: 'Croissant Box (4 pcs)', quantity: 2, value: 54000, status: 'Received', history: donationHistory(['Purchased', 'Restaurant Confirmed', 'Preparing', 'Picked Up', 'Delivered', 'Received'], daysAgo(14, 18)), createdAt: daysAgo(14, 18) },
    { id: 'DON-287', orderId: 'ORD-0990', donorId: 'u-cust', restaurantId: 'r-dapur', institutionId: 'i-kasih', foodSummary: 'Nasi Goreng Kampung', quantity: 4, value: 60000, message: 'For our grandparents.', status: 'Received', history: donationHistory(['Purchased', 'Restaurant Confirmed', 'Preparing', 'Picked Up', 'Delivered', 'Received'], daysAgo(21, 12)), createdAt: daysAgo(21, 12) },
    { id: 'DON-276', orderId: 'ORD-0975', donorId: 'u-c3', restaurantId: 'r-sehat', institutionId: 'i-harapan', foodSummary: 'Gado-Gado', quantity: 5, value: 62500, status: 'Received', history: donationHistory(['Purchased', 'Restaurant Confirmed', 'Preparing', 'Picked Up', 'Delivered', 'Received'], daysAgo(30, 12)), createdAt: daysAgo(30, 12) },
    { id: 'DON-265', orderId: 'ORD-0950', donorId: 'u-cust', restaurantId: 'r-bakery', institutionId: 'i-pelita', foodSummary: 'Roti Sobek Pandan', quantity: 6, value: 66000, status: 'Received', history: donationHistory(['Purchased', 'Restaurant Confirmed', 'Preparing', 'Picked Up', 'Delivered', 'Received'], daysAgo(45, 16)), createdAt: daysAgo(45, 16) },
  ]

  const reviews: Review[] = [
    { id: 'rv-1', orderId: 'ORD-1031', foodId: 'f-nasi-goreng', restaurantId: 'r-dapur', userId: 'u-cust', userName: 'Raka P.', foodQuality: 5, packaging: 4, experience: 5, comment: 'Still warm at pickup and portion was generous. Will order again!', createdAt: daysAgo(6, 21) },
    { id: 'rv-2', foodId: 'f-chicken-rice', restaurantId: 'r-abc', userId: 'u-c2', userName: 'Maya P.', foodQuality: 5, packaging: 5, experience: 5, comment: 'Chicken was juicy and the packaging is fully compostable. Love it.', createdAt: daysAgo(5, 21) },
    { id: 'rv-3', foodId: 'f-beef-ramen', restaurantId: 'r-abc', userId: 'u-c3', userName: 'Budi S.', foodQuality: 4, packaging: 4, experience: 5, comment: 'Broth packed separately so the noodles stayed perfect.', createdAt: daysAgo(3, 21) },
    { id: 'rv-4', foodId: 'f-dimsum', restaurantId: 'r-abc', userId: 'u-c3', userName: 'Budi S.', foodQuality: 4, packaging: 3, experience: 4, comment: 'Tasty, but a couple of pieces stuck to the box.', createdAt: daysAgo(9, 21) },
    { id: 'rv-5', foodId: 'f-croissant', restaurantId: 'r-bakery', userId: 'u-c2', userName: 'Maya P.', foodQuality: 5, packaging: 5, experience: 5, comment: 'Flaky and buttery — reheated beautifully the next morning.', createdAt: daysAgo(14, 21) },
    { id: 'rv-6', foodId: 'f-rendang', restaurantId: 'r-dapur', userId: 'u-c3', userName: 'Budi S.', foodQuality: 5, packaging: 5, experience: 4, comment: 'Best rendang I have had at this price. Incredibly tender.', createdAt: daysAgo(8, 21) },
  ]

  const impactRecords: ImpactRecord[] = [
    { id: 'im-1', userId: 'u-cust', orderId: 'ORD-1031', meals: 2, wasteKg: 0.9, donationValue: 0, isDonation: false, createdAt: daysAgo(6, 20) },
    { id: 'im-2', userId: 'u-cust', orderId: 'ORD-1025', meals: 2, wasteKg: 0.78, donationValue: 0, isDonation: false, createdAt: daysAgo(12, 18) },
    { id: 'im-3', userId: 'u-cust', meals: 4, wasteKg: 1.8, donationValue: 60000, isDonation: true, createdAt: daysAgo(21, 13) },
    { id: 'im-4', userId: 'u-cust', meals: 6, wasteKg: 2.4, donationValue: 66000, isDonation: true, createdAt: daysAgo(45, 17) },
    { id: 'im-5', userId: 'u-cust', meals: 1, wasteKg: 0.32, donationValue: 0, isDonation: false, createdAt: daysAgo(2, 19) },
    { id: 'im-6', userId: 'u-cust', meals: 3, wasteKg: 1.2, donationValue: 0, isDonation: false, createdAt: daysAgo(62, 19) },
    { id: 'im-7', userId: 'u-cust', meals: 2, wasteKg: 0.9, donationValue: 30000, isDonation: true, createdAt: daysAgo(80, 12) },
  ]

  const notifications: Notification[] = [
    { id: 'n-1', userId: 'u-cust', type: 'order', title: 'Your order is being prepared', message: 'ABC Kitchen is preparing ORD-1042. Pickup opens soon.', href: '/orders/ORD-1042', read: false, createdAt: iso(-0.2) },
    { id: 'n-2', userId: 'u-cust', type: 'donation', title: 'Your donation was delivered', message: 'Panti Asuhan Harapan has received a delivery of 2 Rendang Rice Box.', href: '/donations', read: false, createdAt: iso(-1) },
    { id: 'n-3', userId: 'u-cust', type: 'promo', title: 'New food near you', message: 'Daily Bakery just listed Roti Sobek Pandan for tomorrow morning.', href: '/food/f-roti-pandan', read: false, createdAt: iso(-2) },
    { id: 'n-4', userId: 'u-cust', type: 'impact', title: 'Impact milestone reached', message: 'You have saved 20 meals from being wasted. Thank you!', href: '/impact', read: true, createdAt: daysAgo(2, 20) },
    { id: 'n-5', userId: 'u-cust', type: 'review', title: 'How was your Croissant Box?', message: 'Rate your order from Daily Bakery to help others choose.', href: '/orders/ORD-1038', read: true, createdAt: daysAgo(2, 21) },
    { id: 'n-6', userId: 'u-rest', type: 'order', title: 'New order received', message: 'ORD-1044 — 1x Spicy Beef Ramen. Please confirm.', href: '/restaurant/orders', read: false, createdAt: iso(-0.1) },
    { id: 'n-7', userId: 'u-rest', type: 'stock', title: 'Stock running low', message: 'Spicy Beef Ramen has only 3 portions left.', href: '/restaurant/listings', read: false, createdAt: iso(-0.5) },
    { id: 'n-8', userId: 'u-rest', type: 'review', title: 'New 5-star review', message: 'Maya P. reviewed Chicken Rice Bowl.', href: '/restaurant/reviews', read: true, createdAt: daysAgo(5, 21) },
    { id: 'n-9', userId: 'u-inst', type: 'donation', title: 'New donation available', message: '3x Chicken Rice Bowl from ABC Kitchen is waiting for your acceptance.', href: '/institution/donations', read: false, createdAt: iso(-0.8) },
    { id: 'n-10', userId: 'u-inst', type: 'donation', title: 'Donation delivered', message: '2x Rendang Rice Box has arrived. Please confirm receipt.', href: '/institution/donations', read: false, createdAt: iso(-1) },
    { id: 'n-11', userId: 'u-admin', type: 'system', title: 'New restaurant registration', message: 'Sate Pak Kumis is awaiting verification.', href: '/admin/restaurants', read: false, createdAt: daysAgo(1, 10) },
    { id: 'n-12', userId: 'u-admin', type: 'system', title: 'New complaint submitted', message: 'Order problem reported by Budi Santoso.', href: '/admin/complaints', read: false, createdAt: iso(-5) },
  ]

  const complaints: Complaint[] = [
    { id: 'CMP-021', userId: 'u-c3', userName: 'Budi Santoso', category: 'Order problem', subject: 'Order marked ready but restaurant closed', description: 'Arrived at 20:10 for ORD-1028 and the shutter was down.', status: 'Open', responses: [], createdAt: iso(-5) },
    { id: 'CMP-020', userId: 'u-c2', userName: 'Maya Putri', category: 'Food quality issue', subject: 'Smoothie separated', description: 'The green smoothie looked separated but tasted fine.', status: 'In Progress', responses: [{ author: 'Admin', message: 'Thanks Maya, we have contacted Green Bowl about this.', at: daysAgo(1, 9) }], createdAt: daysAgo(2, 14) },
    { id: 'CMP-019', userId: 'u-cust', userName: 'Raka Pratama', category: 'Technical problem', subject: 'Payment page froze', description: 'The page froze after choosing e-wallet but the order went through.', status: 'Resolved', responses: [{ author: 'Admin', message: 'Fixed in the latest release. Sorry for the trouble!', at: daysAgo(8, 10) }], createdAt: daysAgo(9, 19) },
  ]

  const defaultNotifications = { orders: true, donations: true, promotions: true, newFood: true, reviews: true, email: false }

  const preferences: UserPreferences[] = [
    { userId: 'u-cust', favoriteCategories: ['Rice', 'Bakery'], priceRange: [5000, 30000], maxDistance: 5, preferredPickupTime: 'evening', notifications: defaultNotifications, privacy: { showProfile: true, shareImpact: true, twoFactor: false } },
    { userId: 'u-rest', favoriteCategories: [], priceRange: [0, 100000], maxDistance: 10, preferredPickupTime: 'any', notifications: { newOrders: true, lowStock: true, reviews: true, payouts: true }, privacy: { showProfile: true, shareImpact: true, twoFactor: true } },
    { userId: 'u-inst', favoriteCategories: [], priceRange: [0, 100000], maxDistance: 10, preferredPickupTime: 'any', notifications: { newDonations: true, deliveryUpdates: true, weeklySummary: true }, privacy: { showProfile: true, shareImpact: true, twoFactor: false } },
    { userId: 'u-admin', favoriteCategories: [], priceRange: [0, 100000], maxDistance: 10, preferredPickupTime: 'any', notifications: { registrations: true, complaints: true, reports: true }, privacy: { showProfile: false, shareImpact: false, twoFactor: true } },
  ]

  return {
    version: DB_VERSION,
    users,
    restaurants,
    institutions,
    foods,
    orders,
    payments: [],
    donations,
    reviews,
    notifications,
    favorites: [
      { id: 'fav-1', userId: 'u-cust', targetType: 'food', targetId: 'f-croissant', createdAt: daysAgo(3) },
      { id: 'fav-2', userId: 'u-cust', targetType: 'restaurant', targetId: 'r-dapur', createdAt: daysAgo(10) },
      { id: 'fav-3', userId: 'u-cust', targetType: 'food', targetId: 'f-rendang', createdAt: daysAgo(4) },
    ],
    impactRecords,
    complaints,
    preferences,
    carts: { 'u-cust': [] },
    checkoutDrafts: {},
    systemSettings: { platformFeePercent: 8, maintenanceMode: false, autoApproveInstitutions: false, minDiscountPercent: 30, supportEmail: 'support@foodcycle.id' },
    session: null,
  }
}
