import axios from 'axios';
import { toast } from "@/app/hooks/useToast"

export const publicApi = 'https://backend-difar.backend-l23.click';

const apiClient = axios.create({
  //  baseURL: 'https://3qavkuqp3f.us-west-2.awsapprunner.com/api',
    baseURL: 'https://backend-difar.backend-l23.click/api',
  // baseURL: 'http://localhost:4000/api',
  timeout: 120000,
  // headers: {
  //   'Content-Type': 'application/json',
  // },
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

/**
 * Rutas que exigen sesión en el backend (auditoría 13–14/11/2026: C1, S2, S3): cobranza, amortización,
 * usuarios y roles. Solo a ellas se les agrega el token, para no mandar una cabecera de ~8 KB en todas.
 */
const RUTAS_CON_SESION = /^\/?(amortizacion|planilla-cobranza|recibos|cobranza|usuarios|roles)(\/|\?|$)/;

apiClient.interceptors.request.use((config) => {
  try {
    const ruta = config.url || '';
    if (typeof window !== 'undefined' && RUTAS_CON_SESION.test(ruta)) {
      const token = localStorage.getItem('token');
      const cabeceras: any = config.headers;
      const yaTiene = cabeceras?.Authorization || cabeceras?.authorization;
      if (token && cabeceras && !yaTiene) {
        cabeceras.Authorization = `Bearer ${token}`;
      }
    }
  } catch { /* sin token la petición sigue; el backend responde 401 */ }
  return config;
});

/**
 * Sesión demasiado grande para el servidor.
 * nginx rechaza cabeceras de más de ~8 KB ("400 Request Header Or Cookie Too Large") SIN cabeceras CORS,
 * así que el navegador solo ve un error de red y cada pantalla mostraba su mensaje genérico.
 * Si una petición CON token falla sin respuesta, hay internet y el token es de ese tamaño, se comprueba si el
 * servidor responde a una petición SIN token (B8, auditoría 14/11/2026):
 *   - si responde: el problema era el tamaño de la cabecera -> se avisa (sin rojo) y se vuelve a iniciar sesión;
 *   - si no responde: el servidor está caído o reiniciándose (p. ej. pm2) -> NO se cierra la sesión.
 * Antes se cerraba la sesión ante cualquier corte de red con un token grande.
 */
const LIMITE_TOKEN_SEGURO = 8000;
let renovandoSesion = false;

async function servidorRespondeSinToken(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    await fetch(`${publicApi}/api/contabilidad/informes/catalogo`, { method: 'GET', cache: 'no-store', signal: ctrl.signal });
    clearTimeout(t);
    return true; // cualquier respuesta HTTP (401 incluido) prueba que el servidor está arriba
  } catch {
    return false;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    try {
      const llevabaToken = !!(error?.config?.headers?.Authorization || error?.config?.headers?.authorization);
      if (typeof window !== 'undefined' && llevabaToken && !error?.response && error?.code !== 'ECONNABORTED' && !renovandoSesion) {
        const token = localStorage.getItem('token') || '';
        const enLinea = typeof navigator === 'undefined' || navigator.onLine;
        if (enLinea && token.length > LIMITE_TOKEN_SEGURO) {
          renovandoSesion = true;
          void servidorRespondeSinToken().then((arriba) => {
            if (!arriba) { renovandoSesion = false; return; }
            toast({
              title: 'Tu sesión necesita renovarse',
              description: 'Se actualizaron tus permisos. Vuelve a iniciar sesión para continuar.',
              variant: 'warning',
            });
            localStorage.removeItem('token');
            localStorage.removeItem('lastActivityTime');
            setTimeout(() => { window.location.href = '/'; }, 2500);
          });
        }
      }
    } catch { /* la validación nunca debe romper la petición original */ }
    return Promise.reject(error);
  }
);

export default apiClient;



