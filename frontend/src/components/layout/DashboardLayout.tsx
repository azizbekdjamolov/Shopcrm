import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { useSidebarStore } from '@/stores/sidebarStore'
import { cn } from '@/lib/utils'

export function DashboardLayout() {
  const { isOpen, isMobile, setMobile } = useSidebarStore()

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setMobile(mobile)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [setMobile])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          !isMobile && (isOpen ? 'ml-64' : 'ml-20')
        )}
      >
        <Header />
        <main className="min-h-[calc(100vh-4rem)] p-4 md:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>
      {isMobile && <MobileNav />}
    </div>
  )
}
