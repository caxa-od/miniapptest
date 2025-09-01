import axios from 'axios'
import type { 
  CalculatorParams, 
  CalculatorResult, 
  InsurancePolicy, 
  Claim,
  Vehicle,
  Driver 
} from '@/types'

// Базовый URL API (в продакшене заменить на реальный)
const API_BASE_URL = process.env.VITE_API_URL || 'https://api.example.com'

// Создаем экземпляр axios с базовыми настройками
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Интерсептор для добавления токена аутентификации
api.interceptors.request.use((config) => {
  // Получаем данные из Telegram Web App
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
    config.headers.Authorization = `tma ${(window as any).Telegram.WebApp.initData}`
  }
  return config
})

// Интерсептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    
    if (error.response?.status === 401) {
      // Обработка ошибки аутентификации
      console.log('Authentication error')
    }
    
    return Promise.reject(error)
  }
)

export const insuranceApi = {
  // Калькулятор страхования
  calculateInsurance: async (params: CalculatorParams): Promise<CalculatorResult> => {
    const response = await api.post('/calculator/calculate', params)
    return response.data
  },

  // Управление полисами
  getPolicies: async (): Promise<InsurancePolicy[]> => {
    const response = await api.get('/policies')
    return response.data
  },

  getPolicy: async (id: string): Promise<InsurancePolicy> => {
    const response = await api.get(`/policies/${id}`)
    return response.data
  },

  createPolicy: async (policyData: Partial<InsurancePolicy>): Promise<InsurancePolicy> => {
    const response = await api.post('/policies', policyData)
    return response.data
  },

  updatePolicy: async (id: string, updates: Partial<InsurancePolicy>): Promise<InsurancePolicy> => {
    const response = await api.patch(`/policies/${id}`, updates)
    return response.data
  },

  // Управление заявками (claims)
  getClaims: async (): Promise<Claim[]> => {
    const response = await api.get('/claims')
    return response.data
  },

  getClaim: async (id: string): Promise<Claim> => {
    const response = await api.get(`/claims/${id}`)
    return response.data
  },

  createClaim: async (claimData: Partial<Claim>): Promise<Claim> => {
    const response = await api.post('/claims', claimData)
    return response.data
  },

  updateClaim: async (id: string, updates: Partial<Claim>): Promise<Claim> => {
    const response = await api.patch(`/claims/${id}`, updates)
    return response.data
  },

  // Загрузка документов
  uploadDocument: async (claimId: string, file: File): Promise<{ url: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('claimId', claimId)

    const response = await api.post('/claims/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Данные автомобилей
  getVehicleInfo: async (vin?: string, licensePlate?: string): Promise<Partial<Vehicle>> => {
    const params = new URLSearchParams()
    if (vin) params.append('vin', vin)
    if (licensePlate) params.append('licensePlate', licensePlate)

    const response = await api.get(`/vehicles/info?${params}`)
    return response.data
  },

  // Справочники
  getCarMakes: async (): Promise<string[]> => {
    const response = await api.get('/reference/car-makes')
    return response.data
  },

  getCarModels: async (make: string): Promise<string[]> => {
    const response = await api.get(`/reference/car-models?make=${make}`)
    return response.data
  },

  getRegions: async (): Promise<Array<{ code: string; name: string }>> => {
    const response = await api.get('/reference/regions')
    return response.data
  },

  // Профиль пользователя
  getUserProfile: async (): Promise<Driver> => {
    const response = await api.get('/profile')
    return response.data
  },

  updateUserProfile: async (updates: Partial<Driver>): Promise<Driver> => {
    const response = await api.patch('/profile', updates)
    return response.data
  },

  // Платежи
  createPayment: async (policyId: string, amount: number): Promise<{ paymentUrl: string }> => {
    const response = await api.post('/payments/create', {
      policyId,
      amount,
    })
    return response.data
  },

  getPaymentStatus: async (paymentId: string): Promise<{ status: string }> => {
    const response = await api.get(`/payments/${paymentId}/status`)
    return response.data
  },
}

export default api
