'use client'
import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { formatMoney } from '@/lib/helpers'
import { MessageStore } from '@/src/zustand/notification/Message'
import LinkedPagination from '@/components/Admin/LinkedPagination'
import ProductStore, { Product } from '@/src/zustand/Product'
import { AuthStore } from '@/src/zustand/user/AuthStore'
import { UserStore } from '@/src/zustand/user/User'
import CompanyStore from '@/src/zustand/app/Company'
import BookCrateModal from '@/components/Dashboard/BookCrateModal'

const Products: React.FC = () => {
  const {
    getProducts,
    reshuffleResults,
    loading,
    count,
    products,
  } = ProductStore()
  const [page_size] = useState(20)
  const [sort] = useState('-createdAt')
  const { setMessage } = MessageStore()
  const { user } = AuthStore()
  const { getUser } = UserStore()
  const { companyForm, getCompany } = CompanyStore()
  const pathname = usePathname()
  const { page } = useParams()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showBookModal, setShowBookModal] = useState<boolean>(false)
  const url = '/products'

  const refreshStockData = useCallback(() => {
    const params = `?page_size=${page_size}&page=${page ? page : 1}&ordering=${sort}&isSelling=true`
    getProducts(`${url}${params}`, () => {})
    if (!companyForm.bankAccountNumber) {
      getCompany('/company', () => {})
    }
  }, [page_size, page, sort, getProducts, getCompany, companyForm.bankAccountNumber])

  useEffect(() => {
    reshuffleResults()
  }, [pathname])

  useEffect(() => {
    if (user) {
      getUser(`/users/${user.username}`, setMessage)
    }
  }, [user])

  useEffect(() => {
    const params = `?page_size=${page_size}&page=${page ? page : 1}&ordering=${sort}&isSelling=true`
    getProducts(`${url}${params}`, setMessage)
    getCompany('/company', setMessage)
  }, [page, page_size, sort])

  // Sync latest stock when customer returns online or switches tabs back
  useEffect(() => {
    const handleOnline = () => refreshStockData()
    const handleFocus = () => refreshStockData()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshStockData()
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const heartbeatTimer = setInterval(refreshStockData, 20000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(heartbeatTimer)
    }
  }, [refreshStockData])

  // Stock updates are handled in-place by GeneralContext (stock_update socket)
  // so no need to trigger full API refetches here — avoids product list flicker

  return (
    <>
      {/* Header Banner without cart or search bar */}
      <div className="card_body sharp mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-title-color)]">
              Farm Products
            </h1>
            <p className="text-xs text-[var(--text-primary)] mt-1">
              Select any poultry product below to review real-time availability and place your booking order.
            </p>
          </div>
          {loading && (
            <div className="text-xs text-[var(--text-primary)] flex items-center gap-1.5">
              <i className="bi bi-arrow-repeat animate-spin text-[var(--customColor)]"></i>
              Updating stock...
            </div>
          )}
        </div>
      </div>

      {/* Grid of Selling Products */}
      <div className="grid md:grid-cols-2 gap-4 mb-5">
        {products.map((item, index) => {
          const inStock = Math.floor((Number(item.units) || 0) / (Number(item.unitPerPurchase) || 1))
          const unitLabel = item.purchaseUnit || 'unit'
          return (
            <div key={index} className="card_body sharp flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap sm:flex-nowrap relative items-start mb-3 sm:mb-4">
                  <div className="flex items-center text-xs font-semibold mr-2 opacity-60">
                    {(page ? Number(page) - 1 : 1 - 1) * page_size + index + 1}
                  </div>
                  <div className="relative w-[100px] h-[75px] mb-3 sm:mb-0 overflow-hidden rounded-[8px] sm:mr-3 border border-[var(--border)] shrink-0">
                    {item.picture ? (
                      <Image
                        alt={item.name}
                        src={String(item.picture)}
                        fill
                        sizes="100px"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-[var(--secondary)] flex items-center justify-center text-xs text-[var(--text-secondary)]">
                        <i className="bi bi-box-seam text-2xl opacity-40"></i>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base text-[var(--text-title-color)] truncate mb-1">
                      {item.name}
                    </div>
                    <div className="text-sm font-semibold text-[var(--customColor)] mb-2">
                      ₦{formatMoney(item.price)}{' '}
                      <span className="text-xs font-normal text-[var(--text-primary)]">/ {unitLabel}</span>
                    </div>

                    {/* Stock & Rate Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {inStock > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300">
                          <i className="bi bi-check-circle text-[9px]"></i>
                          {formatMoney(inStock)} in stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                          <i className="bi bi-exclamation-circle text-[9px]"></i>
                          Out of stock
                        </span>
                      )}

                      {Boolean(item.rate && item.rate > 0) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                          <i className="bi bi-arrow-repeat text-[9px]"></i>
                          Rate: {item.rate}/day
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button: 1 Product at a time for accurate availability review */}
              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(item)
                    setShowBookModal(true)
                  }}
                  className="custom_btn bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 cursor-pointer text-xs py-2 px-4 rounded-lg font-semibold shadow-sm transition-all w-full sm:w-auto"
                >
                  <i className="bi bi-box-seam"></i>
                  Book / Purchase
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card_body sharp">
        <LinkedPagination
          url="/dashboard/products"
          count={count}
          page_size={20}
        />
      </div>

      {/* Book Product Modal: Handles 1 product at a time with availability calculation & payment */}
      {selectedProduct && (
        <BookCrateModal
          isOpen={showBookModal}
          onClose={() => {
            setShowBookModal(false)
            setSelectedProduct(null)
          }}
          product={selectedProduct}
          onSuccess={() => {
            refreshStockData()
          }}
        />
      )}
    </>
  )
}

export default Products
