import {
    Home,
    Users,
    Tags,
    Package,
    ShoppingCart,
    FileText,
    BarChart2,
    LineChart,
    GitBranch,
    Receipt, GoalIcon, UserCog, Notebook, Gift, Map, Settings
} from "lucide-react";

export interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: Role[];
    children?: Omit<NavItem, "roles" | "children">[];
}

export const NAME_ROLES = {
    ADMIN: "Admin",
    VENDEDOR: "Vendedor",
    USUARIO: "Usuario",
    ADMIN_VENDEDOR: ["Admin", "Vendedor"],
    ADMIN_USUARIO: ["Admin", "Usuario"],
    ALL: ["Admin", "Vendedor", "Usuario"]
}

export type Role = (typeof NAME_ROLES)[keyof typeof NAME_ROLES];

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    "/dashboard": Home,
    "/dashboard/clientes": Users,
    "/dashboard/lista-precios-lote": Tags,
    "/dashboard/productos": Package,
    "/dashboard/tomar-pedido": ShoppingCart,
    "/dashboard/mis-pedidos": FileText,
    "/dashboard/estados-pedidos": GitBranch,
    "/dashboard/comprobantes": Receipt,
    "/dashboard/reportes": BarChart2,
    "/dashboard/reportes/documento-cliente": LineChart,
    "/dashboard/reportes/cobrar-cliente": LineChart,
    "/dashboard/reportes/cobrar-vendedor": LineChart,
    "/dashboard/reportes/metas": GoalIcon,
    "/dashboard/usuarios": UserCog,
    "/dashboard/roles": Notebook,
    "/dashboard/escalas-bonificaciones": Gift,
    "/dashboard/ruta-semanal": Map,
    "/dashboard/configuraciones": Settings,
};