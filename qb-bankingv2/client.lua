local QBCore = exports['qb-core']:GetCoreObject()
local zones = {}

local isPlayerInsideBankZone = false
local isNearATM = false

local function DrawText3D(x, y, z, text)
    SetTextScale(0.35, 0.35)
    SetTextFont(4)
    SetTextProportional(1)
    SetTextColour(255, 255, 255, 215)
    SetTextEntry("STRING")
    SetTextCentre(true)
    AddTextComponentString(text)
    SetDrawOrigin(x, y, z, 0)
    DrawText(0.0, 0.0)
    local factor = (string.len(text)) / 370
    DrawRect(0.0, 0.0+0.0125, 0.017+ factor, 0.03, 0, 0, 0, 75)
    ClearDrawOrigin()
end

local function OpenBank()
    QBCore.Functions.TriggerCallback('qb-bankingv2:server:openBank', function(accounts, statements, playerData, pinNumbers)
        SetNuiFocus(true, true)
        SendNUIMessage({
            action = 'openBank',
            accounts = accounts,
            statements = statements,
            playerData = playerData,
            pinNumbers = pinNumbers
        })
    end)
end

local function OpenATM()
    QBCore.Functions.Progressbar('accessing_atm', Lang:t('progress.atm'), 1500, false, true, {
        disableMovement = false,
        disableCarMovement = false,
        disableMouse = false,
        disableCombat = false,
    }, {
        animDict = 'amb@prop_human_atm@male@enter',
        anim = 'enter',
    }, {
        model = 'prop_cs_credit_card',
        bone = 28422,
        coords = vector3(0.1, 0.03, -0.05),
        rotation = vector3(0.0, 0.0, 180.0),
    }, {}, function()
        QBCore.Functions.TriggerCallback('qb-bankingv2:server:checkPinSetup', function(hasPinSetup, accounts, playerData, acceptablePins)
            if hasPinSetup then
                SetNuiFocus(true, true)
                SendNUIMessage({
                    action = 'openATM',
                    accounts = accounts,
                    pinNumbers = acceptablePins,
                    playerData = playerData
                })
            else
                QBCore.Functions.Notify('You need to set up an ATM PIN at a bank branch first.', 'error', 5000)
            end
        end)
    end)
end

AddEventHandler('onResourceStart', function(resourceName)
    if (GetCurrentResourceName() ~= resourceName) then return end
    SetNuiFocus(false, false)
    SendNUIMessage({
        action = 'closeApp'
    })
end)

AddEventHandler('onResourceStop', function(resourceName)
    if (GetCurrentResourceName() ~= resourceName) then return end
    SetNuiFocus(false, false)
    SendNUIMessage({
        action = 'closeApp'
    })
end)

RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
    SetNuiFocus(false, false)
    SendNUIMessage({
        action = 'closeApp'
    })
end)

RegisterNetEvent('QBCore:Client:OnPlayerUnload', function()
    SetNuiFocus(false, false)
    SendNUIMessage({
        action = 'closeApp'
    })
end)

local function NearATM()
    local playerCoords = GetEntityCoords(PlayerPedId())
    for _, v in pairs(Config.atmModels) do
        local hash = joaat(v)
        local atmObj = GetClosestObjectOfType(playerCoords.x, playerCoords.y, playerCoords.z, 1.5, hash, false, false, false)
        if atmObj and atmObj ~= 0 then
            return true
        end
    end
    return false
end

RegisterNUICallback('closeApp', function(_, cb)
    SetNuiFocus(false, false)
    cb('ok')
end)

RegisterNUICallback('withdraw', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-bankingv2:server:withdraw', function(status)
        cb(status)
    end, data)
end)

RegisterNUICallback('deposit', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-bankingv2:server:deposit', function(status)
        cb(status)
    end, data)
end)

RegisterNUICallback('internalTransfer', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-bankingv2:server:internalTransfer', function(status)
        cb(status)
    end, data)
end)

RegisterNUICallback('externalTransfer', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-bankingv2:server:externalTransfer', function(status)
        cb(status)
    end, data)
end)

RegisterNUICallback('orderCard', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-bankingv2:server:orderCard', function(status)
        cb(status)
    end, data)
end)

