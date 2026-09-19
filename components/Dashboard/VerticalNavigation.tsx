import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useSwipeable } from 'react-swipeable'
import { NavStore } from '@/src/zustand/notification/Navigation'
import { AuthStore } from '@/src/zustand/user/AuthStore'
import {
  Gauge,
  User,
  ArrowLeftRight,
  Boxes,
  Settings,
  Bell,
} from 'lucide-react'
import ThemeToggle from '../Admin/ThemeToggle'

const navLinks = [
  { label: 'Dashboard', href: '/dashboard', icon: Gauge, exact: true },
  { label: 'Profile', href: '/dashboard/profile', icon: User },
  { label: 'Transactions', href: '/dashboard/transactions', icon: ArrowLeftRight },
  { label: 'Products', href: '/dashboard/products', icon: Boxes },
  { label: 'Notification', href: '/dashboard/notifications', icon: Bell },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

function NavigationItems({
  user,
  pathname,
  onItemClick,
}: {
  user: any
  pathname?: string
  onItemClick?: () => void
}) {
  const isDashboardActive = (href: string, exact = false) => {
    if (exact || href === '/dashboard') return pathname === href
    return pathname?.startsWith(href)
  }

  return (
    <div className="v_nav_card nav h-full w-full flex flex-col overflow-y-auto">
      <div className="flex items-start pt-2">
        {user && user.picture ? (
          <Image
            className="object-cover rounded-full mr-2"
            src={user.picture ? String(user.picture) : '/images/avatar.jpg'}
            loading="lazy"
            alt="username"
            sizes="100vw"
            height={0}
            width={0}
            style={{ height: '50px', width: '50px' }}
          />
        ) : (
          <Image
            className="object-cover rounded-full mr-2"
            src={'/images/avatar.jpg'}
            loading="lazy"
            alt="username"
            sizes="100vw"
            height={0}
            width={0}
            style={{ height: '50px', width: '50px' }}
          />
        )}
        <div>
          <div className="text-lg mb-1">Welcome back</div>
          <div className="text-[var(--customRedColor)]">
            {' '}
            {`@${user?.username}`}
          </div>
        </div>
      </div>

      <div className="flex py-1">{user?.staffPositions}</div>

      <div className="mt-6 flex-1 space-y-2">
        {navLinks.map((item) => {
          const Icon = item.icon
          const active = isDashboardActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              onClick={onItemClick}
              className={`v_nav_items hover:text-[var(--customColor)] flex items-center py-3.5 px-1 transition-colors ${
                active ? 'text-[var(--customColor)] font-semibold' : ''
              }`}
              href={item.href}
            >
              <Icon className="mr-3 w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
      <ThemeToggle />
    </div>
  )
}

export default function DashboardNavigation() {
  const pathname = usePathname()
  const { toggleVNav, vNav, clearNav } = NavStore()
  const { user } = AuthStore()

  useEffect(() => {
    clearNav()
  }, [pathname, clearNav])

  const handlers = useSwipeable({
    onSwipedLeft: toggleVNav,
  })

  return (
    <>
      {/* Desktop Sidebar: Strictly visible on desktop (md: and up), hidden on mobile */}
      <aside className="hidden md:block w-[270px] min-w-[270px] shrink-0 sticky top-0 h-screen z-30">
        <NavigationItems user={user} pathname={pathname} />
      </aside>

      {/* Mobile Drawer: Strictly for mobile (< md), hidden on desktop */}
      <div className="md:hidden">
        {/* Backdrop overlay */}
        <div
          onClick={toggleVNav}
          aria-hidden="true"
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            vNav
              ? 'opacity-100 pointer-events-auto visible'
              : 'opacity-0 pointer-events-none invisible'
          }`}
        />

        {/* Off-canvas sliding drawer */}
        <div
          {...handlers}
          className={`fixed top-0 left-0 h-screen z-50 w-[280px] max-w-[85vw] transition-transform duration-300 ease-in-out shadow-2xl ${
            vNav
              ? 'translate-x-0 pointer-events-auto visible'
              : '-translate-x-full pointer-events-none invisible'
          }`}
        >
          <NavigationItems user={user} pathname={pathname} onItemClick={clearNav} />
        </div>
      </div>
    </>
  )
}
