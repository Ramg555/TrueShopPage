<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { catalogApi } from '@/api/services'
import type { Category, Product, ProductFilters } from '@/api/types'
import { SIZES } from '@/utils/sizes'
import ProductCard from '@/components/ProductCard.vue'

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const totalItems = ref(0)
const totalPages = ref(1)

const filters = ref<ProductFilters>({
  search: '',
  categoryId: undefined,
  size: undefined,
  sort: 'newest',
  page: 1,
  pageSize: 12,
})

const sizes = SIZES
const sortOptions = [
  { title: 'Más nuevos', value: 'newest' },
  { title: 'Precio: menor a mayor', value: 'price_asc' },
  { title: 'Precio: mayor a menor', value: 'price_desc' },
  { title: 'Nombre (A–Z)', value: 'name' },
]

let searchTimer: ReturnType<typeof setTimeout> | undefined

async function fetchProducts() {
  loading.value = true
  try {
    const res = await catalogApi.listProducts(filters.value)
    products.value = res.items
    totalItems.value = res.totalItems
    totalPages.value = res.totalPages
  } finally {
    loading.value = false
  }
}

// Debounce de la búsqueda por texto.
watch(
  () => filters.value.search,
  () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      filters.value.page = 1
      fetchProducts()
    }, 350)
  },
)

// Recarga inmediata al cambiar filtros estructurados.
watch(
  () => [filters.value.categoryId, filters.value.size, filters.value.sort],
  () => {
    filters.value.page = 1
    fetchProducts()
  },
)

watch(
  () => filters.value.page,
  () => fetchProducts(),
)

function clearFilters() {
  filters.value = { search: '', categoryId: undefined, size: undefined, sort: 'newest', page: 1, pageSize: 12 }
  fetchProducts()
}

onMounted(async () => {
  categories.value = await catalogApi.listCategories()
  await fetchProducts()
})
</script>

<template>
  <v-container class="py-10">
    <div class="mb-8">
      <div class="text-overline tracking-wide text-medium-emphasis">Catálogo</div>
      <h1 class="font-display text-h4 font-weight-bold">La tienda</h1>
    </div>

    <v-row>
      <!-- Filtros -->
      <v-col cols="12" md="3">
        <div class="filters">
          <v-text-field
            v-model="filters.search"
            label="Buscar"
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            class="mb-6"
          />

          <div class="text-subtitle-2 font-weight-bold mb-2">Categoría</div>
          <v-chip-group v-model="filters.categoryId" column class="mb-6">
            <v-chip
              v-for="cat in categories"
              :key="cat.id"
              :value="cat.id"
              filter
              variant="outlined"
              size="small"
            >
              {{ cat.name }}
            </v-chip>
          </v-chip-group>

          <div class="text-subtitle-2 font-weight-bold mb-2">Talla</div>
          <v-chip-group v-model="filters.size" class="mb-6">
            <v-chip
              v-for="s in sizes"
              :key="s"
              :value="s"
              filter
              variant="outlined"
              size="small"
            >
              {{ s }}
            </v-chip>
          </v-chip-group>

          <v-btn variant="text" size="small" prepend-icon="mdi-close" @click="clearFilters">
            Limpiar filtros
          </v-btn>
        </div>
      </v-col>

      <!-- Resultados -->
      <v-col cols="12" md="9">
        <div class="d-flex align-center justify-space-between mb-4">
          <span class="text-body-2 text-medium-emphasis">
            {{ totalItems }} producto{{ totalItems === 1 ? '' : 's' }}
          </span>
          <v-select
            v-model="filters.sort"
            :items="sortOptions"
            hide-details
            density="compact"
            style="max-width: 240px"
          />
        </div>

        <v-row v-if="loading">
          <v-col v-for="n in 6" :key="n" cols="6" md="4">
            <v-skeleton-loader type="image, article" />
          </v-col>
        </v-row>

        <template v-else>
          <v-row v-if="products.length">
            <v-col v-for="product in products" :key="product.id" cols="6" md="4">
              <ProductCard :product="product" />
            </v-col>
          </v-row>

          <div v-else class="text-center py-16">
            <v-icon size="48" class="mb-3 text-medium-emphasis">mdi-hanger</v-icon>
            <div class="text-h6">No encontramos productos</div>
            <div class="text-body-2 text-medium-emphasis">Prueba con otros filtros.</div>
          </div>

          <div v-if="totalPages > 1" class="d-flex justify-center mt-10">
            <v-pagination
              v-model="filters.page"
              :length="totalPages"
              :total-visible="5"
              rounded="circle"
            />
          </div>
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.filters {
  position: sticky;
  top: 96px;
}
</style>
