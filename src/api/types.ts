// Tipos que reflejan los DTOs del backend TrueShop.Api (JSON en camelCase).

export interface AuthResponse {
  token: string
  userId: number
  email: string
  fullName: string
  role: string
}

export interface Variant {
  id: number
  size: string
  color: string
  sku: string
  stockQuantity: number
}

export interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: number
  brand: string
  material: string
  imageUrl: string
  isActive: boolean
  categoryId: number
  categoryName: string
  variants: Variant[]
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
}

export interface PagedResult<T> {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  items: T[]
}

export interface CartItem {
  id: number
  productVariantId: number
  productId: number
  productName: string
  size: string
  color: string
  imageUrl: string
  unitPrice: number
  quantity: number
  availableStock: number
  lineTotal: number
}

export interface Cart {
  id: number
  items: CartItem[]
  totalItems: number
  total: number
}

export interface OrderItem {
  productVariantId: number
  productName: string
  size: string
  color: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface Order {
  id: number
  status: string
  total: number
  createdAt: string
  shippingFullName: string
  shippingAddressLine: string
  shippingCity: string
  shippingState: string
  shippingZipCode: string
  shippingPhone: string
  items: OrderItem[]
}

export interface ProductFilters {
  search?: string
  categoryId?: number
  size?: string
  minPrice?: number
  maxPrice?: number
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name'
  page?: number
  pageSize?: number
}

export interface ShippingInfo {
  shippingFullName: string
  shippingAddressLine: string
  shippingCity: string
  shippingState: string
  shippingZipCode: string
  shippingPhone: string
}
