local QBCore = exports['qb-core']:GetCoreObject()

-- =====================================================
-- ESTADO DO JOGO
-- =====================================================
local GameState = {
    active      = false,
    plane       = nil,       -- { model, label }
    zone        = nil,       -- config landing zone
    players     = {},        -- { [source] = { name, landed, x, y, z, startHealth, landHealth, distance, votes } }
    landedCount = 0,
    totalCount  = 0,
    votePhase   = false,
}

local function resetGame()
    GameState.active      = false
    GameState.plane       = nil
    GameState.zone        = nil
    GameState.players     = {}
    GameState.landedCount = 0
    GameState.totalCount  = 0
    GameState.votePhase   = false
end

-- =====================================================
-- HELPERS
-- =====================================================
local function getRandomElement(t)
    return t[math.random(1, #t)]
end

local function calcDistancePoints(dist)
    for _, tier in ipairs(Config.Scoring.distancePoints) do
        if dist <= tier.max then return tier.pts end
    end
    return 0
end

local function calcDamageBonus(ratio) -- ratio = dano sofrido 0..1
    for _, tier in ipairs(Config.Scoring.damageBonus) do
        if ratio >= tier.minDmg then
            return tier.pts, tier.label
        end
    end
    return 0, "✅ Intacta"
end

local function broadcastNUI(event, data)
    for src, _ in pairs(GameState.players) do
        TriggerClientEvent('landing:nuiEvent', src, event, data)
    end
end

-- =====================================================
-- CALCULAR SCORES FINAIS
-- =====================================================
local function computeScores()
    local results = {}

    for src, p in pairs(GameState.players) do
        local distPts   = 0
        local dmgPts    = 0
        local dmgLabel  = "❓ Não aterrou"
        local dist      = 9999

        if p.landed then
            -- Distância ao alvo
            local zx, zy = GameState.zone.x, GameState.zone.y
            dist    = math.sqrt((p.x - zx)^2 + (p.y - zy)^2)
            distPts = calcDistancePoints(dist)

            -- Dano
            local ratio = 0
            if p.startHealth and p.startHealth > 0 then
                ratio = math.max(0, (p.startHealth - p.landHealth) / p.startHealth)
            end
            dmgPts, dmgLabel = calcDamageBonus(ratio)
        end

        local votePts = (p.votes or 0) * Config.Scoring.votePoints
        local total   = distPts + dmgPts + votePts

        results[#results + 1] = {
            source    = src,
            name      = p.name,
            landed    = p.landed,
            dist      = math.floor(dist),
            distPts   = distPts,
            dmgPts    = dmgPts,
            dmgLabel  = dmgLabel,
            votes     = p.votes or 0,
            votePts   = votePts,
            total     = total,
            cardData  = p.cardData or nil,    -- dados do card NUI
        }
    end

    -- Ordenar por total desc
    table.sort(results, function(a, b) return a.total > b.total end)

    -- Rank
    for i, r in ipairs(results) do r.rank = i end

    return results
end

-- =====================================================
-- FASE DE VOTAÇÃO
-- =====================================================
local function startVotePhase()
    GameState.votePhase = true

    -- Construir lista de cards para votação
    local cards = {}
    for src, p in pairs(GameState.players) do
        if p.landed then
            cards[#cards + 1] = {
                source   = src,
                name     = p.name,
                cardData = p.cardData,
            }
        end
    end

    broadcastNUI('openVoting', { cards = cards, duration = Config.VoteTimeSeconds })

    -- Timer de votação
    SetTimeout(Config.VoteTimeSeconds * 1000, function()
        local results = computeScores()
        broadcastNUI('openScoreboard', { results = results, zone = { label = GameState.zone.label } })

        -- Notificar chat
        for src, _ in pairs(GameState.players) do
            TriggerClientEvent('QBCore:Notify', src, '🏆 Resultados finais!', 'success', 7000)
        end

        SetTimeout(15000, function()
            resetGame()
        end)
    end)
end

-- =====================================================
-- VERIFICAR SE TODOS ATERRARAM
-- =====================================================
local function checkAllLanded()
    if GameState.landedCount >= GameState.totalCount then
        Wait(2000)
        startVotePhase()
    end
end

-- =====================================================
-- EVENTOS DE CLIENTE
-- =====================================================

-- Jogador registou aterragem
RegisterNetEvent('landing:registerLanding', function(data)
    local src = source
    if not GameState.active then return end
    local p = GameState.players[src]
    if not p or p.landed then return end

    p.landed      = true
    p.x           = data.x
    p.y           = data.y
    p.z           = data.z
    p.landHealth  = data.health
    p.cardData    = data.cardData  -- { speed, heading, damage }
    GameState.landedCount = GameState.landedCount + 1

    print(('[Landing] %s aterrou! (%d/%d)'):format(p.name, GameState.landedCount, GameState.totalCount))

    -- Avisar todos
    broadcastNUI('playerLanded', { name = p.name, count = GameState.landedCount, total = GameState.totalCount })

    checkAllLanded()
end)

-- Jogador submeteu voto
RegisterNetEvent('landing:submitVote', function(votedSrc)
    local src = source
    if not GameState.votePhase then return end
    if src == votedSrc then return end  -- não pode votar em si próprio

    local target = GameState.players[tonumber(votedSrc)]
    if target then
        target.votes = (target.votes or 0) + 1
    end
end)

-- =====================================================
-- COMANDO PARA INICIAR O JOGO
-- =====================================================
QBCore.Commands.Add(Config.Command, 'Iniciar competição de aterragem de aviões', {}, false, function(source, args)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return end

    -- Qualquer jogador pode iniciar
    if GameState.active then
        TriggerClientEvent('QBCore:Notify', source, '⚠️ Já existe um jogo ativo!', 'error', 3000)
        return
    end

    -- Recolher jogadores online
    local players = QBCore.Functions.GetPlayers()
    if #players < 1 then
        TriggerClientEvent('QBCore:Notify', source, '⚠️ Precisas de pelo menos 1 jogador.', 'error', 3000)
        return
    end

    -- Setup do estado
    resetGame()
    GameState.active    = true
    GameState.plane     = getRandomElement(Config.Planes)
    GameState.zone      = getRandomElement(Config.LandingZones)
    GameState.totalCount = #players

    for i, src in ipairs(players) do
        local P = QBCore.Functions.GetPlayer(src)
        GameState.players[src] = {
            name        = P and P.PlayerData.charinfo and
                          (P.PlayerData.charinfo.firstname .. ' ' .. P.PlayerData.charinfo.lastname)
                          or ('Jogador ' .. src),
            landed      = false,
            votes       = 0,
            startHealth = 1000,
            landHealth  = 1000,
            cardData    = nil,
            spawnIndex  = i,
        }
    end

    print(('[Landing] Jogo iniciado! Avião: %s | Zona: %s | Jogadores: %d'):format(
        GameState.plane.label, GameState.zone.label, GameState.totalCount))

    -- Enviar dados de início a todos (com spawn, mas ainda sem timer ativo)
    for src, p in pairs(GameState.players) do
        TriggerClientEvent('landing:startGame', src, {
            plane        = GameState.plane,
            zone         = GameState.zone,
            spawnIndex   = p.spawnIndex,
            totalPlayers = GameState.totalCount,
            flightTime   = Config.FlightTimeSeconds,
            countdown    = Config.CountdownSeconds,
        })
    end

    -- =====================================================
    -- COUNTDOWN: 5, 4, 3, 2, 1, GO!
    -- =====================================================
    local countdownSecs = Config.CountdownSeconds or 5
    for i = countdownSecs, 1, -1 do
        local tick = i
        SetTimeout((countdownSecs - tick) * 1000, function()
            for src, _ in pairs(GameState.players) do
                TriggerClientEvent('landing:countdown', src, tick)
            end
        end)
    end
    -- GO!
    SetTimeout(countdownSecs * 1000, function()
        for src, _ in pairs(GameState.players) do
            TriggerClientEvent('landing:countdown', src, 0)  -- 0 = GO!
        end
    end)

    -- Timer global de voo (começa DEPOIS do countdown)
    local totalDelay = (Config.FlightTimeSeconds + countdownSecs) * 1000
    SetTimeout(totalDelay, function()
        if not GameState.active then return end
        -- Forçar todos a "aterrarem" automaticamente (com dados vazios se não aterraram)
        for src, p in pairs(GameState.players) do
            if not p.landed then
                p.landed     = true
                p.x          = 0; p.y = 0; p.z = 0
                p.landHealth = 0
                GameState.landedCount = GameState.landedCount + 1
                TriggerClientEvent('landing:forceLand', src)
            end
        end
        -- Pequena espera e iniciar votação
        SetTimeout(2000, function()
            if GameState.active then
                startVotePhase()
            end
        end)
    end)
end)
