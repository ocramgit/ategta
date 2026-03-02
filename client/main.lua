-- ============================================================
--  LANDING COMPETITION — Client Main
-- ============================================================

local QBCore       = exports['qb-core']:GetCoreObject()
local playerPlane  = nil   -- handle do veículo spawned
local hasLanded    = false
local gameActive   = false

-- ── Abrir picker NUI ──────────────────────────────────────────

RegisterNetEvent('landing:openPicker', function()
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'showPicker' })
end)

-- ── Iniciar o jogo: teleporte + spawn avião ───────────────────

RegisterNetEvent('landing:startGame', function(zone, plane, spotIndex)
    hasLanded  = false
    gameActive = true

    local spot = Config.SpawnSpots[spotIndex] or Config.SpawnSpots[1]
    local ped  = PlayerPedId()

    -- Teleportar o ped para o spot
    SetEntityCoords(ped, spot.x, spot.y, spot.z + 1.0, false, false, false, true)
    SetEntityHeading(ped, spot.heading)

    -- Carregar modelo do avião
    local modelHash = GetHashKey(plane.model)
    local loaded = false
    RequestModel(modelHash)
    for i = 1, 100 do
        if HasModelLoaded(modelHash) then
            loaded = true
            break
        end
        Wait(100)
    end

    if not loaded then
        -- Fallback sem avião
        gameActive = false
        return
    end

    -- Spawnar o avião na posição do spot
    local vehicle = CreateVehicle(modelHash, spot.x, spot.y, spot.z, spot.heading, false, false)
    SetReducedReactionsEnabledThisFrame(true)
    SetModelAsNoLongerNeeded(modelHash)

    -- Colocar jogador dentro
    SetPedIntoVehicle(ped, vehicle, -1)

    -- Congelar até ao countdown
    FreezeEntityPosition(vehicle, true)
    SetVehicleEngineOn(vehicle, true, true, false)

    playerPlane = vehicle

    -- Mostrar HUD de voo (com zona)
    SendNUIMessage({ action = 'showHUD', zone = zone, planeName = plane.label })

    -- Countdown
    CreateThread(function()
        for t = Config.CountdownSeconds, 1, -1 do
            SendNUIMessage({ action = 'countdown', value = t })
            Wait(1000)
        end
        SendNUIMessage({ action = 'countdown', value = 0 })

        -- Descongelar avião
        if playerPlane and DoesEntityExist(playerPlane) then
            FreezeEntityPosition(playerPlane, false)
        end

        -- Iniciar deteção de aterragem
        StartLandingDetection(zone)

        -- Timer de fim de jogo (client side display)
        StartFlightTimer(Config.FlightTime)
    end)
end)

-- ── Deteção de aterragem ──────────────────────────────────────

function StartLandingDetection(zone)
    CreateThread(function()
        local stableTime = 0

        while gameActive and not hasLanded do
            Wait(500)

            if not playerPlane or not DoesEntityExist(playerPlane) then
                -- Avião destruído
                if not hasLanded then
                    RegisterLanding(true)
                end
                return
            end

            -- Verificar se avião explodiu
            if IsEntityDead(playerPlane) then
                if not hasLanded then
                    RegisterLanding(true)
                end
                return
            end

            local ped        = PlayerPedId()
            local inVehicle  = GetVehiclePedIsIn(ped, false) == playerPlane
            local isOnGround = IsEntityOnAllWheels(playerPlane)
            local speed      = GetEntitySpeed(playerPlane) * 3.6  -- m/s → km/h

            if inVehicle and isOnGround and speed < 10.0 then
                stableTime = stableTime + 500
                if stableTime >= 2000 then
                    -- 2 segundos estável no chão dentro do avião
                    RegisterLanding(false)
                    return
                end
            else
                stableTime = 0
            end
        end
    end)
end

function RegisterLanding(exploded)
    if hasLanded then return end
    hasLanded  = true
    gameActive = false

    local coords = vector3(0.0, 0.0, 0.0)
    if playerPlane and DoesEntityExist(playerPlane) then
        coords = GetEntityCoords(playerPlane, false)
    else
        coords = GetEntityCoords(PlayerPedId(), false)
    end

    TriggerServerEvent('landing:registerLanding', {
        worldX   = coords.x,
        worldY   = coords.y,
        worldZ   = coords.z,
        exploded = exploded,
    })

    -- Notificação local
    if exploded then
        SendNUIMessage({ action = 'feed', message = '💥 O teu avião explodiu! Aterragem registada com penalização.' })
    else
        SendNUIMessage({ action = 'feed', message = '✅ Aterragem detectada! Score em cálculo...' })
    end
end

-- ── Timer de voo (HUD) ────────────────────────────────────────

function StartFlightTimer(seconds)
    CreateThread(function()
        for t = seconds, 0, -1 do
            if hasLanded then return end
            SendNUIMessage({ action = 'timerTick', value = t })
            Wait(1000)
        end
    end)
end

-- ── ForceLand (timer do servidor expirou) ────────────────────

RegisterNetEvent('landing:forceLand', function()
    if not hasLanded then
        RegisterLanding(false)
    end
end)

-- ── Feed de aterragem de outros jogadores ─────────────────────

RegisterNetEvent('landing:playerLanded', function(data)
    local icon = data.exploded and '💥' or '🛬'
    local msg  = string.format('%s %s aterrou a %dm — %d pts',
        icon, data.name, data.dist, data.score)
    SendNUIMessage({ action = 'feed', message = msg })
end)

-- ── Mostrar resultados ────────────────────────────────────────

RegisterNetEvent('landing:showResults', function(results, zone)
    gameActive = false

    -- Apagar avião (precisa de CreateThread por causa do Wait)
    CreateThread(function()
        if playerPlane and DoesEntityExist(playerPlane) then
            local ped = PlayerPedId()
            TaskLeaveVehicle(ped, playerPlane, 0)
            Wait(1500)
            if playerPlane and DoesEntityExist(playerPlane) then
                DeleteVehicle(playerPlane)
            end
            playerPlane = nil
        end
    end)

    SendNUIMessage({
        action  = 'showResults',
        results = results,
        zone    = zone,
    })
    SetNuiFocus(true, false)
end)
