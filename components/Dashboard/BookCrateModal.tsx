'use client'
import React, { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import ProductStore, { Product } from '@/src/zustand/Product'
import CompanyStore from '@/src/zustand/app/Company'
import { AuthStore } from '@/src/zustand/user/AuthStore'
import { MessageStore } from '@/src/zustand/notification/Message'
import { formatMoney } from '@/lib/helpers'

export interface BookCrateModalProps {
  isOpen: boolean
  onClose: () => void
  product?: Product
  eggProduct?: Product
  inStock?: number
  rate?: number
  onSuccess?: () => void
}

export interface AvailabilityInfo {
  status: 'invalid' | 'in-stock' | 'future' | 'no-rate'
  dayOfWeek: string
  dateFormatted: string
  daysNeeded: number
  deficit: number
  message: string
}

export function calculateAvailability(
  bookedUnits: number,
  inStock: number,
  rate: number,
  unitName: string = 'Crate'
): AvailabilityInfo {
  const plural = unitName.endsWith('s') ? unitName : `${unitName}s`
  if (bookedUnits <= 0) {
    return {
      status: 'invalid',
      dayOfWeek: '',
      dateFormatted: '',
      daysNeeded: 0,
      deficit: 0,
      message: `Please enter at least 1 ${unitName.toLowerCase()}.`,
    }
  }

  if (bookedUnits <= inStock) {
    return {
      status: 'in-stock',
      dayOfWeek: 'Today',
      dateFormatted: 'Immediate',
      daysNeeded: 0,
      deficit: 0,
      message: 'Available Today (In Stock)',
    }
  }

  const deficit = bookedUnits - inStock
  if (rate <= 0) {
    return {
      status: 'no-rate',
      dayOfWeek: 'Contact Support',
      dateFormatted: '',
      daysNeeded: 0,
      deficit,
      message: `Quantity exceeds stock and daily production/replenishment rate is not configured.`,
    }
  }

  const daysNeeded = Math.ceil(deficit / rate)
  const today = new Date()
  const targetDate = new Date()
  targetDate.setDate(today.getDate() + daysNeeded)

  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]
  const dayOfWeek = daysOfWeek[targetDate.getDay()]
  const dateFormatted = targetDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return {
    status: 'future',
    dayOfWeek,
    dateFormatted,
    daysNeeded,
    deficit,
    message: `Available on ${dayOfWeek} (${dateFormatted})`,
  }
}

