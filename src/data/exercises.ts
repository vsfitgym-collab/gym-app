export interface LocalExercise {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  gif: string;
}

export const exercises: LocalExercise[] = [
  {
    id: "barra-fixa",
    name: "Barra Fixa",
    bodyPart: "back",
    target: "lats",
    equipment: "body weight",
    gif: "costas/barra-fixa.gif",
  },
  {
    id: "barra-fixa-assistida",
    name: "Barra Fixa Assistida",
    bodyPart: "back",
    target: "lats",
    equipment: "machine",
    gif: "costas/Barra-Fixa-Assistida.gif",
  },
  {
    id: "levantamento-terra",
    name: "Levantamento Terra",
    bodyPart: "back",
    target: "lower back",
    equipment: "barbell",
    gif: "costas/levantamento-terra.gif",
  },
  {
    id: "levantamento-terra-romeno",
    name: "Levantamento Terra Romeno",
    bodyPart: "back",
    target: "hamstrings",
    equipment: "barbell",
    gif: "costas/levantamento-terra-romeno.gif",
  },
  {
    id: "pull-up",
    name: "Pull Up",
    bodyPart: "back",
    target: "lats",
    equipment: "body weight",
    gif: "costas/Pull-Up.gif",
  },
  {
    id: "pulldown-corda",
    name: "Pulldown com Corda",
    bodyPart: "back",
    target: "lats",
    equipment: "cable",
    gif: "costas/Pulldown-com-corda.gif",
  },
  {
    id: "pulldown-inclinado",
    name: "Pulldown Inclinado",
    bodyPart: "back",
    target: "lats",
    equipment: "cable",
    gif: "costas/Pulldown-inclinado-com-corda.gif",
  },
  {
    id: "pulldown-unilateral",
    name: "Pulldown Unilateral",
    bodyPart: "back",
    target: "lats",
    equipment: "cable",
    gif: "costas/Pulldown-Unilateral-no-Cabo.gif",
  },
  {
    id: "pullover-barra",
    name: "Pullover com Barra",
    bodyPart: "back",
    target: "lats",
    equipment: "barbell",
    gif: "costas/Pullover-com-Barra.gif",
  },
  {
    id: "pullover-cabo",
    name: "Pullover com Cabo",
    bodyPart: "back",
    target: "lats",
    equipment: "cable",
    gif: "costas/Pullover-com-Cabo.gif",
  },
  {
    id: "puxada-alta",
    name: "Puxada Alta",
    bodyPart: "back",
    target: "lats",
    equipment: "cable",
    gif: "costas/puxada-alta.gif",
  },
  {
    id: "puxada-alta-fechada",
    name: "Puxada Alta Fechada",
    bodyPart: "back",
    target: "lats",
    equipment: "cable",
    gif: "costas/Puxada-na-Polia-Alta-com-Pegada-Fechada.gif",
  },
  {
    id: "remada-smith",
    name: "Remada no Smith",
    bodyPart: "back",
    target: "lats",
    equipment: "barbell",
    gif: "costas/remada-curvada-smith.gif",
  },
  {
    id: "remada-cross",
    name: "Remada Cruzada",
    bodyPart: "back",
    target: "lats",
    equipment: "cable",
    gif: "costas/remada-cruzada-no-cross.gif",
  },
];
