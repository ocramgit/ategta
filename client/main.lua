local QBCore    = exports['qb-core']:GetCoreObject()

-- =====================================================
-- ESTADO LOCAL
-- =====================================================
local gameData      = nil   -- dados recebidos do servidor
local myPlane       = nil   -- entity do avião
local planeDead     = false
local hasLanded     = false
local flightTimer   = 0
local flightActive  = false
local initialHealth = 0
local nuiOpen       = false

-- =====================================================
-- HELPERS
-- =====================================================
local function notify(msg, type)
    QBCore.Functions.Notify(msg, type or 'primary', 4000)
end

local function requestModel(model)
    local hash = GetHashKey(model)
    RequestModel(hash)
    local t = 0
    while not HasModelLoaded(hash) do
        Wait(100)
        t = t + 100
        if t > 10000 then break end
    end
    return hash
end

local function getSpawnCoords(index)
    local spots = Config.SpawnSpots
    local spot  = spots[((index - 1) % #spots) + 1]  -- cicla se houver mais jogadores que spots
    return spot.x, spot.y, spot.z, spot.h
end

-- =====================================================
-- SPAWN DO AVIÃO
-- =====================================================
local function spawnPlane(index, planeModel)
    local x, y, z, h = getSpawnCoords(index)
    local hash = requestModel(planeModel)
    if not HasModelLoaded(hash) then
        notify('❌ Modelo de avião não carregado!', 'error')
        return nil
    end

    local plane = CreateVehicle(hash, x, y, z, h, true, false)
    SetEntityAsMissionEntity(plane, true, true)
    SetVehicleEngineOn(plane, true, true, false)
    SetVehicleNeedsToBeHotwired(plane, false)
    SetVehicleHasBeenOwnedByPlayer(plane, true)
    SetModelAsNoLongerNeeded(hash)

    -- Entrar no lugar de piloto
    local ped = PlayerPedId()
    TaskWarpPedIntoVehicle(ped, plane, -1)
    Wait(500)

    initialHealth = GetEntityHealth(plane)
    return plane
end

-- =====================================================
-- DETEÇÃO DE ATERRAGEM
-- =====================================================
local function isOnGround()
    if not myPlane or not DoesEntityExist(myPlane) then return true end
    return IsEntityOnAllWheels(myPlane) or
           (GetEntityHeightAboveGround(myPlane) < 2.0 and GetEntitySpeed(myPlane) < 10.0)
end

local function getPlaneCardData()
    if not myPlane or not DoesEntityExist(myPlane) then
        return { speed = 0, heading = 0, damagePercent = 100 }
    end
    local currentHealth = GetEntityHealth(myPlane)
    local dmgPct = 0
    if initialHealth > 0 then
        dmgPct = math.floor(math.max(0, (initialHealth - currentHealth) / initialHealth * 100))
    end
    return {
        speed         = math.floor(GetEntitySpeed(myPlane) * 3.6),  -- km/h
        heading       = math.floor(GetEntityHeading(myPlane)),
        damagePercent = dmgPct,
    }
end

local function registerLanding(forced)
    if hasLanded then return end
    hasLanded   = true
    flightActive = false

    local ped  = PlayerPedId()
    local pos  = GetEntityCoords(ped)
    local cardData = getPlaneCardData()
    local currentHealth = myPlane and DoesEntityExist(myPlane) and GetEntityHealth(myPlane) or 0

    -- Enviar para o servidor
    TriggerServerEvent('landing:registerLanding', {
        x        = pos.x,
        y        = pos.y,
        z        = pos.z,
        health   = currentHealth,
        cardData = cardData,
    })

    -- Gerar card visual no NUI (sem screenshot externo)
    SendNUIMessage({
        action   = 'myLandingCard',
        cardData = cardData,
        name     = GetPlayerName(PlayerId()),
    })

    if not forced then
        notify('✅ Aterragem registada! Aguarda os outros jogadores...', 'success')
    end
end

-- =====================================================
-- LOOP DE VOO
-- =====================================================
local function startFlightLoop(flightTime)
    flightActive = true
    hasLanded    = false
    planeDead    = false

    -- HUD timer
    CreateThread(function()
        local endTime = GetGameTimer() + (flightTime * 1000)
        while flightActive do
            local remaining = math.max(0, math.floor((endTime - GetGameTimer()) / 1000))
            SendNUIMessage({ action = 'updateTimer', seconds = remaining })
            Wait(1000)
        end
    end)

    -- Loop de deteção de aterragem e estado
    CreateThread(function()
        local stableCount = 0
        while flightActive do
            Wait(500)

            if not myPlane or not DoesEntityExist(myPlane) then
                -- avião destruído
                if not hasLanded then
                    notify('💥 O teu avião foi destruído! Aterragem registada.', 'error')
                    registerLanding(false)
                end
                break
            end

            local ped = PlayerPedId()
            -- Piloto saiu do avião?
            local inVehicle = GetVehiclePedIsIn(ped, false)
            local isInPlane = (inVehicle == myPlane)

            -- Avião parou no chão?
            if isInPlane and isOnGround() then
                stableCount = stableCount + 1
                if stableCount >= 4 then  -- 2 segundos parado
                    if not hasLanded then
                        registerLanding(false)
                    end
                    break
                end
            else
                stableCount = 0
            end
        end
    end)
end

-- =====================================================
-- EVENTOS DO SERVIDOR
-- =====================================================

-- Jogo iniciado: spawna o avião e abre o mapa, mas NÃO inicia o voo ainda
RegisterNetEvent('landing:startGame', function(data)
    gameData    = data
    hasLanded   = false
    planeDead   = false
    nuiOpen     = true

    -- Abrir NUI com mapa e info
    SendNUIMessage({
        action     = 'openMap',
        zone       = data.zone,
        plane      = data.plane,
        flightTime = data.flightTime,
    })
    SetNuiFocus(false, false)

    Wait(500)

    -- Spawnar avião (parado, motor ligado, jogador dentro)
    myPlane = spawnPlane(data.spawnIndex, data.plane.model)
    if myPlane then
        -- Congelar avião até GO!
        FreezeEntityPosition(myPlane, true)
        notify(('✈️ Avião: %s | Destino: %s | Aguarda o countdown...'):format(data.plane.label, data.zone.label), 'primary')
    else
        notify('❌ Erro ao spawnar avião!', 'error')
    end
end)

-- Countdown recebido do servidor
RegisterNetEvent('landing:countdown', function(tick)
    -- Enviar para NUI
    SendNUIMessage({ action = 'countdown', tick = tick })

    if tick == 0 then
        -- GO! Descongelar e iniciar voo
        if myPlane and DoesEntityExist(myPlane) then
            FreezeEntityPosition(myPlane, false)
            SetVehicleEngineOn(myPlane, true, true, false)
        end
        if gameData then
            startFlightLoop(gameData.flightTime)
        end
    end
end)

-- Forçar aterragem (timeout do servidor)
RegisterNetEvent('landing:forceLand', function()
    if not hasLanded then
        notify('⏰ Tempo esgotado! A registar aterragem...', 'error')
        registerLanding(true)
    end
end)

-- =====================================================
-- LIMPEZA
-- =====================================================
AddEventHandler('onResourceStop', function(resource)
    if resource ~= GetCurrentResourceName() then return end
    if myPlane and DoesEntityExist(myPlane) then
        DeleteEntity(myPlane)
    end
    SetNuiFocus(false, false)
end)
