import { CaminoGuia, PantallaGuia } from "../tipos"

// Guía: grupos "Registros e Informes" y "SUNAT".
// Todo lo dicho aquí se verificó en el código (front, backend y cuerpo de los SP) el 20/11/2026.
// Los ids data-guia "pestanas", "descripcion-informe", "filtros", "consultar", "resumen", "tabla",
// "exportar-pdf" y "exportar-excel" son compartidos con Libros (PaginaInformes / FiltrosPeriodo).

const NO_GUARDA = "Es solo una consulta: no guarda ni cambia nada."

export const pantallas: PantallaGuia[] = [
    // ------------------------------------------------------------------ Informes Registro de Ventas
    {
        ruta: "/dashboard/contabilidad/informes-registro-ventas",
        nombre: "Informes Registro de Ventas",
        grupo: "Registros e Informes",
        resumen: "Aquí revisas el registro de ventas del mes antes de declarar: en soles, en dólares, boletas resumidas, correlativos, guías facturadas y ventas del año.",
        pasos: [
            {
                guia: "pestanas",
                titulo: "Pestañas de informes",
                queHace: "Aquí eliges qué informe ver: Soles, Dólares, Resumido BV, Correlativos, Guías facturadas o Ventas por año.",
                quePasa: "Al cambiar de pestaña la tabla se limpia. Vuelve a pulsar Consultar.",
            },
            {
                guia: "descripcion-informe",
                titulo: "Qué trae este informe",
                queHace: "Lee esta línea: te explica qué muestra la pestaña elegida y a qué opción de Access reemplaza.",
            },
            {
                guia: "periodo",
                titulo: "Año y Mes",
                queHace: "Elige el año y el mes. Ya viene puesto el mes anterior, que es el que normalmente declaras.",
                quePasa: "En Correlativos y Ventas por año solo eliges el año. En Guías facturadas pones las fechas Desde y Hasta.",
            },
            {
                guia: "consultar",
                titulo: "Consultar",
                queHace: "Pulsa Consultar para traer las ventas del periodo.",
                quePasa: "Los datos salen del registro de ventas (lo que se cargó con Actualiza Ventas APP). " + NO_GUARDA,
                tablas: "registro de ventas, mnombrerazsoc, mtipomoneda, mtipodocumento, documento identidad, empresas control, meses, mtipocambiousd; Guías facturadas: vta_comprobante_cab, vta_comprobante_sunat, lgt_guia_rem_cab, difarf2024.efabvcab",
            },
            {
                guia: "resumen",
                titulo: "Totales del periodo",
                queHace: "Mira aquí cuántos registros hay y los totales. En Soles todo sale en S/; en Dólares, en US$.",
                quePasa: "Los documentos en dólares se pasan a S/ con su tipo de cambio en la pestaña Soles.",
            },
            {
                guia: "tabla",
                titulo: "Detalle documento por documento",
                queHace: "Revisa cada comprobante: fecha, cliente, RUC o DNI, base imponible, IGV y total en S/.",
                quePasa: "En las notas de crédito verás también el documento al que hacen referencia.",
            },
            {
                titulo: "Correlativos",
                queHace: "En la pestaña Correlativos revisa la columna Revisa: si no es 0, en esa serie faltan números o hay repetidos.",
                despues: "Corrige esos comprobantes antes de generar el SIRE o el PLE.",
            },
            {
                titulo: "Resumido BV",
                queHace: "Usa Resumido BV para ver las boletas agrupadas en una sola línea (número desde–hasta).",
            },
            {
                guia: "exportar-pdf",
                titulo: "PDF",
                queHace: "Pulsa PDF para ver la vista previa del informe. Ahí puedes cambiar el título, imprimir o descargar.",
                quePasa: "Se activa solo cuando ya consultaste y hay datos.",
            },
            {
                guia: "exportar-excel",
                titulo: "Excel",
                queHace: "Pulsa Excel para descargar la misma tabla en una hoja de cálculo.",
                despues: "Cuando el registro cuadre, genera los archivos en SIRE - Ventas y Compras (Ventas Anexo 03) y en PLE (14.1).",
            },
        ],
    },

    // ------------------------------------------------------------------ Informes Registro de Compras
    {
        ruta: "/dashboard/contabilidad/informes-registro-compras",
        nombre: "Informes Registro de Compras",
        grupo: "Registros e Informes",
        resumen: "Aquí revisas el registro de compras del mes antes de declarar: en soles, en dólares, percepciones, pendientes de SIRE y compras del año.",
        pasos: [
            {
                guia: "pestanas",
                titulo: "Pestañas de informes",
                queHace: "Aquí eliges qué informe ver: Soles, USD, Percepciones, SIRE pendientes o Compras por año.",
                quePasa: "Al cambiar de pestaña la tabla se limpia. Vuelve a pulsar Consultar.",
            },
            {
                guia: "descripcion-informe",
                titulo: "Qué trae este informe",
                queHace: "Lee esta línea: te explica qué muestra la pestaña elegida y a qué opción de Access reemplaza.",
            },
            {
                guia: "periodo",
                titulo: "Año y Mes",
                queHace: "Elige el año y el mes. Ya viene puesto el mes anterior.",
                quePasa: "En Compras por año solo eliges el año.",
            },
            {
                guia: "consultar",
                titulo: "Consultar",
                queHace: "Pulsa Consultar para traer las compras del periodo.",
                quePasa: "Los datos salen del registro de compras, que se llena al grabar y revisar cada factura en Registro de Compras. " + NO_GUARDA,
                tablas: "registro de compras, reg compras encabezado, reg compras detalle, mnombrerazsoc, mtipomoneda, mtipodocumento, documento identidad, empresas control, meses",
            },
            {
                guia: "resumen",
                titulo: "Totales del periodo",
                queHace: "Mira aquí cuántos registros hay y los totales. En Soles todo sale en S/; en USD, en US$.",
            },
            {
                guia: "tabla",
                titulo: "Detalle documento por documento",
                queHace: "Revisa cada compra: número de registro, fecha, proveedor, RUC, tipo de cambio, no gravado, base imponible, IGV y total.",
            },
            {
                titulo: "SIRE pendientes",
                queHace: "En esta pestaña ves las compras que tienen CAR SIRE pero todavía no se marcaron como revisadas.",
                despues: "Revísalas antes de generar los anexos de compras del SIRE.",
            },
            {
                titulo: "Percepciones",
                queHace: "Aquí ves las compras del mes con percepción del IGV y su importe en S/.",
            },
            {
                titulo: "Compras por año",
                queHace: "Úsala para ver todas las compras del año, una fila por documento, con su CAR SIRE y si ya está revisada.",
            },
            {
                guia: "exportar-pdf",
                titulo: "PDF",
                queHace: "Pulsa PDF para ver la vista previa del informe. Ahí puedes cambiar el título, imprimir o descargar.",
            },
            {
                guia: "exportar-excel",
                titulo: "Excel",
                queHace: "Pulsa Excel para descargar la misma tabla en una hoja de cálculo.",
                despues: "Cuando el registro cuadre, genera los archivos en SIRE - Ventas y Compras (anexos de compras) y en PLE (8.1 y 8.2).",
            },
        ],
    },

    // ------------------------------------------------------------------ Informes Proveedores
    {
        ruta: "/dashboard/contabilidad/informes-proveedores",
        nombre: "Informes Proveedores",
        grupo: "Registros e Informes",
        resumen: "Aquí consultas la cuenta corriente de los proveedores, qué documentos vencen (programa de pagos) y las compras de un proveedor en el año.",
        pasos: [
            {
                guia: "pestanas",
                titulo: "Pestañas de informes",
                queHace: "Aquí eliges el informe: Cuenta corriente, Programa de pagos o Detalle por año.",
                quePasa: "Cada pestaña muestra sus propios filtros.",
            },
            {
                guia: "enlace-saldo-proveedores",
                titulo: "Saldo a una fecha de corte",
                queHace: "Si necesitas el saldo de proveedores a una fecha, usa este enlace: te lleva a Saldo de Documentos por Pagar Proveedor.",
            },
            {
                guia: "filtro-proveedor",
                titulo: "Proveedor",
                queHace: "Escribe el RUC o el nombre (mínimo 2 letras) y elige el proveedor. En Cuenta corriente es opcional: vacío trae a todos.",
                quePasa: "En Detalle por año es obligatorio: si no lo eliges, el campo se marca y se abre la lista.",
            },
            {
                guia: "filtro-documento",
                titulo: "Documento",
                queHace: "En Cuenta corriente, si quieres ver un solo documento, escríbelo como TIPO-SERIE-NÚMERO (por ejemplo 80-08-2025018014).",
            },
            {
                guia: "filtro-vencimiento",
                titulo: "Vencimiento desde / hasta",
                queHace: "Opcional: pon fechas para ver solo los documentos que vencen en ese rango.",
            },
            {
                guia: "periodo",
                titulo: "Fechas o año",
                queHace: "En Programa de pagos pon Desde y Hasta (fechas de vencimiento). En Detalle por año elige el año.",
            },
            {
                guia: "filtro-tipo-doc",
                titulo: "Documentos",
                queHace: "En Programa de pagos elige si quieres ver Todos, solo Facturas o solo Letras.",
            },
            {
                guia: "consultar",
                titulo: "Consultar",
                queHace: "Pulsa Consultar para traer el informe.",
                quePasa: "Cuenta corriente y Programa de pagos salen del kardex de proveedores (provisión y pagos). Detalle por año sale del registro de compras. " + NO_GUARDA,
                tablas: "kardex proveedores, registro de compras, mnombrerazsoc, mtipodocumento, mtipomoneda, mtipoamortizacion, modulo de trabajo",
            },
            {
                guia: "resumen",
                titulo: "Totales",
                queHace: "Mira aquí cuántos registros hay y los saldos: Saldo S/ y Saldo US$ por separado.",
            },
            {
                guia: "tabla",
                titulo: "Detalle",
                queHace: "Revisa cada documento con su provisión, sus pagos (amortización) y el saldo que queda.",
                quePasa: "Programa de pagos solo muestra documentos con saldo pendiente, ordenados por fecha de vencimiento.",
            },
            {
                guia: "exportar-pdf",
                titulo: "PDF",
                queHace: "Pulsa PDF para ver la vista previa del informe e imprimirlo o descargarlo.",
            },
            {
                guia: "exportar-excel",
                titulo: "Excel",
                queHace: "Pulsa Excel para descargar la tabla en una hoja de cálculo.",
            },
        ],
    },

    // ------------------------------------------------------------------ Saldo de Documentos por Pagar Proveedor
    {
        ruta: "/dashboard/reportes/saldo-proveedores",
        nombre: "Saldo de Documentos por Pagar Proveedor",
        grupo: "Registros e Informes",
        resumen: "Aquí ves cuánto debes a cada proveedor a una fecha de corte, documento por documento, en S/ y en US$.",
        pasos: [
            {
                guia: "saldo-proveedor",
                titulo: "Proveedor (vacío = todos)",
                queHace: "Elige un proveedor o déjalo vacío para ver a todos. Puedes buscar por nombre o RUC.",
                quePasa: "La lista solo trae a los proveedores con saldo a la fecha de corte, con su saldo en S/.",
            },
            {
                guia: "saldo-fecha-corte",
                titulo: "Fecha de corte",
                queHace: "Pon la fecha a la que quieres el saldo. Ya viene la fecha de hoy.",
                quePasa: "Solo se cuentan los movimientos hasta esa fecha.",
            },
            {
                guia: "saldo-duplicados",
                titulo: "Excluir duplicados",
                queHace: "Déjalo activado para ver el saldo real. Si lo apagas, el resultado sale igual que en Access, con movimientos repetidos.",
            },
            {
                guia: "saldo-buscar",
                titulo: "Buscar",
                queHace: "Pulsa Buscar para calcular los saldos.",
                quePasa: "El saldo es la provisión menos los pagos de cada documento, tomado del kardex de proveedores. " + NO_GUARDA,
                tablas: "kardex proveedores, mnombrerazsoc, mtipodocumento, mtipomoneda, empresas control, modulo de trabajo",
            },
            {
                guia: "saldo-aviso-duplicados",
                titulo: "Aviso de duplicados",
                queHace: "Si aparece este aviso, hay pagos o canjes repetidos. Pulsa Ver auditoría para ver la lista de movimientos duplicados.",
            },
            {
                guia: "saldo-resumen",
                titulo: "Totales",
                queHace: "Mira aquí el Saldo S/., el Saldo US$, cuántos documentos hay y cuántos están vencidos.",
            },
            {
                guia: "saldo-proveedor-grupo",
                titulo: "Proveedor y sus documentos",
                queHace: "Haz clic en un proveedor para abrir o cerrar sus documentos.",
                quePasa: "Cada documento muestra su estado: días vencido, Por vencer o Negativo.",
            },
            {
                guia: "saldo-total-general",
                titulo: "TOTAL GENERAL",
                queHace: "Al final ves el total de todos los proveedores en S/ y en US$.",
            },
            {
                guia: "saldo-pdf",
                titulo: "PDF",
                queHace: "Pulsa PDF para ver la vista previa del reporte e imprimirlo o descargarlo.",
            },
            {
                guia: "saldo-excel",
                titulo: "Excel",
                queHace: "Pulsa Excel para descargar el reporte en una hoja de cálculo.",
            },
        ],
    },

    // ------------------------------------------------------------------ PLE
    {
        ruta: "/dashboard/contabilidad/ple",
        nombre: "PLE - Libros Electrónicos",
        grupo: "SUNAT",
        resumen: "Aquí generas los archivos TXT del PLE de SUNAT: Registro de Ventas (14.1), Registro de Compras (8.1 y 8.2), Libro Diario (5.1 y 5.3) y Libro Mayor (6.1).",
        pasos: [
            {
                guia: "periodo",
                titulo: "Año y Mes",
                queHace: "Elige el año y el mes que vas a declarar. Ya viene puesto el mes anterior.",
                quePasa: "Si cambias el periodo, se borra lo que ya generaste en pantalla.",
            },
            {
                guia: "archivos-lista",
                titulo: "Archivos del PLE",
                queHace: "Haz clic en la tarjeta del libro que quieres generar para elegirlo.",
                quePasa: "Abajo se muestran los registros de ese libro.",
            },
            {
                guia: "archivo-cargar",
                titulo: "Vista previa",
                queHace: "Pulsa Vista previa (o Consultar) para ver los registros que van en el archivo.",
                quePasa: "Si no hay registros, el archivo saldrá vacío (indicador 0).",
            },
            {
                guia: "archivo-registros",
                titulo: "Registros del archivo",
                queHace: "Revisa aquí, fila por fila, lo que va en el TXT: fecha, comprobante, cliente o proveedor y total.",
            },
            {
                guia: "archivo-generar",
                titulo: "Vista previa TXT",
                queHace: "Pulsa Vista previa TXT en la tarjeta para armar el archivo del mes.",
                quePasa: "Se abre la vista previa y la tarjeta queda marcada con las líneas, el indicador y el nombre del archivo. No se guarda nada en el sistema.",
                tablas: "14.1: registro de ventas · 8.1: registro de compras · 5.1 y 6.1: mayor auxiliar, libro contable, mplancuentas · 5.3: mplancuentas",
            },
            {
                guia: "txt-datos",
                titulo: "Datos del archivo",
                queHace: "Revisa el periodo, el nombre, cuántas líneas tiene y el indicador (1 con información, 0 sin operaciones).",
                quePasa: "El nombre sigue el formato de SUNAT: no lo cambies.",
            },
            {
                guia: "txt-buscar",
                titulo: "Buscar en el contenido",
                queHace: "Escribe un RUC, serie, número o nombre para ubicar una línea del archivo.",
            },
            {
                guia: "txt-descargar",
                titulo: "Descargar TXT",
                queHace: "Pulsa Descargar TXT para bajar el archivo a tu computadora.",
                despues: "Súbelo al PLE de SUNAT tal como está, sin cambiarle el nombre.",
            },
            {
                titulo: "8.2 No Domiciliados",
                queHace: "Este archivo siempre sale vacío (indicador 0): el sistema no tiene compras a no domiciliados. Igual puedes ver su vista previa y descargarlo.",
            },
            {
                titulo: "5.3 Detalle del Plan Contable",
                queHace: "En enero trae todo el plan de cuentas; en los demás meses, solo las cuentas nuevas.",
            },
        ],
    },

    // ------------------------------------------------------------------ SIRE
    {
        ruta: "/dashboard/contabilidad/sire",
        nombre: "SIRE - Ventas y Compras",
        grupo: "SUNAT",
        resumen: "Aquí generas los archivos de reemplazo de las propuestas SIRE: ventas (Anexo 03) y compras (Anexos 11, 12 y 8).",
        pasos: [
            {
                guia: "periodo",
                titulo: "Año y Mes",
                queHace: "Elige el año y el mes que vas a declarar. Ya viene puesto el mes anterior.",
                quePasa: "Si cambias el periodo, se borra lo que ya generaste en pantalla.",
            },
            {
                guia: "archivos-lista",
                titulo: "Archivos del SIRE",
                queHace: "Haz clic en la tarjeta del anexo que necesitas: Ventas Anexo 03, Compras Anexo 11, 12 u 8.",
                quePasa: "Anexo 03 y Anexo 11 llevan todo el mes. Anexo 12 y Anexo 8 llevan solo los documentos que tú elijas.",
            },
            {
                guia: "archivo-elegir-docs",
                titulo: "Elegir docs",
                queHace: "Las tarjetas con esta marca te piden elegir los documentos antes de generar el archivo.",
            },
            {
                guia: "archivo-cargar",
                titulo: "Vista previa / Cargar documentos",
                queHace: "Pulsa este botón para ver los registros del mes del anexo elegido.",
                quePasa: "En Anexo 12 y Anexo 8 el botón dice Cargar documentos y la tabla trae casillas para marcar.",
            },
            {
                guia: "archivo-registros",
                titulo: "Registros del archivo",
                queHace: "Revisa aquí lo que va en el TXT. En Anexo 12 y 8 marca los documentos que quieres enviar; arriba ves cuántos elegiste.",
                quePasa: "El Anexo 12 muestra también el CAR SIRE de cada compra.",
            },
            {
                guia: "archivo-generar",
                titulo: "Vista previa TXT",
                queHace: "Pulsa Vista previa TXT en la tarjeta para armar el archivo. En Anexo 12 y 8 el botón muestra cuántos documentos marcaste.",
                quePasa: "Si no marcaste ninguno, te pide elegir documentos. No se guarda nada en el sistema.",
                tablas: "Anexo 03: registro de ventas · Anexos 11, 12 y 8: registro de compras (con mnombrerazsoc, mtipomoneda, empresas control)",
            },
            {
                guia: "txt-datos",
                titulo: "Datos del archivo",
                queHace: "Revisa el periodo, el nombre, cuántas líneas tiene y el indicador (1 con información, 0 sin operaciones).",
                quePasa: "El nombre sigue el formato de SUNAT: no lo cambies.",
            },
            {
                guia: "txt-buscar",
                titulo: "Buscar en el contenido",
                queHace: "Escribe un RUC, serie, número o nombre para ubicar una línea del archivo.",
            },
            {
                guia: "txt-descargar",
                titulo: "Descargar TXT",
                queHace: "Pulsa Descargar TXT para bajar el archivo a tu computadora.",
                despues: "Súbelo en el SIRE de SUNAT para reemplazar la propuesta, sin cambiarle el nombre.",
            },
        ],
    },
]

