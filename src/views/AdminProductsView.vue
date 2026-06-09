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
  // fetchProducts limpia error al iniciar, así que cargamos categorías después
  // para no perder un posible error al cargar el catálogo de categorías.
  await fetchProducts()
  try {
    categories.value = await catalogApi.listCategories()
  } catch (e) {
    error.value = getErrorMessage(e, 'No se pudieron cargar las categorías.')
  }
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
