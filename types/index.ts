// Domain types. Each interface maps 1:1 to a future Supabase table (see comments).

export type Role = 'customer' | 'restaurant' | 'institution' | 'admin'
export type AccountStatus = 'active' | 'suspended'
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export const FOOD_CATEGORIES = ['Rice', 'Noodles', 'Bakery', 'Snacks', 'Drinks', 'Other'] as const
export type FoodCategory = (typeof FOOD_CATEGORIES)[number]

export type FoodGrade = 'A' | 'B' | 'C'

/** table: users */
export interface User {
  id: string
  name: string
  email: string
  role: Role
  phone?: string
  location?: string
  avatarUrl?: string
  status: AccountStatus
  createdAt: string
  restaurantId?: string
  institutionId?: string
}

/** table: restaurants */
export interface Restaurant {
  id: string
  ownerId: string
  name: string
  description: string
  address: string
  city: string
  distanceKm: number
  openTime: string
  closeTime: string
  phone: string
  email: string
  rating: number
  reviewCount: number
  verification: VerificationStatus
  defaultPickupMinutes: number
  logoColor: string
  createdAt: string
}

/** table: social_institutions */
export interface SocialInstitution {
  id: string
  ownerId?: string
  name: string
  description: string
  address: string
  city: string
  phone: string
  email: string
  verification: VerificationStatus
  mealsNeeded: number
  acceptingDonations: boolean
  openTime: string
  closeTime: string
  preferredCategories: FoodCategory[]
  maxDailyCapacity: number
  preferredPickupTime: string
  createdAt: string
}

/** table: food_quality */
export interface QualityAssessment {
  freshness: number
  packaging: number
  restaurantRating: number
  customerFeedback: number
  score: number
}

export type FoodStatus = 'active' | 'paused' | 'disabled'

/** table: foods */
export interface Food {
  id: string
  restaurantId: string
  name: string
  category: FoodCategory
  description: string
  image: string
  originalPrice: number
  price: number
  quantity: number
  pickupStart: string
  pickupEnd: string
  ingredients: string[]
  allergens: string[]
  donationAvailable: boolean
  rating: number
  ratingCount: number
  soldCount: number
  weightKg: number
  quality: QualityAssessment
  status: FoodStatus
  createdAt: string
}

export type OrderStatus =
  | 'Pending'
  | 'Payment Confirmed'
  | 'Restaurant Confirmed'
  | 'Preparing'
  | 'Ready for Pickup'
  | 'Picked Up'
  | 'Completed'
  | 'Cancelled'

export type OrderType = 'self' | 'donation'

export interface StatusEvent<S extends string> {
  status: S
  at: string
}

/** table: order_items */
export interface OrderItem {
  id: string
  foodId: string
  name: string
  image: string
  price: number
  originalPrice: number
  quantity: number
  grade: FoodGrade
  category: FoodCategory
  weightKg: number
}

/** table: orders */
export interface Order {
  id: string
  customerId: string
  restaurantId: string
  items: OrderItem[]
  type: OrderType
  status: OrderStatus
  history: StatusEvent<OrderStatus>[]
  subtotal: number
  discount: number
  total: number
  pickupStart: string
  pickupEnd: string
  paymentId: string
  donationId?: string
  reviewed: boolean
  createdAt: string
}

export type PaymentMethod = 'E-Wallet' | 'Bank Transfer' | 'Virtual Account'

/** table: payments */
export interface Payment {
  id: string
  orderIds: string[]
  userId: string
  amount: number
  method: PaymentMethod
  status: 'success' | 'failed'
  createdAt: string
}

export type DonationStatus =
  | 'Purchased'
  | 'Accepted'
  | 'Restaurant Confirmed'
  | 'Preparing'
  | 'Picked Up'
  | 'Delivered'
  | 'Received'
  | 'Rejected'

/** table: donations */
export interface Donation {
  id: string
  orderId: string
  donorId: string
  restaurantId: string
  institutionId: string
  foodSummary: string
  quantity: number
  value: number
  message?: string
  status: DonationStatus
  history: StatusEvent<DonationStatus>[]
  createdAt: string
}

/** table: reviews */
export interface Review {
  id: string
  orderId?: string
  foodId: string
  restaurantId: string
  userId: string
  userName: string
  foodQuality: number
  packaging: number
  experience: number
  comment: string
  createdAt: string
}

export type NotificationType = 'order' | 'donation' | 'system' | 'promo' | 'review' | 'stock' | 'impact'

/** table: notifications */
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  href?: string
  read: boolean
  createdAt: string
}

/** table: favorites */
export interface Favorite {
  id: string
  userId: string
  targetType: 'food' | 'restaurant'
  targetId: string
  createdAt: string
}

/** table: impact_records */
export interface ImpactRecord {
  id: string
  userId: string
  orderId?: string
  meals: number
  wasteKg: number
  donationValue: number
  isDonation: boolean
  createdAt: string
}

export const COMPLAINT_CATEGORIES = [
  'Food quality issue',
  'Order problem',
  'Restaurant problem',
  'Donation problem',
  'Technical problem',
] as const
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number]
export type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved'

/** table: complaints */
export interface Complaint {
  id: string
  userId: string
  userName: string
  category: ComplaintCategory
  subject: string
  description: string
  status: ComplaintStatus
  responses: { author: string; message: string; at: string }[]
  createdAt: string
}

export type PickupPreference = 'any' | 'afternoon' | 'evening' | 'night'

/** table: user_preferences */
export interface UserPreferences {
  userId: string
  favoriteCategories: FoodCategory[]
  priceRange: [number, number]
  maxDistance: number
  preferredPickupTime: PickupPreference
  notifications: Record<string, boolean>
  privacy: { showProfile: boolean; shareImpact: boolean; twoFactor: boolean }
}

export interface CartItem {
  foodId: string
  quantity: number
  donate: boolean
}

export interface CheckoutDraft {
  type: OrderType
  institutionId?: string
  message?: string
}

export interface SystemSettings {
  platformFeePercent: number
  maintenanceMode: boolean
  autoApproveInstitutions: boolean
  minDiscountPercent: number
  supportEmail: string
}

export interface Session {
  userId: string
  createdAt: string
  device: string
}

export interface Db {
  version: number
  users: User[]
  restaurants: Restaurant[]
  institutions: SocialInstitution[]
  foods: Food[]
  orders: Order[]
  payments: Payment[]
  donations: Donation[]
  reviews: Review[]
  notifications: Notification[]
  favorites: Favorite[]
  impactRecords: ImpactRecord[]
  complaints: Complaint[]
  preferences: UserPreferences[]
  carts: Record<string, CartItem[]>
  checkoutDrafts: Record<string, CheckoutDraft | undefined>
  systemSettings: SystemSettings
  session: Session | null
}
