-- ============================================================
--  LANDING COMPETITION — Server Main
-- ============================================================

local GameState = {
    active  = false,
    zone    = nil,    -- { worldX, worldY, worldZ, mapX, mapY }
    plane   = nil,    -- Config.Planes entry
    players = {},     -- { [source] = spawnIndex }
    results = {},     -- { [source] = { name, dist, exploded, score, worldX, worldY, mapX, mapY } }
    landed  = {},     -- { [source] = true }
    timer   = nil,
}

-- ── utilidades ───────────────────────────────────────────────

local function getPlayerName(source)
    return GetPlayerName(source) or ('Jogador '..source)
end

local function allLanded()
    for src, _ in pairs(GameState.players) do
        if not GameState.landed[src] then return false end
    end
    return true
end

local function broadcastResults()
    -- Ordenar por score desc
    local sorted = {}
    for src, r in pairs(GameState.results) do
        table.insert(sorted, r)
    end
    table.sort(sorted, function(a, b) return a.score > b.score end)
    for i, r in ipairs(sorted) do r.rank = i end

    TriggerClientEvent('landing:showResults', -1, sorted, GameState.zone)

    -- Reset estado após os resultados (precisa de CreateThread por causa do Wait)
    CreateThread(function()
        Wait(35000)
        GameState.active  = false
        GameState.zone    = nil
        GameState.plane   = nil
        GameState.players = {}
        GameState.results = {}
        GameState.landed  = {}
    end)
end

-- ── comando /iniciaraterragem ─────────────────────────────────

RegisterCommand('iniciaraterragem', function(source, args)
    if source == 0 then
        print('[landing] Comando não disponível na consola.')
        return
    end
    if GameState.active then
        TriggerClientEvent('chat:addMessage', source, {
            color = {255, 80, 80},
            args  = {'[Aterragem]', 'Já existe uma competição ativa.'},
        })
        return
    end
    -- Abre o picker NUI APENAS para este jogador
    TriggerClientEvent('landing:openPicker', source)
end, false)

-- ── zona selecionada (callback do picker) ─────────────────────

RegisterNetEvent('landing:zoneSelected', function(data)
    local source = source
    if GameState.active then return end

    -- Escolher avião aleatório
    local plane = Config.Planes[math.random(#Config.Planes)]

    -- Atribuir spots aos jogadores
    local players = {}
    local spotIdx = 1
    for _, playerId in ipairs(GetPlayers()) do
        local pid = tonumber(playerId)
        players[pid] = spotIdx
        spotIdx = (spotIdx % #Config.SpawnSpots) + 1
    end

    -- Atualizar estado ANTES de enviar eventos
    GameState.active  = true
    GameState.zone    = data
    GameState.plane   = plane
    GameState.players = players
    GameState.results = {}
    GameState.landed  = {}

    -- Enviar startGame a todos com o spot atribuído
    for pid, spot in pairs(players) do
        TriggerClientEvent('landing:startGame', pid, GameState.zone, plane, spot)
    end

    -- Timer de 5 minutos
    GameState.timer = SetTimeout(Config.FlightTime * 1000, function()
        if not GameState.active then return end
        TriggerClientEvent('landing:forceLand', -1)
        -- Aguardar que os clientes registem a aterragem forçada antes de mostrar resultados
        CreateThread(function()
            Wait(5000)
            broadcastResults()
        end)
    end)
end)

-- ── registar aterragem ────────────────────────────────────────

RegisterNetEvent('landing:registerLanding', function(data)
    local source = source
    if not GameState.active then return end
    if GameState.landed[source] then return end
    GameState.landed[source] = true

    local zone = GameState.zone

    -- Distância 2D ao ponto alvo (mundo GTA)
    local dx   = data.worldX - zone.worldX
    local dy   = data.worldY - zone.worldY
    local dist = math.sqrt(dx*dx + dy*dy)

    -- Calcular score
    local score = Config.Scoring.base - math.floor(dist * Config.Scoring.perMeter)
    if data.exploded then
        score = score - Config.Scoring.explosionPenalty
    end
    score = math.max(score, Config.Scoring.minScore)

    -- Conversão coords mundo → mapa para resultados NUI
    local mapX = (data.worldX + 4000) / 8500 * 100
    local mapY = (8000 - data.worldY) / 12000 * 100

    local result = {
        source  = source,
        name    = getPlayerName(source),
        dist    = math.floor(dist),
        exploded = data.exploded or false,
        score   = score,
        worldX  = data.worldX,
        worldY  = data.worldY,
        mapX    = mapX,
        mapY    = mapY,
    }
    GameState.results[source] = result

    -- Notificar todos
    TriggerClientEvent('landing:playerLanded', -1, {
        name     = result.name,
        dist     = result.dist,
        exploded = result.exploded,
        score    = result.score,
    })

    -- Se todos aterraram → mostrar resultados imediatamente
    if allLanded() then
        broadcastResults()
    end
end)

-- ── pedido de resultados ─────────────────────────────────────

RegisterNetEvent('landing:requestResults', function()
    -- não usado ativamente mas pode ser útil para reconecções
end)
