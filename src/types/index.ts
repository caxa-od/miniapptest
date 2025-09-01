// Типы для Telegram Web App
export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

export interface TelegramThemeParams {
  bg_color?: string
  text_color?: string
  hint_color?: string
  link_color?: string
  button_color?: string
  button_text_color?: string
  secondary_bg_color?: string
}

// Типы для автострахования
export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin?: string
  licensePlate: string
  engineVolume: number
  enginePower: number
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid'
  bodyType: 'sedan' | 'hatchback' | 'suv' | 'coupe' | 'wagon' | 'pickup'
  transmission: 'manual' | 'automatic'
  value: number
}

export interface Driver {
  id: string
  firstName: string
  lastName: string
  birthDate: string
  licenseNumber: string
  licenseIssueDate: string
  experience: number
  accidentHistory: number
  hasViolations: boolean
}

export interface InsurancePolicy {
  id: string
  policyNumber: string
  vehicle: Vehicle
  driver: Driver
  type: 'osago' | 'kasko' | 'voluntary'
  startDate: string
  endDate: string
  premium: number
  coverage: {
    propertyDamage: number
    personalInjury: number
    theft?: boolean
    naturalDisasters?: boolean
    vandalism?: boolean
  }
  status: 'active' | 'expired' | 'cancelled' | 'pending'
  paymentStatus: 'paid' | 'pending' | 'overdue'
}

export interface Claim {
  id: string
  policyId: string
  claimNumber: string
  incidentDate: string
  reportDate: string
  type: 'accident' | 'theft' | 'damage' | 'natural_disaster'
  description: string
  damageEstimate: number
  status: 'reported' | 'investigating' | 'approved' | 'rejected' | 'closed'
  documents: ClaimDocument[]
  photos: string[]
}

export interface ClaimDocument {
  id: string
  type: 'police_report' | 'medical_report' | 'repair_estimate' | 'other'
  name: string
  url: string
  uploadDate: string
}

export interface CalculatorParams {
  vehicle: Partial<Vehicle>
  driver: Partial<Driver>
  coverageOptions: {
    osago: boolean
    kasko: boolean
    propertyDamageLimit: number
    personalInjuryLimit: number
    deductible: number
    additionalOptions: string[]
  }
  region: string
  parkingType: 'garage' | 'yard' | 'street'
}

export interface CalculatorResult {
  osagoPremium?: number
  kaskoPremium?: number
  totalPremium: number
  breakdown: {
    basePremium: number
    ageCoefficient: number
    experienceCoefficient: number
    regionCoefficient: number
    vehicleCoefficient: number
    discounts: number
    taxes: number
  }
  recommendations: string[]
}
