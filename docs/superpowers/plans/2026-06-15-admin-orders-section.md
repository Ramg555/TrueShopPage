# Admin Orders Section — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-only view to list all customer orders and change each order's status (Pending/Paid/Shipped/Delivered/Cancelled) via a dropdown + explicit "Guardar" button, wired to the existing `TrueShop.Api` endpoints.

**Architecture:** New protected route `/admin/orders` rendering `AdminOrdersView.vue`, which uses a new `adminApi.listAllOrders` / `adminApi.updateOrderStatus` over the existing Axios client. The view mirrors the existing `OrdersView.vue` (expansion panels + `orderStatusMeta`). Access is gated by the existing `requiresAdmin` route guard and admin-only navbar links.

**Tech Stack:** Vue 3 (`<script setup lang="ts">`), Vuetify 3, Pinia, Vue Router, Axios, TypeScript.

> **Verification note:** This repo has **no test framework or test script** — its only automated gate is `npm run build` (`vue-tsc -b` full type-check + Vite build). Each task verifies via `npm run build` plus explicit manual verification. Do **not** add a test framework.

> **Reference spec:** `docs/superpowers/specs/2026-06-15-admin-orders-design.md`

---

## File Structure

- **Modify** `src/utils/format.ts` — add `ORDER_STATUSES` constant (next to existing `orderStatusMeta`).
- **Modify** `src/api/services.ts` — add `listAllOrders` + `updateOrderStatus` to `adminApi`. (`Order` is already imported and used by `ordersApi`; no import change needed.)
- **Create** `src/views/AdminOrdersView.vue` — the admin orders page: status filter + expansion-panel list + per-order status editor.
- **Modify** `src/router/index.ts` — add `/admin/orders` route.
- **Modify** `src/components/AppNavbar.vue` — replace the single "Administración" link with a grouped admin section (subheader + "Productos" + "Pedidos") in both the desktop account menu and the mobile drawer.

---

## Task 1: API constant and admin order methods

**Files:**
- Modify: `src/utils/format.ts`
- Modify: `src/api/services.ts`

- [ ] **Step 1: Add `ORDER_STATUSES` to `src/utils/format.ts`**

Append at the end of the file (after `orderStatusMeta`):

```ts
// Estados válidos de un pedido, en orden de avance del flujo.
export const ORDER_STATUSES = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'] as const
```

- [ ] **Step 2: Add the two methods to `adminApi` in `src/api/services.ts`**

Inside the existing `adminApi` object (currently ending with `deleteProduct`), add these two methods after `deleteProduct`:

```ts
  listAllOrders(status?: string) {
    return apiClient
      .get<Order[]>('/orders/all', { params: status ? { status } : {} })
      .then((r) => r.data)
  },
  updateOrderStatus(id: number, status: string) {
    return apiClient.put<Order>(`/orders/${id}/status`, { status }).then((r) => r.data)
  },
```

Note: `Order` is already imported in `services.ts` (used by `ordersApi`); do not change the import block.

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/utils/format.ts src/api/services.ts
git commit -m "feat: add admin order listing and status-update API"
```

---

## Task 2: Admin orders view

**Files:**
- Create: `src/views/AdminOrdersView.vue`

- [ ] **Step 1: Create `src/views/AdminOrdersView.vue` with the full implementation**

```vue
<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { adminApi } from '@/api/services'
import { getErrorMessage } from '@/api/client'
import type { Order } from '@/api/types'
import { formatPrice, formatDate, orderStatusMeta, ORDER_STATUSES } from '@/utils/format'

