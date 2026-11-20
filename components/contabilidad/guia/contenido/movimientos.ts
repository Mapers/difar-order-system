import { CaminoGuia, PantallaGuia } from "../tipos"

// Guía · Datos de Movimientos (20/11/2026). Verificado contra el código de cada pantalla y sus SP:
// sp_ws_regcompras_* (Registro de Compras), sp_ws_appventas_*_2b (Actualiza Ventas APP),
// sp_ws_actcont_*_2b (Actualización Contable).

const GRUPO = "Datos de Movimientos"

export const pantallas: PantallaGuia[] = [
    // ------------------------------------------------------------------ Registro de Compras
    {
        ruta: "/dashboard/contabilidad/registro-compras",
        nombre: "Registro de Compras e Inventarios",
        grupo: GRUPO,
        resumen: "Aquí registras las facturas de tus proveedores. Al guardar, el sistema arma solo el asiento contable, la deuda con el proveedor y el ingreso de mercadería.",
        pasos: [
            {
                guia: "escanear-comprobante",
                titulo: "Escanear comprobante",
                queHace: "Si tienes la foto o el PDF de la factura, súbela aquí y el formulario se llena solo.",
                quePasa: "Se leen el proveedor, la serie, el número, los importes y las líneas. Revisa lo que salga en ámbar: son productos que no están en el catálogo.",
                despues: "Revisa los datos de «El documento» antes de guardar.",
            },
            {
                guia: "buscar",
                titulo: "Buscar",
                queHace: "Usa este botón para encontrar una compra ya registrada por proveedor, serie o número.",
                quePasa: "Si ya sabes la clave, escríbela en la casilla «Clave» de al lado y pulsa la flecha. Para empezar otra compra, pulsa «Nueva».",
                seGuarda: "No guarda nada; solo consulta.",
                despues: "Al abrir una compra puedes corregirla, ver su saldo o registrar pagos.",
            },
            {
                guia: "el-documento",
                titulo: "El documento",
                queHace: "Aquí eliges el proveedor y llenas tipo de documento, fecha, serie, número, moneda, IGV, importe total, condición, almacén, período y año.",
                quePasa: "Los campos con * son obligatorios. Si eliges una condición al contado, aparece «Cancelación»: llena fecha, tipo de pago, centro de costos y observación.",
                despues: "Baja a «Detalle de la compra» para poner los productos.",
            },
            {
                guia: "datos-adicionales",
                titulo: "Datos adicionales",
                queHace: "Ábrelo solo si lo necesitas: detracción, clasificación de bienes, inafecto, ICBPER, orden de compra y observaciones.",
                quePasa: "Se despliega debajo. Es opcional.",
            },
            {
                guia: "detalle",
                titulo: "Detalle de la compra",
                queHace: "Pon una línea por cada ítem de la factura: artículo, cantidad, lote, vencimiento, importe con IGV o sin IGV, cuenta y centro de costos.",
                quePasa: "Con Enter pasas a la casilla siguiente; al final de la última línea se agrega otra.",
                despues: "Mira el «Cuadre» para comprobar que las líneas suman el total.",
            },
            {
                guia: "agregar-linea",
                titulo: "Agregar línea",
                queHace: "Pulsa aquí para sumar una línea nueva al detalle.",
                quePasa: "La línea aparece marcada como «nueva». Si te equivocas, quítala con la X antes de guardar.",
            },
            {
                guia: "cuadre",
                titulo: "Cuadre",
                queHace: "Te muestra en vivo el total con IGV, sin IGV, el IGV calculado y la diferencia con el importe total del documento (en S/ o US$, según la moneda).",
                quePasa: "Si dice «No cuadra», revisa importes de las líneas o el importe total antes de guardar.",
                seGuarda: "No guarda nada; solo calcula.",
            },
            {
                guia: "guardar",
                titulo: "Guardar",
                queHace: "Cuando todo esté completo y cuadre, pulsa «Guardar».",
                quePasa: "Se graba la compra y se genera sola su contabilidad. Si la fecha cae en un mes cerrado, no deja guardar.",
                seGuarda: "Compra (cabecera y líneas), Registro de Compras, asiento en el Libro Mayor, deuda con el proveedor, kardex de inventarios y lotes. Si es al contado, también su pago por caja.",
                tablas: "reg compras encabezado, reg compras detalle, registro de compras, mayor auxiliar, kardex proveedores, mkardexinventarios, lotesxarticulo",
                despues: "Ya puedes usar Revisa, Saldo, Pagos a cuenta, Transporte o Imprimir.",
            },
            {
                guia: "eliminar-marcadas",
                titulo: "Eliminar marcadas",
                queHace: "Marca la casilla de las líneas que sobran y pulsa este botón para quitarlas.",
                quePasa: "Primero se guarda la compra y luego se quitan las líneas; el asiento, el kardex y los lotes se rehacen. Para borrar toda la compra usa «Eliminar documento».",
                seGuarda: "Se borran las líneas y se vuelve a generar la contabilidad de la compra.",
                tablas: "reg compras detalle, registro de compras, mayor auxiliar, kardex proveedores, mkardexinventarios, lotesxarticulo",
            },
            {
                guia: "revisa",
                titulo: "Revisa",
                queHace: "Úsalo si el registro contable de la compra quedó mal: lo vuelve a armar con las líneas ya guardadas.",
                quePasa: "Te pide confirmar y luego te dice cuántas filas rehízo. Lo que no hayas guardado no se toma en cuenta.",
                seGuarda: "Registro de Compras, movimientos por centro de costos y ejecución de presupuesto.",
                tablas: "registro de compras, mvtos centro costos, ejecucion_presupuestos",
            },
            {
                guia: "saldo",
                titulo: "Saldo",
                queHace: "Pulsa aquí para ver cuánto se le debe todavía al proveedor por esta factura.",
                quePasa: "Se abre una ventana con la deuda, los pagos y el saldo en S/ o US$.",
                seGuarda: "No guarda nada; solo consulta.",
                tablas: "kardex proveedores",
            },
            {
                guia: "pagos-a-cuenta",
                titulo: "Pagos a cuenta",
                queHace: "Si la compra es a crédito, aquí registras los pagos parciales al proveedor.",
                quePasa: "Agrega cada pago con fecha, tipo de pago, centro de costos e importe, y pulsa «Guardar pagos». No se usa en compras al contado.",
                seGuarda: "Pago de la compra, rebaja de la deuda del proveedor y asiento de salida de caja.",
                tablas: "reg compras pagos, kardex proveedores, mayor auxiliar",
                despues: "Pulsa «Saldo» para ver cuánto falta pagar.",
            },
            {
                guia: "transporte",
                titulo: "Transporte",
                queHace: "Aquí anotas la unidad de transporte, la ciudad y los kilómetros de esta compra.",
                quePasa: "Agrega las filas que necesites y pulsa «Guardar transporte».",
                seGuarda: "Datos de transporte de la compra.",
                tablas: "transporte",
            },
            {
                guia: "imprimir",
                titulo: "Imprimir",
                queHace: "Pulsa aquí para sacar el PDF de la compra.",
                quePasa: "Se abre una vista previa donde eliges colores y nombre del archivo, y lo descargas.",
                seGuarda: "No guarda nada; solo genera el PDF.",
            },
        ],
    },

    // ------------------------------------------------------------------ Actualiza Ventas APP
    {
        ruta: "/dashboard/contabilidad/actualiza-ventas-app",
        nombre: "Actualiza Ventas APP",
        grupo: GRUPO,
        resumen: "Aquí pasas a la contabilidad las facturas, boletas y notas de crédito emitidas en la web: al Registro de Ventas y al Libro Mayor.",
        pasos: [
            {
                guia: "periodo",
                titulo: "Año, mes y buscar",
                queHace: "Elige el año y el mes que quieres trabajar. Si buscas un comprobante, escribe su serie-número, RUC o cliente.",
                quePasa: "La pantalla se llena sola con los comprobantes de ese mes.",
                seGuarda: "No guarda nada; solo consulta.",
            },
            {
                guia: "filtros",
                titulo: "Filtros",
                queHace: "Filtra por tipo (Facturas, Boletas, Notas de crédito) o por estado (Pendientes, Cargados, Parciales).",
                quePasa: "Cada botón muestra cuántos comprobantes hay. Para ver lo que falta pasar, elige «Pendientes».",
                seGuarda: "No guarda nada; solo filtra.",
            },
            {
                guia: "estado-mes",
                titulo: "Estado del mes",
                queHace: "Te resume el mes: comprobantes, cargados y pendientes (con su monto en S/), notas de crédito pendientes, los que tienen observación y la suma para SUNAT.",
                quePasa: "Si «Con observación» no es cero, revisa esos comprobantes antes de cargar.",
                seGuarda: "No guarda nada; solo consulta.",
            },
            {
                guia: "comprobantes",
                titulo: "Comprobantes",
                queHace: "Cada tarjeta es un comprobante con su cliente, valor venta, IGV y total en S/. Haz clic en una para ver qué se grabará o qué ya se grabó.",
                quePasa: "Las marcas RV y MA dicen cuántas filas tiene en el Registro de Ventas y en el Mayor. Si aparece un aviso en ámbar, al cliente le falta ficha o cuenta y no se puede cargar.",
                seGuarda: "No guarda nada; solo consulta.",
                despues: "Pulsa «Cargar» en la tarjeta para pasar solo ese comprobante.",
            },
            {
                guia: "seleccionar",
                titulo: "Seleccionar pendientes",
                queHace: "Marca esta casilla (o la de cada tarjeta) para elegir qué comprobantes pendientes vas a cargar.",
                quePasa: "El botón de arriba cambia a «Cargar seleccionados».",
            },
            {
                guia: "cargar-pendientes",
                titulo: "Cargar pendientes",
                queHace: "Pulsa aquí para pasar a la contabilidad todos los pendientes del mes, o solo los que seleccionaste.",
                quePasa: "Se abre una ventana con lo que se va a grabar; pulsa «Iniciar carga» y verás el avance uno por uno. Un comprobante ya cargado no se vuelve a cargar.",
                seGuarda: "Una fila en el Registro de Ventas y el asiento de la venta en el Libro Mayor (libro 14) por cada comprobante. La cuenta del cliente no cambia: ya la grabó la web al emitir.",
                tablas: "registro de ventas, mayor auxiliar (LibroContab 14). Lee: sie_app_ventas, vta_comprobante_cab, vta_comprobante_sunat",
                despues: "Revisa el resultado en los informes del Registro de Ventas o en el Libro Mayor.",
            },
            {
                guia: "actualizar",
                titulo: "Actualizar",
                queHace: "Pulsa aquí para volver a leer el mes, por ejemplo si se emitieron comprobantes nuevos en la web.",
                seGuarda: "No guarda nada; solo consulta.",
            },
            {
                guia: "validar-sire",
                titulo: "Validar SIRE",
                queHace: "Sube aquí el Excel de la propuesta SIRE de ventas que bajaste de SUNAT para compararla con lo que hay en el sistema.",
                quePasa: "Se detecta el período solo y se compara comprobante por comprobante.",
                seGuarda: "No guarda nada; solo compara.",
            },
            {
                guia: "exportar-pdf",
                titulo: "Exportar PDF",
                queHace: "Pulsa aquí para sacar en PDF la lista que estás viendo, con los filtros aplicados.",
                seGuarda: "No guarda nada; solo genera el PDF.",
            },
        ],
    },

    // ------------------------------------------------------------------ Actualización Contable
    {
        ruta: "/dashboard/contabilidad/actualizacion-contable",
        nombre: "Actualización Contable",
        grupo: GRUPO,
        resumen: "Aquí compruebas que caja, bancos, diario, ventas y compras del año estén bien pasados a la contabilidad. Revisar no cambia nada.",
        pasos: [
            {
                guia: "anio",
                titulo: "Año",
                queHace: "Elige el año que quieres revisar.",
                quePasa: "Al cambiar de año se borran los resultados en pantalla y hay que revisar de nuevo.",
                seGuarda: "No guarda nada; solo consulta.",
            },
            {
                guia: "revisar-todo",
                titulo: "Revisar todo",
                queHace: "Pulsa aquí para revisar los cinco bloques del año, uno tras otro.",
                quePasa: "Puede tardar unos segundos por bloque. Al terminar, cada bloque dice «Todo cuadra» o cuántas diferencias tiene.",
                seGuarda: "No guarda nada; solo compara.",
            },
            {
                guia: "totales",
                titulo: "Totales",
                queHace: "Te muestra cuántos casos hay en todo el año: duplicados, faltan, sobran e importe distinto.",
                seGuarda: "No guarda nada; solo consulta.",
            },
            {
                guia: "bloques",
                titulo: "Bloques",
                queHace: "Haz clic en un bloque (Bancos, Caja, Diario, Clientes / Ventas o Proveedores / Compras) para ver sus diferencias abajo.",
                seGuarda: "No guarda nada; solo consulta.",
            },
            {
                guia: "revisar-bloque",
                titulo: "Revisar este bloque",
                queHace: "Pulsa aquí para revisar solo el bloque que tienes abierto, por ejemplo después de corregir algo.",
                seGuarda: "No guarda nada; solo compara.",
            },
            {
                guia: "resumen-tecnico",
                titulo: "Ver el resumen técnico",
                queHace: "Ábrelo si quieres ver, consulta por consulta, cuántos movimientos debería haber y cuántos hay, con sus importes en S/.",
                seGuarda: "No guarda nada; solo consulta.",
            },
            {
                guia: "filtro-casos",
                titulo: "Filtrar casos",
                queHace: "Elige qué casos ver (duplicados, faltan, sin documento u otro monto) o busca por cliente, proveedor, documento, cuenta o voucher.",
                quePasa: "Abajo aparece una tarjeta por cada caso, con el documento y el monto.",
                seGuarda: "No guarda nada; solo filtra.",
            },
            {
                guia: "arreglar",
                titulo: "Arreglar",
                queHace: "Solo para duplicados: marca los casos y pulsa «Arreglar» para quitar las copias de más.",
                quePasa: "Te pide confirmar con «Sí, arreglar». Antes de borrar, cada copia se respalda; al terminar, el bloque se revisa de nuevo. Solo Gerencia y Contabilidad pueden hacerlo.",
                seGuarda: "Se borran las copias duplicadas y quedan respaldadas en tablas de respaldo.",
                tablas: "kardex clientes, kardex proveedores, mayor auxiliar, mkardexinventarios, registro de ventas, registro de compras → backup_<tabla>",
            },
            {
                guia: "exportar-excel",
                titulo: "Exportar Excel",
                queHace: "Pulsa aquí para bajar en Excel el resumen y las diferencias de los bloques ya revisados.",
                seGuarda: "No guarda nada; solo descarga el archivo.",
            },
            {
                guia: "ver-alcance",
                titulo: "Ver alcance",
                queHace: "Pulsa aquí para ver cuánto borraría el botón «elimina» del Access en ese año.",
                quePasa: "Solo informa: aquí no se borra nada.",
                seGuarda: "No guarda nada; solo consulta.",
            },
        ],
    },
]

