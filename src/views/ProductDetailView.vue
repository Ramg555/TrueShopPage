<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { catalogApi } from '@/api/services'
import { getErrorMessage } from '@/api/client'
import type { Product, Variant } from '@/api/types'
import { formatPrice } from '@/utils/format'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

const props = defineProps<{ id: string }>()
const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()

const product = ref<Product | null>(null)
const loading = ref(true)
const notFound = ref(false)

const selectedColor = ref<string | null>(null)
const selectedSize = ref<string | null>(null)
const quantity = ref(1)
const adding = ref(false)

const snackbar = ref(false)
const snackText = ref('')
const snackColor = ref<'success' | 'error'>('success')

const fallbackImage =
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80'

const colors = computed(() => {
  if (!product.value) return []
  return [...new Set(product.value.variants.map((v) => v.color))]
})

const sizesForColor = computed(() => {
  if (!product.value || !selectedColor.value) return []
  return product.value.variants.filter((v) => v.color === selectedColor.value)
})

const selectedVariant = computed<Variant | null>(() => {
  if (!product.value || !selectedColor.value || !selectedSize.value) return null
  return (
    product.value.variants.find(
      (v) => v.color === selectedColor.value && v.size === selectedSize.value,
    ) ?? null
  )
})

const maxStock = computed(() => selectedVariant.value?.stockQuantity ?? 0)
const canAdd = computed(() => !!selectedVariant.value && maxStock.value > 0)

function notify(text: string, color: 'success' | 'error' = 'success') {
  snackText.value = text
  snackColor.value = color
  snackbar.value = true
}

async function addToCart() {
  if (!auth.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: `/products/${props.id}` } })
    return
  }
  if (!selectedVariant.value) return
  adding.value = true
  try {
    await cart.add(selectedVariant.value.id, quantity.value)
    notify('Producto agregado al carrito.')
  } catch (e) {
    notify(getErrorMessage(e), 'error')
  } finally {
    adding.value = false
  }
}

onMounted(async () => {
  try {
    product.value = await catalogApi.getProduct(Number(props.id))
    if (colors.value.length) selectedColor.value = colors.value[0]
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <v-container class="py-10">
    <v-btn variant="text" prepend-icon="mdi-arrow-left" to="/products" class="mb-6">
      Volver a la tienda
    </v-btn>

    <div v-if="loading" class="py-16 text-center">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <div v-else-if="notFound || !product" class="text-center py-16">
      <v-icon size="48" class="mb-3 text-medium-emphasis">mdi-alert-circle-outline</v-icon>
      <div class="text-h6">Producto no encontrado</div>
      <v-btn class="mt-4" variant="outlined" to="/products">Ir a la tienda</v-btn>
    </div>

    <v-row v-else>
      <!-- Imagen -->
      <v-col cols="12" md="6">
        <v-img
          :src="product.imageUrl || fallbackImage"
          :alt="product.name"
          cover
          class="bg-surface-variant rounded-lg"
          style="aspect-ratio: 3 / 4"
        />
      </v-col>

      <!-- Detalle -->
      <v-col cols="12" md="6">
        <div class="pl-md-6">
          <div class="text-overline tracking-wide text-medium-emphasis">
            {{ product.categoryName }} · {{ product.brand }}
          </div>
          <h1 class="font-display text-h4 font-weight-bold mb-2">{{ product.name }}</h1>
          <div class="text-h5 font-weight-bold mb-6">{{ formatPrice(product.price) }}</div>

          <p class="text-body-1 text-medium-emphasis mb-6">{{ product.description }}</p>

          <div v-if="product.material" class="text-body-2 mb-6">
            <v-icon size="18" class="mr-1">mdi-tshirt-crew-outline</v-icon>
            Material: <strong>{{ product.material }}</strong>
          </div>

          <v-divider class="mb-6" />

          <!-- Color -->
          <div class="text-subtitle-2 font-weight-bold mb-2">
            Color: <span class="text-medium-emphasis">{{ selectedColor }}</span>
          </div>
          <v-chip-group
            v-model="selectedColor"
            mandatory
            class="mb-6"
            @update:model-value="selectedSize = null"
          >
            <v-chip
              v-for="c in colors"
              :key="c"
              :value="c"
              filter
              variant="outlined"
            >
              {{ c }}
            </v-chip>
          </v-chip-group>

          <!-- Talla -->
          <div class="text-subtitle-2 font-weight-bold mb-2">Talla</div>
          <v-chip-group v-model="selectedSize" class="mb-6">
            <v-chip
              v-for="v in sizesForColor"
              :key="v.id"
              :value="v.size"
              :disabled="v.stockQuantity === 0"
              filter
              variant="outlined"
            >
              {{ v.size }}
            </v-chip>
          </v-chip-group>

          <!-- Cantidad + stock -->
          <div v-if="selectedVariant" class="mb-6">
            <div class="d-flex align-center ga-4">
              <div class="d-inline-flex align-center border rounded">
                <v-btn
                  icon="mdi-minus"
                  variant="text"
                  size="small"
                  :disabled="quantity <= 1"
                  @click="quantity = Math.max(1, quantity - 1)"
                />
                <span class="px-3 text-body-1" style="min-width: 32px; text-align: center">
                  {{ quantity }}
                </span>
                <v-btn
                  icon="mdi-plus"
                  variant="text"
                  size="small"
                  :disabled="quantity >= maxStock"
                  @click="quantity = Math.min(maxStock, quantity + 1)"
                />
              </div>
              <span class="text-caption text-medium-emphasis">
                {{ maxStock }} disponibles
              </span>
            </div>
          </div>

          <v-btn
            block
            size="large"
            color="primary"
            variant="flat"
            :loading="adding"
            :disabled="!canAdd"
            prepend-icon="mdi-shopping-outline"
            @click="addToCart"
          >
            {{ canAdd ? 'Agregar al carrito' : selectedSize ? 'Agotado' : 'Elige talla y color' }}
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :color="snackColor" location="bottom right" timeout="2500">
      {{ snackText }}
    </v-snackbar>
  </v-container>
</template>
