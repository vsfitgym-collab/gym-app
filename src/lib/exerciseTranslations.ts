export interface Exercise {
  id: string
  name: string
  bodyPart: string
  target: string
  equipment: string
  gif?: string
  gifUrl?: string
  instructions: string[]
}

const bodyPartTranslations: Record<string, string> = {
  'waist': 'Cintura',
  'upper legs': 'Coxas Superiores',
  'back': 'Costas',
  'lower legs': 'Inferiores',
  'shoulders': 'Ombros',
  'arms': 'Braços',
  'chest': 'Peito',
  'upper arms': 'Braços Superiores',
  'lower arms': 'Braços Inferiores',
  'neck': 'Pescoço',
  'cardio': 'Cardio',
  'all': 'Corpo Inteiro',
  'antebraco': 'Antebraço',
  'biceps': 'Bíceps',
  'costas': 'Costas',
  'pernas': 'Pernas',
  'calistenia': 'Calistenia',
  'crossfit': 'Crossfit',
}

const targetTranslations: Record<string, string> = {
  'abs': 'Abdômen',
  'abductors': 'Abdutores',
  'adductors': 'Adutores',
  'biceps': 'Bíceps',
  'calves': 'Panturrilhas',
  'delts': 'Deltóides',
  'forearms': 'Antebraços',
  'glutes': 'Glúteos',
  'hamstrings': 'Posterior',
  'lats': 'Latíssimo',
  'levator scapulae': 'Elevador da Escápula',
  'pectorals': 'Peitorais',
  'quads': 'Quadríceps',
  'serratus anterior': 'Serrátil Anterior',
  'spine': 'Coluna',
  'traps': 'Trapézio',
  'triceps': 'Tríceps',
  'upper back': 'Costas Superiores',
  'cardiovascular system': 'Sistema Cardiovascular',
  'squads': 'Quadríceps',
  'antebraco': 'Antebraço',
  'costas': 'Costas',
  'calistenia': 'Calistenia',
  'crossfit': 'Crossfit',
}

const equipmentTranslations: Record<string, string> = {
  'body weight': 'Peso Corporal',
  'barbell': 'Barra',
  'dumbbell': 'Halteres',
  'cable': 'Cabo',
  'kettlebell': 'Kettlebell',
  'leverage machine': 'Máquina',
  'resistance band': 'Elástico',
  'smith machine': 'Smith Machine',
  'weighted': 'Com Peso',
  'ez barbell': 'Barra EZ',
  'medicine ball': 'Bola Medicinal',
  'fitball': 'Bola de Ginástica',
  'olympic barbell': 'Barra Olípica',
  'rope': 'Corda',
  'skierg machine': 'Skierg',
  'stationary bike': 'Bicicleta Ergométrica',
  'trap bar': 'Trap Bar',
  'upper body ergometer': 'Ergômetro Superior',
  'wheel roller': 'Rolo',
}

export const translateBodyPart = (bodyPart: string): string => {
  return bodyPartTranslations[bodyPart.toLowerCase()] || bodyPart
}

export const translateTarget = (target: string): string => {
  return targetTranslations[target.toLowerCase()] || target
}

export const translateEquipment = (equipment: string): string => {
  return equipmentTranslations[equipment.toLowerCase()] || equipment
}

