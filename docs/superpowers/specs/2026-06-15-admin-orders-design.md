# Diseño: vista de pedidos para administrador

Fecha: 2026-06-15
Repo: TrueShopPage (frontend Vue 3 + Vuetify 3 + TypeScript + Pinia)
Rama: rmacias/AddAdminProductsSection

## Objetivo

Dar a los usuarios con rol `Admin` una vista donde puedan ver **todos** los pedidos
hechos por los clientes y **cambiar el estado** de cada pedido (Pending, Paid, Shipped,
Delivered, Cancelled) mediante un dropdown con un botón explícito de "Guardar". El
backend `TrueShop.Api` ya expone los endpoints necesarios; este trabajo es exclusivamente
de frontend.

## Contrato del backend (ya existente)

Ambos endpoints requieren autorización `AdminOnly` (JWT con rol Admin, ya inyectado por
el interceptor de Axios).

- `GET /orders/all?status=<opcional>` — lista todos los pedidos, ordenados por fecha
  descendente. El parámetro `status` (opcional) filtra por estado; valores inválidos se
  ignoran (devuelve todos). Respuesta: `200` con `Order[]` (mismo shape que el tipo
  `Order` ya definido en `src/api/types.ts`).
- `PUT /orders/{id}/status` con body `{ "status": "Paid" }` — cambia el estado del pedido.
  Valores válidos: `Pending`, `Paid`, `Shipped`, `Delivered`, `Cancelled` (case-insensitive
  en el backend). Respuesta: `200` con el `Order` actualizado. Errores `ProblemDetails`:
  `400` estado inválido, `404` pedido no encontrado.

Sin paginación: el endpoint devuelve la lista completa. Se decidió **no** paginar por
ahora (la paginación real requeriría cambios de backend y el volumen actual no lo amerita).

## 1. Capa de API

### `src/utils/format.ts` — constante de estados
Agregar junto al ya existente `orderStatusMeta`:
```ts
// Estados válidos de un pedido, en orden de avance del flujo.
export const ORDER_STATUSES = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'] as const
```
Esto alimenta el filtro y el dropdown de cambio de estado sin duplicar literales. Las
etiquetas y colores se obtienen del ya existente `orderStatusMeta(status)`.

### `src/api/services.ts` — métodos nuevos en `adminApi`
No se necesitan tipos nuevos (`Order` ya existe). Agregar al objeto `adminApi`:
```ts
listAllOrders(status?: string) {
  return apiClient
    .get<Order[]>('/orders/all', { params: status ? { status } : {} })
    .then((r) => r.data)
},
updateOrderStatus(id: number, status: string) {
  return apiClient
    .put<Order>(`/orders/${id}/status`, { status })
    .then((r) => r.data)
},
```
Añadir `Order` al bloque `import type { ... } from './types'` de `services.ts`.

## 2. Ruta y navegación

### `src/router/index.ts`
Nueva ruta, después de `admin-products` y antes de `login`:
```ts
{
  path: '/admin/orders',
  name: 'admin-orders',
  component: () => import('@/views/AdminOrdersView.vue'),
  meta: { requiresAuth: true, requiresAdmin: true },
},
```
El guard `requiresAdmin` ya existe y cubre esta ruta sin cambios.

### `src/components/AppNavbar.vue`
Hoy hay un único enlace de admin ("Administración" → `/admin/products`). Reorganizarlo en
un grupo de dos enlaces, ambos gated por `v-if="auth.isAdmin"`:

- **Menú de cuenta (escritorio)**: un subencabezado `v-list-subheader` "Administración"
  seguido de dos `v-list-item`:
  - "Productos" → `/admin/products` (icono `mdi-tshirt-crew-outline` o el actual)
  - "Pedidos" → `/admin/orders` (icono `mdi-clipboard-list-outline`)
  Colocados después de "Mis pedidos" y antes de "Cerrar sesión".
- **Drawer móvil**: los mismos dos enlaces (con `@click="drawer = false"`), después de
  "Mis pedidos" y antes del `<v-divider>`.

(El enlace de admin existente "Administración" → productos se reemplaza por estos dos.)

## 3. Vista `src/views/AdminOrdersView.vue`

Reutiliza el patrón de `OrdersView.vue` (paneles expandibles + `orderStatusMeta` +
`formatPrice` / `formatDate`) para consistencia visual.

