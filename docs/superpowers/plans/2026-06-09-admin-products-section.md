# Admin Products Section — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-only frontend section to list, create, edit, and delete products, wired to the existing `TrueShop.Api` endpoints.

**Architecture:** New protected route `/admin/products` rendering `AdminProductsView.vue`, which uses the existing `catalogApi` to list products/categories and a new `adminApi` (create/update/delete) over the existing Axios client. Access is gated by an `auth.isAdmin` route guard and conditional navbar links.

**Tech Stack:** Vue 3 (`<script setup lang="ts">`), Vuetify 3, Pinia, Vue Router, Axios, TypeScript.

> **Verification note:** This repo has **no test framework or test script** — its only automated gate is `npm run build` (`vue-tsc -b` full type-check + Vite build). Each task below verifies via `npm run build` (type/compile correctness) plus explicit manual verification in the dev server. Do **not** add a test framework; it is out of scope for this feature.

> **Reference spec:** `docs/superpowers/specs/2026-06-09-admin-products-design.md`

---

## File Structure

- **Create** `src/views/AdminProductsView.vue` — the admin page: product table + create/edit dialog + delete confirm dialog.
- **Modify** `src/api/types.ts` — add `VariantInput`, `ProductCreateInput`, `ProductUpdateInput`.
- **Modify** `src/api/services.ts` — add `adminApi` (createProduct / updateProduct / deleteProduct).
- **Modify** `src/router/index.ts` — add `/admin/products` route + extend guard with `requiresAdmin`.
- **Modify** `src/components/AppNavbar.vue` — add admin links (desktop account menu + mobile drawer), shown only when `auth.isAdmin`.

---

## Task 1: API types and admin service

**Files:**
- Modify: `src/api/types.ts`
- Modify: `src/api/services.ts`

- [ ] **Step 1: Add input types to `src/api/types.ts`**

Append at the end of the file (after `ShippingInfo`):

```ts
// ── Admin: entradas para crear/actualizar productos ──
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

- [ ] **Step 2: Add `adminApi` to `src/api/services.ts`**

Add `ProductCreateInput` and `ProductUpdateInput` to the existing `import type { ... } from './types'` block, then append after the `ordersApi` block:

```ts
// ── Admin (solo rol Admin) ──
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

- [ ] **Step 3: Verify type-check/build passes**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors. (`Product` is already imported in `services.ts`; only the two new input types need adding to the import.)

- [ ] **Step 4: Commit**

```bash
git add src/api/types.ts src/api/services.ts
git commit -m "feat: add admin product input types and adminApi service"
```

---

## Task 2: Protected route + guard

**Files:**
- Modify: `src/router/index.ts`

- [ ] **Step 1: Add the route**

Inside the `routes: [...]` array, add this entry directly after the `orders` route object (before `login`):

```ts
    {
      path: '/admin/products',
      name: 'admin-products',
      component: () => import('@/views/AdminProductsView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
```

- [ ] **Step 2: Extend the navigation guard**

Replace the existing `router.beforeEach` body with:

```ts
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'home' }
  }
  return true
})
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: build succeeds. (The route lazily imports `AdminProductsView.vue`, which does not exist yet — `vue-tsc`/Vite tolerate the dynamic import string at build time, but if the build fails on the missing module, proceed to Task 4 to create the view first, then re-run. Order Task 4 before this verification if needed.)

> **Implementation order note:** If `npm run build` fails here due to the not-yet-created `AdminProductsView.vue`, create the view stub from Task 4 Step 1 first, then return. The commit below can still be made independently.

- [ ] **Step 4: Commit**

```bash
git add src/router/index.ts
git commit -m "feat: add protected /admin/products route with admin guard"
```

---

## Task 3: Navbar admin links (admin-only)

**Files:**
- Modify: `src/components/AppNavbar.vue`

- [ ] **Step 1: Add admin link to the desktop account menu**

In the `<v-menu>` account dropdown's `<v-list>`, add this item after the existing "Mis pedidos" `v-list-item` and before the "Cerrar sesión" item:

```html
            <v-list-item
              v-if="auth.isAdmin"
              to="/admin/products"
              title="Administración"
              prepend-icon="mdi-cog-outline"
            />
