/**
 * Normaliza un código de documento al formato F001-9061.
 * - Si ya está en formato correcto (tiene guion), lo devuelve igual.
 * - Si no tiene guion y tiene 9 caracteres, inserta el guion después del 4to carácter.
 * - También convierte todo a mayúsculas y quita espacios extra.
 *
 * @param input string - El código ingresado por el usuario (ej. 'F0019061' o 'F001-9061')
 * @returns string - Código normalizado en formato F001-9061
 */

  
  export function normalizeDocumentCode(input: string): string | null {
    const normalized = input.trim().toUpperCase();
  
    // No se puede normalizar si tiene menos de 5 caracteres
    if (normalized.length < 5) {
      return null;
    }
  
    // Si el 5to carácter es un guion, asumimos que ya está correctamente formateado
    if (normalized.charAt(4) === "-") {
      return normalized;
    }
  
    // Si no tiene guion y tiene al menos 5 caracteres, insertamos el guion
    return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
  }
  