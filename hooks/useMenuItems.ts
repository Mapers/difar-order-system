import { useMemo } from "react";
import { Home, LineChart } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { ICON_MAP } from "@/constants/roles";

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

    return rootMenus.map((menu) => {
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
  }, [user?.menus]);
}
