import { z } from 'zod'

export const documentoSchema = z.object({
    documento: z.string()
        .nonempty('El campo "documento" es obligatorio.')
        .regex(/^\d{2}-[A-Z]\d{3}-\d{4}$/, 'El formato del "documento" es inválido. Ej: 01-F001-9061')
})


export const clientSchema = z.object({
    nombreApellido: z.string()
        .min(1, 'El nombre y apellido es obligatorio.')
        .regex(/^[A-Za-z\s]+$/, 'El nombre y apellido solo puede contener letras y espacios.'),

    fechaCorte: z.string()
        .min(1, 'La fecha de corte es obligatoria.')
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de corte debe tener el formato YYYY-MM-DD.')
        .refine((date) => !isNaN(Date.parse(date)), {
            message: 'La fecha de corte no es válida.',
        }),
})