```

- [ ] **Step 2: Add admin link to the mobile drawer**

In the `<v-navigation-drawer>`'s authenticated `<template v-if="auth.isAuthenticated">` block, add after the "Mis pedidos" drawer item (before the `<v-divider>`):

```html
        <v-list-item
          v-if="auth.isAdmin"
          to="/admin/products"
          title="Administración"
          prepend-icon="mdi-cog-outline"
          @click="drawer = false"
        />
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: build succeeds with no errors. (`auth` is already in scope in the navbar's `<script setup>`.)

- [ ] **Step 4: Commit**

```bash
git add src/components/AppNavbar.vue
git commit -m "feat: show admin section link in navbar for admins"
```

---

## Task 4: Admin products view

**Files:**
- Create: `src/views/AdminProductsView.vue`

- [ ] **Step 1: Create `src/views/AdminProductsView.vue` with the full implementation**

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { catalogApi, adminApi } from '@/api/services'
import { getErrorMessage } from '@/api/client'
import { formatPrice } from '@/utils/format'
import type {
  Category,
  Product,
  ProductCreateInput,
  ProductUpdateInput,
  VariantInput,
} from '@/api/types'

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Diálogo de crear/editar
const dialog = ref(false)
const editingId = ref<number | null>(null)
const valid = ref(false)
const saving = ref(false)

interface ProductForm {
  name: string
  description: string
  price: number | null
  brand: string
  material: string
  imageUrl: string
  categoryId: number | null
  isActive: boolean
  variants: VariantInput[]
}

function emptyForm(): ProductForm {
  return {
    name: '',
    description: '',
    price: null,
    brand: '',
    material: '',
    imageUrl: '',
    categoryId: null,
    isActive: true,
    variants: [{ size: '', color: '', stockQuantity: 0 }],
  }
}

const form = ref<ProductForm>(emptyForm())
// Variantes existentes (solo lectura) cuando se edita.
const editingVariants = ref<Product['variants']>([])

const nameRules = [(v: string) => !!v || 'El nombre es obligatorio']
const priceRules = [
  (v: number | null) => (v !== null && v > 0) || 'El precio debe ser mayor a 0',
]
const categoryRules = [(v: number | null) => v !== null || 'La categoría es obligatoria']

const tableHeaders = [
  { title: '', key: 'imageUrl', sortable: false, width: 56 },
  { title: 'Nombre', key: 'name' },
  { title: 'Categoría', key: 'categoryName' },
  { title: 'Precio', key: 'price' },
  { title: 'Estado', key: 'isActive' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

async function fetchProducts() {
  loading.value = true
  error.value = null
  try {
    const res = await catalogApi.listProducts({ pageSize: 100, sort: 'newest' })
    products.value = res.items
  } catch (e) {
    error.value = getErrorMessage(e, 'No se pudieron cargar los productos.')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  editingVariants.value = []
  form.value = emptyForm()
  error.value = null
  dialog.value = true
}

function openEdit(product: Product) {
  editingId.value = product.id
  editingVariants.value = product.variants
  form.value = {
    name: product.name,
    description: product.description,
    price: product.price,
    brand: product.brand,
    material: product.material,
    imageUrl: product.imageUrl,
    categoryId: product.categoryId,
    isActive: product.isActive,
    variants: [],
  }
  error.value = null
  dialog.value = true
}

function addVariant() {
  form.value.variants.push({ size: '', color: '', stockQuantity: 0 })
}

function removeVariant(index: number) {
  form.value.variants.splice(index, 1)
}

async function save() {
  if (!valid.value || form.value.price === null || form.value.categoryId === null) return
  saving.value = true
  error.value = null
  try {
    if (editingId.value === null) {
      const payload: ProductCreateInput = {
        name: form.value.name,
        description: form.value.description,
        price: form.value.price,
        brand: form.value.brand,
        material: form.value.material,
        imageUrl: form.value.imageUrl,
        categoryId: form.value.categoryId,
        variants: form.value.variants.filter((v) => v.size.trim() && v.color.trim()),
      }
      await adminApi.createProduct(payload)
    } else {
      const payload: ProductUpdateInput = {
        name: form.value.name,
        description: form.value.description,
        price: form.value.price,
        brand: form.value.brand,
        material: form.value.material,
        imageUrl: form.value.imageUrl,
        categoryId: form.value.categoryId,
        isActive: form.value.isActive,
      }
      await adminApi.updateProduct(editingId.value, payload)
    }
    dialog.value = false
    await fetchProducts()
  } catch (e) {
    error.value = getErrorMessage(e, 'No se pudo guardar el producto.')
  } finally {
    saving.value = false
  }
}

// Eliminar
const deleteDialog = ref(false)
const deleteTarget = ref<Product | null>(null)
const deleting = ref(false)

function askDelete(product: Product) {
  deleteTarget.value = product
  error.value = null
  deleteDialog.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  error.value = null
  try {
    await adminApi.deleteProduct(deleteTarget.value.id)
    deleteDialog.value = false
    deleteTarget.value = null
    await fetchProducts()
  } catch (e) {
    error.value = getErrorMessage(e, 'No se pudo eliminar el producto.')
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  try {
    categories.value = await catalogApi.listCategories()
  } catch (e) {
    error.value = getErrorMessage(e, 'No se pudieron cargar las categorías.')
  }
  await fetchProducts()
})
</script>

<template>
  <v-container class="py-10">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <div class="text-overline tracking-wide text-medium-emphasis">Administración</div>
        <h1 class="font-display text-h4 font-weight-bold">Productos</h1>
      </div>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate">
        Nuevo producto
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
      {{ error }}
    </v-alert>

    <v-data-table
      :headers="tableHeaders"
      :items="products"
      :loading="loading"
      item-value="id"
      density="comfortable"
    >
      <template #[`item.imageUrl`]="{ item }">
        <v-avatar size="40" rounded="sm">
          <v-img :src="item.imageUrl" :alt="item.name" cover />
        </v-avatar>
      </template>
      <template #[`item.price`]="{ item }">
        {{ formatPrice(item.price) }}
      </template>
      <template #[`item.isActive`]="{ item }">
        <v-chip :color="item.isActive ? 'success' : 'secondary'" size="small" variant="tonal">
          {{ item.isActive ? 'Activo' : 'Inactivo' }}
        </v-chip>
      </template>
      <template #[`item.actions`]="{ item }">
        <v-btn icon="mdi-pencil" size="small" variant="text" @click="openEdit(item)" />
        <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="askDelete(item)" />
      </template>
      <template #no-data>
        <div class="py-8 text-medium-emphasis">No hay productos todavía.</div>
      </template>
    </v-data-table>

    <!-- Diálogo crear/editar -->
    <v-dialog v-model="dialog" max-width="640" scrollable>
      <v-card rounded="lg">
        <v-card-title class="font-display">
          {{ editingId === null ? 'Nuevo producto' : 'Editar producto' }}
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-form v-model="valid" @submit.prevent="save">
            <v-text-field v-model="form.name" label="Nombre" :rules="nameRules" class="mb-2" />
            <v-textarea v-model="form.description" label="Descripción" rows="3" class="mb-2" />
            <v-text-field
              v-model.number="form.price"
              label="Precio"
              type="number"
              prefix="$"
              :rules="priceRules"
              class="mb-2"
            />
            <v-text-field v-model="form.brand" label="Marca" class="mb-2" />
            <v-text-field v-model="form.material" label="Material" class="mb-2" />
            <v-text-field v-model="form.imageUrl" label="URL de imagen" class="mb-2" />
            <v-select
              v-model="form.categoryId"
              :items="categories"
              item-title="name"
              item-value="id"
              label="Categoría"
              :rules="categoryRules"
              class="mb-2"
            />

            <v-switch
              v-if="editingId !== null"
              v-model="form.isActive"
              label="Activo"
              color="primary"
              hide-details
              class="mb-2"
            />

            <!-- Variantes: editor solo al crear -->
            <template v-if="editingId === null">
              <div class="d-flex align-center justify-space-between mt-2 mb-1">
                <div class="text-subtitle-2 font-weight-bold">Variantes</div>
                <v-btn size="small" variant="text" prepend-icon="mdi-plus" @click="addVariant">
                  Agregar
                </v-btn>
              </div>
              <div
                v-for="(variant, i) in form.variants"
                :key="i"
                class="d-flex ga-2 align-center mb-2"
              >
                <v-text-field v-model="variant.size" label="Talla" hide-details density="compact" />
                <v-text-field v-model="variant.color" label="Color" hide-details density="compact" />
                <v-text-field
                  v-model.number="variant.stockQuantity"
                  label="Stock"
                  type="number"
                  hide-details
                  density="compact"
                  style="max-width: 96px"
                />
                <v-btn
                  icon="mdi-close"
                  size="small"
                  variant="text"
                  @click="removeVariant(i)"
                />
              </div>
            </template>

            <!-- Variantes existentes: solo lectura al editar -->
            <template v-else>
              <div class="text-subtitle-2 font-weight-bold mt-2 mb-1">Variantes</div>
              <div class="text-caption text-medium-emphasis mb-2">
                Las variantes se gestionan desde el backend.
              </div>
              <v-chip
                v-for="variant in editingVariants"
                :key="variant.id"
                size="small"
                variant="outlined"
                class="mr-2 mb-2"
              >
                {{ variant.size }} · {{ variant.color }} · {{ variant.stockQuantity }} en stock
              </v-chip>
              <div v-if="!editingVariants.length" class="text-caption text-medium-emphasis">
                Sin variantes.
              </div>
            </template>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" :disabled="!valid" @click="save">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo eliminar -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-title class="font-display">Eliminar producto</v-card-title>
        <v-card-text>
          ¿Seguro que deseas eliminar
          <strong>{{ deleteTarget?.name }}</strong>? Esta acción no se puede deshacer.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="confirmDelete">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: build succeeds with no TypeScript or template errors.

- [ ] **Step 3: Commit**

```bash
git add src/views/AdminProductsView.vue
git commit -m "feat: add admin products view with create/edit/delete"
```

---

## Task 5: Manual verification (end-to-end)

**Files:** none (verification only)

- [ ] **Step 1: Start backend + dev server**

Ensure `TrueShop.Api` is running on `http://localhost:5150`, then run:
`npm run dev` → open `http://localhost:5173`

- [ ] **Step 2: Verify access control**

- Logged out or as a non-admin: navigating to `/admin/products` redirects to `/`, and the "Administración" link is **not** visible in the account menu/drawer.
- Log in with an Admin account: the "Administración" link appears; clicking it opens `/admin/products`.

- [ ] **Step 3: Verify list**

The table loads existing products with image, name, category, price (formatted MXN), and an active/inactive chip.

- [ ] **Step 4: Verify create**

Click "Nuevo producto", fill name/price/category and at least one variant (talla, color, stock), Save. Dialog closes; the new product appears in the table. Try invalid input (empty name, price 0) and confirm validation blocks save / backend error shows in the alert.

- [ ] **Step 5: Verify edit**

Click the pencil on a product. Confirm fields are prefilled, the "Activo" switch shows, and existing variants render read-only with the backend note. Change a field and the active toggle, Save, and confirm the table reflects the change.

- [ ] **Step 6: Verify delete**

Click the trash icon, confirm in the dialog, and verify the product disappears from the table.

- [ ] **Step 7: Final build gate**

Run: `npm run build`
Expected: succeeds. No commit needed (verification task).
```
