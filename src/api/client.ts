import axios from 'axios'

// Base del API. En dev usamos '/api' y dejamos que el proxy de Vite (vite.config.ts)
// lo redirija al backend .NET. Puedes sobreescribirlo con VITE_API_URL.
const baseURL = import.meta.env.VITE_API_URL ?? '/api'

const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// Inserta el token JWT (si existe) en cada petición.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ts_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si el token expira o es inválido, limpia la sesión y manda al login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ts_token')
      localStorage.removeItem('ts_user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

// Extrae un mensaje legible de un error de Axios (usa ProblemDetails del backend).
export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: string; title?: string } | undefined
    return data?.detail ?? data?.title ?? error.message ?? fallback
  }
  return fallback
}

export default apiClient
