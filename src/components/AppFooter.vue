<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <v-footer color="primary" class="text-on-primary pa-0">
    <v-container class="py-12">
      <v-row>
        <v-col cols="12" md="5">
          <div class="brand-title text-h6 mb-3">TrueShop</div>
          <p class="text-body-2 text-medium-emphasis" style="max-width: 320px; color: rgba(255,255,255,0.7)">
            Camisas para hombre con diseño atemporal. Calidad y elegancia en cada prenda.
          </p>
        </v-col>
        <v-col cols="6" md="3">
          <div class="text-overline mb-2">Tienda</div>
          <ul class="footer-links">
            <li><router-link to="/products">Todos los productos</router-link></li>
            <li><router-link to="/cart">Mi carrito</router-link></li>
            <li><router-link to="/orders">Mis pedidos</router-link></li>
          </ul>
        </v-col>
        <v-col cols="6" md="4">
          <div class="text-overline mb-2">Contacto</div>
          <ul class="footer-links">
            <li>contacto@trueshop.com</li>
            <li>+52 55 1234 5678</li>
            <li>Ciudad de México</li>
          </ul>
        </v-col>
      </v-row>

      <v-divider class="my-6" style="border-color: rgba(255,255,255,0.15)" />

      <div class="d-flex flex-column flex-sm-row justify-space-between align-center ga-2">
        <span class="text-caption" style="color: rgba(255,255,255,0.6)">
          © {{ year }} TrueShop. Todos los derechos reservados.
        </span>
        <div class="d-flex ga-4">
          <v-icon size="20" style="color: rgba(255,255,255,0.7)">mdi-instagram</v-icon>
          <v-icon size="20" style="color: rgba(255,255,255,0.7)">mdi-facebook</v-icon>
          <v-icon size="20" style="color: rgba(255,255,255,0.7)">mdi-twitter</v-icon>
        </div>
      </div>
    </v-container>
  </v-footer>
</template>

<style scoped>
.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}
.footer-links li {
  margin-bottom: 8px;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}
.footer-links a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.2s ease;
}
.footer-links a:hover {
  color: #ffffff;
}
</style>
