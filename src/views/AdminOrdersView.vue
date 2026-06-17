<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { adminApi } from '@/api/services'
import { getErrorMessage } from '@/api/client'
import type { Order } from '@/api/types'
import { formatPrice, formatDate, orderStatusMeta, ORDER_STATUSES } from '@/utils/format'

const orders = ref<Order[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const statusFilter = ref<string | null>(null)
// Estado elegido por pedido (borrador), comparado contra el estado real para habilitar "Guardar".
const drafts = reactive<Record<number, string>>({})
// Ids de pedidos guardándose ahora (soporta guardados concurrentes en distintos pedidos).
const savingIds = reactive(new Set<number>())

const snackbar = ref(false)
const snackText = ref('')
const snackColor = ref<'success' | 'error'>('success')

// Tipados explícitos como string para que el v-model del v-select (string) sea compatible.
const filterItems: { title: string; value: string | null }[] = [
  { title: 'Todos', value: null },
  ...ORDER_STATUSES.map((s) => ({ title: orderStatusMeta(s).label, value: s })),
]
const statusItems: { title: string; value: string }[] = ORDER_STATUSES.map((s) => ({
  title: orderStatusMeta(s).label,
  value: s,
}))

function notify(text: string, color: 'success' | 'error' = 'success') {
  snackText.value = text
  snackColor.value = color
  snackbar.value = true
}

// Secuencia para descartar respuestas obsoletas si el filtro cambia rápido.
let fetchSeq = 0

async function fetchOrders() {
  loading.value = true
  error.value = null
  const seq = ++fetchSeq
  try {
    const data = await adminApi.listAllOrders(statusFilter.value ?? undefined)
    if (seq !== fetchSeq) return
    orders.value = data
    for (const o of orders.value) drafts[o.id] = o.status
  } catch (e) {
    if (seq !== fetchSeq) return
    error.value = getErrorMessage(e, 'No se pudieron cargar los pedidos.')
  } finally {
    if (seq === fetchSeq) loading.value = false
  }
}

async function saveStatus(order: Order) {
  const next = drafts[order.id]
  if (next === order.status || savingIds.has(order.id)) return
  savingIds.add(order.id)
  try {
    const updated = await adminApi.updateOrderStatus(order.id, next)
    const i = orders.value.findIndex((o) => o.id === order.id)
    if (i !== -1) orders.value[i] = updated
    drafts[updated.id] = updated.status
    notify(`Pedido #${order.id} actualizado a ${orderStatusMeta(updated.status).label}.`)
  } catch (e) {
    notify(getErrorMessage(e, 'No se pudo actualizar el estado.'), 'error')
  } finally {
    savingIds.delete(order.id)
  }
}

watch(statusFilter, () => fetchOrders(), { immediate: true })
</script>

<template>
  <v-container class="py-10">
    <div class="d-flex align-center justify-space-between mb-8 flex-wrap ga-4">
      <div>
        <div class="text-overline tracking-wide text-medium-emphasis">Administración</div>
        <h1 class="font-display text-h4 font-weight-bold">Pedidos</h1>
      </div>
      <v-select
        v-model="statusFilter"
        :items="filterItems"
        label="Filtrar por estado"
        density="compact"
        hide-details
        style="max-width: 240px"
      />
    </div>

    <div v-if="loading" class="py-16 text-center">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-alert v-else-if="error" type="error" variant="tonal">{{ error }}</v-alert>

    <div v-else-if="!orders.length" class="text-center py-16">
      <v-icon size="56" class="mb-4 text-medium-emphasis">mdi-package-variant</v-icon>
      <div class="text-h6 mb-2">No hay pedidos</div>
      <p class="text-body-2 text-medium-emphasis">Cuando los clientes compren, aparecerán aquí.</p>
    </div>

    <v-expansion-panels v-else variant="accordion" multiple>
      <v-expansion-panel v-for="order in orders" :key="order.id" elevation="0">
        <v-expansion-panel-title>
          <div class="d-flex align-center justify-space-between flex-grow-1 mr-4 flex-wrap ga-2">
            <div>
              <span class="font-weight-bold">Pedido #{{ order.id }}</span>
              <span class="text-caption text-medium-emphasis ml-2">{{ formatDate(order.createdAt) }}</span>
              <span class="text-caption text-medium-emphasis ml-2">· {{ order.shippingFullName }}</span>
            </div>
            <div class="d-flex align-center ga-3">
              <v-chip :color="orderStatusMeta(order.status).color" size="small" variant="tonal">
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

          <div class="text-caption text-medium-emphasis mb-4">
            <v-icon size="16" class="mr-1">mdi-map-marker-outline</v-icon>
            {{ order.shippingFullName }} — {{ order.shippingAddressLine }},
            {{ order.shippingCity }}<template v-if="order.shippingState">, {{ order.shippingState }}</template>
            {{ order.shippingZipCode }}
          </div>

          <!-- Editor de estado (solo admin) -->
          <div class="d-flex align-center ga-3 flex-wrap">
            <v-select
              v-model="drafts[order.id]"
              :items="statusItems"
              label="Estado"
              density="compact"
              hide-details
              style="max-width: 220px"
            />
            <v-btn
              color="primary"
              variant="flat"
              :disabled="drafts[order.id] === order.status"
              :loading="savingIds.has(order.id)"
              @click="saveStatus(order)"
            >
              Guardar
            </v-btn>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-snackbar v-model="snackbar" :color="snackColor" location="bottom right" timeout="2500">
      {{ snackText }}
    </v-snackbar>
  </v-container>
</template>
