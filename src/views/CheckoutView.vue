<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ordersApi } from '@/api/services'
import { getErrorMessage } from '@/api/client'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import type { ShippingInfo } from '@/api/types'
import { formatPrice } from '@/utils/format'

const router = useRouter()
const cart = useCartStore()
const auth = useAuthStore()

const form = ref<ShippingInfo>({
  shippingFullName: auth.displayName,
  shippingAddressLine: '',
  shippingCity: '',
  shippingState: '',
  shippingZipCode: '',
  shippingPhone: '',
})

const submitting = ref(false)
const error = ref<string | null>(null)
const valid = ref(false)

const required = (v: string) => !!v?.trim() || 'Campo obligatorio'

async function placeOrder() {
  if (!valid.value) return
  submitting.value = true
  error.value = null
  try {
    const order = await ordersApi.create(form.value)
    cart.reset()
    router.push({ name: 'orders', query: { created: String(order.id) } })
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await cart.load()
  if (cart.isEmpty) router.replace('/cart')
})
</script>

<template>
  <v-container class="py-10">
    <v-btn variant="text" prepend-icon="mdi-arrow-left" to="/cart" class="mb-6">
      Volver al carrito
    </v-btn>

    <h1 class="font-display text-h4 font-weight-bold mb-8">Finalizar compra</h1>

    <v-row>
      <!-- Datos de envío -->
      <v-col cols="12" md="7">
        <v-card variant="outlined" rounded="lg" class="pa-6">
          <div class="text-subtitle-1 font-weight-bold mb-4">Datos de envío</div>

          <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
            {{ error }}
          </v-alert>

          <v-form v-model="valid" @submit.prevent="placeOrder">
            <v-text-field
              v-model="form.shippingFullName"
              label="Nombre completo *"
              :rules="[required]"
              class="mb-2"
            />
            <v-text-field
              v-model="form.shippingAddressLine"
              label="Dirección (calle y número) *"
              :rules="[required]"
              class="mb-2"
            />
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.shippingCity" label="Ciudad *" :rules="[required]" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.shippingState" label="Estado" />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.shippingZipCode" label="Código postal *" :rules="[required]" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.shippingPhone" label="Teléfono" />
              </v-col>
            </v-row>

            <v-btn
              type="submit"
              block
              size="large"
              color="primary"
              variant="flat"
              class="mt-4"
              :loading="submitting"
              :disabled="!valid"
            >
              Confirmar pedido
            </v-btn>
          </v-form>
        </v-card>
      </v-col>

      <!-- Resumen del pedido -->
      <v-col cols="12" md="5">
        <v-card variant="outlined" rounded="lg" class="pa-6" style="position: sticky; top: 96px">
          <div class="text-subtitle-1 font-weight-bold mb-4">Tu pedido</div>
          <div
            v-for="item in cart.items"
            :key="item.id"
            class="d-flex justify-space-between mb-3 text-body-2"
          >
            <span class="text-medium-emphasis">
              {{ item.quantity }}× {{ item.productName }}
              <span class="text-caption">({{ item.size }}/{{ item.color }})</span>
            </span>
            <span>{{ formatPrice(item.lineTotal) }}</span>
          </div>
          <v-divider class="my-4" />
          <div class="d-flex justify-space-between">
            <span class="text-subtitle-1 font-weight-bold">Total</span>
            <span class="text-subtitle-1 font-weight-bold">{{ formatPrice(cart.total) }}</span>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
