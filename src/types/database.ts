export interface Profile {
  id: string
  full_name: string
  phone: string
  role: 'student' | 'admin'
  created_at: string
}

export interface Section {
  id: string
  name: string
  description: string | null
  image: string | null
  created_at: string
}

export interface Subject {
  id: string
  section_id: string
  name: string
  description: string | null
  image: string | null
  created_at: string
}

export interface Teacher {
  id: string
  subject_id: string
  name: string
  image: string | null
  description: string | null
  created_at: string
}

export interface Product {
  id: string
  teacher_id: string
  title: string
  description: string | null
  price: number
  image: string | null
  is_reusable: boolean
  created_at: string
}

export interface Code {
  id: string
  product_id: string
  code: string
  status: 'unused' | 'sold'
  sold_to: string | null
  sold_at: string | null
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  product_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface Payment {
  id: string
  order_id: string
  user_id: string
  amount: number
  method: 'instapay' | 'vodafone_cash'
  screenshot_url: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}
