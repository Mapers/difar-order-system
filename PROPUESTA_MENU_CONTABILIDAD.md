# Propuesta: rediseño del menú Contabilidad (rama `contabilidad_v3`, 14/11/2026)

> **Solo es una propuesta.** No se ejecutó nada en la base. El script está en
> `docs/contabilidad/propuesta_menu_contabilidad_v3.sql` y se ejecuta solo con aprobación.

## Problema actual
- "Contabilidad" (menú 23) tiene **16 opciones a un solo nivel**, en un orden que salió de cómo se fueron agregando. Hay órdenes repetidos (4, 12) y un reporte movido desde Reportes (44).
- Con las 11 pantallas nuevas de esta rama serían **27 opciones en una sola lista**.
- La barra lateral (`hooks/useMenuItems.ts`, `components/nav/NavMenu.tsx`) solo soporta **2 niveles**: menú padre → hijos.

## Propuesta: agrupar como en Access (Datos Movimientos / Datos Fijos / Informes Contables)

```
Contabilidad
├── 💰 Cobranzas
│   ├── Cliente Cobranza                      (24)
│   ├── Planilla de Cobranza                  (26)
│   ├── Asignación de Cobranzas               (35)
│   └── Recibo Cuenta Cliente                 (33)
├── 📥 Datos de Movimientos
│   ├── Libro Caja y Bancos                   (37)
│   └── Registro de Compras e Inventarios     (39)
├── 📒 Libros Contables
│   ├── Libro Diario                          (NUEVO)
│   ├── Libro Mayor                           (NUEVO)
│   ├── Movimiento de Sub Cuenta              (38)
│   ├── Cuentas Contables                     (NUEVO)
│   └── Estados Financieros y Balances        (NUEVO)
├── 📊 Registros e Informes
│   ├── Informes Registro de Ventas           (52)
│   ├── Informes Registro de Compras          (53)
│   ├── Informes Proveedores                  (62)
│   └── Saldo Docs. por Pagar Proveedor       (44)
├── 🏛️ SUNAT
│   ├── PLE - Libros Electrónicos             (54)
│   └── SIRE - Ventas y Compras               (55)
├── 🏷️ Comisiones
│   ├── Comisión de Ventas                    (41)
│   └── Comisión de Cobranza                  (42)
└── ⚙️ Datos Fijos
    ├── Plan Contable                         (63)
    ├── Personas y Empresas                   (NUEVO)
    ├── Artículos (Bienes y Servicios)        (NUEVO)
    ├── Tipo de Cambio                        (NUEVO)
    ├── IGV                                   (NUEVO)
    ├── Año y Meses                           (NUEVO)
    └── Catálogos (Datos de Control)          (NUEVO)
```
Son 7 grupos y 26 opciones. Cada grupo tiene 2 a 7 opciones, en lugar de una lista de 27.

## Dos formas de implementarlo

| | **A) Grupos dentro de Contabilidad, a 3 niveles (recomendada)** | B) Grupos como menús de primer nivel |
|---|---|---|
| Cómo se ve | Un solo "Contabilidad" que se despliega en 7 grupos, y cada grupo despliega sus opciones | 7 menús nuevos en la barra principal ("Cobranzas", "Libros Contables"…) al lado de Clientes, Pedidos, etc. |
| Cambio en la base | 7 filas de grupo (`ruta` NULL, `id_padre` = 23); las opciones pasan a `id_padre` = grupo | 7 filas de grupo (`id_padre` NULL); las opciones pasan a `id_padre` = grupo; se desactiva el 23 |
| Cambio de código | Front, unos 3 archivos: `useMenuItems.ts` (árbol recursivo), `NavMenu.tsx`/`mobile-nav.tsx` (pintar el 3.er nivel) y `dashboard/roles/page.tsx` (asignar permisos por grupo) | Ninguno |
| Ventaja | Todo lo contable queda en un solo lugar, ordenado como en Access | Rápida, sin tocar código |
| Desventaja | Hay que tocar el front | La barra principal pasa de 16 a 22 entradas y se mezcla contabilidad con ventas |

## ⚠️ Condición previa: el tamaño del token (nginx)
- El JWT lleva la lista de menús del usuario, y nginx rechaza cabeceras de más de 8 KB.
- Las 11 pantallas nuevas y los 7 grupos suman unos 2.9 KB al token:

| Rol | Token hoy | Con 11 nuevas | Con 11 nuevas + 7 grupos |
|---|---|---|---|
| 6 Contabilidad Chimbote | 5.9 KB | 7.9 KB | ≈ 8.8 KB ❌ |
| 2 Administrativo Chimbote | 6.4 KB | 8.4 KB ❌ | ≈ 9.3 KB ❌ |
| 3 Gerente / 5 Adm. AWS | 7.7 KB | 9.7 KB ❌ | ≈ 10.6 KB ❌ |

**Antes de aplicar cualquiera de las dos formas hay que arreglar nginx** (un `reload`, no corta a nadie):
```bash
echo 'large_client_header_buffers 4 32k;' | sudo tee /etc/nginx/conf.d/large_headers.conf
sudo nginx -t && sudo systemctl reload nginx
```
La otra salida es el rediseño del JWT (token chico y menús por endpoint; deuda técnica #8).

## Orden sugerido
1. Arreglar nginx y verificarlo: un token de prueba de 9 KB debe devolver 401, no 400.
2. Subir esta rama (front y backend) a master y main.
3. Si se elige A, cambiar el front para los 3 niveles; en B no hay que cambiar nada.
4. Ejecutar el script SQL de la opción elegida y pedir a los usuarios que vuelvan a iniciar sesión.
