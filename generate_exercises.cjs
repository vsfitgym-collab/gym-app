const fs = require('fs');

const rawData = fs.readFileSync('C:/Users/laercio/.gemini/antigravity/brain/cab1d2a4-72cd-46ff-b99a-4d31e69d5fb0/.system_generated/steps/104/output.txt', 'utf8');
const obj = JSON.parse(rawData);
const resultStr = obj.result;
const start = resultStr.indexOf('[');
const end = resultStr.lastIndexOf(']');
const dataStr = resultStr.substring(start, end + 1);
const data = JSON.parse(dataStr);

const exercises = {};

// Map to translate folder names to standard target muscles
const targetMapping = {
  'antebraco': 'Antebraço',
  'biceps': 'Bíceps',
  'calistenia': 'Corpo Todo',
  'cardio': 'Cardio',
  'costas': 'Costas',
  'crossfit': 'Corpo Todo',
  'eretorLombar': 'Lombar',
  'funcional': 'Funcional',
  'gluteos': 'Glúteos',
  'mobilidade': 'Mobilidade',
  'ombros': 'Ombro',
  'panturrilha': 'Panturrilha',
  'peitoral': 'Peito',
  'pernas': 'Perna',
  'trapezio': 'Trapézio',
  'triceps': 'Tríceps'
};

data.forEach(item => {
  const parts = item.name.split('/');
  if (parts.length === 2) {
    const folder = parts[0];
    const file = parts[1];
    
    // Skip if it doesn't have an extension we care about
    if (!file.includes('.')) return;
    
    const ext = file.split('.').pop();
    let baseName = file.replace('.' + ext, '').replace('_fixed', '');
    
    // Fix names like "rosca-direta (1)" -> "rosca-direta"
    baseName = baseName.replace(/ \(\d+\)$/, '').trim();
    
    if (!exercises[baseName]) {
      const formattedName = baseName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      exercises[baseName] = {
        id: baseName,
        name: formattedName,
        target: targetMapping[folder] || folder,
        equipment: 'Peso Corporal', // default for now, could be improved based on keyword (barra, cabo, maquina, halter)
        gifUrl: '',
        thumbnail: ''
      };
      
      // Try to guess equipment
      const nameLower = baseName.toLowerCase();
      if (nameLower.includes('halter')) exercises[baseName].equipment = 'Halteres';
      else if (nameLower.includes('barra')) exercises[baseName].equipment = 'Barra';
      else if (nameLower.includes('cabo') || nameLower.includes('polia')) exercises[baseName].equipment = 'Cabo';
      else if (nameLower.includes('maquina') || nameLower.includes('smith')) exercises[baseName].equipment = 'Máquina';
      else if (nameLower.includes('elastico') || nameLower.includes('banda') || nameLower.includes('faixa')) exercises[baseName].equipment = 'Elástico';
      else if (nameLower.includes('kettlebell')) exercises[baseName].equipment = 'Kettlebell';
    }
    
    const url = 'https://ueixrbdbtjpyuortrniz.supabase.co/storage/v1/object/public/exercicios/' + item.name;
    
    if (ext === 'mp4') {
      exercises[baseName].gifUrl = url;
    } else if (ext === 'jpg' || ext === 'png') {
      exercises[baseName].thumbnail = url;
    }
  }
});

const result = Object.values(exercises);

const fileContent = `export interface Exercise {
  id: string;
  name: string;
  target: string;
  equipment: string;
  gifUrl?: string;
  thumbnail?: string;
}

export const exerciseLibrary: Exercise[] = ${JSON.stringify(result, null, 2)};
`;

fs.writeFileSync('src/data/exercises.ts', fileContent);
console.log('Generated ' + result.length + ' exercises');
