'use client'
import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthStore } from '@/src/zustand/user/AuthStore'
import { PageHeader } from '@/components/Public/PageBanner'

export default function CheckOut() {
  const { user } = AuthStore()
  const router = useRouter()

  useEffect(() => {
    const target = user ? '/dashboard/products' : '/sign-in'
    const timer = setTimeout(() => {
      router.replace(target)
    }, 1500)
    return () => clearTimeout(timer)
  }, [user, router])

  return (
    <div>
      <PageHeader page="Booking & Purchasing" title="Farm Products Booking" />
      <div className="flex py-[100px] justify-center bg-[var(--backgroundColor)]">
        <div className="customContainer">
          <div className="flex flex-col items-center text-center max-w-lg mx-auto p-8 rounded-2xl bg-white shadow-sm border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl mb-4">
              <i className="bi bi-box-seam"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Book Products via Dashboard
            </h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Product purchase and booking with real-time weekly availability calculation is now conducted directly in the Customer Dashboard.
            </p>
            <Link
              href={user ? '/dashboard/products' : '/sign-in'}
              className="custom_btn bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-sm transition-all"
            >
              {user ? 'Go to Dashboard Products' : 'Sign In to Book'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
