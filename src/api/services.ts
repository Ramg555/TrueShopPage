import apiClient from './client'
import type {
  AuthResponse,
  Cart,
  Category,
  Order,
  PagedResult,
  Product,
  ProductFilters,
  ShippingInfo,
} from './types'

// ── Auth ──
export const authApi = {
  login(email: string, password: string) {
    return apiClient.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data)
  },
  register(email: string, password: string, fullName: string) {
    return apiClient
      .post<AuthResponse>('/auth/register', { email, password, fullName })
      .then((r) => r.data)
  },
}

// ── Catálogo ──
export const catalogApi = {
  listProducts(filters: ProductFilters = {}) {
    return apiClient
      .get<PagedResult<Product>>('/products', { params: filters })
      .then((r) => r.data)
  },
  getProduct(id: number) {
    return apiClient.get<Product>(`/products/${id}`).then((r) => r.data)
  },
  listCategories() {
    return apiClient.get<Category[]>('/categories').then((r) => r.data)
  },
}

// ── Carrito ──
export const cartApi = {
  get() {
    return apiClient.get<Cart>('/cart').then((r) => r.data)
  },
  addItem(productVariantId: number, quantity: number) {
    return apiClient.post<Cart>('/cart/items', { productVariantId, quantity }).then((r) => r.data)
  },
  updateItem(itemId: number, quantity: number) {
    return apiClient.put<Cart>(`/cart/items/${itemId}`, { quantity }).then((r) => r.data)
  },
  removeItem(itemId: number) {
    return apiClient.delete<Cart>(`/cart/items/${itemId}`).then((r) => r.data)
  },
  clear() {
    return apiClient.delete('/cart')
  },
}

// ── Pedidos ──
export const ordersApi = {
  create(shipping: ShippingInfo) {
    return apiClient.post<Order>('/orders', shipping).then((r) => r.data)
  },
  listMine() {
    return apiClient.get<Order[]>('/orders').then((r) => r.data)
  },
  get(id: number) {
    return apiClient.get<Order>(`/orders/${id}`).then((r) => r.data)
  },
}
