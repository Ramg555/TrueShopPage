import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartApi } from '@/api/services'
import { getErrorMessage } from '@/api/client'
import type { Cart } from '@/api/types'

export const useCartStore = defineStore('cart', () => {
  const cart = ref<Cart | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const itemCount = computed(() => cart.value?.totalItems ?? 0)
  const items = computed(() => cart.value?.items ?? [])
  const total = computed(() => cart.value?.total ?? 0)
  const isEmpty = computed(() => items.value.length === 0)

  async function load() {
    loading.value = true
    error.value = null
    try {
      cart.value = await cartApi.get()
    } catch (e) {
      error.value = getErrorMessage(e)
    } finally {
      loading.value = false
    }
  }

  async function add(productVariantId: number, quantity = 1) {
    error.value = null
    try {
      cart.value = await cartApi.addItem(productVariantId, quantity)
    } catch (e) {
      error.value = getErrorMessage(e)
      throw e
    }
  }

  async function update(itemId: number, quantity: number) {
    error.value = null
    try {
      cart.value = await cartApi.updateItem(itemId, quantity)
    } catch (e) {
      error.value = getErrorMessage(e)
      throw e
    }
  }

  async function remove(itemId: number) {
    error.value = null
    try {
      cart.value = await cartApi.removeItem(itemId)
    } catch (e) {
      error.value = getErrorMessage(e)
      throw e
    }
  }

  async function clear() {
    error.value = null
    try {
      await cartApi.clear()
      cart.value = cart.value ? { ...cart.value, items: [], totalItems: 0, total: 0 } : null
    } catch (e) {
      error.value = getErrorMessage(e)
      throw e
    }
  }

  function reset() {
    cart.value = null
    error.value = null
  }

  return {
    cart,
    loading,
    error,
    itemCount,
    items,
    total,
    isEmpty,
    load,
    add,
    update,
    remove,
    clear,
    reset,
  }
})