export const caminos: CaminoGuia[] = [
    {
        id: "cierre-ventas-sunat",
        titulo: "Cierre del mes: ventas a SUNAT",
        descripcion: "Desde que las ventas del mes están cargadas hasta que el archivo llega a SUNAT.",
        etapas: [
            {
                titulo: "Cargar las ventas",
                ruta: "/dashboard/contabilidad/actualiza-ventas-app",
                quien: "Contabilidad",
                queHace: "Carga los comprobantes del mes al registro de ventas.",
                seGuarda: "Registro de ventas y su asiento en el mayor",
            },
            {
                titulo: "Revisar el registro de ventas",
                ruta: "/dashboard/contabilidad/informes-registro-ventas",
                quien: "Contabilidad",
                queHace: "Revisa la pestaña Soles y los Correlativos: que no falten ni se repitan números.",
            },
            {
                titulo: "Generar el SIRE de ventas",
                ruta: "/dashboard/contabilidad/sire",
                quien: "Contabilidad",
                queHace: "Genera y descarga el Ventas Anexo 03 del mes.",
                despues: "Súbelo en el SIRE de SUNAT para reemplazar la propuesta.",
            },
            {
                titulo: "Generar el PLE de ventas",
                ruta: "/dashboard/contabilidad/ple",
                quien: "Contabilidad",
                queHace: "Genera y descarga el 14.1 Registro de Ventas del mes.",
                despues: "Súbelo al PLE de SUNAT sin cambiarle el nombre.",
            },
        ],
    },
    {
        id: "cierre-compras-sunat",
        titulo: "Cierre del mes: compras a SUNAT",
        descripcion: "Desde el registro de cada factura de compra hasta el archivo para SUNAT.",
        etapas: [
            {
                titulo: "Registrar y revisar las compras",
                ruta: "/dashboard/contabilidad/registro-compras",
                quien: "Contabilidad",
                queHace: "Graba y revisa cada factura de compra del mes.",
                seGuarda: "Registro de compras",
            },
            {
                titulo: "Revisar el registro de compras",
                ruta: "/dashboard/contabilidad/informes-registro-compras",
                quien: "Contabilidad",
                queHace: "Revisa las pestañas Soles y USD, y mira en SIRE pendientes qué compras faltan revisar.",
            },
            {
                titulo: "Generar el SIRE de compras",
                ruta: "/dashboard/contabilidad/sire",
                quien: "Contabilidad",
                queHace: "Genera el Compras Anexo 11 (todo el mes) o, si solo cambias algunos documentos, el Anexo 12 o el Anexo 8.",
                despues: "Súbelo en el SIRE de SUNAT para reemplazar la propuesta.",
            },
            {
                titulo: "Generar el PLE de compras",
                ruta: "/dashboard/contabilidad/ple",
                quien: "Contabilidad",
                queHace: "Genera y descarga el 8.1 Registro de Compras y el 8.2 No Domiciliados (vacío).",
                despues: "Súbelos al PLE de SUNAT sin cambiarles el nombre.",
            },
        ],
    },
    {
        id: "libros-diario-mayor-ple",
        titulo: "Libro Diario y Mayor al PLE",
        descripcion: "Revisar los libros del mes y generar sus archivos electrónicos.",
        etapas: [
            {
                titulo: "Revisar el Libro Diario",
                ruta: "/dashboard/contabilidad/libro-diario",
                quien: "Contabilidad",
                queHace: "Revisa los asientos del mes.",
            },
            {
                titulo: "Revisar el Libro Mayor",
                ruta: "/dashboard/contabilidad/libro-mayor",
                quien: "Contabilidad",
                queHace: "Revisa los movimientos del mes por cuenta.",
            },
            {
                titulo: "Generar el PLE de los libros",
                ruta: "/dashboard/contabilidad/ple",
                quien: "Contabilidad",
                queHace: "Genera y descarga el 5.1 Libro Diario, el 5.3 Detalle del Plan Contable y el 6.1 Libro Mayor.",
                despues: "Súbelos al PLE de SUNAT sin cambiarles el nombre.",
            },
        ],
    },
    {
        id: "pagos-proveedores",
        titulo: "Qué pagar a los proveedores",
        descripcion: "Ver qué vence, revisar la cuenta de un proveedor y sacar el saldo por pagar a una fecha.",
        etapas: [
            {
                titulo: "Ver qué vence",
                ruta: "/dashboard/contabilidad/informes-proveedores",
                quien: "Contabilidad",
                queHace: "En Programa de pagos pon el rango de vencimiento y mira los documentos con saldo pendiente.",
            },
            {
                titulo: "Revisar la cuenta de un proveedor",
                ruta: "/dashboard/contabilidad/informes-proveedores",
                quien: "Contabilidad",
                queHace: "En Cuenta corriente elige el proveedor y revisa la provisión y los pagos de cada documento.",
            },
            {
                titulo: "Saldo a una fecha de corte",
                ruta: "/dashboard/reportes/saldo-proveedores",
                quien: "Contabilidad",
                queHace: "Saca el saldo por pagar de uno o de todos los proveedores a la fecha que necesites, en PDF o Excel.",
            },
        ],
    },
]
