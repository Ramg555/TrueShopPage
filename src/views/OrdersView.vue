<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ordersApi } from '@/api/services'
import { getErrorMessage } from '@/api/client'
import type { Order } from '@/api/types'
import { formatPrice, formatDate, orderStatusMeta } from '@/utils/format'

const route = useRoute()
const orders = ref<Order[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const createdId = computed(() => route.query.created as string | undefined)

onMounted(async () => {
  try {
    orders.value = await ordersApi.listMine()
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <v-container class="py-10">
    <h1 class="font-display text-h4 font-weight-bold mb-8">Mis pedidos</h1>

    <v-alert
      v-if="createdId"
      type="success"
      variant="tonal"
      class="mb-6"
      icon="mdi-check-circle-outline"
    >
      ¡Gracias por tu compra! Tu pedido <strong>#{{ createdId }}</strong> fue creado correctamente.
    </v-alert>

    <div v-if="loading" class="py-16 text-center">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-alert v-else-if="error" type="error" variant="tonal">{{ error }}</v-alert>

    <div v-else-if="!orders.length" class="text-center py-16">
      <v-icon size="56" class="mb-4 text-medium-emphasis">mdi-package-variant</v-icon>
      <div class="text-h6 mb-2">Aún no tienes pedidos</div>
      <p class="text-body-2 text-medium-emphasis mb-6">Cuando compres algo, aparecerá aquí.</p>
      <v-btn color="primary" variant="flat" to="/products">Ir a la tienda</v-btn>
    </div>

    <v-expansion-panels v-else variant="accordion" multiple>
      <v-expansion-panel v-for="order in orders" :key="order.id" elevation="0">
        <v-expansion-panel-title>
          <div class="d-flex align-center justify-space-between flex-grow-1 mr-4 flex-wrap ga-2">
            <div>
              <span class="font-weight-bold">Pedido #{{ order.id }}</span>
              <span class="text-caption text-medium-emphasis ml-2">{{ formatDate(order.createdAt) }}</span>
            </div>
            <div class="d-flex align-center ga-3">
              <v-chip
                :color="orderStatusMeta(order.status).color"
                size="small"
                variant="tonal"
              >
                {{ orderStatusMeta(order.status).label }}
              </v-chip>
              <span class="font-weight-bold">{{ formatPrice(order.total) }}</span>
            </div>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div
            v-for="(item, i) in order.items"
            :key="i"
            class="d-flex justify-space-between py-2 text-body-2"
          >
            <span class="text-medium-emphasis">
              {{ item.quantity }}× {{ item.productName }}
              <span class="text-caption">({{ item.size }}/{{ item.color }})</span>
            </span>
            <span>{{ formatPrice(item.lineTotal) }}</span>
          </div>

          <v-divider class="my-3" />

          <div class="text-caption text-medium-emphasis">
            <v-icon size="16" class="mr-1">mdi-map-marker-outline</v-icon>
            {{ order.shippingFullName }} — {{ order.shippingAddressLine }},
            {{ order.shippingCity }}<template v-if="order.shippingState">, {{ order.shippingState }}</template>
            {{ order.shippingZipCode }}
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>
