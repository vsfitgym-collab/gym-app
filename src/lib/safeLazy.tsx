import { lazy, ComponentType, FunctionComponent } from "react"

type ModuleExport = ComponentType<any>
type ModuleExports = Record<string, ModuleExport>

function getFirstExport(mod: ModuleExports): { default: ModuleExport } {
  if (mod.default) {
    return { default: mod.default }
  }
  
  const keys = Object.keys(mod).filter(k => k !== "default" && typeof mod[k] === "function")
  if (keys.length > 0) {
    const firstKey = keys[0]
    console.warn(`[safeLazy] Using named export "${firstKey}" as default`)
    return { default: mod[firstKey] }
  }
  
  console.error("[safeLazy] No valid export found in module:", mod)
  const Fallback: FunctionComponent = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  )
  return { default: Fallback }
}

function getErrorFallback(): { default: ModuleExport } {
  const ErrorFallback: FunctionComponent = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center p-8">
        <p className="text-lg font-semibold mb-2">Erro ao carregar página</p>
        <p className="text-muted-foreground text-sm">Tente novamente mais tarde</p>
      </div>
    </div>
  )
  return { default: ErrorFallback }
}

export function safeLazy(
  importFn: () => Promise<ModuleExports>
): ReturnType<typeof lazy> {
  return lazy(() =>
    importFn()
      .then(getFirstExport)
      .catch(() => getErrorFallback())
  )
}