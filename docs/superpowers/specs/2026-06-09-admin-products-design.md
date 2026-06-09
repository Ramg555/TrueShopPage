# Diseño: Sección de administración de productos

Fecha: 2026-06-09
Repo: TrueShopPage (frontend Vue 3 + Vuetify 3 + TypeScript + Pinia)

## Objetivo

Dar a los usuarios con rol `Admin` una sección dentro del frontend para **gestionar
productos**: listarlos, crear nuevos (con variantes), editarlos y eliminarlos. El
backend `TrueShop.Api` ya expone todos los endpoints necesarios; este trabajo es
exclusivamente de frontend.

## Contrato del backend (ya existente)

Todos los endpoints requieren autorización `AdminOnly` (JWT con rol Admin, ya inyectado
por el interceptor de Axios).

- `POST /products` — crear producto con variantes.
  ```
  { name, description, price, brand, material, imageUrl, categoryId,
    variants: [{ size, color, stockQuantity }] }
  ```
  Respuesta: `201` con el `Product` creado (incluye slug y SKUs generados).
- `PUT /products/{id}` — actualizar datos del producto. **No** modifica variantes.
  ```
  { name, description, price, brand, material, imageUrl, categoryId, isActive }
  ```
  Respuesta: `200` con el `Product` actualizado.
- `DELETE /products/{id}` — elimina producto y sus variantes (y limpia ítems de carrito
  que las referencien). Respuesta: `204`.

Validaciones del backend (devuelven `ProblemDetails` 400/404): nombre requerido, precio
> 0, categoría existente, cada variante necesita talla y color. El frontend mostrará
esos mensajes vía `getErrorMessage`.

Para listar y obtener categorías se reutiliza el `catalogApi` existente:
- `catalogApi.listProducts(filters)` → `PagedResult<Product>`
- `catalogApi.listCategories()` → `Category[]`

## 1. Navegación y acceso

- Nueva ruta en `src/router/index.ts`:
  ```ts
  {
    path: '/admin/products',
    name: 'admin-products',
    component: () => import('@/views/AdminProductsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  }
  ```
- Extender el guard `router.beforeEach`: si `to.meta.requiresAdmin` y `!auth.isAdmin`,
  redirigir a `{ name: 'home' }`. La sesión se rehidrata en `main.ts` antes de montar la
  app, así que `auth.isAdmin` está disponible en el primer guard.
- En `src/components/AppNavbar.vue`, agregar el enlace **"Administración"** (icono
  `mdi-cog-outline`, `to="/admin/products"`) en dos lugares, ambos con `v-if="auth.isAdmin"`:
  - el `v-menu` de la cuenta (escritorio),
  - el `v-navigation-drawer` (móvil).

## 2. Capa de API

### `src/api/types.ts` — nuevos tipos
```ts
export interface VariantInput {
  size: string
  color: string
  stockQuantity: number
}

export interface ProductCreateInput {
  name: string
  description: string
  price: number
  brand: string
  material: string
  imageUrl: string
  categoryId: number
  variants: VariantInput[]
}

export interface ProductUpdateInput {
  name: string
  description: string
  price: number
  brand: string
  material: string
  imageUrl: string
  categoryId: number
  isActive: boolean
}
```

### `src/api/services.ts` — nuevo `adminApi`
```ts
export const adminApi = {
  createProduct(input: ProductCreateInput) {
    return apiClient.post<Product>('/products', input).then((r) => r.data)
  },
  updateProduct(id: number, input: ProductUpdateInput) {
    return apiClient.put<Product>(`/products/${id}`, input).then((r) => r.data)
  },
  deleteProduct(id: number) {
    return apiClient.delete(`/products/${id}`)
  },
}
```

## 3. Vista `src/views/AdminProductsView.vue`

Sigue los patrones existentes (`<script setup lang="ts">`, Composition API, Vuetify,
`getErrorMessage`, `formatPrice`).

### Estado
- `products: Product[]`, `categories: Category[]`, `loading`, `error`.
- `dialog` (abierto/cerrado), `editingId: number | null` (null = creación).
- `form` con los campos del producto + `variants: VariantInput[]`, `isActive`.
- `deleteTarget: Product | null`, `deleteDialog`.
- `saving`, `deleting`.

### Carga
- `onMounted`: `categories = await listCategories()` y `fetchProducts()`.
- `fetchProducts()`: `catalogApi.listProducts({ pageSize: 100, sort: 'newest' })`,
  guarda `res.items`.

### Tabla
- `v-data-table` con columnas: imagen (avatar pequeño desde `imageUrl`), nombre,
  categoría (`categoryName`), precio (`formatPrice`), estado (`v-chip` "Activo"/"Inactivo"),
  acciones (botones icono editar `mdi-pencil` y eliminar `mdi-delete`).
- Encabezado de la página con título y botón **"Nuevo producto"** (`mdi-plus`) que abre el
  diálogo en modo creación (resetea `form`, `editingId = null`).

### Diálogo de producto (crear/editar)
- `v-dialog` con `v-form v-model="valid"`.
- Campos: nombre, descripción (`v-textarea`), precio (`type="number"`), marca, material,
  URL de imagen, categoría (`v-select` con `categories`, item-title `name`, item-value `id`).
- Reglas de validación: nombre requerido, precio > 0, categoría requerida.
- **Switch "Activo"**: visible solo en modo edición (el `PUT` lo soporta; al crear el
  backend siempre marca `isActive = true`).
- **Editor de variantes**: visible **solo en modo creación**. Lista de filas dinámicas
  (talla, color, stock `type="number"`) con botón para agregar/quitar fila. Al menos la
  estructura permite 0..n variantes; el backend valida talla+color por fila.
- **Modo edición**: en lugar del editor, mostrar las variantes existentes del producto en
  **solo lectura** (lista de "Talla · Color · stock") con una nota:
  "Las variantes se gestionan desde el backend".
- Botones: Cancelar / Guardar (`:loading="saving"`, `:disabled="!valid"`).
- `save()`:
  - creación → `adminApi.createProduct(payload)`.
  - edición → `adminApi.updateProduct(editingId, payload)`.
  - en éxito: cerrar diálogo, `fetchProducts()`.
  - en error: `error.value = getErrorMessage(e)`.

### Eliminar
- Botón eliminar abre `deleteDialog` con confirmación mostrando el nombre.
- `confirmDelete()` → `adminApi.deleteProduct(id)` → cerrar → `fetchProducts()`.
- Errores con `getErrorMessage`.

### Manejo de errores y feedback
- `v-alert type="error" variant="tonal"` para errores de carga/operación, igual que
  `LoginView`.
- Estados de carga: `loading` para la tabla (`v-data-table :loading`), `saving`/`deleting`
  en los botones de los diálogos.

## Fuera de alcance (YAGNI)

- Edición de variantes desde el frontend (la API no lo soporta vía `PUT`).
- Carga/almacenamiento de imágenes: se usa una URL de imagen (campo de texto), igual que
  el modelo actual.
- Paginación de la tabla de admin (se asume volumen bajo; `pageSize: 100`).
- Gestión de categorías (solo se consumen las existentes).

## Archivos afectados

- `src/router/index.ts` — ruta + guard `requiresAdmin`.
- `src/components/AppNavbar.vue` — enlaces de admin condicionados a `auth.isAdmin`.
- `src/api/types.ts` — `VariantInput`, `ProductCreateInput`, `ProductUpdateInput`.
- `src/api/services.ts` — `adminApi`.
- `src/views/AdminProductsView.vue` — **nuevo**.
