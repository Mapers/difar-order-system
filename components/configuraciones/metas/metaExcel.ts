import ExcelJS from "exceljs"

export interface MetaColumn {
  header: string
  key: string
  width?: number
  /** valor pre-llenado desde la entidad (export). Si existe, la columna es de solo-referencia (no editable). */
  prefill?: (entity: any) => any
  /** obligatorio para que la fila se suba (import). */
  required?: boolean
  /** opciones de un desplegable (data validation de Excel). */
  options?: string[]
}

export interface ParsedRow {
  fila: number
  record: Record<string, string>
  /** no la tocó el usuario (todas las columnas editables vacías). */
  isEmpty: boolean
  /** encabezados de columnas obligatorias que faltan. */
  missingRequired: string[]
}

const HEADER_FILL = "FF1E3A8A"
const REF_FILL = "FFF1F5F9"

/** Genera y descarga una plantilla pre-llenada con todas las entidades del contexto. */
export async function downloadMetaTemplate(params: {
  fileName: string
  sheetName: string
  columns: MetaColumn[]
  entities: any[]
}) {
  const { fileName, sheetName, columns, entities } = params
  const wb = new ExcelJS.Workbook()
  wb.creator = "DROGUERÍA DIFAR"
  const ws = wb.addWorksheet(sheetName, { views: [{ state: "frozen", ySplit: 1 }] })

  ws.columns = columns.map(c => ({ key: c.key, width: c.width ?? 22 }))

  const headerRow = ws.getRow(1)
  columns.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = c.header + (c.required ? " *" : "")
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } }
    cell.alignment = { vertical: "middle", horizontal: "center" }
  })
  headerRow.height = 22

  entities.forEach(entity => {
    const rowValues: Record<string, any> = {}
    columns.forEach(c => { rowValues[c.key] = c.prefill ? c.prefill(entity) : null })
    const row = ws.addRow(rowValues)
    columns.forEach((c, i) => {
      const cell = row.getCell(i + 1)
      if (c.prefill) {
        // columnas de referencia: fondo gris para indicar que no se editan
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: REF_FILL } }
      }
      if (c.options && c.options.length) {
        cell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [`"${c.options.join(",")}"`],
        }
      }
    })
  })

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  URL.revokeObjectURL(link.href)
}

const cellToStr = (v: any): string => {
  if (v == null) return ""
  if (typeof v === "object") {
    if ("text" in v) return String((v as any).text)
    if ("result" in v) return String((v as any).result ?? "")
    if ("richText" in v) return (v as any).richText.map((r: any) => r.text).join("")
    if ("hyperlink" in v) return String((v as any).text ?? "")
    return ""
  }
  return String(v)
}

/** Lee la plantilla completada y devuelve las filas mapeadas por key de columna. */
export async function parseMetaTemplate(
  file: File,
  columns: MetaColumn[],
): Promise<ParsedRow[]> {
  const buffer = await file.arrayBuffer()
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)
  const ws = wb.worksheets[0]
  if (!ws) return []

  // mapear columna del Excel -> key, comparando el texto del encabezado (sin " *")
  const headerRow = ws.getRow(1)
  const colToKey = new Map<number, string>()
  headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
    const text = cellToStr(cell.value).replace(/\s*\*$/, "").trim().toLowerCase()
    const match = columns.find(c => c.header.trim().toLowerCase() === text)
    if (match) colToKey.set(col, match.key)
  })

  const editableKeys = columns.filter(c => !c.prefill).map(c => c.key)

  const rows: ParsedRow[] = []
  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum === 1) return
    const record: Record<string, string> = {}
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      const key = colToKey.get(col)
      if (key) record[key] = cellToStr(cell.value).trim()
    })
    const isEmpty = editableKeys.every(k => !record[k])
    const missingRequired = columns
      .filter(c => c.required && !record[c.key])
      .map(c => c.header)
    rows.push({ fila: rowNum, record, isEmpty, missingRequired })
  })
  return rows
}
