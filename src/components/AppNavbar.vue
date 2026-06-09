<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const drawer = ref(false)

const links = [
  { title: 'Inicio', to: '/' },
  { title: 'Tienda', to: '/products' },
]

function logout() {
  auth.logout()
  cart.reset()
  drawer.value = false
  router.push('/')
}
</script>

<template>
  <v-app-bar flat color="background" height="72" class="border-b px-2">
    <v-container class="d-flex align-center py-0">
      <!-- Menú móvil -->
      <v-app-bar-nav-icon
        class="d-md-none"
        @click="drawer = !drawer"
      />

      <!-- Marca -->
      <router-link to="/" class="text-decoration-none">
        <span class="brand-title text-h6 text-primary">TrueShop</span>
      </router-link>

      <v-spacer />

      <!-- Enlaces (escritorio) -->
      <div class="d-none d-md-flex align-center ga-8 mr-6">
        <router-link
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="nav-link text-body-2 text-primary text-uppercase"
        >
          {{ link.title }}
        </router-link>
        <router-link
          v-if="auth.isAuthenticated"
          to="/orders"
          class="nav-link text-body-2 text-primary text-uppercase"
        >
          Mis pedidos
        </router-link>
      </div>

      <!-- Carrito -->
      <v-btn icon variant="text" to="/cart" class="mr-1">
        <v-badge
          :content="cart.itemCount"
          :model-value="cart.itemCount > 0"
          color="primary"
        >
          <v-icon>mdi-shopping-outline</v-icon>
        </v-badge>
      </v-btn>

      <!-- Cuenta -->
      <template v-if="auth.isAuthenticated">
        <v-menu>
          <template #activator="{ props }">
            <v-btn icon variant="text" v-bind="props">
              <v-icon>mdi-account-outline</v-icon>
            </v-btn>
          </template>
          <v-list density="compact" min-width="200">
            <v-list-item :title="auth.displayName" :subtitle="auth.user?.email" />
            <v-divider />
            <v-list-item to="/orders" title="Mis pedidos" prepend-icon="mdi-package-variant-closed" />
            <v-list-item title="Cerrar sesión" prepend-icon="mdi-logout" @click="logout" />
          </v-list>
        </v-menu>
      </template>
      <template v-else>
        <v-btn variant="text" to="/login" class="d-none d-sm-flex text-uppercase">
          Entrar
        </v-btn>
        <v-btn variant="flat" color="primary" to="/register" class="d-none d-sm-flex ml-2 text-uppercase">
          Crear cuenta
        </v-btn>
      </template>
    </v-container>
  </v-app-bar>

  <!-- Drawer móvil -->
  <v-navigation-drawer v-model="drawer" temporary location="left">
    <v-list nav>
      <v-list-item
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        :title="link.title"
        @click="drawer = false"
      />
      <template v-if="auth.isAuthenticated">
        <v-list-item to="/orders" title="Mis pedidos" @click="drawer = false" />
        <v-divider class="my-2" />
        <v-list-item title="Cerrar sesión" prepend-icon="mdi-logout" @click="logout" />
      </template>
      <template v-else>
        <v-divider class="my-2" />
        <v-list-item to="/login" title="Entrar" @click="drawer = false" />
        <v-list-item to="/register" title="Crear cuenta" @click="drawer = false" />
      </template>
    </v-list>
  </v-navigation-drawer>
</template>
