<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { catalogApi } from '@/api/services'
import type { Product } from '@/api/types'
import ProductCard from '@/components/ProductCard.vue'

const featured = ref<Product[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await catalogApi.listProducts({ sort: 'newest', pageSize: 4 })
    featured.value = res.items
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <!-- HERO -->
    <section class="hero d-flex align-center">
      <v-container>
        <v-row align="center">
          <v-col cols="12" md="7">
            <div class="text-overline tracking-wider text-medium-emphasis mb-4">
              Nueva colección · 2026
            </div>
            <h1 class="font-display text-h2 text-md-h1 font-weight-bold mb-6" style="line-height: 1.05">
              Elegancia<br />en cada detalle
            </h1>
            <p class="text-body-1 text-medium-emphasis mb-8" style="max-width: 460px">
              Camisas para hombre confeccionadas con materiales nobles y un diseño
              atemporal. Menos, pero mejor.
            </p>
            <div class="d-flex ga-4 flex-wrap">
              <v-btn size="large" color="primary" variant="flat" to="/products" class="px-8">
                Ver la tienda
              </v-btn>
              <v-btn size="large" variant="outlined" to="/products" class="px-8">
                Explorar
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- BANDA DE VALORES -->
    <section class="bg-surface-variant py-10">
      <v-container>
        <v-row class="text-center">
          <v-col v-for="f in [
            { icon: 'mdi-truck-fast-outline', title: 'Envío gratis', text: 'En compras mayores a $999' },
            { icon: 'mdi-refresh', title: 'Cambios fáciles', text: '30 días para devoluciones' },
            { icon: 'mdi-shield-check-outline', title: 'Pago seguro', text: 'Tus datos protegidos' },
            { icon: 'mdi-tshirt-crew-outline', title: 'Calidad premium', text: 'Materiales seleccionados' },
          ]" :key="f.title" cols="6" md="3">
            <v-icon size="32" class="mb-2">{{ f.icon }}</v-icon>
            <div class="text-subtitle-2 font-weight-bold">{{ f.title }}</div>
            <div class="text-caption text-medium-emphasis">{{ f.text }}</div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- DESTACADOS -->
    <section class="py-16">
      <v-container>
        <div class="d-flex align-end justify-space-between mb-8">
          <div>
            <div class="text-overline tracking-wide text-medium-emphasis">Selección</div>
            <h2 class="font-display text-h4 font-weight-bold">Lo más nuevo</h2>
          </div>
          <v-btn variant="text" to="/products" append-icon="mdi-arrow-right">
            Ver todo
          </v-btn>
        </div>

        <v-row v-if="loading">
          <v-col v-for="n in 4" :key="n" cols="6" md="3">
            <v-skeleton-loader type="image, article" />
          </v-col>
        </v-row>

        <v-row v-else>
          <v-col v-for="product in featured" :key="product.id" cols="6" md="3">
            <ProductCard :product="product" />
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- CTA -->
    <section class="bg-primary text-on-primary py-16">
      <v-container class="text-center">
        <h2 class="font-display text-h4 font-weight-bold mb-4">Vístete con intención</h2>
        <p class="text-body-1 mb-8 mx-auto" style="max-width: 480px; color: rgba(255,255,255,0.75)">
          Crea tu cuenta y descubre piezas pensadas para durar.
        </p>
        <v-btn size="large" color="white" variant="flat" to="/products" class="px-8">
          Comprar ahora
        </v-btn>
      </v-container>
    </section>
  </div>
</template>

<style scoped>
.hero {
  min-height: 70vh;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.6) 100%),
    url('https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1600&q=80');
  background-size: cover;
  background-position: center;
}
</style>