RegisterNUICallback('openAccount', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-bankingv2:server:openAccount', function(status)
        cb(status)
    end, data)
end)

RegisterNUICallback('renameAccount', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-bankingv2:server:renameAccount', function(status)
        cb(status)
    end, data)
end)

RegisterNUICallback('deleteAccount', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-bankingv2:server:deleteAccount', function(status)
        cb(status)
    end, data)
end)

RegisterNUICallback('addUser', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-bankingv2:server:addUser', function(status)
        cb(status)
    end, data)
end)

RegisterNUICallback('removeUser', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-bankingv2:server:removeUser', function(status)
        cb(status)
    end, data)
end)

RegisterNUICallback('refreshAccounts', function(_, cb)
    QBCore.Functions.TriggerCallback('qb-bankingv2:server:openBank', function(accounts, statements, playerData, pinNumbers)
        SendNUIMessage({
            action = 'refreshAccounts',
            accounts = accounts,
            statements = statements,
            pinNumbers = pinNumbers
        })
        cb('ok')
    end)
end)

RegisterNUICallback('getStatements', function(_, cb)
    QBCore.Functions.TriggerCallback('qb-bankingv2:server:openBank', function(accounts, statements, playerData, pinNumbers)
        SendNUIMessage({
            action = 'getStatements',
            statements = statements,
            pinNumbers = pinNumbers
        })
        cb('ok')
    end)
end)

RegisterNUICallback('setATMPin', function(data, cb)
    QBCore.Functions.TriggerCallback('qb-bankingv2:server:setATMPin', function(status)
        cb(status)
    end, data)
end)

RegisterNetEvent('qb-bankingv2:client:useCard', function()
    if NearATM() then OpenATM() end
end)

RegisterCommand('useatm', function()
    if NearATM() then
        if QBCore.Functions.HasItem('bank_card') then
            OpenATM()
        else
            QBCore.Functions.Notify(Lang:t('error.card'), 'error')
        end
    else
        QBCore.Functions.Notify('No ATM nearby', 'error')
    end
end, false)

RegisterKeyMapping('useatm', 'Use nearby ATM', 'keyboard', '')

RegisterCommand('checkatms', function()
    local playerCoords = GetEntityCoords(PlayerPedId())
    local found = false
    
    QBCore.Functions.Notify('Checking for ATMs within 10m...', 'primary')
    
    for _, model in pairs(Config.atmModels) do
        local hash = joaat(model)
        local atmObj = GetClosestObjectOfType(playerCoords.x, playerCoords.y, playerCoords.z, 10.0, hash, false, false, false)
        
        if atmObj and atmObj ~= 0 then
            local atmCoords = GetEntityCoords(atmObj)
            local dist = #(playerCoords - atmCoords)
            found = true
            
            QBCore.Functions.Notify('Found ' .. model .. ' at ' .. math.floor(dist * 100) / 100 .. 'm', 'success')
        end
    end
    
    if not found then
        QBCore.Functions.Notify('No ATMs found within 10m', 'error')
    end
end, false)

CreateThread(function()
    for i = 1, #Config.locations do
        local blip = AddBlipForCoord(Config.locations[i])
        SetBlipSprite(blip, Config.blipInfo.sprite)
        SetBlipDisplay(blip, 4)
        SetBlipScale(blip, Config.blipInfo.scale)
        SetBlipColour(blip, Config.blipInfo.color)
        SetBlipAsShortRange(blip, true)
        BeginTextCommandSetBlipName('STRING')
        AddTextComponentSubstringPlayerName(tostring(Config.blipInfo.name))
        EndTextCommandSetBlipName(blip)
    end
end)

