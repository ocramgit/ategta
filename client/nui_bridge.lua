-- NUI Bridge — Callbacks NUI → Lua  e  Lua → NUI

-- =====================================================
-- NUI CALLBACKS (NUI → Lua)
-- =====================================================

-- Iniciador selecionou uma zona no picker
RegisterNUICallback('zoneSelected', function(data, cb)
    TriggerServerEvent('landing:zoneSelected', data.zoneIndex)
    SetNuiFocus(false, false)
    cb({ ok = true })
end)

-- Fechar UI (ESC no ecrã de resultados)
RegisterNUICallback('closeUI', function(_, cb)
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'hide' })
    cb({ ok = true })
end)

-- =====================================================
-- EVENTOS DO SERVIDOR → NUI
-- =====================================================

RegisterNetEvent('landing:nuiEvent', function(event, data)
    SendNUIMessage({ action = event, data = data })

    -- Resultados: bloquear focus para o jogador ver o mapa
    if event == 'openResults' then
        SetNuiFocus(true, true)
    end
end)

-- =====================================================
-- FECHAR NUI COM ESC
-- =====================================================
RegisterCommand('landing_close', function()
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'hide' })
end)

RegisterKeyMapping('landing_close', 'Fechar Landing UI', 'keyboard', 'ESCAPE')
