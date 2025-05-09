import { z } from "zod"

export const dateSchema = z.object({
  fecha: z.string().refine((date) => {
    return !isNaN(Date.parse(date))
  }, {
    message: "La fecha no es válida",
  }),
})
