import { useMemo } from "react";
import { Home, LineChart, Sparkles, HandCoins, ArrowLeftRight, BookText, FileBarChart, Landmark, BadgePercent, Settings2, ShoppingCart, Boxes, FolderOpen } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { ICON_MAP } from "@/constants/roles";
import { SHOW_TOMAR_PEDIDO_ALPHA } from "@/constants/featureFlags";

type NavIcon = React.ComponentType<{ className?: string }>;

export interface NavChild {
  id: string;
  title: string;
  href: string;
  icon: NavIcon;
  /** Tercer nivel: si el hijo es un GRUPO (menú sin ruta con sus propias opciones). */
  children?: NavChild[];
}

/** Íconos de los grupos (no tienen ruta, así que no están en ICON_MAP). */
const ICONOS_GRUPO: Record<string, NavIcon> = {
  // Grupos reales del Access (3soj SISTEMAS Contable): Datos Movimientos / Datos Fijos / Informes Contables
  "Datos Movimientos": ArrowLeftRight,
  "Datos Fijos": Settings2,
  "Informes Contables": FileBarChart,
  // Nombres antiguos (por compatibilidad si quedara algún grupo previo)
  "Cobranzas": HandCoins,
  "Datos de Movimientos": ArrowLeftRight,
  "Libros Contables": BookText,
  "Registros e Informes": FileBarChart,
  "SUNAT": Landmark,
  "Comisiones": BadgePercent,
};

/**
 * Reportes: agrupación SOLO visual (no cambia tablas ni permisos). Cada rol sigue viendo
 * exactamente los reportes que tiene habilitados; aquí solo se ordenan en grupos.
 * Un reporte nuevo que no esté en esta lista cae en "Otros reportes" para que nunca se pierda.
 */
const RUTA_REPORTES = "/dashboard/reportes";
const GRUPOS_REPORTES: { id: string; titulo: string; icono: NavIcon; rutas: string[] }[] = [
  {
    id: "reportes-cobranza", titulo: "Cobranza", icono: HandCoins,
    rutas: [
      "/dashboard/reportes/cuenta-cliente",
      "/dashboard/reportes/saldos-cliente",
      "/dashboard/reportes/saldos-vencidos",
      "/dashboard/reportes/documento-cliente",
      "/dashboard/reportes/cobranza-ventas-mes",
    ],
  },
  {
    id: "reportes-ventas", titulo: "Ventas", icono: ShoppingCart,
    rutas: [
      "/dashboard/reportes/ventas-totales",
      "/dashboard/reportes/informe-laboratorio-vendedor",
      "/dashboard/reportes/metas",
      "/dashboard/reportes/hoja-en-blanco",
      "/dashboard/reportes/registro-ventas-comprobantes",
    ],
  },
  {
    id: "reportes-inventario", titulo: "Inventario", icono: Boxes,
    rutas: [
      "/dashboard/reportes/item-kardex",
      "/dashboard/reportes/toma-inventario",
      "/dashboard/reportes/psicotropicos",
    ],
  },
];

function agruparReportes(hijos: NavChild[]): NavChild[] {
  // Si algún día los grupos vienen desde la base, se respeta lo que venga.
  if (hijos.some((h) => h.children)) return hijos;
  const usados = new Set<string>();
  const grupos: NavChild[] = [];
  for (const g of GRUPOS_REPORTES) {
    const opciones = g.rutas
      .map((ruta) => hijos.find((h) => h.href === ruta))
      .filter((h): h is NavChild => !!h);
    opciones.forEach((o) => usados.add(o.id));
    if (opciones.length) grupos.push({ id: g.id, title: g.titulo, href: opciones[0].href, icon: g.icono, children: opciones });
  }
  const otros = hijos.filter((h) => !usados.has(h.id));
  if (otros.length) grupos.push({ id: "reportes-otros", title: "Otros reportes", href: otros[0].href, icon: FolderOpen, children: otros });
  return grupos;
}

export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: NavIcon;
  children?: NavChild[];
}

/**
 * Transforma el `user.menus` plano (con id_padre) que viene del auth context
 * en el árbol de navegación que consumen SideNav y MobileNav.
 */
export function useMenuItems(): NavItem[] {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user?.menus || user.menus.length === 0) return [];

    const rootMenus = user.menus.filter((menu) => !menu.id_padre);
    const childMenus = user.menus.filter((menu) => menu.id_padre);

    const items: NavItem[] = rootMenus.map((menu) => {
      const children = childMenus
        .filter((child) => String(child.id_padre) === String(menu.id))
        .map((child) => {
          // Tercer nivel: opciones cuyo padre es este hijo (el hijo es un grupo).
          const nietos = childMenus
            .filter((n) => String(n.id_padre) === String(child.id))
            .map((n) => ({ id: n.id, title: n.nombre, href: n.ruta, icon: ICON_MAP[n.ruta] || LineChart }));
          return {
            id: child.id,
            title: child.nombre,
            href: child.ruta || nietos[0]?.href || menu.ruta,
            icon: ICON_MAP[child.ruta] || ICONOS_GRUPO[child.nombre] || LineChart,
            children: nietos.length > 0 ? nietos : undefined,
            tieneRuta: !!child.ruta,
          };
        })
        // Un grupo (sin ruta) que no tiene opciones habilitadas para el rol no se muestra.
        .filter((child) => child.children || child.tieneRuta)
        .map(({ tieneRuta, ...child }) => child);

      const esReportes = String(menu.ruta || "").replace(/\/+$/, "") === RUTA_REPORTES;
      const hijos = esReportes ? agruparReportes(children) : children;

      return {
        id: menu.id,
        title: menu.nombre,
        href: menu.ruta,
        icon: ICON_MAP[menu.ruta] || Home,
        children: hijos.length > 0 ? hijos : undefined,
      };
    });

    // Item de desarrollo, no viene del backend: se inyecta si el flag
    // SHOW_TOMAR_PEDIDO_ALPHA está en true (para validar en local sin
    // exponerlo a todos), o si el usuario logueado es la cuenta de pruebas
    // "web-aws" (visible siempre para esa cuenta, sin tocar el flag global).
    // Si el backend ya trae la ruta en el menú no se inyecta: tendría el mismo
    // href y las dos entradas se marcarían activas a la vez.
    const yaEnMenu = (href: string) => items.some((item) => item.href === href);

    const esUsuarioDePruebas = user?.nombreCompleto?.trim().toLowerCase() === "web-aws";
    if ((SHOW_TOMAR_PEDIDO_ALPHA || esUsuarioDePruebas) && !yaEnMenu("/dashboard/tomar-pedido-alpha")) {
      const tomarPedidoIndex = items.findIndex((item) => item.href === "/dashboard/tomar-pedido");
      const alphaItem = {
        id: "tomar-pedido-alpha",
        title: "Tomar Pedido Alpha",
        href: "/dashboard/tomar-pedido-alpha",
        icon: Sparkles,
      };
      const insertAt = tomarPedidoIndex >= 0 ? tomarPedidoIndex + 1 : items.length;
      items.splice(insertAt, 0, alphaItem);
    }

    return items;
  }, [user?.menus, user?.nombreCompleto]);
}
