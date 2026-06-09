<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { getErrorMessage } from '@/api/client'

const auth = useAuthStore()
const cart = useCartStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const valid = ref(false)

const emailRules = [
  (v: string) => !!v || 'El correo es obligatorio',
  (v: string) => /.+@.+\..+/.test(v) || 'Correo no válido',
]
const passwordRules = [(v: string) => !!v || 'La contraseña es obligatoria']

async function submit() {
  if (!valid.value) return
  loading.value = true
  error.value = null
  try {
    await auth.login(email.value, password.value)
    await cart.load()
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (e) {
    error.value = getErrorMessage(e, 'No se pudo iniciar sesión.')
  } finally {
    loading.value = false
  }
}

function fillDemo() {
  email.value = 'cliente@trueshop.com'
  password.value = 'Cliente123!'
}
</script>

<template>
  <v-container class="py-16">
    <v-row justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <div class="text-center mb-8">
          <div class="brand-title text-h5 mb-2">TrueShop</div>
          <h1 class="font-display text-h5 font-weight-bold">Bienvenido de vuelta</h1>
          <p class="text-body-2 text-medium-emphasis">Inicia sesión para continuar</p>
        </div>

        <v-card variant="outlined" rounded="lg" class="pa-6">
          <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
            {{ error }}
          </v-alert>

          <v-form v-model="valid" @submit.prevent="submit">
            <v-text-field
              v-model="email"
              label="Correo electrónico"
              type="email"
              prepend-inner-icon="mdi-email-outline"
              :rules="emailRules"
              class="mb-2"
            />
            <v-text-field
              v-model="password"
              label="Contraseña"
              :type="showPassword ? 'text' : 'password'"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              :rules="passwordRules"
              @click:append-inner="showPassword = !showPassword"
            />

            <v-btn
              type="submit"
              block
              size="large"
              color="primary"
              variant="flat"
              class="mt-4"
              :loading="loading"
              :disabled="!valid"
            >
              Entrar
            </v-btn>
          </v-form>

          <v-btn
            variant="text"
            size="small"
            block
            class="mt-3"
            prepend-icon="mdi-account-circle-outline"
            @click="fillDemo"
          >
            Usar cuenta de prueba
          </v-btn>
        </v-card>

        <div class="text-center text-body-2 mt-6">
          ¿No tienes cuenta?
          <router-link to="/register" class="text-primary font-weight-medium">Crea una</router-link>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
