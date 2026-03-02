fx_version 'cerulean'
game 'gta5'

name        'landing-competition'
description 'Competição multiplayer de aterragem de aviões'
author      'ocramgit'
version     '1.0.0'

shared_scripts {
    'config.lua'
}

server_scripts {
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
    'html/js/picker.js',
    'html/js/map.js',
    'html/js/results.js',
    'html/assets/gtamap.jpg'
}
