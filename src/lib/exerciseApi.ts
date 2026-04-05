import type { Exercise } from './exerciseTranslations'
import { translateExercise, generateInstructions } from './exerciseTranslations'

const EXERCISE_DB_API = 'https://exercisedb.p.rapidapi.com'
const EXERCISE_DB_KEY = import.meta.env.VITE_RAPIDAPI_KEY

interface ApiResponse<T> {
  data: T
  error?: string
}

const headers = {
  'Content-Type': 'application/json',
  ...(EXERCISE_DB_KEY && { 'X-RapidAPI-Key': EXERCISE_DB_KEY }),
  'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
}

const getGifUrl = (exerciseId: string): string => {
  return `https://exercise-db-images.vercel.app/${exerciseId}.gif`
}

export const fetchExercises = async (
  limit: number = 20, 
  offset: number = 0
): Promise<ApiResponse<Exercise[]>> => {
  try {
    const response = await fetch(
      `${EXERCISE_DB_API}/exercises?limit=${limit}&offset=${offset}`,
      { headers }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('API exercises sample:', data.slice(0, 2))

    const translatedData = data.map((exercise: any) => {
      const gifUrl = getGifUrl(exercise.id)
      
      return {
        ...exercise,
        id: exercise.id || `ex-${Math.random().toString(36).substr(2, 9)}`,
        name: exercise.name,
        gifUrl: gifUrl,
        instructions: exercise.instructions?.length > 0 
          ? exercise.instructions 
          : generateInstructions(exercise.target, exercise.name),
      }
    })

    return { data: translatedData.map(translateExercise) }
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Failed to fetch exercises' 
    }
  }
}

