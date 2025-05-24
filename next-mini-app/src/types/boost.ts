export interface Boost {
  id: string
  user_id: string
  username: string
  level_at_purchase: number
  quantity_remaining: number
  is_active: boolean
  purchased_at: string
  price_paid: number
  transaction_hash: string
  created_at: string
}

export interface BoostUsage {
  id: string
  boost_id: string
  user_id: string
  username: string
  used_at: string
  claim_amount_base: number
  claim_amount_boosted: number
  created_at: string
}

export interface PurchaseBoostRequest {
  wallet_address: string
  username: string
  level: number
  quantity: number
  price_paid: number
  transaction_hash: string
}

export interface BoostResponse {
  success: boolean
  total_boosts: number
  has_active_boost: boolean
  boosts: Boost[]
}
export interface Boost {
  id: string
  user_id: string
  username: string
  level_at_purchase: number
  quantity_remaining: number
  is_active: boolean
  purchased_at: string
  price_paid: number
  transaction_hash: string
  created_at: string
}

export interface BoostUsage {
  id: string
  boost_id: string
  user_id: string
  username: string
  used_at: string
  claim_amount_base: number
  claim_amount_boosted: number
  created_at: string
}

export interface PurchaseBoostRequest {
  wallet_address: string
  username: string
  level: number
  quantity: number
  price_paid: number
  transaction_hash: string
}

export interface BoostResponse {
  success: boolean
  total_boosts: number
  has_active_boost: boolean
  boosts: Boost[]
}
