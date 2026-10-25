import Image, { type ImageProps } from "next/image"
import { cn } from "@/lib/utils"

/** Logo de DIFAR: la versión clara del texto se usa en el modo nocturno. */
export function LogoDifar({ className, ...props }: Omit<ImageProps, "src" | "alt">) {
  return (
    <>
      <Image src="/difar-logo.png" alt="Logo difar" className={cn(className, "dark:hidden")} {...props} />
      <Image src="/difar-logo-oscuro.png" alt="Logo difar" className={cn(className, "hidden dark:block")} {...props} />
    </>
  )
}
