local QBCore = exports['qb-core']:GetCoreObject()

-- =====================================================
-- ESTADO DO JOGO
-- =====================================================
local GameState = {
    active         = false,
    flightStarted  = false,
    resultsStarted = false,   -- evita chamar startResultsPhase duas vezes
    plane          = nil,
    zone           = nil,
    initiator      = nil,
    players        = {},
    landedCount    = 0,
    totalCount     = 0,
}

local function resetGame()
    GameState.active         = false
    GameState.flightStarted  = false
    GameState.resultsStarted = false
    GameState.plane          = nil
    GameState.zone           = nil
    GameState.initiator      = nil
    GameState.players        = {}
    GameState.landedCount    = 0
    GameState.totalCount     = 0
end

-- =====================================================
-- HELPERS
-- =====================================================
local function getRandomElement(t)
    return t[math.random(1, #t)]
end

local function broadcast(event, ...)
    for src, _ in pairs(GameState.players) do
        TriggerClientEvent(event, src, ...)
    end
end

local function broadcastNUI(action, data)
    for src, _ in pairs(GameState.players) do
        TriggerClientEvent('landing:nuiEvent', src, action, data)
    end
end

-- =====================================================
-- CONVERTER COORDS DO MUNDO → % NO MAPA
-- Bounds aproximados do mapa GTA V
-- X: -4000 (esq) a 4500 (dir) → 8500 unidades
-- Y: 8000 (topo/norte) a -4000 (fundo/sul) → 12000 unidades
-- =====================================================
local function worldToMapPct(wx, wy)
    local px = (wx + 4000) / 8500 * 100
    local py = (8000 - wy)  / 12000 * 100
    return math.max(0, math.min(100, px)),
           math.max(0, math.min(100, py))
end

-- =====================================================
-- CALCULAR DISTÂNCIA AO ALVO
-- =====================================================
local function calcDistance(p)
    if not p.landed or not GameState.zone then return 99999 end
    local dx = p.x - GameState.zone.x
    local dy = p.y - GameState.zone.y
    return math.sqrt(dx * dx + dy * dy)
end

-- =====================================================
-- CALCULAR SCORES E GERAR RESULTADOS
-- =====================================================
local function computeResults()
    local results = {}
    local zx = GameState.zone.x
    local zy = GameState.zone.y
    local zmx, zmy = worldToMapPct(zx, zy)

    for src, p in pairs(GameState.players) do
        local dist    = calcDistance(p)
        local exploded = (p.landHealth ~= nil and p.landHealth < 200)
        local pts      = 0

        if p.landed then
            -- pontuação base: 10000 - distância*10 (mínimo 0)
            pts = math.max(0, 10000 - math.floor(dist) * 10)
            -- penalidade se explodiu
            if exploded then pts = math.max(0, pts - 3000) end
        end

        local mx, my = 50.0, 50.0
        if p.landed and p.x ~= 0 then
            mx, my = worldToMapPct(p.x, p.y)
        end

        results[#results + 1] = {
            source   = src,
            name     = p.name,
            landed   = p.landed,
            exploded = exploded,
            dist     = math.floor(dist),
            pts      = pts,
            mapX     = mx,
            mapY     = my,
        }
    end

    table.sort(results, function(a, b) return a.pts > b.pts end)
    for i, r in ipairs(results) do r.rank = i end

    return results, zmx, zmy
end

-- =====================================================
-- FASE FINAL: mostrar resultados GeoGuessr
-- =====================================================
local function startResultsPhase()
    if GameState.resultsStarted then return end   -- guard dupla chamada
    GameState.resultsStarted = true
    GameState.flightStarted  = false

    local results, zmx, zmy = computeResults()

    broadcastNUI('openResults', {
        results  = results,
        zone     = { label = GameState.zone.label, mapX = zmx, mapY = zmy },
        duration = Config.ResultsDurationSeconds,
    })

    SetTimeout((Config.ResultsDurationSeconds + 5) * 1000, function()
        resetGame()
    end)
end

-- =====================================================
-- VERIFICAR SE TODOS ATERRARAM
-- =====================================================
local function checkAllLanded()
    if GameState.landedCount >= GameState.totalCount then
        SetTimeout(2000, function()
            if GameState.active and GameState.flightStarted then
                startResultsPhase()  -- guard interno em startResultsPhase
            end
        end)
    end
end

-- =====================================================
-- EVENTO: jogador registou aterragem
-- =====================================================
RegisterNetEvent('landing:registerLanding', function(data)
    local src = source
    if not GameState.active or not GameState.flightStarted then return end
    local p = GameState.players[src]
    if not p or p.landed then return end

    p.landed     = true
    p.x          = data.x
    p.y          = data.y
    p.z          = data.z
    p.landHealth = data.health

    GameState.landedCount = GameState.landedCount + 1

    local dist = calcDistance(p)
    print(('[Landing] %s aterrou! Distância: %.1fm (%d/%d)'):format(
        p.name, dist, GameState.landedCount, GameState.totalCount))

    -- Avisar todos
    broadcastNUI('playerLanded', {
        name  = p.name,
        count = GameState.landedCount,
        total = GameState.totalCount,
    })

    -- Se todos já aterraram
    if GameState.landedCount >= GameState.totalCount then
        SetTimeout(2000, function()
            startResultsPhase()  -- guard interno evita dupla chamada
        end)
    end
end)

-- =====================================================
-- EVENTO: iniciador escolheu a zona no mapa
-- =====================================================
RegisterNetEvent('landing:zoneSelected', function(data)
    local src = source
    if src ~= GameState.initiator then return end
    if GameState.active then return end

    -- Converter % do mapa para coords do mundo GTA V
    -- mapX% = (worldX + 4000) / 8500 * 100  →  worldX = (mapX/100 * 8500) - 4000
    -- mapY% = (8000 - worldY) / 12000 * 100  →  worldY = 8000 - (mapY/100 * 12000)
    local mx  = tonumber(data.mapX) or 50
    local my  = tonumber(data.mapY) or 50
    local wx  = (mx / 100 * 8500) - 4000
    local wy  = 8000 - (my / 100 * 12000)

    local zone = {
        x     = wx,
        y     = wy,
        z     = 0,       -- servidor n\u00e3o precisa de z para dist\u00e2ncia 2D
        label = 'Zona Personalizada',
        hint  = ('Coordenadas: %.0f, %.0f'):format(wx, wy),
        mapX  = mx,
        mapY  = my,
    }

    -- Recolher jogadores online
    local players = QBCore.Functions.GetPlayers()
    GameState.totalCount = #players

    for i, psrc in ipairs(players) do
        local P = QBCore.Functions.GetPlayer(psrc)
        GameState.players[psrc] = {
            name        = P and P.PlayerData.charinfo and
                          (P.PlayerData.charinfo.firstname .. ' ' .. P.PlayerData.charinfo.lastname)
                          or ('Jogador ' .. psrc),
            landed      = false,
            landHealth  = 1000,
            x = 0, y = 0, z = 0,
            spawnIndex  = i,
        }
    end

    print(('[Landing] Zona escolhida: %s | Avião: %s | Jogadores: %d'):format(
        zone.label, GameState.plane.label, GameState.totalCount))

    -- Enviar dados de início a todos + countdown
    for psrc, p in pairs(GameState.players) do
        TriggerClientEvent('landing:startGame', psrc, {
            plane        = GameState.plane,
            zone         = GameState.zone,
            spawnIndex   = p.spawnIndex,
            totalPlayers = GameState.totalCount,
            flightTime   = Config.FlightTimeSeconds,
            countdown    = Config.CountdownSeconds,
        })
    end

    -- Countdown broadcast
    local countdownSecs = Config.CountdownSeconds or 10
    for i = countdownSecs, 1, -1 do
        local tick = i
        SetTimeout((countdownSecs - tick) * 1000, function()
            broadcast('landing:countdown', tick)
        end)
    end
    SetTimeout(countdownSecs * 1000, function()
        GameState.flightStarted = true
        broadcast('landing:countdown', 0)  -- GO!
    end)

    -- Timer global de voo (após countdown)
    local totalDelay = (Config.FlightTimeSeconds + countdownSecs) * 1000
    SetTimeout(totalDelay, function()
        if not GameState.active then return end
        -- Forçar aterragem dos que ainda não aterraram
        for psrc, p in pairs(GameState.players) do
            if not p.landed then
                p.landed     = true
                p.landHealth = 0
                p.x = 0; p.y = 0; p.z = 0
                GameState.landedCount = GameState.landedCount + 1
                TriggerClientEvent('landing:forceLand', psrc)
            end
        end
        SetTimeout(2000, startResultsPhase)
    end)
end)

-- =====================================================
-- COMANDO: abrir picker de zona para o iniciador
-- =====================================================
QBCore.Commands.Add(Config.Command, 'Iniciar competição de aterragem de aviões', {}, false, function(source, args)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return end

    if GameState.active or GameState.initiator then
        TriggerClientEvent('QBCore:Notify', source, '⚠️ Já existe um jogo ativo!', 'error', 3000)
        return
    end

    local players = QBCore.Functions.GetPlayers()
    if #players < 1 then
        TriggerClientEvent('QBCore:Notify', source, '⚠️ Precisas de pelo menos 1 jogador.', 'error', 3000)
        return
    end

    -- Escolher avião aleatório (igual para todos)
    GameState.initiator = source
    GameState.plane     = getRandomElement(Config.Planes)

    -- Abrir picker de zona para o iniciador
    TriggerClientEvent('landing:openPicker', source, {
        zones = Config.LandingZones,
        plane = GameState.plane,
    })

    -- Timeout de segurança: se o picker for abandonado, reset após 3 minutos
    SetTimeout(180000, function()
        if GameState.initiator == source and not GameState.active then
            GameState.initiator = nil
            GameState.plane     = nil
            TriggerClientEvent('landing:nuiEvent', source, 'hide', {})
            TriggerClientEvent('QBCore:Notify', source, '⏰ Picker expirou. Usa o comando novamente.', 'error', 4000)
        end
    end)
end)
