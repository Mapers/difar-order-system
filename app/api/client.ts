import axios from 'axios';
import { toast } from "@/hooks/use-toast"

const apiClient = axios.create({
  // baseURL: 'https://3qavkuqp3f.us-west-2.awsapprunner.com/api',
  baseURL: 'http://localhost:4000/api'
});

// ✅ Interceptor de solicitud: agregar token automáticamente
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token')
//     if (token) {
//       config.headers['Authorization'] = `Bearer ${token}`
//     }
//     return config
//   },
//   (error) => {
//     return Promise.reject(error)
//   }
// )


// Interceptor de respuesta: manejo global de errores
// apiClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response) {
//       const status = error.response.status
//       const message = error.response.data?.message || 'Error inesperado'

//       if (status === 401) {
//         toast({ title: "", description: "Sesión expirada. Por favor, inicia sesión nuevamente.", variant: "error" })
//         // se puede mandar a login
//       } else if (status === 500) {
//         toast({ title: "", description: "Error interno del servidor. Inténtalo más tarde.", variant: "error" })
//       } else {
//         toast({ title: "", description: message, variant: "error" }) // otros errores generales (400,403)
//       }
//     } else if (error.request) {
//       toast({ title: "", description: "No se puedo conectar con el servidor..", variant: "error" })// No hubo respuesta del servidor (network error)
//     } else {
//       toast({ title: "", description: "Ocurrió un error inesperado.", variant: "error" })// Algo falló en la configuración del request
//     }

//     return Promise.reject(error)
//   }
// )

export default apiClient;
