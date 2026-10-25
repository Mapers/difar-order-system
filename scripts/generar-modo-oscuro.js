/**
 * Genera app/modo-oscuro.css: la capa general del modo nocturno.
 *
 * Muchos módulos usan colores pensados solo para el tema claro (fondos
 * tintados como bg-red-50, textos oscuros como text-blue-900, bordes
 * claros...). En vez de repetir una variante dark: en cada archivo, esta capa
 * reinterpreta esas clases cuando el tema es oscuro:
 *   - fondos claros de color  -> el mismo tono, translúcido sobre el fondo oscuro
 *   - textos oscuros de color -> el mismo tono, claro
 *   - bordes claros de color  -> el mismo tono, translúcido
 *   - grises y blanco         -> los tokens del tema (card, muted, border...)
 *
 * Los selectores usan :where(.dark), así que pesan lo mismo que la clase
 * original: ganan a ella por ir después, pero una variante dark: explícita
 * (más específica) sigue mandando donde un módulo ya la define.
 *
 * Como Tailwind, solo emite las clases que aparecen en el código (app/,
 * components/), así que corre antes de cada build (npm run prebuild).
 *
 * Uso: node scripts/generar-modo-oscuro.js
 */
const fs = require('fs')
const path = require('path')
const colores = require('tailwindcss/colors')

