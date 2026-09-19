'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AuthStore } from '@/src/zustand/user/AuthStore'
import TransactionStore from '@/src/zustand/Transaction'
import ProductStore from '@/src/zustand/Product'
import CompanyStore from '@/src/zustand/app/Company'
import { MessageStore } from '@/src/zustand/notification/Message'
import { formatDateToDDMMYY, formatMoney, formatTimeTo12Hour } from '@/lib/helpers'
import BookCrateModal from '@/components/Dashboard/BookCrateModal'

const Dashboard: React.FC = () => {
  const { user } = AuthStore()
  const { setMessage } = MessageStore()
  const { transactions, loading, count, getTransactions } = TransactionStore()
  const { products, getProducts } = ProductStore()
  const { companyForm, getCompany } = CompanyStore()
  const [showBookModal, setShowBookModal] = useState<boolean>(false)

  useEffect(() => {
    if (user?.username || user?.phone || user?.email) {
      const usernameParam = user.username || user.phone || user.email
      getTransactions(
        `/transactions?ordering=-createdAt&page_size=10&username=${usernameParam}`,
        setMessage
      )
    }
  }, [user])

  useEffect(() => {
    if (!companyForm.name || !companyForm.rate) {
      getCompany('/company', setMessage)
    }
    if (!products || products.length === 0) {
      getProducts('/products?isSelling=true', setMessage)
    }
  }, [])

  const stats = useMemo(() => {
    const totalSpent = transactions.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0)
    const paidCount = transactions.filter((t) => t.status).length
    const pendingCount = transactions.filter((t) => !t.status).length
    const totalUnits = transactions.reduce((sum, item) => {
      const itemUnits = item.cartProducts?.reduce(
        (sub, p) => sub + (Number(p.cartUnits) || 0),
        0
      ) || 0
      return sum + itemUnits
    }, 0)

    return {
      totalSpent: user?.totalPurchase && user.totalPurchase > totalSpent ? user.totalPurchase : totalSpent,
      totalOrders: count || transactions.length,
      paidCount,
      pendingCount,
      totalUnits,
    }
  }, [transactions, count, user])

  // Weekly Availability: In-stock crates + production for remaining days through Saturday
  const { eggProduct, inStockCrates, remainingProduction, weeklyAvailability } = useMemo(() => {
    const prod = products.find(
      (p) =>
        p.name.toLowerCase().includes('egg') &&
        !p.name.toLowerCase().includes('crack')
    ) || products.find((p) => p.name.toLowerCase().includes('egg'))

    const inStock = prod
      ? Math.floor((Number(prod.units) || 0) / (Number(prod.unitPerPurchase) || 1))
      : 0

    const dayOfWeek = new Date().getDay() // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
    const remainingDays = dayOfWeek === 0 ? 6 : Math.max(0, 6 - dayOfWeek)
    const rate = Number(companyForm?.rate) || 0
    const remProd = remainingDays * rate
    const totalAvail = Math.max(0, inStock + remProd)

    return {
      eggProduct: prod,
      inStockCrates: inStock,
      remainingProduction: remProd,
      weeklyAvailability: totalAvail,
    }
  }, [products, companyForm?.rate])

  return (
    <>
      {/* Header Banner */}
      <div className="card_body sharp mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-title-color)]">
              Welcome back, {user?.fullName || 'Customer'}!
            </h1>
            <p className="text-sm text-[var(--text-primary)] mt-1">
              Here is an overview of your poultry product purchases and order history.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/transactions"
              className="custom_btn bg-[var(--customColor)] text-white flex items-center gap-2"
            >
              <i className="bi bi-receipt"></i>
              All Transactions
            </Link>
            <button
              type="button"
              onClick={() => setShowBookModal(true)}
              className="custom_btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 cursor-pointer"
            >
              <i className="bi bi-box-seam"></i>
              Book Crate
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Spent */}
        <div className="card_body sharp flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400 flex items-center justify-center text-2xl shrink-0">
            <i className="bi bi-cash-stack"></i>
          </div>
          <div className="overflow-hidden">
            <div className="text-xs uppercase font-semibold text-[var(--text-primary)] tracking-wide">
              Total Spent
            </div>
            <div className="text-xl font-bold text-[var(--text-title-color)] truncate">
              ₦{formatMoney(stats.totalSpent)}
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="card_body sharp flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl shrink-0">
            <i className="bi bi-bag-check"></i>
          </div>
          <div className="overflow-hidden">
            <div className="text-xs uppercase font-semibold text-[var(--text-primary)] tracking-wide">
              Total Orders
            </div>
            <div className="text-xl font-bold text-[var(--text-title-color)] truncate">
              {stats.totalOrders}
            </div>
          </div>
        </div>

        {/* Units Purchased */}
        <div className="card_body sharp flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shrink-0">
            <i className="bi bi-box-seam"></i>
          </div>
          <div className="overflow-hidden">
            <div className="text-xs uppercase font-semibold text-[var(--text-primary)] tracking-wide">
              Units Purchased
            </div>
            <div className="text-xl font-bold text-[var(--text-title-color)] truncate">
              {stats.totalUnits}
            </div>
          </div>
        </div>

        {/* Weekly Availability */}
        <div className="card_body sharp flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl shrink-0">
            <i className="bi bi-calendar-week"></i>
          </div>
          <div className="overflow-hidden">
            <div className="text-xs uppercase font-semibold text-[var(--text-primary)] tracking-wide">
              Weekly Availability
            </div>
            <div className="text-xl font-bold text-[var(--text-title-color)] truncate">
              {formatMoney(weeklyAvailability)}{' '}
              <span className="text-xs font-normal text-[var(--text-primary)]">Crates</span>
            </div>
            <div className="text-[11px] text-[var(--text-primary)] truncate mt-0.5">
              {formatMoney(inStockCrates)} in stock {remainingProduction > 0 ? `+ ${formatMoney(remainingProduction)} est.` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Purchases Table */}
      <div className="card_body sharp mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold text-[var(--text-title-color)]">Recent Purchases</div>
          <Link
            href="/dashboard/transactions"
            className="text-sm font-medium text-[var(--customColor)] hover:underline flex items-center gap-1"
          >
            View Full History
            <i className="bi bi-arrow-right"></i>
          </Link>
        </div>

        {loading ? (
          <div className="flex w-full justify-center py-10">
            <i className="bi bi-opencollective loading text-2xl"></i>
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--primary)] text-left text-xs uppercase font-semibold text-[var(--text-primary)] border-b border-[var(--border)]">
                  <th className="p-3">S/N</th>
                  <th className="p-3">Invoice</th>
                  <th className="p-3">Products</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {transactions.slice(0, 5).map((item, index) => (
                  <tr
                    key={item._id || index}
                    className={index % 2 === 1 ? 'bg-[var(--primary)]' : ''}
                  >
                    <td className="p-3 text-sm text-[var(--text-secondary)]">{index + 1}</td>
                    <td className="p-3 text-sm font-semibold text-[var(--text-title-color)]">
                      #{item.invoiceNumber || String(item._id).slice(-6).toUpperCase()}
                    </td>
                    <td className="p-3 text-sm">
                      {item.cartProducts && item.cartProducts.length > 0 ? (
                        item.cartProducts.map((p, i) => (
                          <div key={i} className="text-xs py-0.5 text-[var(--text-secondary)]">
                            <span className="font-semibold text-[var(--text-title-color)]">{p.cartUnits}</span>{' '}
                            {p.purchaseUnit} of {p.name}
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-[var(--text-primary)]">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-sm font-bold text-green-600 dark:text-green-400">
                      ₦{formatMoney(item.totalAmount)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded ${
                          item.status
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        }`}
                      >
                        {item.status ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-[var(--text-primary)]">
                      {formatTimeTo12Hour(item.createdAt)}
                      <br />
                      {formatDateToDDMMYY(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="relative mb-4">
              <Image
                className="max-w-[180px] h-auto object-contain opacity-75"
                alt="No purchases"
                src="/images/not-found.png"
                width={180}
                height={180}
              />
            </div>
            <div className="text-lg font-semibold text-[var(--text-title-color)] mb-1">
              No purchases recorded yet
            </div>
            <p className="text-sm text-[var(--text-primary)] max-w-sm mb-4">
              When you order poultry and farm products, your receipts and order status will appear here.
            </p>
            <button
              type="button"
              onClick={() => setShowBookModal(true)}
              className="custom_btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 cursor-pointer"
            >
              <i className="bi bi-box-seam"></i>
              Book Crate
            </button>
          </div>
        )}
      </div>

      <BookCrateModal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        eggProduct={eggProduct}
        inStock={inStockCrates}
        rate={Number(companyForm?.rate) || 0}
        onSuccess={() => {
          if (user?.username || user?.phone || user?.email) {
            const usernameParam = user.username || user.phone || user.email
            getTransactions(
              `/transactions?ordering=-createdAt&page_size=10&username=${usernameParam}`,
              setMessage
            )
          }
        }}
      />
    </>
  )
}

export default Dashboard