const orders = ref<Order[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const statusFilter = ref<string | null>(null)
// Estado elegido por pedido (borrador), comparado contra el estado real para habilitar "Guardar".
const drafts = reactive<Record<number, string>>({})
const savingId = ref<number | null>(null)

const snackbar = ref(false)
const snackText = ref('')
const snackColor = ref<'success' | 'error'>('success')

// Tipados explícitos como string para que el v-model del v-select (string) sea compatible.
const filterItems: { title: string; value: string | null }[] = [
  { title: 'Todos', value: null },
  ...ORDER_STATUSES.map((s) => ({ title: orderStatusMeta(s).label, value: s as string })),
]
const statusItems: { title: string; value: string }[] = ORDER_STATUSES.map((s) => ({
  title: orderStatusMeta(s).label,
  value: s,
}))

function notify(text: string, color: 'success' | 'error' = 'success') {
  snackText.value = text
  snackColor.value = color
  snackbar.value = true
}

async function fetchOrders() {
  loading.value = true
  error.value = null
  try {
    orders.value = await adminApi.listAllOrders(statusFilter.value ?? undefined)
    for (const o of orders.value) drafts[o.id] = o.status
  } catch (e) {
    error.value = getErrorMessage(e, 'No se pudieron cargar los pedidos.')
  } finally {
    loading.value = false
  }
}

async function saveStatus(order: Order) {
  const next = drafts[order.id]
  if (next === order.status) return
  savingId.value = order.id
  try {
    const updated = await adminApi.updateOrderStatus(order.id, next)
    const i = orders.value.findIndex((o) => o.id === order.id)
    if (i !== -1) orders.value[i] = updated
    drafts[updated.id] = updated.status
    notify(`Pedido #${order.id} actualizado a ${orderStatusMeta(updated.status).label}.`)
  } catch (e) {
    notify(getErrorMessage(e, 'No se pudo actualizar el estado.'), 'error')
  } finally {
    savingId.value = null
  }
}

watch(statusFilter, () => fetchOrders())
onMounted(() => fetchOrders())
</script>

<template>
  <v-container class="py-10">
    <div class="d-flex align-center justify-space-between mb-8 flex-wrap ga-4">
      <div>
        <div class="text-overline tracking-wide text-medium-emphasis">Administración</div>
        <h1 class="font-display text-h4 font-weight-bold">Pedidos</h1>
      </div>
      <v-select
        v-model="statusFilter"
        :items="filterItems"
        label="Filtrar por estado"
        density="compact"
        hide-details
        style="max-width: 240px"
      />
    </div>

    <div v-if="loading" class="py-16 text-center">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-alert v-else-if="error" type="error" variant="tonal">{{ error }}</v-alert>

    <div v-else-if="!orders.length" class="text-center py-16">
      <v-icon size="56" class="mb-4 text-medium-emphasis">mdi-package-variant</v-icon>
      <div class="text-h6 mb-2">No hay pedidos</div>
      <p class="text-body-2 text-medium-emphasis">Cuando los clientes compren, aparecerán aquí.</p>
    </div>

    <v-expansion-panels v-else variant="accordion" multiple>
      <v-expansion-panel v-for="order in orders" :key="order.id" elevation="0">
        <v-expansion-panel-title>
          <div class="d-flex align-center justify-space-between flex-grow-1 mr-4 flex-wrap ga-2">
            <div>
              <span class="font-weight-bold">Pedido #{{ order.id }}</span>
              <span class="text-caption text-medium-emphasis ml-2">{{ formatDate(order.createdAt) }}</span>
              <span class="text-caption text-medium-emphasis ml-2">· {{ order.shippingFullName }}</span>
            </div>
            <div class="d-flex align-center ga-3">
              <v-chip :color="orderStatusMeta(order.status).color" size="small" variant="tonal">
                {{ orderStatusMeta(order.status).label }}
              </v-chip>
              <span class="font-weight-bold">{{ formatPrice(order.total) }}</span>
            </div>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div
            v-for="(item, i) in order.items"
            :key="i"
            class="d-flex justify-space-between py-2 text-body-2"
          >
            <span class="text-medium-emphasis">
              {{ item.quantity }}× {{ item.productName }}
              <span class="text-caption">({{ item.size }}/{{ item.color }})</span>
            </span>
            <span>{{ formatPrice(item.lineTotal) }}</span>
          </div>

          <v-divider class="my-3" />

          <div class="text-caption text-medium-emphasis mb-4">
            <v-icon size="16" class="mr-1">mdi-map-marker-outline</v-icon>
            {{ order.shippingFullName }} — {{ order.shippingAddressLine }},
            {{ order.shippingCity }}<template v-if="order.shippingState">, {{ order.shippingState }}</template>
            {{ order.shippingZipCode }}
          </div>

          <!-- Editor de estado (solo admin) -->
          <div class="d-flex align-center ga-3 flex-wrap">
            <v-select
              v-model="drafts[order.id]"
              :items="statusItems"
              label="Estado"
              density="compact"
              hide-details
              style="max-width: 220px"
            />
            <v-btn
              color="primary"
              variant="flat"
              :disabled="drafts[order.id] === order.status"
              :loading="savingId === order.id"
              @click="saveStatus(order)"
            >
              Guardar
            </v-btn>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-snackbar v-model="snackbar" :color="snackColor" location="bottom right" timeout="2500">
      {{ snackText }}
    </v-snackbar>
  </v-container>
</template>
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: build succeeds with no TypeScript or template errors.

- [ ] **Step 3: Commit**

```bash
git add src/views/AdminOrdersView.vue
git commit -m "feat: add admin orders view with status editor"
```

---

## Task 3: Protected route

**Files:**
- Modify: `src/router/index.ts`

- [ ] **Step 1: Add the route**

In the `routes: [...]` array, add this entry directly AFTER the existing `admin-products` route object and BEFORE the `login` route object:

```ts
    {
      path: '/admin/orders',
      name: 'admin-orders',
      component: () => import('@/views/AdminOrdersView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
```

The existing `router.beforeEach` guard already handles `requiresAdmin` — no guard change needed.

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: build succeeds. (`AdminOrdersView.vue` exists from Task 2, so the lazy import resolves.)

- [ ] **Step 3: Commit**

```bash
git add src/router/index.ts
git commit -m "feat: add protected /admin/orders route"
```

---

## Task 4: Navbar admin group

**Files:**
- Modify: `src/components/AppNavbar.vue`

- [ ] **Step 1: Replace the desktop account-menu admin link with a grouped section**

In the `<v-menu>` account dropdown's `<v-list>`, the current admin item is:

```html
            <v-list-item
              v-if="auth.isAdmin"
              to="/admin/products"
              title="Administración"
              prepend-icon="mdi-cog-outline"
            />
```

Replace that single `v-list-item` with:

```html
            <template v-if="auth.isAdmin">
              <v-divider />
              <v-list-subheader>Administración</v-list-subheader>
              <v-list-item to="/admin/products" title="Productos" prepend-icon="mdi-tshirt-crew-outline" />
              <v-list-item to="/admin/orders" title="Pedidos" prepend-icon="mdi-clipboard-list-outline" />
            </template>
```

- [ ] **Step 2: Replace the mobile-drawer admin link with the same group**

In the `<v-navigation-drawer>`'s authenticated block, the current admin item is:

```html
        <v-list-item
          v-if="auth.isAdmin"
          to="/admin/products"
          title="Administración"
          prepend-icon="mdi-cog-outline"
          @click="drawer = false"
        />
```

Replace that single `v-list-item` with:

```html
        <template v-if="auth.isAdmin">
          <v-list-subheader>Administración</v-list-subheader>
          <v-list-item
            to="/admin/products"
            title="Productos"
            prepend-icon="mdi-tshirt-crew-outline"
            @click="drawer = false"
          />
          <v-list-item
            to="/admin/orders"
            title="Pedidos"
            prepend-icon="mdi-clipboard-list-outline"
            @click="drawer = false"
          />
        </template>
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: build succeeds with no errors. (`auth` is already in scope in the navbar's `<script setup>`.)

- [ ] **Step 4: Commit**

```bash
git add src/components/AppNavbar.vue
git commit -m "feat: group admin navbar links into Productos and Pedidos"
```

---

## Task 5: Manual verification (end-to-end)

**Files:** none (verification only)

- [ ] **Step 1: Start backend + dev server**

Ensure `TrueShop.Api` is running on `http://localhost:5150`, then run `npm run dev` and open `http://localhost:5173`.

- [ ] **Step 2: Verify access control**

- As a non-admin (or logged out): the "Administración" group is NOT visible in the account menu/drawer, and navigating to `/admin/orders` redirects (logged-out → login; non-admin → home).
- Log in as Admin: the account menu shows an "Administración" subheader with "Productos" and "Pedidos"; clicking "Pedidos" opens `/admin/orders`.

- [ ] **Step 3: Verify list + filter**

The page lists all orders (newest first) with order #, date, customer name, status chip, and total. Changing "Filtrar por estado" reloads the list filtered by that status; "Todos" shows all.

- [ ] **Step 4: Verify status change**

Expand an order. The "Guardar" button is disabled until you pick a different status in the "Estado" dropdown. Pick a new status → "Guardar" → the button shows a spinner, then a success snackbar appears, the status chip updates, and "Guardar" becomes disabled again (draft now equals the saved status).

- [ ] **Step 5: Verify filtered-save behavior**

With a status filter active (e.g. "Pending"), change an order to a different status (e.g. "Paid") and save. Confirm the order stays visible (does not vanish) until the next reload/filter change.

- [ ] **Step 6: Final build gate**

Run: `npm run build`
Expected: succeeds. No commit needed (verification task).
