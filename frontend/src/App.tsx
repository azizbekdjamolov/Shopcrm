import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import '@/i18n'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { PublicLayout } from './layouts/PublicLayout'
import { LoadingState } from './components/common/LoadingState'

const LandingPage = lazy(() => import('./pages/landing/LandingPage').then((m) => ({ default: m.LandingPage })))
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const ProductsPage = lazy(() => import('./pages/products/ProductsPage').then((m) => ({ default: m.ProductsPage })))
const ProductDetailPage = lazy(() => import('./pages/products/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })))
const ProductFormPage = lazy(() => import('./pages/products/ProductFormPage').then((m) => ({ default: m.ProductFormPage })))
const InventoryPage = lazy(() => import('./pages/inventory/InventoryPage').then((m) => ({ default: m.InventoryPage })))
const POSPage = lazy(() => import('./pages/pos/POSPage').then((m) => ({ default: m.POSPage })))
const CustomersPage = lazy(() => import('./pages/customers/CustomersPage').then((m) => ({ default: m.CustomersPage })))
const CustomerDetailPage = lazy(() => import('./pages/customers/CustomerDetailPage').then((m) => ({ default: m.CustomerDetailPage })))
const OrdersPage = lazy(() => import('./pages/orders/OrdersPage').then((m) => ({ default: m.OrdersPage })))
const OrderDetailPage = lazy(() => import('./pages/orders/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })))
const OrderFormPage = lazy(() => import('./pages/orders/OrderFormPage').then((m) => ({ default: m.OrderFormPage })))
const DeliveryPage = lazy(() => import('./pages/delivery/DeliveryPage').then((m) => ({ default: m.DeliveryPage })))
const CourierDashboardPage = lazy(() => import('./pages/delivery/CourierDashboardPage').then((m) => ({ default: m.CourierDashboardPage })))
const EmployeesPage = lazy(() => import('./pages/employees/EmployeesPage').then((m) => ({ default: m.EmployeesPage })))
const EmployeeDetailPage = lazy(() => import('./pages/employees/EmployeeDetailPage').then((m) => ({ default: m.EmployeeDetailPage })))
const SalesPage = lazy(() => import('./pages/sales/SalesPage').then((m) => ({ default: m.SalesPage })))
const DebtsPage = lazy(() => import('./pages/debts/DebtsPage').then((m) => ({ default: m.DebtsPage })))
const ExpensesPage = lazy(() => import('./pages/expenses/ExpensesPage').then((m) => ({ default: m.ExpensesPage })))
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })))
const AdminBusinessesPage = lazy(() => import('./pages/admin/AdminBusinessesPage').then((m) => ({ default: m.AdminBusinessesPage })))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const MarketplaceSettingsPage = lazy(() => import('./pages/settings/MarketplaceSettingsPage').then((m) => ({ default: m.MarketplaceSettingsPage })))
const InvoicesPage = lazy(() => import('./pages/invoices/InvoicesPage').then((m) => ({ default: m.InvoicesPage })))
const ShopPage = lazy(() => import('./pages/shop/ShopPage').then((m) => ({ default: m.ShopPage })))
const ShopProductDetailPage = lazy(() => import('./pages/shop/ShopProductDetailPage').then((m) => ({ default: m.ShopProductDetailPage })))
const CartPage = lazy(() => import('./pages/shop/CartPage').then((m) => ({ default: m.CartPage })))
const CheckoutPage = lazy(() => import('./pages/shop/CheckoutPage').then((m) => ({ default: m.CheckoutPage })))
const OrderTrackingPage = lazy(() => import('./pages/shop/OrderTrackingPage').then((m) => ({ default: m.OrderTrackingPage })))
const CategoriesPage = lazy(() => import('./pages/categories/CategoriesPage').then((m) => ({ default: m.CategoriesPage })))
const StoresPage = lazy(() => import('./pages/marketplace/StoresPage').then((m) => ({ default: m.StoresPage })))
const StoreDetailPage = lazy(() => import('./pages/marketplace/StoreDetailPage').then((m) => ({ default: m.StoreDetailPage })))
const MyOrdersPage = lazy(() => import('./pages/marketplace/MyOrdersPage').then((m) => ({ default: m.MyOrdersPage })))
const CustomerProfilePage = lazy(() => import('./pages/customer/ProfilePage').then((m) => ({ default: m.CustomerProfilePage })))
const CourierProfilePage = lazy(() => import('./pages/delivery/CourierProfilePage').then((m) => ({ default: m.CourierProfilePage })))
const ExpenseCategoriesPage = lazy(() => import('./pages/expenses/ExpenseCategoriesPage').then((m) => ({ default: m.ExpenseCategoriesPage })))
const NotFoundPage = lazy(() => import('./pages/errors/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 0,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingState />}>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
            </Route>

            <Route element={<PublicLayout />}>
              <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/shop/:id" element={<ShopProductDetailPage />} />
              <Route path="/shop/cart" element={<CartPage />} />
              <Route path="/shop/checkout" element={<CheckoutPage />} />
              <Route path="/shop/track/:orderNumber" element={<OrderTrackingPage />} />
            </Route>

            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Customer routes */}
              <Route path="/stores" element={<StoresPage />} />
              <Route path="/stores/:businessId" element={<StoreDetailPage />} />
              <Route path="/my-orders" element={<MyOrdersPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/profile" element={<CustomerProfilePage />} />

              {/* Owner routes */}
              <Route path="/owner/dashboard" element={<DashboardPage />} />

              {/* Manager routes */}
              <Route path="/manager/dashboard" element={<DashboardPage />} />

              {/* Seller routes */}
              <Route path="/seller/pos" element={<POSPage />} />

              {/* Courier routes */}
              <Route path="/courier/deliveries" element={<CourierDashboardPage />} />
              <Route path="/courier/active" element={<CourierDashboardPage />} />
              <Route path="/courier/history" element={<CourierDashboardPage />} />

              {/* Shared business routes */}
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/new" element={<ProductFormPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/products/:id/edit" element={<ProductFormPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/pos" element={<POSPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/:id" element={<CustomerDetailPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/new" element={<OrderFormPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />
              <Route path="/delivery" element={<DeliveryPage />} />
              <Route path="/delivery/courier" element={<CourierDashboardPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/debts" element={<DebtsPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/marketplace" element={<MarketplaceSettingsPage />} />

              {/* Courier profile */}
              <Route path="/courier/profile" element={<CourierProfilePage />} />

              {/* Expense categories */}
              <Route path="/expense-categories" element={<ExpenseCategoriesPage />} />

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute roles={['platform_admin']}><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/businesses" element={<ProtectedRoute roles={['platform_admin']}><AdminBusinessesPage /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute roles={['platform_admin']}><AdminUsersPage /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }}
      />
    </QueryClientProvider>
  )
}

export default App