export const fetchExercisesByBodyPart = async (
  bodyPart: string,
  limit: number = 20
): Promise<ApiResponse<Exercise[]>> => {
  try {
    const response = await fetch(
      `${EXERCISE_DB_API}/exercises/bodyPart/${bodyPart}?limit=${limit}`,
      { headers }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    const translatedData = data.map((exercise: any) => {
      const gifUrl = getGifUrl(exercise.id)
      
      return {
        ...exercise,
        id: exercise.id || `ex-${Math.random().toString(36).substr(2, 9)}`,
        gifUrl: gifUrl,
        instructions: exercise.instructions?.length > 0 
          ? exercise.instructions 
          : generateInstructions(exercise.target, exercise.name),
      }
    })

    return { data: translatedData.map(translateExercise) }
  } catch (error) {
    console.error('Error fetching exercises by body part:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Failed to fetch exercises' 
    }
  }
}

export const fetchExerciseById = async (
  id: string
): Promise<ApiResponse<Exercise>> => {
  try {
    const response = await fetch(
      `${EXERCISE_DB_API}/exercises/exercise/${id}`,
      { headers }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const gifUrl = getGifUrl(data.id)

    const translatedExercise = translateExercise({
      ...data,
      gifUrl: gifUrl,
      instructions: data.instructions?.length > 0 
        ? data.instructions 
        : generateInstructions(data.target, data.name),
    })

    return { data: translatedExercise }
  } catch (error) {
    console.error('Error fetching exercise by id:', error)
    return { 
      data: {} as Exercise, 
      error: error instanceof Error ? error.message : 'Failed to fetch exercise' 
    }
  }
}

export const searchExercises = async (
  query: string,
  limit: number = 20
): Promise<ApiResponse<Exercise[]>> => {
  try {
    const response = await fetch(
      `${EXERCISE_DB_API}/exercises/name/${query}?limit=${limit}`,
      { headers }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    const translatedData = data.map((exercise: any) => {
      const gifUrl = getGifUrl(exercise.id)
      
      return {
        ...exercise,
        id: exercise.id || `ex-${Math.random().toString(36).substr(2, 9)}`,
        gifUrl: gifUrl,
        instructions: exercise.instructions?.length > 0 
          ? exercise.instructions 
          : generateInstructions(exercise.target, exercise.name),
      }
    })

    return { data: translatedData.map(translateExercise) }
  } catch (error) {
    console.error('Error searching exercises:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Failed to search exercises' 
    }
  }
}

export const fetchAllBodyParts = async (): Promise<ApiResponse<string[]>> => {
  try {
    const response = await fetch(
      `${EXERCISE_DB_API}/exercises/bodyPartList`,
      { headers }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return { data }
  } catch (error) {
    console.error('Error fetching body parts:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Failed to fetch body parts' 
    }
  }
}

export const fetchAllEquipment = async (): Promise<ApiResponse<string[]>> => {
  try {
    const response = await fetch(
      `${EXERCISE_DB_API}/exercises/equipmentList`,
      { headers }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return { data }
  } catch (error) {
    console.error('Error fetching equipment:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Failed to fetch equipment' 
    }
  }
}

export const fetchAllTargetMuscles = async (): Promise<ApiResponse<string[]>> => {
  try {
    const response = await fetch(
      `${EXERCISE_DB_API}/exercises/targetList`,
      { headers }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return { data }
  } catch (error) {
    console.error('Error fetching target muscles:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Failed to fetch target muscles' 
    }
  }
}

export const mockExercises: Exercise[] = [
  {
    id: 'mock-1',
    name: 'Barbell Bench Press',
    bodyPart: 'chest',
    target: 'pectorals',
    equipment: 'barbell',
    gifUrl: '',
    instructions: ['Deite no banco com os pés no chão', 'Segure a barra com as mãos afastadas', 'Abaixe a barra até o peito', 'Empurre a barra para cima'],
  },
  {
    id: 'mock-2',
    name: 'Dumbbell Bicep Curl',
    bodyPart: 'upper arms',
    target: 'biceps',
    equipment: 'dumbbell',
    gifUrl: '',
    instructions: ['Fique em pé com os halteres ao lado do corpo', 'Dobre os cotovelos e levante os halteres', 'Aperte o bíceps no topo', 'Retorne lentamente à posição inicial'],
  },
  {
    id: 'mock-3',
    name: 'Pull Up',
    bodyPart: 'back',
    target: 'lats',
    equipment: 'body weight',
    gifUrl: '',
    instructions: ['Suspenda-se na barra com as palmas voltadas para fora', 'Puxe o corpo para cima até o queixo passar a barra', 'Desça lentamente controlando o movimento', 'Repita o exercício'],
  },
  {
    id: 'mock-4',
    name: 'Squat',
    bodyPart: 'upper legs',
    target: 'quads',
    equipment: 'barbell',
    gifUrl: '',
    instructions: ['Posicione a barra nos ombros', 'Desça flexionando os joelhos', 'Mantenha as costas retas', 'Retorne à posição inicial'],
  },
  {
    id: 'mock-5',
    name: 'Dumbbell Shoulder Press',
    bodyPart: 'shoulders',
    target: 'delts',
    equipment: 'dumbbell',
    gifUrl: '',
    instructions: ['Sente-se com os halteres nos ombros', 'Empurre os halteres para cima', 'Mantenha o núcleo estável', 'Retorne lentamente'],
  },
  {
    id: 'mock-6',
    name: 'Deadlift',
    bodyPart: 'back',
    target: 'spine',
    equipment: 'barbell',
    gifUrl: '',
    instructions: ['Fique em pé com os pés na largura dos ombros', 'Dobre o quadril e segure a barra', 'Mantenha as costas retas', 'Levante a barra estendendo os quadris'],
  },
  {
    id: 'mock-7',
    name: 'Tricep Dip',
    bodyPart: 'upper arms',
    target: 'triceps',
    equipment: 'body weight',
    gifUrl: '',
    instructions: ['Coloque as mãos no banco atrás de você', 'Desça flexionando os cotovelos', 'Empurre para cima estendendo os braços', 'Repita'],
  },
  {
    id: 'mock-8',
    name: 'Lunge',
    bodyPart: 'upper legs',
    target: 'glutes',
    equipment: 'body weight',
    gifUrl: '',
    instructions: ['Fique em pé com os pés afastados', 'Dê um passo à frente', 'Desça até os joelhos estarem em 90 graus', 'Retorne e repita do outro lado'],
  },
  {
    id: 'mock-9',
    name: 'Calf Raise',
    bodyPart: 'lower legs',
    target: 'calves',
    equipment: 'body weight',
    gifUrl: '',
    instructions: ['Fique em pé com os pés na largura dos ombros', 'Suba nas pontas dos pés', 'Aperte as panturrilhas no topo', 'Desça lentamente'],
  },
  {
    id: 'mock-10',
    name: 'Plank',
    bodyPart: 'waist',
    target: 'abs',
    equipment: 'body weight',
    gifUrl: '',
    instructions: ['Coloque os antebraços no chão', 'Mantenha o corpo em linha reta', 'Contraia o core', 'Segure a posição pelo tempo determinado'],
  },
  {
    id: 'mock-11',
    name: 'Lat Pulldown',
    bodyPart: 'back',
    target: 'lats',
    equipment: 'cable',
    gifUrl: '',
    instructions: ['Sente-se na máquina com os joelhos travados', 'Segure a barra com as mãos afastadas', 'Puxe a barra até o peito', 'Retorne lentamente'],
  },
  {
    id: 'mock-12',
    name: 'Leg Press',
    bodyPart: 'upper legs',
    target: 'quads',
    equipment: 'leverage machine',
    gifUrl: '',
    instructions: ['Sente na máquina com os pés no plataforma', 'Descae o peso flexionando os joelhos', 'Empurre a plataforma para cima', 'Não trave os joelhos'],
  },
]

export const getMockExercises = (): Promise<Exercise[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockExercises.map(translateExercise))
    }, 500)
  })
}