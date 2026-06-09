<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Product } from '@/api/types'
import { formatPrice } from '@/utils/format'

const props = defineProps<{ product: Product }>()
const router = useRouter()

const inStock = computed(() =>
  props.product.variants.some((v) => v.stockQuantity > 0),
)

const fallbackImage =
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'

function go() {
  router.push(`/products/${props.product.id}`)
}
</script>

<template>
  <v-card class="product-card" flat @click="go">
    <div class="overflow-hidden bg-surface-variant" style="aspect-ratio: 3 / 4">
      <v-img
        :src="product.imageUrl || fallbackImage"
        :alt="product.name"
        cover
        height="100%"
        class="product-image"
      >
        <template #placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-progress-circular indeterminate color="grey-lighten-1" size="28" />
          </div>
        </template>
      </v-img>
    </div>

    <div class="pa-4">
      <div class="text-overline text-medium-emphasis mb-1" style="line-height: 1">
        {{ product.categoryName }}
      </div>
      <div class="text-subtitle-1 font-weight-medium text-truncate">
        {{ product.name }}
      </div>
      <div class="d-flex align-center justify-space-between mt-2">
        <span class="text-subtitle-1 font-weight-bold">{{ formatPrice(product.price) }}</span>
        <v-chip
          v-if="!inStock"
          size="x-small"
          variant="tonal"
          color="error"
        >
          Agotado
      </v-chip>
      </div>
    </div>
  </v-card>
</template>
