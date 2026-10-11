import { useMemo } from "react";
import { Home, LineChart, Sparkles, FilePlus2 } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { ICON_MAP } from "@/constants/roles";
import { SHOW_TOMAR_PEDIDO_ALPHA, SHOW_TOMAR_PEDIDO_HOJA_BLANCO } from "@/constants/featureFlags";

type NavIcon = React.ComponentType<{ className?: string }>;

export interface NavChild {
  id: string;
  title: string;
  href: string;
  icon: NavIcon;
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

    const items = rootMenus.map((menu) => {
      const children = childMenus
        .filter((child) => child.id_padre === menu.id)
        .map((child) => ({
          id: child.id,
          title: child.nombre,
          href: child.ruta,
          icon: ICON_MAP[child.ruta] || LineChart,
        }));

      return {
        id: menu.id,
        title: menu.nombre,
        href: menu.ruta,
        icon: ICON_MAP[menu.ruta] || Home,
        children: children.length > 0 ? children : undefined,
      };
    });

    // Item de desarrollo, no viene del backend: se inyecta si el flag
    // SHOW_TOMAR_PEDIDO_ALPHA está en true (para validar en local sin
    // exponerlo a todos), o si el usuario logueado es la cuenta de pruebas
    // "web-aws" (visible siempre para esa cuenta, sin tocar el flag global).
    const esUsuarioDePruebas = user?.nombreCompleto?.trim().toLowerCase() === "web-aws";
    if (SHOW_TOMAR_PEDIDO_ALPHA || esUsuarioDePruebas) {
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

    // Item de desarrollo, no viene del backend: formulario de Registro de
    // Ventas migrado de Access ("Facturas"), en validacion. Se inyecta
    // justo debajo de "Comprobantes". No confundir con "Hoja en Blanco"
    // (reporte de despachos serie 0800, dentro de Reportes) - son pantallas
    // distintas.
    if (SHOW_TOMAR_PEDIDO_HOJA_BLANCO) {
      const comprobantesIndex = items.findIndex((item) => item.href === "/dashboard/comprobantes");
      const hojaBlancaItem = {
        id: "tomar-pedido-hoja-blanco",
        title: "Tomar Pedido Hoja en Blanco",
        href: "/dashboard/tomar-pedido-hoja-blanco",
        icon: FilePlus2,
      };
      const insertHojaBlancaAt = comprobantesIndex >= 0 ? comprobantesIndex + 1 : items.length;
      items.splice(insertHojaBlancaAt, 0, hojaBlancaItem);
    }

    return items;
  }, [user?.menus, user?.nombreCompleto]);
}
