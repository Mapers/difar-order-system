/**
 * Fondo del inicio de sesión: escena difuminada del rubro (distribución farmacéutica).
 * Manchas de color, cápsulas y cruces desenfocadas a distintas profundidades, una red de
 * moléculas y una ruta de reparto. Solo decorativo: no recibe clics ni lo lee el lector de pantalla.
 */

const ANIMACIONES = `
@keyframes login-flotar { 0%, 100% { transform: translate3d(0, 0, 0) rotate(var(--giro, 0deg)) } 50% { transform: translate3d(0, -22px, 0) rotate(calc(var(--giro, 0deg) + 6deg)) } }
@keyframes login-deriva { 0%, 100% { transform: translate3d(0, 0, 0) scale(1) } 50% { transform: translate3d(3%, -4%, 0) scale(1.08) } }
@keyframes login-ruta { to { stroke-dashoffset: -280 } }
@media (prefers-reduced-motion: reduce) { .login-anim { animation: none !important } }
.login-quieto .login-anim { animation: none !important }
`

/** Cápsula de dos mitades (los colores del logo: rojo y blanco). */
function Capsula({ className, giro, demora, mitad = "#ef4444" }: { className: string; giro: number; demora: number; mitad?: string }) {
    return (
        <svg viewBox="0 0 120 48" className={`login-anim absolute ${className}`}
             style={{ ["--giro" as string]: `${giro}deg`, animation: `login-flotar ${9 + demora}s ease-in-out ${-demora}s infinite` }}>
            <defs>
                <clipPath id={`capsula-${giro}-${demora}`}><rect x="2" y="2" width="116" height="44" rx="22" /></clipPath>
            </defs>
            <g clipPath={`url(#capsula-${giro}-${demora})`}>
                <rect x="0" y="0" width="60" height="48" fill={mitad} />
                <rect x="60" y="0" width="60" height="48" fill="#f8fafc" />
                <rect x="0" y="6" width="120" height="9" fill="#ffffff" opacity=".28" />
            </g>
            <rect x="2" y="2" width="116" height="44" rx="22" fill="none" stroke="#ffffff" strokeOpacity=".35" strokeWidth="2" />
        </svg>
    )
}

/** Pastilla redonda con ranura. */
function Pastilla({ className, demora }: { className: string; demora: number }) {
    return (
        <svg viewBox="0 0 60 60" className={`login-anim absolute ${className}`}
             style={{ animation: `login-flotar ${11 + demora}s ease-in-out ${-demora}s infinite` }}>
            <circle cx="30" cy="30" r="27" fill="#e0e7ff" stroke="#ffffff" strokeOpacity=".5" strokeWidth="2" />
            <path d="M12 30h36" stroke="#a5b4fc" strokeWidth="3" strokeLinecap="round" />
        </svg>
    )
}

/** Cruz de farmacia. */
function Cruz({ className, demora }: { className: string; demora: number }) {
    return (
        <svg viewBox="0 0 60 60" className={`login-anim absolute ${className}`}
             style={{ animation: `login-flotar ${13 + demora}s ease-in-out ${-demora}s infinite` }}>
            <path d="M22 4h16v18h18v16H38v18H22V38H4V22h18z" fill="#60a5fa" />
        </svg>
    )
}

/**
 * `suave`: versión tenue para ponerla detrás de las pantallas de trabajo (todo el sistema):
 * va por debajo del contenido, con un velo más fuerte para no restar lectura y sin movimiento
 * para no distraer ni gastar equipo.
 */