export const caminos: CaminoGuia[] = [
    {
        id: "compra-a-credito",
        titulo: "Registrar una compra a crédito y pagarla",
        descripcion: "Desde la factura del proveedor hasta que queda pagada.",
        etapas: [
            {
                titulo: "Registra la factura",
                ruta: "/dashboard/contabilidad/registro-compras",
                quien: "Contabilidad",
                queHace: "Escanea o llena la factura, pon sus líneas y pulsa «Guardar».",
                seGuarda: "Compra, Registro de Compras, asiento, deuda con el proveedor, kardex de inventarios y lotes.",
                despues: "La deuda queda pendiente en la cuenta del proveedor.",
            },
            {
                titulo: "Registra los pagos",
                ruta: "/dashboard/contabilidad/registro-compras",
                quien: "Contabilidad",
                queHace: "Abre la compra, pulsa «Pagos a cuenta», agrega cada pago y pulsa «Guardar pagos».",
                seGuarda: "Pago, rebaja de la deuda del proveedor y asiento de salida de caja.",
            },
            {
                titulo: "Comprueba el saldo",
                ruta: "/dashboard/contabilidad/registro-compras",
                quien: "Contabilidad",
                queHace: "Pulsa «Saldo» para ver cuánto falta pagar en S/ o US$.",
            },
            {
                titulo: "Controla el año",
                ruta: "/dashboard/contabilidad/actualizacion-contable",
                quien: "Contabilidad",
                queHace: "Revisa el bloque «Proveedores / Compras» para ver que todo cuadre.",
            },
        ],
    },
    {
        id: "compra-al-contado",
        titulo: "Registrar una compra al contado",
        descripcion: "La compra y su pago quedan grabados en un solo paso.",
        etapas: [
            {
                titulo: "Registra la factura con condición al contado",
                ruta: "/dashboard/contabilidad/registro-compras",
                quien: "Contabilidad",
                queHace: "Elige una condición al contado y llena la sección «Cancelación»: fecha, tipo de pago, centro de costos y observación. Luego pulsa «Guardar».",
                seGuarda: "Compra con su asiento, y además su pago por caja.",
            },
            {
                titulo: "Comprueba el saldo",
                ruta: "/dashboard/contabilidad/registro-compras",
                quien: "Contabilidad",
                queHace: "Pulsa «Saldo» para confirmar que la compra figura como pagada.",
            },
        ],
    },
    {
        id: "ventas-app-a-contabilidad",
        titulo: "Pasar las ventas de la web a la contabilidad",
        descripcion: "Las facturas, boletas y notas de crédito emitidas en la web llegan al Registro de Ventas y al Libro Mayor.",
        etapas: [
            {
                titulo: "Se emite el comprobante",
                quien: "Vendedor",
                queHace: "La venta se emite desde la web.",
                seGuarda: "El comprobante y la deuda del cliente (la web la graba al emitir).",
                despues: "Queda «Pendiente» en Actualiza Ventas APP.",
            },
            {
                titulo: "Carga los pendientes",
                ruta: "/dashboard/contabilidad/actualiza-ventas-app",
                quien: "Contabilidad",
                queHace: "Elige año y mes, filtra «Pendientes» y pulsa «Cargar pendientes».",
                seGuarda: "Registro de Ventas y asiento de la venta en el Libro Mayor (libro 14).",
            },
            {
                titulo: "Compara con SUNAT",
                ruta: "/dashboard/contabilidad/actualiza-ventas-app",
                quien: "Contabilidad",
                queHace: "Pulsa «Validar SIRE» y sube la propuesta de SUNAT para ver si coincide.",
            },
            {
                titulo: "Controla el año",
                ruta: "/dashboard/contabilidad/actualizacion-contable",
                quien: "Contabilidad",
                queHace: "Revisa el bloque «Clientes / Ventas» para ver que no falte ni sobre nada.",
            },
        ],
    },
    {
        id: "corregir-duplicados",
        titulo: "Encontrar y corregir movimientos duplicados",
        descripcion: "Cuando algo se grabó dos veces en la contabilidad.",
        etapas: [
            {
                titulo: "Revisa el año",
                ruta: "/dashboard/contabilidad/actualizacion-contable",
                quien: "Contabilidad",
                queHace: "Elige el año y pulsa «Revisar todo».",
            },
            {
                titulo: "Quita las copias",
                ruta: "/dashboard/contabilidad/actualizacion-contable",
                quien: "Gerencia o Contabilidad",
                queHace: "Abre el bloque con duplicados, márcalos y pulsa «Arreglar».",
                seGuarda: "Se borran las copias de más; cada una queda respaldada antes.",
                despues: "El bloque se revisa solo otra vez.",
            },
        ],
    },
]
