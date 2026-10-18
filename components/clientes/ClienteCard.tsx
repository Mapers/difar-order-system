import { Ban, CreditCard, Edit, Eye, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClientMethodsService } from "@/app/dashboard/clientes/services/clientMethodsService"
import { formatSafeDate } from "@/app/utils/date"

interface ClienteCardProps {
  cliente: any
  /** VISTA_TABLA_CLIENTES: '1' = vista de evaluación, otro = datos completos. */
  vistaTablaClientes: string
  onView: (codigo: string) => void
  onEdit: (codigo: string) => void
  onUbicacion: (codigo: string, nombre: string) => void
}

const iniciales = (texto?: string) =>
    (texto || "").split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase() || "?"

const Dato = ({ etiqueta, children, className = "" }: { etiqueta: React.ReactNode; children: React.ReactNode; className?: string }) => (
    <div className={`min-w-0 ${className}`}>
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">{etiqueta}</span>
      <span className="block break-words">{children}</span>
    </div>
)

/**
 * Tarjeta de la vista en cards de escritorio del listado de clientes. Lo
 * primero que se ve después del nombre es la línea de crédito: en verde con
 * el monto, o en rojo si el cliente no tiene.
 */
export function ClienteCard({ cliente, vistaTablaClientes, onView, onEdit, onUbicacion }: ClienteCardProps) {
  const esEvaluacion = vistaTablaClientes === "1"
  const estadoAprobacion = ClientMethodsService.getEstadoAprobacion(cliente.estado)
  const IconoEstado = estadoAprobacion.icon
  const lineaCredito = Number(cliente.lineaCredito) || 0

  return (
      <Card className="flex flex-col border border-border transition-shadow hover:shadow-md">
        <CardContent className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              {iniciales(cliente.razonSocial)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs font-bold text-blue-600">{cliente.codigoInterno}</p>
              <p className="text-sm font-bold leading-tight line-clamp-2">{cliente.razonSocial || "-"}</p>
            </div>
            {esEvaluacion ? (
                <Badge className={`${estadoAprobacion.color} shrink-0 text-xs`}>
                  <IconoEstado className="mr-1 h-3 w-3" />
                  {estadoAprobacion.estado}
                </Badge>
            ) : (
                <Badge variant="outline" className="shrink-0 bg-muted text-xs">
                  {cliente.situacion || "Activo"}
                </Badge>
            )}
          </div>
          {cliente.nombreComercial && (
              <p className="-mt-2 text-[11px] uppercase text-muted-foreground line-clamp-1">{cliente.nombreComercial}</p>
          )}

          {lineaCredito > 0 ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                <span className="flex items-center gap-1.5 text-xs font-semibold"><CreditCard className="h-3.5 w-3.5" /> Línea de crédito</span>
                <span className="font-mono text-sm font-bold">
                  S/ {lineaCredito.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
          ) : (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                <span className="flex items-center gap-1.5 text-xs font-semibold"><Ban className="h-3.5 w-3.5" /> Línea de crédito</span>
                <span className="text-xs font-bold">No tiene línea de crédito</span>
              </div>
          )}

          <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-muted/50 px-3 py-2.5 text-xs">
            <Dato etiqueta={cliente.tipoDocumento || "Documento"}>{cliente.numeroDocumento || "-"}</Dato>
            <Dato etiqueta="Zona">{cliente.zona || "-"}</Dato>
            <Dato etiqueta={<><MapPin className="h-3 w-3" /> Dirección</>} className="col-span-2">
              {[cliente.direccion, cliente.provincia].filter(Boolean).join(" · ") || "-"}
            </Dato>
            {esEvaluacion ? (
                <>
                  <Dato etiqueta="Categoría">{ClientMethodsService.getCategoriaLabel(cliente.categoria)}</Dato>
                  <Dato etiqueta="Fecha evaluación">{formatSafeDate(cliente.fechaEvaluacion) || "-"}</Dato>
                </>
            ) : (
                <>
                  <Dato etiqueta={<><Phone className="h-3 w-3" /> Teléfono</>}>{cliente.telefono || "-"}</Dato>
                  <Dato etiqueta="Vendedor">
                    {cliente.nombreVendedor || cliente.codigoVendedor || "-"}
                    {cliente.nombreVendedor && cliente.codigoVendedor && (
                        <span className="block font-mono text-[10px] text-muted-foreground">{cliente.codigoVendedor}</span>
                    )}
                  </Dato>
                </>
            )}
          </div>

          <div className="mt-auto grid grid-cols-[1fr_auto_1fr] gap-2">
            <Button variant="outline" size="sm" className="bg-blue-50 text-xs text-blue-700 hover:bg-blue-100" onClick={() => onView(cliente.codigoInterno)}>
              <Eye className="mr-1 h-3 w-3" /> Ver
            </Button>
            <Button variant="outline" size="sm"
                    className="px-2.5 text-xs text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                    title="Ver ubicación en el mapa"
                    aria-label={`Ver ubicación de ${cliente.razonSocial}`}
                    onClick={() => onUbicacion(cliente.codigoInterno, cliente.razonSocial)}>
              <MapPin className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => onEdit(cliente.codigoInterno)}>
              <Edit className="mr-1 h-3 w-3" /> Editar
            </Button>
          </div>
        </CardContent>
      </Card>
  )
}
