'use client'
import Image from 'next/image'
import Link from 'next/link'
import ProductStore from '@/src/zustand/Product'
import { AuthStore } from '@/src/zustand/user/AuthStore'
import { formatMoney } from '@/lib/helpers'

export default function Products() {
  const { products } = ProductStore()
  const { user } = AuthStore()

  return (
    <>
      <div className="grid lg:grid-cols-4 md:grid-cols-3 grid-cols-2 w-full gap-4 mb-9">
        {products.map((item, index) => {
          const unitLabel = item.purchaseUnit || 'unit'
          return (
            <div
              key={index}
              className="flex flex-col items-center justify-between shadow-[0_2px_6px_rgba(0,0,0,0.1)] rounded-[15px] bg-[var(--backgroundColor)] p-3 md:p-6 transition-all hover:shadow-md"
            >
              <div className="w-full flex flex-col items-center">
                <Image
                  src={item.picture ? String(item.picture) : '/images/page-header.jpg'}
                  sizes="100vw"
                  className="sm:h-[180px] h-[100px] w-full object-contain mb-4"
                  width={0}
                  height={0}
                  alt={item.name || 'Product'}
                />
                <div className="flex mb-1 md:text-[18px] text-[15px]">
                  <i className="bi bi-star text-[var(--customColor)] mr-1"></i>
                  <i className="bi bi-star text-[var(--customColor)] mr-1"></i>
                  <i className="bi bi-star text-[var(--customColor)] mr-1"></i>
                  <i className="bi bi-star text-[var(--customColor)] mr-1"></i>
                  <i className="bi bi-star text-[var(--customColor)]"></i>
                </div>
                <div className="text-[var(--primaryTextColor)] md:text-[20px] text-base font-bold mb-1 text-center line-clamp-1">
                  {item.name}
                </div>
                <div className="flex justify-center mb-3">
                  <div className="text-[var(--customColor)] text-base md:text-lg font-bold">
                    ₦{formatMoney(item.price)}{' '}
                    <span className="text-xs font-normal text-[var(--secondaryTextColor)]">/ {unitLabel}</span>
                  </div>
                </div>
              </div>

              <Link
                href={user ? '/dashboard/products' : '/sign-in'}
                className="w-full text-center py-2 px-3 rounded-lg text-xs md:text-sm font-semibold bg-[var(--customColor)] hover:opacity-90 text-white transition-all flex items-center justify-center gap-1.5"
              >
                <i className="bi bi-box-seam"></i>
                Book / Purchase
              </Link>
            </div>
          )
        })}
      </div>
    </>
  )
}
