<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { formatPrice } from '@/utils/format'

const cart = useCartStore()
const router = useRouter()

const fallbackImage =
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=200&q=80'

async function changeQty(itemId: number, quantity: number) {
  if (quantity < 1) return
  await cart.update(itemId, quantity)
}

onMounted(() => cart.load())
</script>

<template>
  <v-container class="py-10">
    <h1 class="font-display text-h4 font-weight-bold mb-8">Tu carrito</h1>

    <div v-if="cart.loading" class="py-16 text-center">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <div v-else-if="cart.isEmpty" class="text-center py-16">
      <v-icon size="56" class="mb-4 text-medium-emphasis">mdi-shopping-outline</v-icon>
      <div class="text-h6 mb-2">Tu carrito está vacío</div>
      <p class="text-body-2 text-medium-emphasis mb-6">Añade algunas prendas para empezar.</p>
      <v-btn color="primary" variant="flat" to="/products">Ir a la tienda</v-btn>
    </div>

    <v-row v-else>
      <!-- Lista -->
      <v-col cols="12" md="8">
        <v-alert v-if="cart.error" type="error" variant="tonal" class="mb-4" density="compact">
          {{ cart.error }}
        </v-alert>

        <v-card variant="outlined" rounded="lg">
          <template v-for="(item, i) in cart.items" :key="item.id">
            <v-divider v-if="i > 0" />
            <div class="d-flex pa-4 ga-4 align-center">
              <v-img
                :src="item.imageUrl || fallbackImage"
                :alt="item.productName"
                cover
                width="80"
                height="100"
                class="rounded bg-surface-variant flex-grow-0"
              />
              <div class="flex-grow-1">
                <div class="text-subtitle-1 font-weight-medium">{{ item.productName }}</div>
                <div class="text-caption text-medium-emphasis">
                  Talla {{ item.size }} · {{ item.color }}
                </div>
                <div class="text-body-2 mt-1">{{ formatPrice(item.unitPrice) }}</div>

                <div class="d-flex align-center ga-2 mt-2">
                  <div class="d-inline-flex align-center border rounded">
                    <v-btn
                      icon="mdi-minus"
                      variant="text"
                      size="x-small"
                      :disabled="item.quantity <= 1"
                      @click="changeQty(item.id, item.quantity - 1)"
                    />
                    <span class="px-2 text-body-2" style="min-width: 28px; text-align: center">
                      {{ item.quantity }}
                    </span>
                    <v-btn
                      icon="mdi-plus"
                      variant="text"
                      size="x-small"
                      :disabled="item.quantity >= item.availableStock"
                      @click="changeQty(item.id, item.quantity + 1)"
                    />
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-subtitle-1 font-weight-bold">{{ formatPrice(item.lineTotal) }}</div>
                <v-btn
                  variant="text"
                  size="small"
                  color="error"
                  icon="mdi-trash-can-outline"
                  @click="cart.remove(item.id)"
                />
              </div>
            </div>
          </template>
        </v-card>

        <div class="mt-4">
          <v-btn variant="text" size="small" prepend-icon="mdi-delete-sweep-outline" @click="cart.clear()">
            Vaciar carrito
          </v-btn>
        </div>
      </v-col>

      <!-- Resumen -->
      <v-col cols="12" md="4">
        <v-card variant="outlined" rounded="lg" class="pa-6" style="position: sticky; top: 96px">
          <div class="text-subtitle-1 font-weight-bold mb-4">Resumen</div>
          <div class="d-flex justify-space-between mb-2 text-body-2">
            <span>Productos ({{ cart.itemCount }})</span>
            <span>{{ formatPrice(cart.total) }}</span>
          </div>
          <div class="d-flex justify-space-between mb-4 text-body-2 text-medium-emphasis">
            <span>Envío</span>
            <span>Se calcula al pagar</span>
          </div>
          <v-divider class="mb-4" />
          <div class="d-flex justify-space-between mb-6">
            <span class="text-subtitle-1 font-weight-bold">Total</span>
            <span class="text-subtitle-1 font-weight-bold">{{ formatPrice(cart.total) }}</span>
          </div>
          <v-btn block size="large" color="primary" variant="flat" @click="router.push('/checkout')">
            Proceder al pago
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
