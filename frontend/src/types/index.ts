export const UserRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  SELLER: 'seller',
  COURIER: 'courier',
  CUSTOMER: 'customer',
  PLATFORM_ADMIN: 'platform_admin',
} as const

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole]

export const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERING: 'delivering',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
} as const

export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus]

export const PaymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
} as const

export type PaymentStatusType = (typeof PaymentStatus)[keyof typeof PaymentStatus]

export const PaymentMethod = {
  CASH: 'cash',
  CARD: 'card',
  TRANSFER: 'transfer',
  CLICK: 'click',
  PAYME: 'payme',
  UZCARD: 'uzcard',
  HUMO: 'humo',
  ONLINE: 'online',
} as const

export type PaymentMethodType = (typeof PaymentMethod)[keyof typeof PaymentMethod]

export const DebtStatus = {
  ACTIVE: 'active',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
  WRITTEN_OFF: 'written_off',
} as const

export type DebtStatusType = (typeof DebtStatus)[keyof typeof DebtStatus]

export const SubscriptionStatus = {
  ACTIVE: 'active',
  TRIAL: 'trial',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  SUSPENDED: 'suspended',
} as const

export type SubscriptionStatusType = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]

export const InventoryMovementType = {
  PURCHASE: 'purchase',
  SALE: 'sale',
  RETURN: 'return',
  ADJUSTMENT: 'adjustment',
  TRANSFER: 'transfer',
  DAMAGE: 'damage',
} as const

export type InventoryMovementTypeType = (typeof InventoryMovementType)[keyof typeof InventoryMovementType]

export const DeliveryStatus = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  RETURNED: 'returned',
} as const

export type DeliveryStatusType = (typeof DeliveryStatus)[keyof typeof DeliveryStatus]

export const ShiftStatus = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ABSENT: 'absent',
} as const

export type ShiftStatusType = (typeof ShiftStatus)[keyof typeof ShiftStatus]

export interface User {
  id: string
  email: string
  phone: string
  full_name: string
  role: UserRoleType
  avatar?: string
  is_active: boolean
  is_platform_admin?: boolean
  telegram_username?: string
  preferred_language?: string
  preferred_theme?: string
  first_name?: string
  last_name?: string
  business_name?: string
  date_of_birth?: string
  address?: string
  date_joined?: string
  created_at: string
  updated_at: string
  last_login?: string
}

export interface Business {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  phone: string
  email?: string
  address?: string
  website?: string
  tax_id?: string
  owner_id: string
  owner?: User
  is_active: boolean
  subscription_status: SubscriptionStatusType
  created_at: string
  updated_at: string
}

