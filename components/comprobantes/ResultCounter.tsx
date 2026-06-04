interface ResultCounterProps {
  count: number;
  /** texto antes del número (ej. "Documentos recuperados"). */
  label?: string;
}

/** Texto informativo con el total de documentos del resultado de búsqueda/filtro.
 *  Pensado para ir pegado a la izquierda del toolbar. */
export function ResultCounter({
  count,
  label = "Documentos recuperados",
}: ResultCounterProps) {
  return (
    <p className="text-xs text-gray-500 sm:text-sm">
      {label}:{" "}
      <span className="font-semibold tabular-nums text-gray-800">{count}</span>
    </p>
  );
}