export const generateInstructions = (target: string, _exerciseName?: string): string[] => {
  const translatedTarget = translateTarget(target)

  const baseInstructions = [
    `Posicione-se corretamente antes de iniciar o movimento`,
    `Execute o movimento de forma controlada, focando no músculo ${translatedTarget.toLowerCase()}`,
    `Mantenha a postura adequada durante toda a execução`,
    `Respire corretamente - expire na fase de esforço e inspire no retorno`,
    `Controle o peso em toda a amplitude do movimento`,
  ]

  const specificInstructions: Record<string, string[]> = {
    'bíceps': [
      'Mantenha os cotovelos fixos junto ao corpo',
      'NãoBalance o corpo para auxiliar o movimento',
      'Aperte o bíceps no topo do movimento',
    ],
    'tríceps': [
      'Mantenha os cotovelos apontando para cima',
      'Não mova os ombros durante o exercício',
      'Estenda completamente os braços no topo',
    ],
    'peitorais': [
      'Mantenha as escápulas contraídas',
      'Não arquete as costas excessivamente',
      'Controle o retorno do movimento',
    ],
    'costas': [
      'Puxe com os ombros para trás e para baixo',
      'Não use impulso para completar o movimento',
      'Contrua os músculos na fase de Concentração',
    ],
    'quadríceps': [
      'Mantenha os joelhos alinhados com os pés',
      'Não Deixe os joelhos ultrapassarem a ponta dos pés',
      'Desça até que os joelhos estejam em 90 graus',
    ],
    'posterior': [
      'Mantenha as costas retas durante o movimento',
      'Dobre o quadril ao invés de arredondar as costas',
      'Sinta o alongamento na parte posterior da coxa',
    ],
    'glúteos': [
      'Aperte os glúteos no topo do movimento',
      'Mantenha o núcleo estável durante o exercício',
      'Evite empurrar com a região lombar',
    ],
    'panturrilhas': [
      'Mantenha os joelhos levemente flexionados',
      'Alongue completamente na posição inferior',
      'Suba nas pontas dos pés para máximo contato',
    ],
    'ombros': [
      'Mantenha o núcleo estável para evitar compensações',
      'Não Balance o corpo durante o movimento',
      'Controle a descida do peso',
    ],
    'abdômen': [
      'Mantenha o core contraído durante todo o exercício',
      'Não puxe o pescoço com as mãos',
      'Expire ao contrair os músculos abdominais',
    ],
  }

  const key = Object.keys(specificInstructions).find(k =>
    translatedTarget.toLowerCase().includes(k)
  )

  return key
    ? [...specificInstructions[key], ...baseInstructions.slice(2)]
    : baseInstructions
}

export const translateExercise = (exercise: Exercise): Exercise => ({
  ...exercise,
  bodyPart: translateBodyPart(exercise.bodyPart),
  target: translateTarget(exercise.target),
  equipment: translateEquipment(exercise.equipment),
  instructions: exercise.instructions.length > 0
    ? exercise.instructions
    : generateInstructions(exercise.target, exercise.name),
})

export const getExerciseNameTranslation = (name: string): string => {
  return name
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const bodyParts = [
  { value: 'all', label: 'Corpo Inteiro' },
  { value: 'back', label: 'Costas' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'chest', label: 'Peito' },
  { value: 'lower arms', label: 'Braços Inferiores' },
  { value: 'lower legs', label: 'Pernas Inferiores' },
  { value: 'neck', label: 'Pescoço' },
  { value: 'shoulders', label: 'Ombros' },
  { value: 'upper arms', label: 'Braços Superiores' },
  { value: 'upper legs', label: 'Coxas Superiores' },
  { value: 'waist', label: 'Cintura' },
  { value: 'antebraco', label: 'Antebraço' },
  { value: 'biceps', label: 'Bíceps' },
  { value: 'pernas', label: 'Pernas' },
  { value: 'calistenia', label: 'Calistenia' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'crossfit', label: 'Crossfit' },
]

export const muscleGroups = [
  { value: 'all', label: 'Todos' },
  { value: 'biceps', label: 'Bíceps' },
  { value: 'calves', label: 'Panturrilhas' },
  { value: 'chest', label: 'Peito' },
  { value: 'delts', label: 'Deltóides' },
  { value: 'forearms', label: 'Antebraços' },
  { value: 'glutes', label: 'Glúteos' },
  { value: 'hamstrings', label: 'Posterior' },
  { value: 'lats', label: 'Latíssimo' },
  { value: 'pectorals', label: 'Peitorais' },
  { value: 'quads', label: 'Quadríceps' },
  { value: 'traps', label: 'Trapézio' },
  { value: 'triceps', label: 'Tríceps' },
  { value: 'antebraco', label: 'Antebraço' },
  { value: 'pernas', label: 'Pernas' },
  { value: 'costas', label: 'Costas' },
  { value: 'calistenia', label: 'Calistenia' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'crossfit', label: 'Crossfit' },
]

export const equipmentTypes = [
  { value: 'all', label: 'Todos' },
  { value: 'barbell', label: 'Barra' },
  { value: 'dumbbell', label: 'Halteres' },
  { value: 'cable', label: 'Cabo' },
  { value: 'body weight', label: 'Peso Corporal' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'resistance band', label: 'Elástico' },
  { value: 'leverage machine', label: 'Máquina' },
  { value: 'weighted', label: 'Com Peso' },
]