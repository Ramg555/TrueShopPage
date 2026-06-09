import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { useAuthStore } from './stores/auth'
import './styles/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

// Rehidrata la sesión (token en localStorage) antes de montar.
useAuthStore().restore()

app.mount('#app')
