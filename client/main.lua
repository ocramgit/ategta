local QBCore    = exports['qb-core']:GetCoreObject()

-- =====================================================
-- ESTADO LOCAL
-- =====================================================
local gameData      = nil
local myPlane       = nil
local hasLanded     = false
local flightActive  = false
local initialHealth = 0

-- =====================================================
-- HELPERS
-- =====================================================
local function notify(msg, ntype)
    QBCore.Functions.Notify(msg, ntype or 'primary', 4000)
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
    local spot  = spots[((index - 1) % #spots) + 1]
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

    local plane = CreateVehicle(hash, x, y, z + 0.5, h, true, false)
    SetEntityAsMissionEntity(plane, true, true)
    SetVehicleEngineOn(plane, true, true, false)
    SetVehicleNeedsToBeHotwired(plane, false)
    SetVehicleHasBeenOwnedByPlayer(plane, true)
    SetVehicleFuelLevel(plane, 100.0)     -- combustível cheio garantido
    SetVehicleDoorsLocked(plane, 1)       -- bloquear entrada de outros jogadores
    SetModelAsNoLongerNeeded(hash)

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

local function getCardData()
    if not myPlane or not DoesEntityExist(myPlane) then
        return { speed = 0, heading = 0, damagePercent = 100 }
    end
    local cur = GetEntityHealth(myPlane)
    local dmg = 0
    if initialHealth > 0 then
        dmg = math.floor(math.max(0, (initialHealth - cur) / initialHealth * 100))
    end
    return {
        speed         = math.floor(GetEntitySpeed(myPlane) * 3.6),
        heading       = math.floor(GetEntityHeading(myPlane)),
        damagePercent = dmg,
    }
end

-- FIX: usar coords do AVIÃO (não do ped) — correto mesmo se jogador saiu
local function registerLanding(forced)
    if hasLanded then return end
    hasLanded    = true
    flightActive = false

    local pos
    if myPlane and DoesEntityExist(myPlane) then
        pos = GetEntityCoords(myPlane)
    else
        pos = GetEntityCoords(PlayerPedId())
    end

    local currentHealth = (myPlane and DoesEntityExist(myPlane)) and GetEntityHealth(myPlane) or 0
    local cardData = getCardData()

    TriggerServerEvent('landing:registerLanding', {
        x        = pos.x,
        y        = pos.y,
        z        = pos.z,
        health   = currentHealth,
        cardData = cardData,
    })

    if not forced then
        notify('✅ Aterragem registada! Aguarda os outros...', 'success')
    end
end

-- =====================================================
-- LOOP DE VOO
-- =====================================================
local function startFlightLoop(flightTime)
    flightActive = true
    hasLanded    = false

    -- HUD timer countdown
    CreateThread(function()
        local endTime = GetGameTimer() + (flightTime * 1000)
        while flightActive do
            local remaining = math.max(0, math.floor((endTime - GetGameTimer()) / 1000))
            SendNUIMessage({ action = 'updateTimer', seconds = remaining })
            Wait(1000)
        end
    end)

    -- Deteção de aterragem
    CreateThread(function()
        local stableCount = 0
        while flightActive do
            Wait(500)

            -- Avião destruído?
            if not myPlane or not DoesEntityExist(myPlane) then
                if not hasLanded then
                    notify('💥 Avião destruído! Aterragem registada.', 'error')
                    registerLanding(false)
                end
                break
            end

            local ped       = PlayerPedId()
            local inVehicle = GetVehiclePedIsIn(ped, false)

            -- FIX: só contar stability quando dentro do avião
            if inVehicle == myPlane then
                if isOnGround() then
                    stableCount = stableCount + 1
                    if stableCount >= 4 then   -- 2 segundos estável no chão
                        if not hasLanded then registerLanding(false) end
                        break
                    end
                else
                    stableCount = 0
                end
            else
                -- Jogador saiu do avião: resetar contagem
                stableCount = 0
            end
        end
    end)
end

-- =====================================================
-- ABERTURA DO PICKER (só para o iniciador)
-- =====================================================
RegisterNetEvent('landing:openPicker', function(data)
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = 'openPicker',
        zones  = data.zones,
        plane  = data.plane,
    })
end)

-- =====================================================
-- INICIO DO JOGO (recebido por todos)
-- FIX: CreateThread para Wait() ser seguro dentro de net event
-- =====================================================
RegisterNetEvent('landing:startGame', function(data)
    CreateThread(function()
        gameData  = data
        hasLanded = false

        SendNUIMessage({
            action     = 'openMap',
            zone       = data.zone,
            plane      = data.plane,
            flightTime = data.flightTime,
        })
        SetNuiFocus(false, false)

        Wait(800)

        myPlane = spawnPlane(data.spawnIndex, data.plane.model)
        if myPlane then
            FreezeEntityPosition(myPlane, true)
            notify(('✈️ %s | 📍 %s | Aguarda countdown...'):format(
                data.plane.label, data.zone.label), 'primary')
        else
            notify('❌ Erro ao spawnar avião!', 'error')
        end
    end)
end)

-- =====================================================
-- COUNTDOWN
-- =====================================================
RegisterNetEvent('landing:countdown', function(tick)
    SendNUIMessage({ action = 'countdown', tick = tick })

    if tick == 0 then
        if myPlane and DoesEntityExist(myPlane) then
            FreezeEntityPosition(myPlane, false)
            SetVehicleEngineOn(myPlane, true, true, false)
        end
        if gameData then
            startFlightLoop(gameData.flightTime)
        end
    end
end)

-- =====================================================
-- FORÇAR ATERRAGEM (timer do servidor esgotou)
-- =====================================================
RegisterNetEvent('landing:forceLand', function()
    if not hasLanded then
        notify('⏰ Tempo esgotado!', 'error')
        registerLanding(true)
    end
end)

-- =====================================================
-- LIMPEZA
-- =====================================================
AddEventHandler('onResourceStop', function(resource)
    if resource ~= GetCurrentResourceName() then return end
    if myPlane and DoesEntityExist(myPlane) then DeleteEntity(myPlane) end
    SetNuiFocus(false, false)
end)