const TINTES = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const GRISES = ['slate', 'gray', 'zinc', 'neutral', 'stone']

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}
const alfa = (hex, a) => `rgb(${rgb(hex)} / ${a})`
const esc = (clase) => clase.replace(/\//g, '\\/').replace(/:/g, '\\:')

// Variantes de estado que también se reinterpretan.
const VARIANTES = [
  (c) => `.${esc(c)}`,
  (c) => `.${esc(`hover:${c}`)}:hover`,
  (c) => `.group:hover .${esc(`group-hover:${c}`)}`,
]
// Clases usadas en el código (con o sin variante hover:/group-hover:).
const RAIZ = path.join(__dirname, '..')
const usadas = new Set()
;(function leer(dir) {
  for (const f of fs.readdirSync(dir)) {
    if (f === 'node_modules' || f.startsWith('.')) continue
    const ruta = path.join(dir, f)
    if (fs.statSync(ruta).isDirectory()) leer(ruta)
    else if (/\.(tsx|ts|jsx|js)$/.test(f)) for (const t of fs.readFileSync(ruta, 'utf8').split(/[\s"'`{}()]+/)) usadas.add(t)
  }
})(path.join(RAIZ, 'app'))
;(function leer(dir) {
  for (const f of fs.readdirSync(dir)) {
    const ruta = path.join(dir, f)
    if (fs.statSync(ruta).isDirectory()) leer(ruta)
    else if (/\.(tsx|ts)$/.test(f)) for (const t of fs.readFileSync(ruta, 'utf8').split(/[\s"'`{}()]+/)) usadas.add(t)
  }
})(path.join(RAIZ, 'components'))
const PREFIJOS = ['', 'hover:', 'group-hover:']

const reglas = []
const regla = (clase, decl, variantes = VARIANTES) => {
  const activas = variantes.filter((_, i) => usadas.has(PREFIJOS[i] + clase))
  if (activas.length) reglas.push(`${activas.map(v => `:where(.dark) ${v(clase)}`).join(',\n')} { ${decl} }`)
}
const divisor = (clase, color) => {
  if (usadas.has(clase)) reglas.push(`:where(.dark) .${esc(clase)} > :not([hidden]) ~ :not([hidden]) { border-color: ${color}; }`)
}

const OPACIDADES = [null, 30, 40, 50, 60, 70, 80]
const conOpacidad = (base, op) => (op ? `${base}/${op}` : base)

// Fondos claros: tono 500 translúcido. Más claro en claro = más sutil en oscuro.
const FONDO = { 50: 0.1, 100: 0.15, 200: 0.22, 300: 0.3 }
// Textos oscuros: el tono claro equivalente.
const TEXTO = { 600: 400, 700: 300, 800: 300, 900: 200, 950: 100 }
const BORDE = { 50: 0.15, 100: 0.2, 200: 0.3, 300: 0.4 }

for (const c of TINTES) {
  const p = colores[c]
  for (const [tono, a] of Object.entries(FONDO)) {
    for (const op of OPACIDADES) {
      const factor = op ? op / 100 : 1
      regla(conOpacidad(`bg-${c}-${tono}`, op), `background-color: ${alfa(p[500], +(a * factor).toFixed(3))};`)
    }
    const color = alfa(p[500], a)
    regla(`from-${c}-${tono}`, `--tw-gradient-from: ${color} var(--tw-gradient-from-position); --tw-gradient-to: ${alfa(p[500], 0)} var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);`, [VARIANTES[0]])
    regla(`via-${c}-${tono}`, `--tw-gradient-to: ${alfa(p[500], 0)} var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), ${color} var(--tw-gradient-via-position), var(--tw-gradient-to);`, [VARIANTES[0]])
    regla(`to-${c}-${tono}`, `--tw-gradient-to: ${color} var(--tw-gradient-to-position);`, [VARIANTES[0]])
  }
  for (const [tono, claro] of Object.entries(TEXTO)) regla(`text-${c}-${tono}`, `color: ${p[claro]};`)
  for (const [tono, a] of Object.entries(BORDE)) {
    for (const lado of ['', '-t', '-b', '-l', '-r', '-x', '-y']) regla(`border${lado}-${c}-${tono}`, `border-color: ${alfa(p[500], a)};`, [VARIANTES[0]])
    divisor(`divide-${c}-${tono}`, alfa(p[500], a))
  }
}

// Grises y blanco: a los tokens del tema, para que todo use la misma paleta.
for (const c of GRISES) {
  for (const tono of [50, 100]) {
    for (const op of OPACIDADES) regla(conOpacidad(`bg-${c}-${tono}`, op), `background-color: hsl(var(--muted) / ${op ? op / 100 : 1});`)
  }
  regla(`bg-${c}-200`, 'background-color: hsl(var(--accent));')
  for (const tono of [700, 800, 900, 950]) regla(`text-${c}-${tono}`, 'color: hsl(var(--foreground));')
  regla(`text-${c}-600`, 'color: hsl(var(--muted-foreground));')
  for (const tono of [100, 200, 300]) {
    for (const lado of ['', '-t', '-b', '-l', '-r', '-x', '-y']) regla(`border${lado}-${c}-${tono}`, 'border-color: hsl(var(--border));', [VARIANTES[0]])
    divisor(`divide-${c}-${tono}`, 'hsl(var(--border))')
  }
  for (const tono of [50, 100]) {
    regla(`from-${c}-${tono}`, '--tw-gradient-from: hsl(var(--muted)) var(--tw-gradient-from-position); --tw-gradient-to: hsl(var(--muted) / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);', [VARIANTES[0]])
    regla(`to-${c}-${tono}`, '--tw-gradient-to: hsl(var(--muted)) var(--tw-gradient-to-position);', [VARIANTES[0]])
  }
}
// Grises neutros que los módulos ya fijaron para el modo oscuro (dark:bg-gray-800,
// dark:border-zinc-700...): se llevan a la paleta del tema para que todos los
// módulos usen las mismas superficies. Mismo selector que Tailwind, va después: gana.
const SUPERFICIE = { 950: '--background', 900: '--card', 800: '--muted', 700: '--accent', 600: '--input' }
const oscura = (clase, decl, conEstados = true) => {
  const prefijos = conEstados ? ['dark:', 'dark:hover:'] : ['dark:']
  const sel = prefijos.filter(pre => usadas.has(pre + clase))
    .map(pre => `.dark .${esc(pre + clase)}${pre.includes('hover') ? ':hover' : ''}`)
  if (sel.length) reglas.push(`${sel.join(',\n')} { ${decl} }`)
}
for (const c of [...GRISES, 'black']) {
  const tonos = c === 'black' ? { '': '--background' } : SUPERFICIE
  for (const [tono, token] of Object.entries(tonos)) {
    const nombre = tono ? `${c}-${tono}` : c
    for (const op of OPACIDADES) oscura(conOpacidad(`bg-${nombre}`, op), `background-color: hsl(var(${token}) / ${op ? op / 100 : 1});`)
    oscura(`from-${nombre}`, `--tw-gradient-from: hsl(var(${token})) var(--tw-gradient-from-position); --tw-gradient-to: hsl(var(${token}) / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);`, false)
    oscura(`to-${nombre}`, `--tw-gradient-to: hsl(var(${token})) var(--tw-gradient-to-position);`, false)
  }
  if (c === 'black') continue
  for (const tono of [600, 700, 800, 900, 950]) {
    for (const lado of ['', '-t', '-b', '-l', '-r', '-x', '-y']) oscura(`border${lado}-${c}-${tono}`, 'border-color: hsl(var(--border));', false)
    if (usadas.has(`dark:divide-${c}-${tono}`)) reglas.push(`.dark .${esc(`dark:divide-${c}-${tono}`)} > :not([hidden]) ~ :not([hidden]) { border-color: hsl(var(--border)); }`)
  }
}

regla('bg-white', 'background-color: hsl(var(--card));')
regla('from-white', '--tw-gradient-from: hsl(var(--card)) var(--tw-gradient-from-position); --tw-gradient-to: hsl(var(--card) / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);', [VARIANTES[0]])
regla('to-white', '--tw-gradient-to: hsl(var(--card)) var(--tw-gradient-to-position);', [VARIANTES[0]])
regla('text-black', 'color: hsl(var(--foreground));')

const salida = path.join(__dirname, '..', 'app', 'modo-oscuro.css')
fs.writeFileSync(salida, `/* Generado por scripts/generar-modo-oscuro.js. No editar a mano. */\n${reglas.join('\n')}\n`)
console.log(`${reglas.length} reglas -> ${path.relative(process.cwd(), salida)}`)
