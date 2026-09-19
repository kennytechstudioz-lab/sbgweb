import { create } from 'zustand'
import apiRequest from '@/lib/axios'

export interface Company {
  _id: string
  name: string
  domain: string
  finalInstruction: string
  email: string
  documents: string
  phone: string
  allowSignUp: boolean
  allowApplicant: boolean
  headquaters: string
  bankAccountName: string
  bankAccountNumber: string
  bankName: string
  authCode: string
  rate: number
}

export const CompanyEmpty = {
  _id: '',
  name: '',
  domain: '',
  finalInstruction: '',
  email: '',
  documents: '',
  phone: '',
  allowSignUp: false,
  allowApplicant: false,
  headquaters: '',
  bankAccountNumber: '',
  bankAccountName: '',
  bankName: '',
  authCode: '',
  rate: 0,
}

interface FetchResponse {
  message: string
  count: number
  page_size: number
  results: Company[]
  company: Company
}

interface CompanyState {
  links: { next: string | null; previous: string | null } | null
  count: number
  page_size: number
  results: Company[]
  loading: boolean
  error: string | null
  successs?: string | null
  selectedItems: Company[]
  searchResult: Company[]
  searchedResults: Company[]
  isAllChecked: boolean
  companyForm: Company
  setForm: (key: keyof Company, value: Company[keyof Company]) => void
  resetForm: () => void
  updateItem: (
    url: string,
    updatedItem: FormData,
    setMessage: (message: string, isError: boolean) => void
  ) => Promise<void>
  resetAll: (
    url: string,
    updatedItem: Record<string, unknown>,
    setMessage: (message: string, isError: boolean) => void
  ) => Promise<void>
  getCompany: (
    url: string,
    setMessage: (message: string, isError: boolean) => void
  ) => Promise<void>
}

const CompanyStore = create<CompanyState>((set) => ({
  links: null,
  count: 0,
  page_size: 0,
  results: [],
  loading: false,
  error: null,
  selectedItems: [],
  searchResult: [],
  searchedResults: [],
  isAllChecked: false,
  companyForm: CompanyEmpty,
  setForm: (key, value) =>
    set((state) => ({
      companyForm: {
        ...state.companyForm,
        [key]: value,
      },
    })),
  resetForm: () =>
    set({
      companyForm: CompanyEmpty,
    }),

  updateItem: async (
    url,
    updatedItem,
    setMessage
  ) => {
    try {
      set({ loading: true })
      const response = await apiRequest<FetchResponse>(url, {
        method: 'PATCH',
        body: updatedItem,
        setMessage,
      })
      const data = response.data
      if (data.company) {
        set({
          companyForm: {
            ...CompanyEmpty,
            ...data.company,
            name: data.company.name ?? '',
            domain: data.company.domain ?? '',
            finalInstruction: data.company.finalInstruction ?? '',
            email: data.company.email ?? '',
            documents: data.company.documents ?? '',
            phone: data.company.phone ?? '',
            headquaters: data.company.headquaters ?? '',
            bankAccountNumber: data.company.bankAccountNumber ?? '',
            bankAccountName: data.company.bankAccountName ?? '',
            bankName: data.company.bankName ?? '',
            authCode: data.company.authCode ?? '',
            rate: data.company.rate ?? 0,
          },
          loading: false,
        })
      }
    } catch (error) {
      console.log(error)
    } finally {
      set({ loading: false })
    }
  },

  resetAll: async (
    url,
    updatedItem,
    setMessage
  ) => {
    try {
      set({ loading: true })
      await apiRequest<FetchResponse>(url, {
        method: 'PATCH',
        body: updatedItem,
        setMessage,
      })

    } catch (error) {
      console.log(error)
    } finally {
      set({ loading: false })
    }
  },

  getCompany: async (url, setMessage) => {
    set({ loading: true })
    const response = await apiRequest<FetchResponse>(url, {
      method: 'GET',
      setMessage,
    })
    const data = response.data
    if (data && data.company) {
      set({
        loading: false,
        companyForm: {
          ...CompanyEmpty,
          ...data.company,
          name: data.company.name ?? '',
          domain: data.company.domain ?? '',
          finalInstruction: data.company.finalInstruction ?? '',
          email: data.company.email ?? '',
          documents: data.company.documents ?? '',
          phone: data.company.phone ?? '',
          headquaters: data.company.headquaters ?? '',
          bankAccountNumber: data.company.bankAccountNumber ?? '',
          bankAccountName: data.company.bankAccountName ?? '',
          bankName: data.company.bankName ?? '',
          authCode: data.company.authCode ?? '',
          rate: data.company.rate ?? 0,
        },
      })
    } else {
      set({ loading: false })
    }
  },
}))

export default CompanyStore
