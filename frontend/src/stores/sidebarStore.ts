import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  isOpen: boolean
  isMobile: boolean
  mobileOpen: boolean
  toggle: () => void
  setMobile: (isMobile: boolean) => void
  toggleMobile: () => void
  closeMobile: () => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      isOpen: true,
      isMobile: false,
      mobileOpen: false,

      toggle: () => {
        const { isMobile } = get()
        if (isMobile) {
          set({ mobileOpen: !get().mobileOpen })
        } else {
          set({ isOpen: !get().isOpen })
        }
      },

      setMobile: (isMobile) => {
        set({ isMobile, mobileOpen: false })
      },

      toggleMobile: () => {
        set({ mobileOpen: !get().mobileOpen })
      },

      closeMobile: () => {
        set({ mobileOpen: false })
      },
    }),
    {
      name: 'sidebar-storage',
      partialize: (state) => ({
        isOpen: state.isOpen,
      }),
    }
  )
)
