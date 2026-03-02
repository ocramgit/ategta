-- NUI Bridge: handlers de NUI → Lua e Lua → NUI

-- =====================================================
-- NUI CALLBACKS (NUI → Lua)
-- =====================================================

-- Jogador votou numa aterragem
RegisterNUICallback('submitVote', function(data, cb)
    TriggerServerEvent('landing:submitVote', data.votedSource)
    cb({ ok = true })
end)

-- NUI pede para fechar (pressionar ESC no scoreboard)
RegisterNUICallback('closeUI', function(_, cb)
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'hide' })
    cb({ ok = true })
end)

-- =====================================================
-- EVENTOS DO SERVIDOR → NUI
-- =====================================================

-- Outro jogador aterrou
RegisterNetEvent('landing:nuiEvent', function(event, data)
    SendNUIMessage({ action = event, data = data })

    -- Se for abertura de votação, bloquear o focus para interação
    if event == 'openVoting' then
        SetNuiFocus(true, true)
    end

    -- Se for scoreboard, mantém focus bloqueado
    if event == 'openScoreboard' then
        SetNuiFocus(true, true)
    end
end)

-- =====================================================
-- KEYBIND: fechar NUI com ESC no scoreboard
-- =====================================================
RegisterCommand('landing_close', function()
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'hide' })
end)

RegisterKeyMapping('landing_close', 'Fechar Landing UI', 'keyboard', 'ESCAPE')