if Config.showATMBlips then
    CreateThread(function()
        Wait(2000)
        
        local atmBlips = {}
        for _, model in pairs(Config.atmModels) do
            local hash = joaat(model)
            local atmObjects = GetGamePool('CObject')
            
            for i = 1, #atmObjects do
                local object = atmObjects[i]
                if GetEntityModel(object) == hash then
                    local coords = GetEntityCoords(object)
                    
                    local createBlip = true
                    for j = 1, #atmBlips do
                        if #(atmBlips[j] - coords) < 5.0 then
                            createBlip = false
                            break
                        end
                    end
                    
                    if createBlip then
                        local blip = AddBlipForCoord(coords)
                        SetBlipSprite(blip, 108) -- ATM sprite
                        SetBlipDisplay(blip, 4)
                        SetBlipScale(blip, 0.4)
                        SetBlipColour(blip, 2)
                        SetBlipAsShortRange(blip, true)
                        BeginTextCommandSetBlipName('STRING')
                        AddTextComponentSubstringPlayerName('ATM')
                        EndTextCommandSetBlipName(blip)
                        
                        atmBlips[#atmBlips + 1] = coords
                    end
                end
            end
        end
    end)
end

if Config.useTarget then
    CreateThread(function()
        for i = 1, #Config.locations do
            exports['qb-target']:AddCircleZone('bank_' .. i, Config.locations[i], 1.0, {
                name = 'bank_' .. i,
                useZ = true,
                debugPoly = false,
            }, {
                options = {
                    {
                        icon = 'fas fa-university',
                        label = 'Open Bank',
                        action = function()
                            OpenBank()
                        end,
                    }
                },
                distance = 1.5
            })
        end
    end)

    CreateThread(function()
        for i = 1, #Config.atmModels do
            local atmModel = Config.atmModels[i]
            exports['qb-target']:AddTargetModel(atmModel, {
                options = {
                    {
                        icon = 'fas fa-university',
                        label = 'Open ATM',
                        item = 'bank_card',
                        action = function()
                            OpenATM()
                        end,
                    }
                },
                distance = 1.5
            })
        end
    end)
end

if not Config.useTarget then
    CreateThread(function()
        for i = 1, #Config.locations do
            local zone = CircleZone:Create(Config.locations[i], 3.0, {
                name = 'bank_' .. i,
                debugPoly = false,
            })
            zones[#zones + 1] = zone
        end

        local combo = ComboZone:Create(zones, {
            name = 'bank_combo',
            debugPoly = false,
        })

        combo:onPlayerInOut(function(isPointInside)
            isPlayerInsideBankZone = isPointInside
            if isPlayerInsideBankZone then
                exports['qb-core']:DrawText('Open Bank')
                CreateThread(function()
                    while isPlayerInsideBankZone do
                        Wait(0)
                        if IsControlJustPressed(0, 38) then
                            OpenBank()
                        end
                    end
                end)
            else
                exports['qb-core']:HideText()
            end
        end)
    end)
    
    CreateThread(function()
        while true do
            local sleep = 1000
            local playerCoords = GetEntityCoords(PlayerPedId())
            isNearATM = false
            
            for _, model in pairs(Config.atmModels) do
                local hash = joaat(model)
                local atmObj = GetClosestObjectOfType(playerCoords.x, playerCoords.y, playerCoords.z, 1.5, hash, false, false, false)
                
                if atmObj and atmObj ~= 0 then
                    local atmCoords = GetEntityCoords(atmObj)
                    local dist = #(playerCoords - atmCoords)
                    
                    if dist < 1.5 then
                        sleep = 0
                        isNearATM = true
                        DrawText3D(atmCoords.x, atmCoords.y, atmCoords.z + 0.5, "Press [E] to use ATM")
                        
                        if IsControlJustPressed(0, 38) then -- E key
                            if QBCore.Functions.HasItem('bank_card') then
                                OpenATM()
                            else
                                QBCore.Functions.Notify(Lang:t('error.card'), 'error')
                            end
                        end
                        break
                    end
                end
            end
            
            Wait(sleep)
        end
    end)
end

RegisterNetEvent('qb-bankingv2:client:refreshAccounts', function()
    QBCore.Functions.TriggerCallback('qb-bankingv2:server:openBank', function(accounts, statements, playerData, pinNumbers)
        SendNUIMessage({
            action = 'refreshAccounts',
            accounts = accounts,
            playerData = playerData,
            pinNumbers = pinNumbers
        })
    end)
end)

RegisterNetEvent('qb-bankingv2:client:refreshStatements', function()
    QBCore.Functions.TriggerCallback('qb-bankingv2:server:openBank', function(accounts, statements, playerData, pinNumbers)
        SendNUIMessage({
            action = 'refreshStatements',
            statements = statements,
            playerData = playerData,
            pinNumbers = pinNumbers
        })
    end)
end)