export default function BookCrateModal({
  isOpen,
  onClose,
  product,
  eggProduct,
  inStock,
  rate,
  onSuccess,
}: BookCrateModalProps) {
  const currentProduct = product || eggProduct
  const unitName = currentProduct?.purchaseUnit || 'Crate'
  const unitNamePlural = unitName.endsWith('s') ? unitName : `${unitName}s`
  const computedInStock =
    inStock !== undefined
      ? inStock
      : currentProduct
      ? Math.floor((Number(currentProduct.units) || 0) / (Number(currentProduct.unitPerPurchase) || 1))
      : 0
  const computedRate =
    rate !== undefined ? rate : Number(currentProduct?.rate) || 0

  const { user } = AuthStore()
  const { companyForm, getCompany } = CompanyStore()
  const { createTransaction, loading: productLoading } = ProductStore()
  const { setMessage } = MessageStore()

  const [view, setView] = useState<'booking' | 'payment'>('booking')
  const [cratesInput, setCratesInput] = useState<number>(1)
  const [paymentMethod, setPaymentMethod] = useState<'Transfer' | 'Cash' | 'POS'>('Transfer')
  const [receipt, setReceipt] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  useEffect(() => {
    if (isOpen) {
      setView('booking')
      setCratesInput(computedInStock > 0 ? Math.min(computedInStock, 5) : 1)
      setPaymentMethod('Transfer')
      setReceipt(null)
      setPreview('')
      setSubmitting(false)
      setCopied(false)
      if (!companyForm.bankAccountNumber) {
        getCompany('/company', setMessage)
      }
    }
  }, [isOpen, computedInStock])

  const bookedCrates = Math.max(0, Number(cratesInput) || 0)
  const unitPrice = Number(currentProduct?.price) || 0
  const totalPrice = bookedCrates * unitPrice

  const availability = useMemo(
    () => calculateAvailability(bookedCrates, computedInStock, computedRate, unitName),
    [bookedCrates, computedInStock, computedRate, unitName]
  )

  if (!isOpen) return null

  const handleCrateChange = (val: number) => {
    setCratesInput(Math.max(1, val))
  }

  const handleCopyAccount = () => {
    if (companyForm.bankAccountNumber) {
      navigator.clipboard.writeText(companyForm.bankAccountNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null
    setReceipt(file)
    if (file) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview('')
    }
  }

  const handleProceedToPayment = () => {
    if (bookedCrates <= 0) {
      setMessage('Please enter a valid crate amount.', false)
      return
    }
    setView('payment')
  }

  const handleSubmitBooking = async () => {
    if (!user?.username) {
      setMessage('Please sign in to confirm your crate booking.', false)
      return
    }

    if (!currentProduct?._id) {
      setMessage('Product details not found.', false)
      return
    }

    const bookedItem = {
      ...currentProduct,
      cartUnits: bookedCrates,
      purchaseUnit: unitName,
    }

    const form = new FormData()
    form.append('username', user.username)
    form.append('fullName', user.fullName || '')
    form.append('picture', user.picture ? String(user.picture) : '')
    form.append('cartProducts', JSON.stringify([bookedItem]))
    form.append('partPayment', JSON.stringify(0))
    form.append('totalAmount', String(totalPrice))
    if (receipt) {
      form.append('receipt', receipt)
    }
    form.append('payment', paymentMethod)
    form.append('isProfit', 'true')
    form.append('from', 'User')
    form.append('status', 'false')
    form.append('isBooking', 'true')

    setSubmitting(true)
    createTransaction(
      '/transactions?ordering=-createdAt&isBuyable=false',
      form,
      setMessage,
      () => {
        setSubmitting(false)
        setMessage(
          `Booking of ${bookedCrates} ${bookedCrates > 1 ? unitNamePlural : unitName} confirmed via ${paymentMethod}! Available on ${
            availability.status === 'in-stock' ? 'today (in stock)' : availability.dayOfWeek
          }.`,
          true
        )
        if (onSuccess) {
          onSuccess()
        }
        onClose()
      }
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[var(--backgroundColor)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-[var(--text-title-color)] transition-all animate-in zoom-in-95 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {view === 'payment' ? (
              <button
                type="button"
                onClick={() => setView('booking')}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--primary)] transition-colors mr-1 cursor-pointer"
                title="Back to quantity"
              >
                <i className="bi bi-arrow-left text-lg"></i>
              </button>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400 flex items-center justify-center text-xl shrink-0">
                <i className="bi bi-box-seam"></i>
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-[var(--text-title-color)] leading-tight">
                {view === 'booking' ? `Book ${currentProduct?.name || 'Products'}` : 'Complete Payment'}
              </h2>
              <p className="text-xs text-[var(--text-primary)]">
                {view === 'booking'
                  ? `Order ${unitNamePlural.toLowerCase()} with real-time weekly availability`
                  : "Pay into company's account and select payment method"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--primary)] transition-colors cursor-pointer"
          >
            <i className="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {view === 'booking' ? (
            <>
              {/* Product & Stock Summary */}
              <div className="p-3.5 rounded-xl bg-[var(--primary)] border border-[var(--border)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {currentProduct?.picture ? (
                    <Image
                      src={String(currentProduct.picture)}
                      alt={currentProduct.name || 'Product'}
                      width={46}
                      height={46}
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
                      <i className="bi bi-box-seam"></i>
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-sm text-[var(--text-title-color)]">
                      {currentProduct?.name || 'Product'}
                    </div>
                    <div className="text-xs font-bold text-[var(--customColor)]">
                      ₦{formatMoney(unitPrice)}{' '}
                      <span className="font-normal text-[var(--text-primary)]">/ {unitName}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300">
                    <i className="bi bi-check-circle text-[10px]"></i>
                    {formatMoney(computedInStock)} in stock
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div>
                <label className="block text-xs uppercase font-semibold text-[var(--text-primary)] mb-2 tracking-wide">
                  Number of {unitNamePlural} to Book
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCrateChange(bookedCrates - 5)}
                    disabled={bookedCrates <= 5}
                    className="px-3 py-2 text-xs font-semibold rounded-lg bg-[var(--primary)] border border-[var(--border)] hover:bg-[var(--secondaryCustomColor)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-title-color)] transition-colors cursor-pointer"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCrateChange(bookedCrates - 1)}
                    disabled={bookedCrates <= 1}
                    className="w-10 h-10 rounded-lg bg-[var(--primary)] border border-[var(--border)] flex items-center justify-center text-base hover:bg-[var(--secondaryCustomColor)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-title-color)] transition-colors cursor-pointer"
                  >
                    <i className="bi bi-dash-lg"></i>
                  </button>

                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={cratesInput}
                      onChange={(e) => handleCrateChange(parseInt(e.target.value) || 0)}
                      className="w-full text-center text-xl font-bold py-2 px-3 rounded-lg bg-[var(--primary)] border border-[var(--border)] focus:outline-none focus:border-[var(--customColor)] text-[var(--text-title-color)]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCrateChange(bookedCrates + 1)}
                    className="w-10 h-10 rounded-lg bg-[var(--primary)] border border-[var(--border)] flex items-center justify-center text-base hover:bg-[var(--secondaryCustomColor)] text-[var(--text-title-color)] transition-colors cursor-pointer"
                  >
                    <i className="bi bi-plus-lg"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCrateChange(bookedCrates + 5)}
                    className="px-3 py-2 text-xs font-semibold rounded-lg bg-[var(--primary)] border border-[var(--border)] hover:bg-[var(--secondaryCustomColor)] text-[var(--text-title-color)] transition-colors cursor-pointer"
                  >
                    +5
                  </button>
                </div>

                {/* Quick preset chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[5, 10, 20, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleCrateChange(num)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                        bookedCrates === num
                          ? 'bg-[var(--customColor)] text-white border-[var(--customColor)] font-bold'
                          : 'bg-[var(--primary)] text-[var(--text-primary)] border-[var(--border)] hover:text-[var(--text-title-color)]'
                      }`}
                    >
                      {num} {unitNamePlural}
                    </button>
                  ))}
                  {computedInStock > 0 && (
                    <button
                      type="button"
                      onClick={() => handleCrateChange(computedInStock)}
                      className="text-xs px-2.5 py-1 rounded-md bg-[var(--primary)] text-green-600 dark:text-green-400 border border-green-500/30 hover:bg-green-500/10 font-medium ml-auto cursor-pointer"
                    >
                      All in stock ({computedInStock})
                    </button>
                  )}
                </div>
              </div>

              {/* Availability Status Card */}
              {availability.status === 'in-stock' && (
                <div className="rounded-xl p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/60 flex items-start gap-3">
                  <div className="text-green-600 dark:text-green-400 text-2xl shrink-0 mt-0.5">
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-green-800 dark:text-green-300">
                      Available Today (In Stock)
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-400/90 mt-0.5">
                      All {bookedCrates} {bookedCrates > 1 ? unitNamePlural : unitName} {bookedCrates > 1 ? 'are' : 'is'} currently in stock
                      and ready for immediate pickup or dispatch today.
                    </div>
                  </div>
                </div>
              )}

              {availability.status === 'future' && (
                <div className="rounded-xl p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                  <div className="text-amber-600 dark:text-amber-400 text-2xl shrink-0 mt-0.5">
                    <i className="bi bi-calendar-event-fill"></i>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <span>Available on {availability.dayOfWeek}</span>
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                        {availability.dateFormatted}
                      </span>
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-400/90 mt-1">
                      All {bookedCrates} {unitNamePlural} will be available on {availability.dayOfWeek}.
                    </div>
                  </div>
                </div>
              )}

              {availability.status === 'no-rate' && (
                <div className="rounded-xl p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-3">
                  <div className="text-red-600 dark:text-red-400 text-2xl shrink-0 mt-0.5">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-red-800 dark:text-red-300">
                      Exceeds Current Stock
                    </div>
                    <div className="text-xs text-red-700 dark:text-red-400/90 mt-0.5">
                      Only {computedInStock} {unitNamePlural} in stock. Daily production/replenishment rate has not been
                      configured yet for this product.
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing Calculation Summary: Full row on mobile above the green price */}
              <div className="p-4 rounded-xl bg-[var(--primary)] border border-[var(--border)]">
                <div className="w-full text-xs uppercase tracking-wide font-semibold text-[var(--text-primary)] mb-1">
                  Total Booking Amount
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="text-xs text-[var(--text-primary)]">
                    {bookedCrates} {bookedCrates > 1 ? unitNamePlural : unitName} × ₦{formatMoney(unitPrice)}
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1 sm:mt-0">
                    ₦{formatMoney(totalPrice)}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* View: Payment Pop-up with Company Account */
            <>
              {/* Company Bank Account Box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/20 border border-green-200 dark:border-green-800/60">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-green-200/60 dark:border-green-800/40">
                  <div className="flex items-center gap-2">
                    <i className="bi bi-bank text-green-600 dark:text-green-400 text-lg"></i>
                    <span className="text-xs uppercase font-bold text-green-800 dark:text-green-300 tracking-wider">
                      Company Account Details
                    </span>
                  </div>
                  <span className="text-[11px] text-green-700 dark:text-green-400 font-medium">
                    Direct Payment
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-primary)] font-medium">Bank Name:</span>
                    <span className="font-bold text-[var(--text-title-color)]">
                      {companyForm.bankName || 'Farm Official Bank'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-primary)] font-medium">Account Name:</span>
                    <span className="font-bold text-[var(--text-title-color)]">
                      {companyForm.bankAccountName || companyForm.name || 'Farm Account'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-green-200/50 dark:border-green-800/30">
                    <span className="text-[var(--text-primary)] font-medium">Account Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-green-700 dark:text-green-300 tracking-wider">
                        {companyForm.bankAccountNumber || 'Contact Farm Support'}
                      </span>
                      {companyForm.bankAccountNumber && (
                        <button
                          type="button"
                          onClick={handleCopyAccount}
                          className="px-2 py-0.5 text-[11px] rounded bg-green-600 hover:bg-green-700 text-white font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <i className={copied ? 'bi bi-check' : 'bi bi-clipboard'}></i>
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Order Summary: Full row on mobile */}
              <div className="p-4 rounded-xl bg-[var(--primary)] border border-[var(--border)]">
                <div className="w-full text-xs uppercase tracking-wide font-semibold text-[var(--text-primary)] mb-1">
                  Total Booking Amount
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="text-xs text-[var(--text-primary)]">
                    {bookedCrates} crate{bookedCrates > 1 ? 's' : ''} •{' '}
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      {availability.status === 'in-stock'
                        ? 'Available Today'
                        : `Available on ${availability.dayOfWeek}`}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1 sm:mt-0">
                    ₦{formatMoney(totalPrice)}
                  </div>
                </div>
              </div>

              {/* Means of Payment */}
              <div>
                <label className="block text-xs uppercase font-semibold text-[var(--text-primary)] mb-2 tracking-wide">
                  Select Means of Payment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Transfer')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
                      paymentMethod === 'Transfer'
                        ? 'border-green-600 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 ring-2 ring-green-600/20'
                        : 'border-[var(--border)] bg-[var(--primary)] text-[var(--text-primary)] hover:border-[var(--customColor)]'
                    }`}
                  >
                    <i className="bi bi-bank text-xl"></i>
                    <span>Transfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
                      paymentMethod === 'Cash'
                        ? 'border-green-600 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 ring-2 ring-green-600/20'
                        : 'border-[var(--border)] bg-[var(--primary)] text-[var(--text-primary)] hover:border-[var(--customColor)]'
                    }`}
                  >
                    <i className="bi bi-cash-stack text-xl"></i>
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('POS')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
                      paymentMethod === 'POS'
                        ? 'border-green-600 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 ring-2 ring-green-600/20'
                        : 'border-[var(--border)] bg-[var(--primary)] text-[var(--text-primary)] hover:border-[var(--customColor)]'
                    }`}
                  >
                    <i className="bi bi-credit-card-2-front text-xl"></i>
                    <span>POS</span>
                  </button>
                </div>
              </div>

              {/* Receipt Upload (Optional for Transfer & POS) */}
              {(paymentMethod === 'Transfer' || paymentMethod === 'POS') && (
                <div className="p-3.5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--primary)]">
                  <label className="block text-xs font-semibold text-[var(--text-title-color)] mb-1.5">
                    Upload Payment Receipt / Proof (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-xs text-[var(--text-primary)] file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 cursor-pointer"
                  />
                  {preview && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <Image
                        src={preview}
                        alt="Receipt preview"
                        width={50}
                        height={50}
                        className="rounded-lg object-cover border border-[var(--border)]"
                      />
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Receipt attached
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between gap-3 bg-[var(--primary)] shrink-0">
          {view === 'booking' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--secondaryCustomColor)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={bookedCrates <= 0}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white flex items-center gap-2 shadow-lg shadow-green-600/20 transition-all cursor-pointer ml-auto"
              >
                <span>Proceed to Payment</span>
                <i className="bi bi-arrow-right"></i>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setView('booking')}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--secondaryCustomColor)] transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmitBooking}
                disabled={submitting || productLoading}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white flex items-center gap-2 shadow-lg shadow-green-600/20 transition-all cursor-pointer ml-auto"
              >
                {submitting ? (
                  <>
                    <i className="bi bi-hourglass-split animate-spin"></i>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle"></i>
                    <span>Confirm Booking ({paymentMethod})</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
