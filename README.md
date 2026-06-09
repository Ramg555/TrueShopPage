# TrueShopPage 👔

Frontend de **TrueShop** — tienda en línea de camisas para hombre. Diseño minimalista
en **blanco y negro**, construido con **Vue 3 + Vuetify 3 + TypeScript + Vite**.

Consume la API REST de [`TrueShop.Api`](../TrueShop) (.NET 10).

## 🧱 Stack

Vue 3 (Composition API + `<script setup>`) · Vuetify 3 · TypeScript · Vite · Pinia · Vue Router · Axios

## 🚀 Cómo ejecutar

1. **Levanta el backend** primero (`TrueShop.Api`) en `http://localhost:5150`.

2. **Instala dependencias** (solo la primera vez):
   ```bash
   npm install
   ```

3. **Arranca el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre **http://localhost:5173**

> El front llama a `/api/...` y Vite redirige esas peticiones al backend .NET mediante un
> **proxy** (configurado en `vite.config.ts`), evitando problemas de CORS en desarrollo.
> Para apuntar a otra URL, define `VITE_API_URL` en un archivo `.env`.

## 🔑 Cuenta de prueba

| Email                   | Contraseña    |
|-------------------------|---------------|
| `cliente@trueshop.com`  | `Cliente123!` |

(En la pantalla de login hay un botón **"Usar cuenta de prueba"** que la rellena.)

## 🗂️ Estructura

```
src/
├── main.ts              # Bootstrap (Pinia, Router, Vuetify)
├── App.vue              # Layout (navbar + main + footer)
├── plugins/vuetify.ts   # Tema negro/blanco + defaults de componentes
├── router/              # Rutas + guard de autenticación
├── api/                 # Cliente Axios, tipos y servicios del API
├── stores/              # Estado global (auth, cart) con Pinia
├── components/          # Navbar, Footer, ProductCard
├── views/               # Páginas (Home, Products, Detail, Cart, Checkout, Login, Register, Orders)
├── utils/               # Formato de precios/fechas
└── styles/              # CSS global y tipografía
```

## ✨ Funcionalidad

- **Catálogo** con búsqueda, filtros (categoría, talla), orden y paginación.
- **Detalle de producto** con selección de color/talla y control de stock.
- **Carrito**: agregar, cambiar cantidad, quitar, vaciar.
- **Checkout** con datos de envío → crea el pedido.
- **Autenticación JWT** (login/registro) con sesión persistente y rutas protegidas.
- **Mis pedidos**: historial con estado y detalle.

## 📦 Build de producción

```bash
npm run build      # genera dist/
npm run preview    # sirve el build localmente
```
