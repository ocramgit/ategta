fx_version 'cerulean'
game 'gta5'

name 'Landing Competition'
description 'Minijogo de competição de aterragem de aviões para QBCore'
author 'servidor'
version '1.0.0'

shared_scripts {
    '@qb-core/shared/locale.lua',
    'config.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/main.lua'
}

client_scripts {
    'client/main.lua',
    'client/nui_bridge.lua'
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/css/style.css',
    'html/js/app.js',
    'html/js/map.js',
    'html/js/voting.js',
    'html/js/scoreboard.js',
    'html/assets/map.png'
}
