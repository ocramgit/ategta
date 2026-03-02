-- ============================================================
--  LANDING COMPETITION — Client NUI Bridge
-- ============================================================

local resourceName = GetCurrentResourceName()

-- ── Picker: jogador confirmou o ponto no mapa ─────────────────

RegisterNUICallback('zoneConfirmed', function(data, cb)
    SetNuiFocus(false, false)
    -- data: { worldX, worldY, worldZ, mapX, mapY }
    TriggerServerEvent('landing:zoneSelected', data)
    cb({ ok = true })
end)

-- ── Resultados: fechar ecrã ───────────────────────────────────

RegisterNUICallback('closeResults', function(data, cb)
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'hideNUI' })
    cb({ ok = true })
end)
