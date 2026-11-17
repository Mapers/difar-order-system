import withPWAInit from "@ducanh2912/next-pwa"
import { execSync } from "node:child_process"
import { writeFileSync } from "node:fs"

// Versión de este despliegue: el commit que compila Amplify (AWS_COMMIT_ID).
// Se graba en el front (NEXT_PUBLIC_APP_VERSION) y en public/version.json;
// si el servidor tiene otra versión, el front pide volver a iniciar sesión.
const APP_VERSION = (() => {
  if (process.env.AWS_COMMIT_ID) return process.env.AWS_COMMIT_ID.slice(0, 12)
  try { return execSync("git rev-parse --short=12 HEAD").toString().trim() } catch { return String(Date.now()) }
})()
try {
  writeFileSync(new URL("./public/version.json", import.meta.url), JSON.stringify({ version: APP_VERSION }) + "\n")
} catch (e) {
  console.warn("No se pudo escribir public/version.json", e)
}

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})

let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: APP_VERSION,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default withPWA(nextConfig)