export function FondoLogin({ suave = false }: { suave?: boolean }) {
    return (
        <div aria-hidden="true" className={`pointer-events-none fixed inset-0 overflow-hidden ${suave ? "login-quieto -z-10" : ""} bg-gradient-to-br from-blue-100 via-white to-indigo-100 dark:from-[#0b0f19] dark:via-[#0c1226] dark:to-[#10102e]`}>
            <style>{ANIMACIONES}</style>

            {/* Manchas de color muy desenfocadas. */}
            <div className="login-anim absolute -left-[12%] -top-[18%] h-[58vmax] w-[58vmax] rounded-full bg-blue-400/40 blur-[110px] dark:bg-blue-500/25"
                 style={{ animation: "login-deriva 22s ease-in-out infinite" }} />
            <div className="login-anim absolute -bottom-[22%] -right-[10%] h-[52vmax] w-[52vmax] rounded-full bg-indigo-400/40 blur-[120px] dark:bg-indigo-500/20"
                 style={{ animation: "login-deriva 26s ease-in-out -8s infinite" }} />
            <div className="login-anim absolute left-[38%] top-[48%] h-[30vmax] w-[30vmax] rounded-full bg-violet-400/30 blur-[110px] dark:bg-violet-500/20"
                 style={{ animation: "login-deriva 30s ease-in-out -14s infinite" }} />
            <div className="absolute right-[18%] top-[6%] h-[16vmax] w-[16vmax] rounded-full bg-rose-400/25 blur-[90px] dark:bg-rose-500/15" />

            {/* Red de moléculas y ruta de reparto, al fondo. */}
            <svg className="absolute inset-0 h-full w-full text-blue-700/20 blur-[1px] dark:text-blue-200/15" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
                <g fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M150 640l52-30 52 30v60l-52 30-52-30zM254 640l52-30 52 30v60l-52 30-52-30zM202 550l52-30 52 30v60l-52 30-52-30z" />
                    <path d="M1130 120l46-27 46 27v54l-46 27-46-27zM1222 120l46-27 46 27v54l-46 27-46-27zM1176 201l46-27 46 27v54l-46 27-46-27z" />
                    <path d="M358 670h70M1130 147h-64M1268 282v52" />
                </g>
                <g fill="currentColor">
                    <circle cx="428" cy="670" r="7" /><circle cx="1066" cy="147" r="7" /><circle cx="1268" cy="334" r="7" />
                </g>
                {/* Ruta: del almacén a las farmacias. */}
                <path className="login-anim" d="M-20 780C240 700 330 860 560 770S900 560 1090 640s260 40 380-60" fill="none" stroke="currentColor"
                      strokeWidth="3" strokeLinecap="round" strokeDasharray="4 16" style={{ animation: "login-ruta 18s linear infinite" }} />
                <g fill="currentColor">
                    <circle cx="560" cy="770" r="9" /><circle cx="1090" cy="640" r="9" /><circle cx="250" cy="752" r="9" />
                </g>
            </svg>

            {/* Cápsulas, pastillas y cruces desenfocadas: las lejanas más borrosas y tenues. */}
            <Capsula className="left-[3%] top-[4%] w-40 opacity-60 blur-[6px]" giro={-28} demora={0} />
            <Capsula className="right-[7%] top-[58%] w-56 opacity-50 blur-[10px]" giro={22} demora={3} mitad="#3b82f6" />
            <Capsula className="left-[30%] bottom-[7%] w-28 opacity-45 blur-[4px]" giro={48} demora={5} />
            <Capsula className="right-[30%] top-[9%] w-24 opacity-40 blur-[8px]" giro={-55} demora={2} mitad="#6366f1" />
            <Pastilla className="left-[16%] top-[56%] w-20 opacity-50 blur-[7px]" demora={1} />
            <Pastilla className="right-[14%] top-[24%] w-14 opacity-45 blur-[5px]" demora={4} />
            <Cruz className="left-[44%] top-[10%] w-16 opacity-30 blur-[9px]" demora={2} />
            <Cruz className="right-[40%] bottom-[10%] w-24 opacity-25 blur-[12px]" demora={6} />

            {/* Velo para que el texto se lea siempre. */}
            <div className={`absolute inset-0 ${suave ? "bg-white/60 dark:bg-[#070a14]/65" : "bg-white/30 dark:bg-[#070a14]/45"}`} />
        </div>
    )
}