### Estado (script setup)
- `orders: Order[]`, `loading`, `error: string | null`.
- `statusFilter: string | null` — `null` = "Todos".
- `drafts: Record<number, string>` — estado elegido por pedido (borrador), inicializado al
  cargar desde `order.status`.
- `savingId: number | null` — id del pedido que se está guardando.
- Snackbar: `snackbar`, `snackText`, `snackColor` (igual que `ProductDetailView`).

### Carga y filtro
- `fetchOrders()`: `loading = true`, llama `adminApi.listAllOrders(statusFilter ?? undefined)`,
  asigna `orders.value`, reconstruye `drafts` (cada `drafts[o.id] = o.status`), maneja error
  con `getErrorMessage`, `loading = false`.
- `onMounted` → `fetchOrders()`.
- Cambiar `statusFilter` (watch o `@update:model-value`) → `fetchOrders()`.

### Plantilla
- Encabezado: overline "Administración" + título "Pedidos".
- **Filtro**: `v-select` "Filtrar por estado" con items `[{ title: 'Todos', value: null }, ...ORDER_STATUSES.map(s => ({ title: orderStatusMeta(s).label, value: s }))]`, ancho acotado.
- Estados: spinner si `loading`; `v-alert` error; vacío "No hay pedidos" si `!orders.length`.
- **Lista**: `v-expansion-panels variant="accordion" multiple`. Por cada pedido:
  - **Título**: `#id`, `formatDate(createdAt)`, nombre del cliente (`shippingFullName`),
    chip de estado actual (`orderStatusMeta(order.status)`), total (`formatPrice`).
  - **Cuerpo**:
    - Ítems: `{{ item.quantity }}× {{ item.productName }} ({{ item.size }}/{{ item.color }})`
      con `formatPrice(item.lineTotal)` (igual que OrdersView).
    - Dirección de envío (igual que OrdersView).
    - `v-divider`.
    - **Editor de estado**: en una fila, un `v-select` con items derivados de
      `ORDER_STATUSES` (title = `orderStatusMeta(s).label`, value = `s`) ligado a
      `drafts[order.id]`, y un botón "Guardar" con:
      - `:disabled="drafts[order.id] === order.status"` (sin cambios),
      - `:loading="savingId === order.id"`,
      - `@click="saveStatus(order)"`.

### Acción de guardado
```
async function saveStatus(order) {
  const next = drafts[order.id]
  if (next === order.status) return
  savingId.value = order.id
  try {
    const updated = await adminApi.updateOrderStatus(order.id, next)
    // reemplazar el pedido en la lista por el actualizado
    const i = orders.value.findIndex((o) => o.id === order.id)
    if (i !== -1) orders.value[i] = updated
    drafts[updated.id] = updated.status
    notify(`Pedido #${order.id} actualizado a ${orderStatusMeta(updated.status).label}.`)
  } catch (e) {
    error.value = getErrorMessage(e, 'No se pudo actualizar el estado.')
    notify(getErrorMessage(e, 'No se pudo actualizar el estado.'), 'error')
  } finally {
    savingId.value = null
  }
}
```
`notify(text, color)` muestra el snackbar (patrón de `ProductDetailView`).

Nota: si el filtro está activo y se cambia un pedido a un estado distinto del filtro, el
pedido permanece visible hasta la próxima recarga (no se re-filtra automáticamente). Es
aceptable y evita que la fila desaparezca de golpe tras guardar.

### Manejo de errores y feedback
- Errores de carga → `v-alert type="error"` en la página.
- Éxito/error de guardado → snackbar (consistente con `ProductDetailView`).
- Estados de carga: spinner inicial; `loading` del botón "Guardar" por pedido.

## Fuera de alcance (YAGNI)

- Paginación (decidido: sin paginar por ahora).
- El admin no edita ítems ni datos de envío, solo el estado.
- Filtros adicionales (por cliente, fecha, rango): solo filtro por estado.

## Archivos afectados

- `src/utils/format.ts` — constante `ORDER_STATUSES`.
- `src/api/services.ts` — `adminApi.listAllOrders`, `adminApi.updateOrderStatus`, import de `Order`.
- `src/router/index.ts` — ruta `/admin/orders`.
- `src/components/AppNavbar.vue` — grupo de dos enlaces de admin (Productos / Pedidos).
- `src/views/AdminOrdersView.vue` — **nuevo**.
