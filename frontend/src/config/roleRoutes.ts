import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Warehouse,
  Users,
  ShoppingBag,
  Truck,
  UserCog,
  TrendingUp,
  Wallet,
  Receipt,
  BarChart3,
  Bell,
  Building2,
  Settings,
  CreditCard,
  DollarSign,
  Clock,
  User,
  Store,
  Globe,
} from 'lucide-react'

export interface RouteConfig {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  translationKey: string
}

export const ROLE_ROUTES: Record<string, string> = {
  platform_admin: '/admin',
  owner: '/owner/dashboard',
  manager: '/manager/dashboard',
  seller: '/seller/pos',
  courier: '/courier/deliveries',
  customer: '/stores',
}

export const ROLE_SIDEBAR_ITEMS: Record<string, RouteConfig[]> = {
  platform_admin: [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, translationKey: 'admin.dashboard' },
    { path: '/admin/businesses', label: 'Businesses', icon: Building2, translationKey: 'admin.businesses' },
    { path: '/admin/users', label: 'Users', icon: Users, translationKey: 'admin.users' },
    { path: '/notifications', label: 'Notifications', icon: Bell, translationKey: 'notifications.title' },
    { path: '/settings', label: 'Settings', icon: Settings, translationKey: 'settings.title' },
  ],
  owner: [
    { path: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard, translationKey: 'dashboard.title' },
    { path: '/products', label: 'Products', icon: Package, translationKey: 'products.title' },
    { path: '/categories', label: 'Categories', icon: FolderTree, translationKey: 'categories.title' },
    { path: '/inventory', label: 'Inventory', icon: Warehouse, translationKey: 'inventory.title' },
    { path: '/customers', label: 'Customers', icon: Users, translationKey: 'customers.title' },
    { path: '/orders', label: 'Orders', icon: ShoppingBag, translationKey: 'orders.title' },
    { path: '/delivery', label: 'Delivery', icon: Truck, translationKey: 'delivery.title' },
    { path: '/employees', label: 'Employees', icon: UserCog, translationKey: 'employees.title' },
    { path: '/sales', label: 'Sales', icon: TrendingUp, translationKey: 'sales.title' },
    { path: '/debts', label: 'Debts', icon: Wallet, translationKey: 'debts.title' },
    { path: '/expenses', label: 'Expenses', icon: Receipt, translationKey: 'expenses.title' },
    { path: '/expense-categories', label: 'Expense Categories', icon: FolderTree, translationKey: 'expenses.categoryTitle' },
    { path: '/reports', label: 'Reports', icon: BarChart3, translationKey: 'reports.title' },
    { path: '/settings/marketplace', label: 'Marketplace', icon: Globe, translationKey: 'settings.marketplace' },
    { path: '/notifications', label: 'Notifications', icon: Bell, translationKey: 'notifications.title' },
    { path: '/settings', label: 'Settings', icon: Settings, translationKey: 'settings.title' },
  ],
  manager: [
    { path: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard, translationKey: 'dashboard.title' },
    { path: '/products', label: 'Products', icon: Package, translationKey: 'products.title' },
    { path: '/categories', label: 'Categories', icon: FolderTree, translationKey: 'categories.title' },
    { path: '/inventory', label: 'Inventory', icon: Warehouse, translationKey: 'inventory.title' },
    { path: '/customers', label: 'Customers', icon: Users, translationKey: 'customers.title' },
    { path: '/orders', label: 'Orders', icon: ShoppingBag, translationKey: 'orders.title' },
    { path: '/delivery', label: 'Delivery', icon: Truck, translationKey: 'delivery.title' },
    { path: '/employees', label: 'Employees', icon: UserCog, translationKey: 'employees.title' },
    { path: '/sales', label: 'Sales', icon: TrendingUp, translationKey: 'sales.title' },
    { path: '/debts', label: 'Debts', icon: Wallet, translationKey: 'debts.title' },
    { path: '/expenses', label: 'Expenses', icon: Receipt, translationKey: 'expenses.title' },
    { path: '/reports', label: 'Reports', icon: BarChart3, translationKey: 'reports.title' },
    { path: '/notifications', label: 'Notifications', icon: Bell, translationKey: 'notifications.title' },
  ],
  seller: [
    { path: '/seller/pos', label: 'POS / Kassa', icon: ShoppingCart, translationKey: 'pos.title' },
    { path: '/orders', label: 'Orders', icon: ShoppingBag, translationKey: 'orders.title' },
    { path: '/customers', label: 'Customers', icon: Users, translationKey: 'customers.title' },
    { path: '/products', label: 'Products', icon: Package, translationKey: 'products.title' },
    { path: '/sales', label: 'My Sales', icon: TrendingUp, translationKey: 'sales.title' },
    { path: '/notifications', label: 'Notifications', icon: Bell, translationKey: 'notifications.title' },
  ],
  courier: [
    { path: '/courier/deliveries', label: 'Deliveries', icon: Truck, translationKey: 'delivery.title' },
    { path: '/courier/active', label: 'Active Order', icon: Package, translationKey: 'delivery.activeOrder' },
    { path: '/courier/history', label: 'History', icon: Clock, translationKey: 'delivery.history' },
    { path: '/courier/profile', label: 'Profile', icon: User, translationKey: 'profile.title' },
  ],
  customer: [
    { path: '/stores', label: 'Stores', icon: Store, translationKey: 'marketplace.stores' },
    { path: '/my-orders', label: 'My Orders', icon: ShoppingBag, translationKey: 'marketplace.myOrders' },
    { path: '/cart', label: 'Cart', icon: ShoppingCart, translationKey: 'marketplace.cart' },
    { path: '/profile', label: 'Profile', icon: User, translationKey: 'profile.title' },
  ],
}
