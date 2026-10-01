import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  Compass,
  FileBarChart,
  Gift,
  HandHeart,
  Heart,
  History,
  Home,
  LayoutDashboard,
  Leaf,
  type LucideIcon,
  MessageSquareWarning,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Star,
  Store,
  User,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import type { Role } from '@/types'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  badge?: 'notifications' | 'cart' | 'pendingOrders' | 'pendingDonations' | 'adminQueue'
}

export interface NavConfig {
  label: string
  primary: NavItem[]
  mobile: NavItem[]
}

const customerPrimary: NavItem[] = [
  { href: '/home', label: 'Home', icon: Home, exact: true },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/donations', label: 'Donations', icon: HandHeart },
  { href: '/impact', label: 'Impact', icon: Leaf },
  { href: '/notifications', label: 'Notifications', icon: Bell, badge: 'notifications' },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const restaurantPrimary: NavItem[] = [
  { href: '/restaurant', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/restaurant/listings', label: 'Food Listings', icon: UtensilsCrossed },
  { href: '/restaurant/orders', label: 'Orders', icon: ClipboardList, badge: 'pendingOrders' },
  { href: '/restaurant/sales', label: 'Sales', icon: BarChart3 },
  { href: '/restaurant/reviews', label: 'Reviews', icon: Star },
  { href: '/restaurant/impact', label: 'Impact', icon: Leaf },
  { href: '/restaurant/notifications', label: 'Notifications', icon: Bell, badge: 'notifications' },
  { href: '/restaurant/profile', label: 'Profile', icon: Store },
  { href: '/restaurant/settings', label: 'Settings', icon: Settings },
]

const institutionPrimary: NavItem[] = [
  { href: '/institution', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/institution/donations', label: 'Donations', icon: Gift, badge: 'pendingDonations' },
  { href: '/institution/history', label: 'History', icon: History },
  { href: '/institution/notifications', label: 'Notifications', icon: Bell, badge: 'notifications' },
  { href: '/institution/profile', label: 'Profile', icon: Building2 },
  { href: '/institution/settings', label: 'Settings', icon: Settings },
]

const adminPrimary: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/restaurants', label: 'Restaurants', icon: Store, badge: 'adminQueue' },
  { href: '/admin/institutions', label: 'Institutions', icon: Building2 },
  { href: '/admin/foods', label: 'Foods', icon: UtensilsCrossed },
  { href: '/admin/orders', label: 'Orders', icon: Receipt },
  { href: '/admin/donations', label: 'Donations', icon: Package },
  { href: '/admin/reports', label: 'Reports', icon: FileBarChart },
  { href: '/admin/complaints', label: 'Complaints', icon: MessageSquareWarning },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell, badge: 'notifications' },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

function pick(items: NavItem[], hrefs: string[]) {
  return hrefs.map((h) => items.find((i) => i.href === h)!).filter(Boolean)
}

export const NAV: Record<Role, NavConfig> = {
  customer: {
    label: 'Customer',
    primary: customerPrimary,
    mobile: pick(customerPrimary, ['/home', '/explore', '/orders', '/donations', '/profile']),
  },
  restaurant: {
    label: 'Restaurant',
    primary: restaurantPrimary,
    mobile: pick(restaurantPrimary, ['/restaurant', '/restaurant/listings', '/restaurant/orders', '/restaurant/sales']),
  },
  institution: {
    label: 'Social Institution',
    primary: institutionPrimary,
    mobile: pick(institutionPrimary, ['/institution', '/institution/donations', '/institution/history', '/institution/profile']),
  },
  admin: {
    label: 'Admin',
    primary: adminPrimary,
    mobile: pick(adminPrimary, ['/admin', '/admin/users', '/admin/restaurants', '/admin/complaints']),
  },
}

export function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
