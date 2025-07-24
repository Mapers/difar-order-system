import { Home, Users, Tags, Package, ShoppingCart, FileText, BarChart2, LineChart } from "lucide-react";

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


export const NAV_ITEMS: NavItem[] = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: Home,
        roles: [NAME_ROLES.ADMIN],
    },
    {
        title: "Clientes",
        href: "/dashboard/clientes",
        icon: Users,
        roles: [NAME_ROLES.VENDEDOR],
    },
    {
        title: "Lista de precios por lote",
        href: "/dashboard/lista-precios-lote",
        icon: Tags,
        roles: [NAME_ROLES.VENDEDOR],
    },
    {
        title: "Productos",
        href: "/dashboard/productos",
        icon: Package,
        roles: [NAME_ROLES.ADMIN],
    },
    {
        title: "Tomar Pedido",
        href: "/dashboard/tomar-pedido",
        icon: ShoppingCart,
        roles: [NAME_ROLES.ADMIN],
    },
    {
        title: "Mis Pedidos",
        href: "/dashboard/mis-pedidos",
        icon: FileText,
        roles: [NAME_ROLES.ADMIN],
    },
    {
        title: "Reportes",
        href: "/dashboard/reportes",
        icon: BarChart2,
        roles: [NAME_ROLES.ADMIN],
        children: [
            {
                title: "Consulta Documento Cliente",
                href: "/dashboard/reportes/documento-cliente",
                icon: LineChart,
            },
            {
                title: "Consulta Cobrar Cliente",
                href: "/dashboard/reportes/cobrar-cliente",
                icon: LineChart,
            },
            {
                title: "Consulta Cobrar Vendedor",
                href: "/dashboard/reportes/cobrar-vendedor",
                icon: LineChart,
            },
        ],
    },
];
