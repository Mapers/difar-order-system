export interface DocVencido {
    Fecha_Emision: string;
    Fecha_Vcto: string;
    Abreviatura: string;
    Serie_Numero: string;
    Simbolo: string;
    Provision: number;
    Amortizacion: number;
    Saldo: number;
    Saldo_Soles: number;
    Saldo_Dolares: number;
}

export interface ClienteVencido {
    Cliente: string;
    Direccion: string;
    Telefono: string;
    documentos: DocVencido[];
    totalSolesCliente: number;
    totalDolaresCliente: number;
}

export interface ZonaVencida {
    NombreZona: string;
    clientes: ClienteVencido[];
    totalSolesZona: number;
    totalDolaresZona: number;
}

export interface VendedorVencido {
    Vendedor: string;
    zonas: ZonaVencida[];
    totalSolesVendedor: number;
    totalDolaresVendedor: number;
}