export interface Branch {
  id: string
  business_id: string
  name: string
  address: string
  phone: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BusinessUser {
  id: string
  business_id: string
  user_id: string
  user?: User
  role: UserRoleType
  branch_id?: string
  branch?: Branch
  is_active: boolean
  joined_at: string
}

export interface Category {
  id: string
  business_id: string
  name: string
  description?: string
  parent_id?: string
  parent?: Category
  children?: Category[]
  product_count?: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  business_id: string
  name: string
  slug?: string
  barcode?: string
  description?: string
  category_id: string
  category?: Category
  category_name?: string
  supplier_id?: string
  supplier?: Supplier
  supplier_name?: string
  purchase_price: number
  selling_price: number
  quantity: number
  stock_quantity: number
  minimum_stock: number
  min_stock: number
  unit: string
  image?: string
  status: string
  is_active: boolean
  is_weighted: boolean
  tax_rate: number
  profit_margin?: number
  is_low_stock?: boolean
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  business_id: string
  name: string
  phone: string
  email?: string
  address?: string
  contact_person?: string
  total_debt: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Inventory {
  id: string
  business_id: string
  product_id: string
  product?: Product
  branch_id: string
  branch?: Branch
  quantity: number
  reserved_quantity: number
  available_quantity: number
  updated_at: string
}

export interface InventoryMovement {
  id: string
  business_id: string
  product_id: string
  product?: Product
  branch_id: string
  branch?: Branch
  type: InventoryMovementTypeType
  quantity: number
  reference_type?: string
  reference_id?: string
  notes?: string
  performed_by?: User
  created_at: string
}

export interface Customer {
  id: string
  business_id: string
  full_name: string
  phone: string
  email?: string
  address?: string
  total_spent: number
  total_orders: number
  debt_amount: number
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  business_id: string
  branch_id: string
  branch?: Branch
  customer_id?: string
  customer?: Customer
  seller?: User
  items: SaleItem[]
  subtotal: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  payment_method: PaymentMethodType
  payment_status: PaymentStatusType
  notes?: string
  receipt_number: string
  created_at: string
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  product?: Product
  quantity: number
  unit_price: number
  cost_price: number
  discount: number
  tax_amount: number
  total: number
}

export interface Debt {
  id: string
  business_id: string
  customer_id: string
  customer?: Customer
  original_amount: number
  paid_amount: number
  remaining_amount: number
  status: DebtStatusType
  description?: string
  due_date?: string
  transactions: DebtTransaction[]
  created_at: string
  updated_at: string
}

export interface DebtTransaction {
  id: string
  debt_id: string
  amount: number
  payment_method: PaymentMethodType
  notes?: string
  performed_by?: User
  created_at: string
}

export interface Expense {
  id: string
  business_id: string
  category_id: string
  category?: ExpenseCategory
  amount: number
  description: string
  receipt?: string
  branch_id?: string
  branch?: Branch
  created_by?: User
  date: string
  created_at: string
  updated_at: string
}

export interface ExpenseCategory {
  id: string
  business_id: string
  name: string
  description?: string
  budget_limit?: number
  total_spent?: number
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  business_id: string
  user_id: string
  user?: User
  position: string
  salary: number
  hire_date: string
  branch_id?: string
  branch?: Branch
  is_active: boolean
  performance_score?: number
  shifts?: EmployeeShift[]
  created_at: string
  updated_at: string
}

export interface EmployeeShift {
  id: string
  employee_id: string
  employee?: Employee
  branch_id: string
  branch?: Branch
  start_time: string
  end_time: string
  status: ShiftStatusType
  notes?: string
  created_at: string
}

export interface Order {
  id: string
  business_id: string
  order_number: string
  customer_id?: string
  customer?: Customer
  branch_id: string
  branch?: Branch
  items: OrderItem[]
  subtotal: number
  discount_amount: number
  delivery_fee: number
  tax_amount: number
  total_amount: number
  status: OrderStatusType
  payment_method?: PaymentMethodType
  payment_status: PaymentStatusType
  delivery_address?: string
  delivery_notes?: string
  courier_id?: string
  courier?: User
  estimated_delivery?: string
  delivered_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product?: Product
  quantity: number
  unit_price: number
  discount: number
  total: number
}

export interface Delivery {
  id: string
  business_id: string
  order_id: string
  order?: Order
  courier_id?: string
  courier?: User
  status: DeliveryStatusType
  pickup_address: string
  delivery_address: string
  scheduled_date?: string
  actual_delivery_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CourierRating {
  id: string
  courier_id: string
  courier?: User
  order_id: string
  order?: Order
  rating: number
  comment?: string
  created_at: string
}

export interface Payment {
  id: string
  business_id: string
  amount: number
  method: PaymentMethodType
  status: PaymentStatusType
  reference_type?: string
  reference_id?: string
  transaction_id?: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  business_id: string
  invoice_number: string
  customer_id?: string
  customer?: Customer
  items: InvoiceItem[]
  subtotal: number
  tax_amount: number
  total_amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date?: string
  paid_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  is_read: boolean
  link?: string
  created_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  billing_period: 'monthly' | 'yearly'
  max_branches: number
  max_employees: number
  max_products: number
  features: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  business_id: string
  business?: Business
  plan_id: string
  plan?: SubscriptionPlan
  status: SubscriptionStatusType
  start_date: string
  end_date: string
  trial_end_date?: string
  auto_renew: boolean
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  business_id: string
  user_id: string
  user?: User
  action: string
  entity_type: string
  entity_id: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ErrorResponse {
  detail?: string
  message?: string
  errors?: Record<string, string[]>
  status_code?: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  first_name: string
  last_name: string
  email: string
  phone: string
  password: string
  password_confirm: string
  business_name: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface PaymentBreakdown {
  method: string
  total: number
  count: number
}

export interface SalesReport {
  total_sales: number
  total_orders: number
  average_order_value: number
  sales_by_date: { date: string; amount: number }[]
  sales_by_category: { category: string; amount: number }[]
  top_products: { product: string; quantity: number; amount: number }[]
  payment_by_method: PaymentBreakdown[]
}

export interface ProfitReport {
  total_revenue: number
  total_cost: number
  gross_profit: number
  profit_margin: number
  profit_by_date: { date: string; revenue: number; cost: number; profit: number }[]
  profit_by_category: { category: string; profit: number }[]
}

export interface ExpenseReport {
  total_expenses: number
  expenses_by_category: { category: string; amount: number }[]
  expenses_by_date: { date: string; amount: number }[]
  top_expenses: { description: string; amount: number }[]
}

export interface InventoryReport {
  total_products: number
  total_value: number
  low_stock_count: number
  out_of_stock_count: number
  stock_by_category: { category: string; count: number; value: number }[]
  low_stock_products: { product: string; current_stock: number; min_stock: number }[]
}

export interface EmployeeReport {
  total_employees: number
  active_employees: number
  total_salary_expense: number
  top_performers: { name: string; score: number }[]
  attendance_rate: number
}

export interface CustomerReport {
  total_customers: number
  new_customers: number
  active_customers: number
  total_debt: number
  top_customers: { name: string; total_spent: number }[]
}

export interface DashboardData {
  today_sales: number
  today_orders: number
  today_profit: number
  month_sales: number
  month_orders: number
  month_profit: number
  total_customers: number
  total_products: number
  active_debts: number
  debt_amount: number
  low_stock_count: number
  pending_orders: number
  sales_trend: { date: string; amount: number }[]
  recent_sales: Sale[]
  top_products: { product: Product; quantity: number; amount: number }[]
  low_stock_products: Product[]
  recent_orders: Order[]
  best_seller?: Employee
}
