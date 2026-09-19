import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useSwipeable } from 'react-swipeable'
import { NavStore } from '@/src/zustand/notification/Navigation'
import { AuthStore } from '@/src/zustand/user/AuthStore'
import CompanyStore from '@/src/zustand/app/Company'
import TransactionStore from '@/src/zustand/Transaction'
import ThemeToggle from './ThemeToggle'
import {
  Gauge,
  Users,
  FileArchive,
  CreditCard,
  ArrowLeftRight,
  Boxes,
  Settings,
  Wrench,
  HeartHandshake,
  Lock,
} from 'lucide-react'

function AdminNavContent({
  pathname,
  user,
  companyForm,
  canSee,
  onItemClick,
  pendingCount,
}: {
  pathname: string
  user: any
  companyForm: any
  canSee: (name: string) => boolean
  onItemClick?: () => void
  pendingCount?: number
}) {
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

      <div className="mt-4 flex-1">
        {canSee('Dashboard') && (
          <Link
            onClick={onItemClick}
            className={`${
              pathname === '/admin' ? 'text-[var(--customRedColor)]' : ''
            } v_nav_items hover:text-[var(--customRedColor)] flex items-center`}
            href="/admin"
          >
            <Gauge className="mr-3 w-5 h-5" />
            Dashboard
          </Link>
        )}
        {canSee('Sell Products') && (
          <Link
            onClick={onItemClick}
            className={`${
              pathname === '/admin/activities'
                ? 'text-[var(--customRedColor)]'
                : ''
            } v_nav_items hover:text-[var(--customRedColor)] flex items-center`}
            href="/admin/activities"
          >
            <ArrowLeftRight className="mr-3 w-5 h-5" />
            Sell Products
          </Link>
        )}
        {canSee('Purchase Products') && (
          <Link
            onClick={onItemClick}
            className={`${
              pathname.includes('/admin/activities/purchase')
                ? 'text-[var(--customRedColor)]'
                : ''
            } v_nav_items hover:text-[var(--customRedColor)] flex items-center`}
            href="/admin/activities/purchase"
          >
            <CreditCard className="mr-3 w-5 h-5" />
            Purchase Products
          </Link>
        )}

        {canSee('Transactions') && (
          <div className="v_nav_items active trip">
            <div className="hover:text-[var(--customRedColor)] flex cursor-pointer items-center py-3">
              <Link
                onClick={onItemClick}
                className="flex flex-1 items-center"
                href="/admin/transactions"
              >
                <CreditCard className="mr-3 w-5 h-5" />
                Transactions
                {pendingCount && pendingCount > 0 ? (
                  <span className="ml-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                ) : null}
              </Link>
            </div>
            <div className="nav_dropdown">
              <Link
                onClick={onItemClick}
                className="inner_nav_items"
                href="/admin/transactions/purchase"
              >
                Purchase Transactions
              </Link>
              <Link
                onClick={onItemClick}
                className="inner_nav_items"
                href="/admin/operations/expenses"
              >
                Expenses
              </Link>
            </div>
          </div>
        )}

        {canSee('Operation') && (
          <div className="v_nav_items active">
            <div className="hover:text-[var(--customRedColor)] flex cursor-pointer items-center py-3">
              <Link
                onClick={onItemClick}
                className="flex flex-1 items-center"
                href="/admin/operations"
              >
                <Wrench className="mr-3 w-5 h-5" />
                Operation
              </Link>
            </div>

            <div className="nav_dropdown">
              {(canSee('Operation') || canSee('Daily Production')) && (
                <Link
                  onClick={onItemClick}
                  className="inner_nav_items"
                  href="/admin/operations/productions"
                >
                  Daily Production
                </Link>
              )}
              {(canSee('Operation') || canSee('Daily Consumption')) && (
                <Link
                  onClick={onItemClick}
                  className="inner_nav_items"
                  href="/admin/operations/consumptions"
                >
                  Daily Consumption
                </Link>
              )}
              {(canSee('Operation') || canSee('Daily Mortality')) && (
                <Link
                  onClick={onItemClick}
                  className="inner_nav_items"
                  href="/admin/operations/mortality"
                >
                  Daily Mortality
                </Link>
              )}
              {(canSee('Operation') || canSee('Daily Services')) && (
                <Link
                  onClick={onItemClick}
                  className="inner_nav_items"
                  href="/admin/operations/services"
                >
                  Daily Services
                </Link>
              )}
            </div>
          </div>
        )}

        {canSee('Products') && (
          <div className="v_nav_items active">
            <div
              className={`flex hover:text-[var(--customRedColor)] cursor-pointer items-center py-3 ${
                pathname.includes('products')
                  ? 'text-[var(--customRedColor)]'
                  : ''
              }`}
            >
              <Boxes className="mr-3 w-5 h-5" />
              Products
            </div>
            <div className="nav_dropdown">
              {canSee('Products') && (
                <>
                  <Link
                    onClick={onItemClick}
                    className="inner_nav_items"
                    href="/admin/products"
                  >
                    Product Records
                  </Link>
                  <Link
                    onClick={onItemClick}
                    className="inner_nav_items"
                    href="/admin/products/consumption"
                  >
                    Consumption Products
                  </Link>
                  <Link
                    onClick={onItemClick}
                    className="inner_nav_items"
                    href="/admin/products/selling"
                  >
                    Selling Products
                  </Link>
                </>
              )}
              {(canSee('Products') || canSee('Stocks')) && (
                <Link
                  onClick={onItemClick}
                  className="inner_nav_items"
                  href="/admin/products/stocks"
                >
                  Stocks
                </Link>
              )}
            </div>
          </div>
        )}

        {canSee('Customers') && (
          <div className="v_nav_items active two">
            <div
              className={`${
                pathname.includes('/admin/customers')
                  ? 'text-[var(--customRedColor)]'
                  : ''
              } hover:text-[var(--customRedColor)] flex cursor-pointer items-center py-3`}
            >
              <Link
                onClick={onItemClick}
                className="flex flex-1 items-center"
                href="/admin/customers"
              >
                <Users className="mr-3 w-5 h-5" />
                Customers
              </Link>
            </div>
            <div className="nav_dropdown">
              {canSee('Customers') && (
                <>
                  <Link
                    onClick={onItemClick}
                    className="inner_nav_items"
                    href="/admin/customers"
                  >
                    Customers Table
                  </Link>
                  <Link
                    onClick={onItemClick}
                    className="inner_nav_items"
                    href="/admin/customers/reviews"
                  >
                    Customer Reviews
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {canSee('Security') && (
          <div className="v_nav_items active two">
            <div
              className={`${
                pathname.includes('/admin/security')
                  ? 'text-[var(--customRedColor)]'
                  : ''
              } hover:text-[var(--customRedColor)] flex cursor-pointer items-center py-3`}
            >
              <div className="flex flex-1 items-center">
                <Lock className="mr-3 w-5 h-5" />
                Security
              </div>
            </div>
            <div className="nav_dropdown">
              {canSee('Security') && (
                <>
                  <Link
                    onClick={onItemClick}
                    className="inner_nav_items"
                    href="/admin/security/equipments"
                  >
                    Equipment Report
                  </Link>
                  <Link
                    onClick={onItemClick}
                    className="inner_nav_items"
                    href="/admin/security"
                  >
                    Visitors
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {canSee('Monthly Strategy') && (
          <div className="v_nav_items active trip">
            <div className="hover:text-[var(--customRedColor)] flex cursor-pointer items-center py-3">
              <div className="flex flex-1 items-center">
                <HeartHandshake className="mr-3 w-5 h-5" />
                Monthly Strategy
              </div>
            </div>
            <div className="nav_dropdown">
              {canSee('Monthly Strategy') && (
                <>
                  <Link
                    onClick={onItemClick}
                    className="inner_nav_items"
                    href="/admin/socials/strategies"
                  >
                    Monthly Strategy
                  </Link>
                  <Link
                    onClick={onItemClick}
                    className="inner_nav_items"
                    href="/admin/socials"
                  >
                    Social Reports
                  </Link>
                  <Link
                    onClick={onItemClick}
                    className="inner_nav_items"
                    href="/admin/socials/marketing"
                  >
                    Marketing Reports
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {canSee('Pages') && (
          <div className="v_nav_items active">
            <div
              className={`flex cursor-pointer ${
                pathname.includes('pages') ? 'text-[var(--customRedColor)]' : ''
              } hover:text-[var(--customRedColor)] items-center py-3`}
            >
              <FileArchive className="mr-3 w-5 h-5" />
              Pages
            </div>
            <div className="nav_dropdown">
              {canSee('Pages') && (
                <>
                  <Link
                    onClick={onItemClick}
                    className="inner_nav_items hover:text-[var(--customColor)]"
                    href="/admin/pages/blog"
                  >
                    Blog
                  </Link>

                  <Link
                    onClick={onItemClick}
                    className="inner_nav_items hover:text-[var(--customColor)]"
                    href="/admin/pages/faq"
                  >
                    FAQ
                  </Link>
                  <Link
                    onClick={onItemClick}
                    className="inner_nav_items"
                    href="/admin/pages/emails"
                  >
                    Emails
                  </Link>
                  <Link
                    onClick={onItemClick}
                    className="inner_nav_items"
                    href="/admin/pages/notification-templates"
                  >
                    Notifications
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {canSee('Company') && (
          <div className="v_nav_items active">
            <div
              className={`hover:text-[var(--customRedColor)] flex cursor-pointer items-center py-3 ${
                pathname.includes('company')
                  ? 'text-[var(--customRedColor)]'
                  : ''
              }`}
            >
              <Settings className="mr-3 w-5 h-5" />
              Company
            </div>
            <div className="nav_dropdown">
              {canSee('Company') && (
                <>
                  {(canSee('CEO') || canSee('Director')) && (
                    <Link
                      onClick={onItemClick}
                      className="inner_nav_items"
                      href="/admin/company"
                    >
                      Set Company
                    </Link>
                  )}
                  <Link
                    onClick={onItemClick}
                    className="inner_nav_items"
                    href="/admin/company/positions"
                  >
                    Positions
                  </Link>
                  {(canSee('Company') || canSee('Production Columns')) && (
                    <Link
                      onClick={onItemClick}
                      className="inner_nav_items"
                      href="/admin/operations/columns"
                    >
                      Pen Houses
                    </Link>
                  )}
                  <Link
                    onClick={onItemClick}
                    className="inner_nav_items"
                    href="/admin/finances"
                  >
                    Finances
                  </Link>
                  <Link
                    onClick={onItemClick}
                    className="inner_nav_items"
                    href="/admin/company/salary"
                  >
                    Salary
                  </Link>
                  {companyForm.allowApplicant && (
                    <Link
                      onClick={onItemClick}
                      className="inner_nav_items"
                      href="/admin/company/applications"
                    >
                      Submitted Applications
                    </Link>
                  )}
                  <Link
                    onClick={onItemClick}
                    className="inner_nav_items"
                    href="/admin/company/staffs"
                  >
                    Staffs
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <ThemeToggle />
    </div>
  )
}

export default function VerticalNavigation() {
  const pathname = usePathname()
  const { toggleVNav, vNav, clearNav } = NavStore()
  const { user } = AuthStore()
  const { companyForm } = CompanyStore()
  const { pendingCount } = TransactionStore()

  useEffect(() => {
    clearNav()
  }, [pathname, clearNav])

  const handlers = useSwipeable({
    onSwipedLeft: toggleVNav,
  })

  const canSee = (menuName: string) => {
    if (!user) return false
    const position = user.staffPositions || ''
    const roles = user.roles || ''

    if (position === 'CEO' || position === 'Director') return true
    if (position === 'Manager') {
      return menuName !== 'Company'
    }

    const roleList = roles.split(',').map((r) => r.trim().toLowerCase())
    return roleList.includes(menuName.toLowerCase())
  }

  return (
    <>
      {/* Desktop Sidebar: Strictly visible on desktop (md: and up), hidden on mobile */}
      <aside className="hidden md:block w-[270px] min-w-[270px] shrink-0 sticky top-0 h-screen z-30">
        <AdminNavContent
          pathname={pathname}
          user={user}
          companyForm={companyForm}
          canSee={canSee}
          pendingCount={pendingCount}
        />
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
          <AdminNavContent
            pathname={pathname}
            user={user}
            companyForm={companyForm}
            canSee={canSee}
            onItemClick={clearNav}
            pendingCount={pendingCount}
          />
        </div>
      </div>
    </>
  )
}