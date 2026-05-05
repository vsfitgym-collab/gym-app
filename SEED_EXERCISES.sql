-- ========================================
-- SEED: Exercícios de exemplo
-- Execute no Supabase SQL Editor
-- ========================================

INSERT INTO exercises (name, description, muscle_group, equipment, image_url, video_url) VALUES
-- PEITO
('Supino Reto com Halteres', 'Deite no banco, segure halteres e empurre para cima', 'peito', 'halteres', 'supino-reto-halteres.jpg', 'supino-reto-halteres.mp4'),
('Supino Inclinado com Barra', 'Execute supino inclinado para trabalhar porção superior do peito', 'peito', 'barra', 'supino-inclinado-barra.jpg', 'supino-inclinado-barra.mp4'),
('Peck Deck', 'Máquina para Desenvolvimento do peito com movimento de abrazo', 'peito', 'maquina', 'peck-deck.jpg', 'peck-deck.mp4'),
('Crossover', 'Exercício com cabos para peito isolamento', 'peito', 'cabo', 'crossover.jpg', 'crossover.mp4'),
('Flexão de Braço', 'Exercício peso corporal para peito', 'peito', 'peso_corporal', 'flexao-braco.jpg', 'flexao-braco.mp4'),

-- COSTAS
('Puxada Frontal', 'Puxe a barra em direção ao peito, contraindo dorsais', 'costas', 'cabo', 'puxada-frontal.jpg', 'puxada-frontal.mp4'),
('Barra Fixa', 'Suspenda-se na barra usando força dos dorsais', 'costas', 'peso_corporal', 'barra-fixa.jpg', 'barra-fixa.mp4'),
('Remada Curvada', 'Remada com barra curvada para espessura das costas', 'costas', 'barra', 'remada-curvada.jpg', 'remada-curvada.mp4'),
('Remada Unilateral', 'Remada com haltere para cada lado', 'costas', 'halteres', 'remada-unilateral.jpg', 'remada-unilateral.mp4'),
('Pullrown', 'Movimento de remada no cabo inferior', 'costas', 'cabo', 'pullrown.jpg', 'pullrown.mp4'),

-- PERNAS
('Agachamento com Barra', 'Agachamento completo com barra nos ombros', 'pernas', 'barra', 'agachamento-barra.jpg', 'agachamento-barra.mp4'),
('Leg Press', 'Extensão de pernas na máquina', 'pernas', 'maquina', 'leg-press.jpg', 'leg-press.mp4'),
('Cadeira Extensora', 'Extensão de quadris na máquina', 'pernas', 'maquina', 'cadeira-extensora.jpg', 'cadeira-extensora.mp4'),
('Stiff', 'Levantamento terra stiff para posterior', 'pernas', 'barra', 'stiff.jpg', 'stiff.mp4'),
('Afundo', 'Avanço comhalteres para pernas', 'pernas', 'halteres', 'afundo.jpg', 'afundo.mp4'),
('Calf Raise', 'Elevação de panturrilha', 'pernas', 'maquina', 'calf-raise.jpg', 'calf-raise.mp4'),

-- OMBROS
('Elevação Lateral', 'Elevação lateral de halteres para deltoides', 'ombros', 'halteres', 'elevacao-lateral.jpg', 'elevacao-lateral.mp4'),
('Elevação Frontal', 'Elevação frontal com halteres', 'ombros', 'halteres', 'elevacao-frontal.jpg', 'elevacao-frontal.mp4'),
('Desenvolvimento Arnold', 'Rotação durante desenvolvimento', 'ombros', 'halteres', 'arnold-press.jpg', 'arnold-press.mp4'),
('Peck Rear', 'Fly inverso para rear deltoids', 'ombros', 'cabo', 'peck-rear.jpg', 'peck-rear.mp4'),
('Face Pull', 'Puxe a corda para rosto', 'ombros', 'cabo', 'face-pull.jpg', 'face-pull.mp4'),

-- BÍCEPS
('Rosca Direta', 'Rosca com halteres para biceps', 'biceps', 'halteres', 'rosca-direta.jpg', 'rosca-direta.mp4'),
('Rosca Martelo', 'Rosca com pegada neutra', 'biceps', 'halteres', 'rosca-martelo.jpg', 'rosca-martelo.mp4'),
('Rosca Alternada', 'Rosca alternada com halteres', 'biceps', 'halteres', 'rosca-alternada.jpg', 'rosca-alternada.mp4'),
('Rosca na Barra', 'Rosca com barra reta', 'biceps', 'barra', 'rosca-barra.jpg', 'rosca-barra.mp4'),
('Rosca no Cabo', 'Rosca no pulley baixo', 'biceps', 'cabo', 'rosca-cabo.jpg', 'rosca-cabo.mp4'),

-- TRÍCEPS
('Tríceps no Pulley', 'Extensão de tríceps no pulley alto', 'triceps', 'cabo', 'triceps-pulley.jpg', 'triceps-pulley.mp4'),
('Tríceps Banco', 'Extensão de tríceps atrás da cabeça', 'triceps', 'halteres', 'triceps-banco.jpg', 'triceps-banco.mp4'),
('Mergulho', 'Mergulho no banco para tríceps', 'triceps', 'peso_corporal', 'mergulho.jpg', 'mergulho.mp4'),
('Rosca Inversa', 'Rosca inversa na barra', 'triceps', 'barra', 'rosca-inversa.jpg', 'rosca-inversa.mp4'),
('Tríceps Martelo', 'Extensão com pegada martelo', 'triceps', 'halteres', 'triceps-martelo.jpg', 'triceps-martelo.mp4'),

-- CORE
('Prancha', 'Prancha frontal para core', 'core', 'peso_corporal', 'prancha.jpg', 'prancha.mp4'),
('Crunch', 'Elevação de tronco para abdominal', 'core', 'peso_corporal', 'crunch.jpg', 'crunch.mp4'),
('Perna Elevada', 'Elevação de pernas pendurado', 'core', 'peso_corporal', 'perna-elevada.jpg', 'perna-elevada.mp4'),
('Russian Twist', 'Torção de tronco com peso', 'core', 'halteres', 'russian-twist.jpg', 'russian-twist.mp4'),
('Ab Wheel', 'Roda abdominal', 'core', 'outro', 'ab-wheel.jpg', 'ab-wheel.mp4'),

-- CARDIO
('Esteira', 'Corrida na esteira', 'cardio', 'maquina', 'esteira.jpg', 'esteira.mp4'),
('Bicicleta Ergométrica', 'Ciclismo indoor', 'cardio', 'maquina', 'bike.jpg', 'bike.mp4'),
('Elíptico', 'Treino elíptico', 'cardio', 'maquina', 'eliptico.jpg', 'eliptico.mp4'),
('Remo', 'Remoergômetro', 'cardio', 'maquina', 'remo.jpg', 'remo.mp4'),
('Burpee', 'Exercício completo de cardio', 'cardio', 'peso_corporal', 'burpee.jpg', 'burpee.mp4');

-- Verificar inserção
SELECT muscle_group, COUNT(*) as total FROM exercises GROUP BY muscle_group;