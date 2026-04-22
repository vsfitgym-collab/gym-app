import type { Exercicio } from '../data/exercicios/types'

export const GRUPOS_VALIDOS = [
  "antebraco",
  "biceps",
  "calistenia",
  "cardio",
  "costas",
  "crossfit",
  "eretor_lombar",
  "funcional_hiit",
  "gluteos",
  "mobilidade",
  "ombros",
  "panturrilha",
  "peitoral",
  "pernas",
  "trapezio",
  "triceps"
] as const

export type GrupoValido = typeof GRUPOS_VALIDOS[number]

export const GRUPOS_LABEL: Record<GrupoValido, string> = {
  antebraco: "Antebraço",
  biceps: "Bíceps",
  calistenia: "Calistenia",
  cardio: "Cardio",
  costas: "Costas",
  crossfit: "Crossfit",
  eretor_lombar: "Eretor Lombar",
  funcional_hiit: "Funcional e HIIT",
  gluteos: "Glúteos",
  mobilidade: "Mobilidade",
  ombros: "Ombros",
  panturrilha: "Panturrilha",
  peitoral: "Peitoral",
  pernas: "Pernas",
  trapezio: "Trapézio",
  triceps: "Tríceps"
}

export function normalizeGrupo(grupo: string): string {
  return grupo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function getGrupoLabel(grupo: string): string {
  const normalized = normalizeGrupo(grupo) as GrupoValido
  return GRUPOS_LABEL[normalized] || grupo
}

export function validarGrupo(grupo: string): boolean {
  const normalized = normalizeGrupo(grupo)
  return GRUPOS_VALIDOS.includes(normalized as GrupoValido)
}

export function getGruposFromExercicios(exercicios: Exercicio[]): { value: string; label: string }[] {
  const gruposUnicos = [...new Set(exercicios.map(e => normalizeGrupo(e.grupoMuscular)))]
    .filter((g): g is GrupoValido => GRUPOS_VALIDOS.includes(g as GrupoValido))
    .sort()

  return [
    { value: "todos", label: "Todos" },
    ...gruposUnicos.map(grupo => ({
      value: grupo,
      label: GRUPOS_LABEL[grupo]
    }))
  ]
}

export function filterExercicios(
  exercicios: Exercicio[],
  filtro: string
): Exercicio[] {
  if (filtro === "todos") return exercicios
  return exercicios.filter(ex => normalizeGrupo(ex.grupoMuscular) === filtro)
}