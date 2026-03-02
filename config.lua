Config = {}

-- Aviões disponíveis (todos os jogadores recebem o mesmo avião aleatório)
Config.Planes = {
    { model = 'luxor',    label = 'Luxor'          },
    { model = 'luxor2',   label = 'Luxor Deluxe'   },
    { model = 'nimbus',   label = 'Nimbus'          },
    { model = 'shamal',   label = 'Shamal'          },
    { model = 'titan',    label = 'Titan'           },
    { model = 'cuban800', label = 'Cuban 800'       },
    { model = 'besra',    label = 'Besra'           },
    { model = 'velum',    label = 'Velum'           },
    { model = 'velum2',   label = 'Velum 5-Seater'  },
}

-- Posições de spawn no aeroporto LSIA (pista principal, lado a lado)
Config.SpawnSpots = {
    { x = -1336.0, y = -3044.0, z = 13.9, heading = 340.0 },
    { x = -1326.0, y = -3044.0, z = 13.9, heading = 340.0 },
    { x = -1316.0, y = -3044.0, z = 13.9, heading = 340.0 },
    { x = -1306.0, y = -3044.0, z = 13.9, heading = 340.0 },
    { x = -1296.0, y = -3044.0, z = 13.9, heading = 340.0 },
    { x = -1286.0, y = -3044.0, z = 13.9, heading = 340.0 },
    { x = -1276.0, y = -3044.0, z = 13.9, heading = 340.0 },
    { x = -1266.0, y = -3044.0, z = 13.9, heading = 340.0 },
    { x = -1256.0, y = -3044.0, z = 13.9, heading = 340.0 },
    { x = -1246.0, y = -3044.0, z = 13.9, heading = 340.0 },
    { x = -1236.0, y = -3044.0, z = 13.9, heading = 340.0 },
    { x = -1226.0, y = -3044.0, z = 13.9, heading = 340.0 },
}

-- Tempo de voo em segundos (5 minutos)
Config.FlightTime = 300

-- Countdown inicial em segundos
Config.CountdownSeconds = 10

-- Pontuação
Config.Scoring = {
    base           = 10000,   -- pontos base
    perMeter       = 10,      -- pontos por metro de distância (desconto)
    explosionPenalty = 3000,  -- penalização por explosão do avião
    minScore       = 0,       -- pontuação mínima
}

-- Cores dos pins no mapa de resultados (hex)
Config.PinColors = {
    '#FF6B6B', -- vermelho
    '#4ECDC4', -- ciano
    '#FFE66D', -- amarelo
    '#A29BFE', -- roxo
    '#FD79A8', -- rosa
    '#00B894', -- verde
    '#FDCB6E', -- laranja
    '#74B9FF', -- azul
    '#E17055', -- coral
    '#55EFC4', -- menta
    '#B2BEC3', -- cinza
    '#0984E3', -- azul escuro
}
