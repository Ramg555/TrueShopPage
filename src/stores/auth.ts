import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/services'
import type { AuthResponse } from '@/api/types'

interface StoredUser {
  userId: number
  email: string
  fullName: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<StoredUser | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'Admin')
  const displayName = computed(() => user.value?.fullName ?? '')

  function persist(data: AuthResponse) {
    token.value = data.token
    user.value = {
      userId: data.userId,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
    }
    localStorage.setItem('ts_token', data.token)
    localStorage.setItem('ts_user', JSON.stringify(user.value))
  }

  /** Rehidrata sesión desde localStorage al iniciar la app. */
  function restore() {
    const t = localStorage.getItem('ts_token')
    const u = localStorage.getItem('ts_user')
    if (t && u) {
      token.value = t
      try {
        user.value = JSON.parse(u)
      } catch {
        user.value = null
      }
    }
  }

  async function login(email: string, password: string) {
    const data = await authApi.login(email, password)
    persist(data)
  }

  async function register(email: string, password: string, fullName: string) {
    const data = await authApi.register(email, password, fullName)
    persist(data)
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('ts_token')
    localStorage.removeItem('ts_user')
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    displayName,
    restore,
    login,
    register,
    logout,
  }
})
