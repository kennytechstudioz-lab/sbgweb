'use client'
import { initializeSound } from '@/lib/sound'
import useSocket from '@/src/useSocket'
import ConsumptionStore, { Consumption } from '@/src/zustand/Consumption'
import ExpenseStore, { Expense } from '@/src/zustand/Expenses'
import { MessageStore } from '@/src/zustand/notification/Message'
import StockingStore, { Stocking } from '@/src/zustand/Stocking'
import TransactionStore, { Transaction } from '@/src/zustand/Transaction'
import ProductStore from '@/src/zustand/Product'
import { createContext, useEffect, useContext, ReactNode, useMemo } from 'react'

const GeneralContext = createContext<{
  socket: ReturnType<typeof useSocket> | null
}>({
  socket: null,
})

interface GeneralProviderProps {
  children: ReactNode
}

export const GeneralProvider = ({ children }: GeneralProviderProps) => {
  const socket = useSocket()
  const { setBaseUrl } = MessageStore()

  useEffect(() => {
    initializeSound()
    const url =
      process.env.NODE_ENV === 'production'
        ? process.env.NEXT_PUBLIC_PROD_API_URL
        : process.env.NEXT_PUBLIC_DEV_API_URL
    setBaseUrl(String(url))
  }, [])


  useEffect(() => {
    if (!socket) return;

    socket.on("consumption", (data: { consumption: Consumption }) => {
      if (data.consumption) {
        ConsumptionStore.setState(prev => {
          return {
            latestConsumptions: [data.consumption, ...prev.latestConsumptions]
          }
        })
      }
    });
    socket.on("expenses", (data: { expenses: Expense }) => {
      if (data.expenses) {
        ExpenseStore.setState(prev => {
          return {
            latestExpenses: [data.expenses, ...prev.latestExpenses]
          }
        })
      }
    });
    socket.on("stocking", (data: { production: Stocking, stocking: Stocking }) => {
      if (data.production) {
        StockingStore.setState(prev => {
          return {
            latestProductions: [data.production, ...prev.latestProductions]
          }
        })
        StockingStore.setState(prev => {
          return {
            latestStocks: prev.latestStocks.map((e) => e._id === data.stocking.productId ? { ...e, units: data.stocking.units } : e)
          }
        })
        ProductStore.setState(prev => ({
          products: prev.products.map((p) => p._id === data.stocking.productId ? { ...p, units: data.stocking.units } : p)
        }))
      }
    });
    socket.on("stock_update", (data: { productId?: string; units?: number; products?: any[] }) => {
      if (data?.products && Array.isArray(data.products)) {
        // Only patch units of existing products in the store
        // Never replace the full array (avoids non-selling products flashing in)
        ProductStore.setState(prev => ({
          products: prev.products.map(p => {
            const updated = data.products!.find((dp: any) => dp._id === p._id)
            return updated ? { ...p, units: updated.units } : p
          })
        }))
      } else if (data?.productId !== undefined) {
        ProductStore.setState(prev => ({
          products: prev.products.map(p => p._id === data.productId ? { ...p, units: data.units! } : p)
        }))
      }
    });
    socket.on("motality", (data: { stocking: Stocking }) => {
      if (data.stocking) {
        StockingStore.setState(prev => {
          return {
            latestMortalities: [data.stocking, ...prev.latestMortalities]
          }
        })
      }
    });
    socket.on("transaction", (data: { transaction: Transaction }) => {
      if (data.transaction) {
        // Update the latest list (used on dashboard homepage)
        TransactionStore.setState(prev => ({
          latest: [data.transaction, ...prev.latest]
        }))
        // Also prepend into admin trx list so it appears instantly without refresh
        TransactionStore.setState(prev => {
          const alreadyExists = prev.trx.some(t => t._id === data.transaction._id)
          if (alreadyExists) return prev
          const newTrx = [data.transaction, ...prev.trx]
          const pendingCount = newTrx.filter(t => !t.status).length
          return {
            trx: newTrx,
            transactions: [{ ...data.transaction, isChecked: false, isActive: false }, ...prev.transactions],
            count: prev.count + 1,
            pendingCount,
          }
        })
      }
    });
    socket.on("transaction_deleted", (data: { ids: string[] }) => {
      if (data?.ids?.length) {
        TransactionStore.setState(prev => {
          const newTrx = prev.trx.filter(t => !data.ids.includes(t._id))
          const newTransactions = prev.transactions.filter(t => !data.ids.includes(t._id))
          const newUser = prev.userTransactions.filter(t => !data.ids.includes(t._id))
          const pendingCount = newTrx.filter(t => !t.status).length
          return {
            trx: newTrx,
            transactions: newTransactions,
            userTransactions: newUser,
            count: Math.max(0, prev.count - data.ids.length),
            pendingCount,
          }
        })
      }
    });
    socket.on("transaction_updated", (data: { transaction: Transaction }) => {
      if (data.transaction) {
        // Update status in userTransactions (user dashboard) in real-time
        TransactionStore.setState(prev => ({
          userTransactions: prev.userTransactions.map(t =>
            t._id === data.transaction._id ? { ...t, ...data.transaction } : t
          ),
          // Also update admin trx list
          trx: prev.trx.map(t =>
            t._id === data.transaction._id ? { ...t, ...data.transaction } : t
          ),
          transactions: prev.transactions.map(t =>
            t._id === data.transaction._id ? { ...t, ...data.transaction } : t
          ),
        }))
      }
    });
    return () => {
      socket.off("stocking");
      socket.off("stock_update");
      socket.off("motality");
      socket.off("expenses");
      socket.off("consumption");
      socket.off("transaction");
      socket.off("transaction_deleted");
      socket.off("transaction_updated");
    };
  }, [socket]);

  const value = useMemo(() => ({ socket }), [socket])

  return (
    <GeneralContext.Provider value={value}>{children}</GeneralContext.Provider>
  )
}

export const useGeneralContext = () => useContext(GeneralContext)
