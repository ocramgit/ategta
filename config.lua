Config = {}

-- =====================================================
-- AVIÕES DISPONÍVEIS (um será escolhido aleatoriamente e todos usam o mesmo)
-- =====================================================
Config.Planes = {
    { model = 'mammatus',   label = 'Mammatus'         },
    { model = 'titan',      label = 'Titan'            },
    { model = 'luxor',      label = 'Luxor'            },
    { model = 'jet',        label = 'Shamal'           },
    { model = 'cargoplane', label = 'Cargo Plane'      },
    { model = 'duster',     label = 'Duster'           },
    { model = 'stunt',      label = 'Stunt Plane'      },
    { model = 'velum',      label = 'Velum'            },
    { model = 'cuban800',   label = 'Cuban 800'        },
    { model = 'howard',     label = 'V65 Molotok'      },
}

-- =====================================================
-- POSIÇÕES DE SPAWN NO AEROPORTO (LSIA)
-- Pontos espalhados pelas pistas e taxiways
-- =====================================================
Config.SpawnSpots = {
    { x = -1336.0, y = -3044.0, z = 13.94, h = 60.0  },  -- Runway 03 Start
    { x = -1148.0, y = -2869.0, z = 13.94, h = 60.0  },  -- Runway 03 Mid
    { x = -1020.0, y = -2744.0, z = 13.94, h = 60.0  },  -- Runway 03 End
    { x = -1619.0, y = -3049.0, z = 13.94, h = 330.0 },  -- Taxiway West
    { x = -1495.0, y = -3199.0, z = 13.94, h = 110.0 },  -- Runway 21 South
    { x = -1740.0, y = -2890.0, z = 13.94, h = 250.0 },  -- Taxiway NW
    { x = -1277.0, y = -3210.0, z = 13.94, h = 240.0 },  -- Apron East
    { x = -1850.0, y = -3071.0, z = 13.94, h = 160.0 },  -- Cargo Apron
}

-- =====================================================
-- ZONAS DE ATERRAGEM (difíceis / incomuns)
-- =====================================================
Config.LandingZones = {
    {
        label    = "Autoestrada da Grande Estrada Oceânica",
        hint     = "Aterra a meio da estrada costeira!",
        x        = -1484.3, y = 21.5,   z = 27.8,
        radius   = 40.0,
        -- em formato percentagem para o mapa NUI (0..100)
        mapX     = 24.5,  mapY = 48.3
    },
    {
        label    = "Cruzamento Downtown Vinewood",
        hint     = "Aterra na grande avenida do centro!",
        x        = 266.8,  y = -956.7,  z = 29.3,
        radius   = 35.0,
        mapX     = 52.0,  mapY = 58.0
    },
    {
        label    = "Estrada de Alta Velocidade Sandy Shores",
        hint     = "Aterra na estrada do deserto!",
        x        = 1700.9, y = 3588.6,  z = 34.0,
        radius   = 50.0,
        mapX     = 72.0,  mapY = 22.0
    },
    {
        label    = "Rua Principal de Paleto Bay",
        hint     = "Aterra na rua principal da vila!",
        x        = -448.7, y = 6037.5,  z = 31.2,
        radius   = 40.0,
        mapX     = 28.0,  mapY = 6.0
    },
    {
        label    = "Ponte do Porto de LS",
        hint     = "Aterra na ponte industrial!",
        x        = 689.5,  y = -2415.0, z = 7.4,
        radius   = 30.0,
        mapX     = 58.5,  mapY = 71.0
    },
    {
        label    = "Topo do Monte Chiliad",
        hint     = "Aterra no cume da montanha!",
        x        = 500.7,  y = 5604.6,  z = 797.9,
        radius   = 60.0,
        mapX     = 43.0,  mapY = 10.0
    },
    {
        label    = "Parque de Estacionamento ULSA",
        hint     = "Aterra no parque da universidade!",
        x        = -1630.7, y = 60.0,  z = 52.0,
        radius   = 35.0,
        mapX     = 21.5,  mapY = 46.5
    },
    {
        label    = "Autoestrada Route 1 (Davis)",
        hint     = "Aterra na auto-estrada a Sul!",
        x        = 270.4,  y = -1648.2, z = 29.3,
        radius   = 45.0,
        mapX     = 52.0,  mapY = 67.5
    },
    {
        label    = "Rua Principal de La Mesa",
        hint     = "Aterra nas ruas industriais de La Mesa!",
        x        = 1004.0, y = -1640.0, z = 30.2,
        radius   = 40.0,
        mapX     = 62.0,  mapY = 67.0
    },
    {
        label    = "Trilho de Grapeseed",
        hint     = "Aterra na curva estreita da aldeia!",
        x        = 1700.0, y = 4800.0,  z = 41.5,
        radius   = 45.0,
        mapX     = 70.0,  mapY = 14.0
    },
    {
        label    = "Cais de Vernon",
        hint     = "Aterra nos cais de madeira!",
        x        = -1825.0, y = -1241.0, z = 13.0,
        radius   = 30.0,
        mapX     = 17.5,  mapY = 60.5
    },
    {
        label    = "Estrada do Viaduto de LS",
        hint     = "Aterra no viaduto principal!",
        x        = -145.0, y = -1698.0, z = 33.0,
        radius   = 35.0,
        mapX     = 46.5,  mapY = 68.0
    },
}

-- =====================================================
-- PONTUAÇÃO
-- =====================================================
Config.Scoring = {
    -- Pontos por distância ao alvo (em metros)
    distancePoints = {
        { max = 10,  pts = 5000 },
        { max = 25,  pts = 3500 },
        { max = 50,  pts = 2000 },
        { max = 100, pts = 1000 },
        { max = 200, pts = 500  },
        { max = 999, pts = 100  },
    },
    -- Bónus por aeronave destruída (mais dano = mais bónus de "caos")
    damageBonus = {
        { minDmg = 0.75, pts = 2000, label = "💥 Destruída" },
        { minDmg = 0.50, pts = 1000, label = "🔥 Danificada" },
        { minDmg = 0.25, pts = 500,  label = "⚠️ Arranhada"  },
        { minDmg = 0.0,  pts = 0,    label = "✅ Intacta"    },
    },
    -- Pontos por cada voto recebido no Tinder
    votePoints = 750,
}

-- =====================================================
-- COUNTDOWN
-- =====================================================
Config.CountdownSeconds = 10   -- segundos de countdown antes de voar

-- =====================================================
-- TEMPO DE JOGO
-- =====================================================
Config.FlightTimeSeconds = 300  -- 5 minutos para aterrar

-- =====================================================
-- RESULTADOS (ecrã GeoGuessr no final)
-- =====================================================
Config.ResultsDurationSeconds = 30   -- segundos até fechar automaticamente

-- =====================================================
-- COMANDO PARA INICIAR
-- =====================================================
Config.Command = 'iniciaraterragem'
