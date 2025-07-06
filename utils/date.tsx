import { format, parseISO } from "date-fns"

export const formatSafeDate = (fecha: string, fallback: string = "Sin evaluar") => {
  try {
    if (!fecha || fecha === "Sin evaluar") return fallback
    return format(parseISO(fecha), "dd/MM/yyyy")
  } catch {
    return fallback
  }
}
