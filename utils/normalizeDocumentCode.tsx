/**
 * Normaliza un código de documento al formato F001-9061.
 * - Si ya está en formato correcto (tiene guion), lo devuelve igual.
 * - Si no tiene guion y tiene 9 caracteres, inserta el guion después del 4to carácter.
 * - También convierte todo a mayúsculas y quita espacios extra.
 *
 * @param input string - El código ingresado por el usuario (ej. 'F0019061' o 'F001-9061')
 * @returns string - Código normalizado en formato F001-9061
 */
 export function normalizeDocumentCode(input: string): string {
    let normalized = input.trim().toUpperCase()
  
    // Si ya está en formato correcto (con guion), lo devolvemos tal cual
    if (normalized.includes("-")) {
      return normalized
    }
  
    // Si no tiene guion y tiene 9 caracteres (ej: F0019061), insertamos guion después del 4to carácter
    if (normalized.length === 9) {
      return `${normalized.slice(0, 4)}-${normalized.slice(4)}`
    }
  
    // Si no cumple las condiciones, lo devolvemos igual (puedes lanzar un error si prefieres)
    return normalized
  }
  