/* ============================================================
   picker.js — Leaflet map com imagem GTA V (imageOverlay)
   Clique livre no mapa → pin 📍 → botão confirmar
   ============================================================ */

// Dimensões do mapa GTA V no espaço Leaflet (pixels da imagem)
// A imagem gtamap.jpg tem proporção ~8500x12000 (mundo GTA V)
// Usamos uma escala 1:1 em L.CRS.Simple: 1 pixel = 10m de mundo
const MAP_W = 850;   // largura da imagem
const MAP_H = 1200;  // altura da imagem

let pickerMap = null;
let pickerMarker = null;
let pendingCoords = null;

function initPicker() {
    if (pickerMap) {
        pickerMap.invalidateSize();
        return;
    }

    const bounds = [[0, 0], [MAP_H, MAP_W]];

    pickerMap = L.map('picker-map', {
        crs: L.CRS.Simple,
        minZoom: -1,
        maxZoom: 3,
        zoomControl: true,
        attributionControl: false,
    });

    // Imagem do mapa GTA V como overlay
    L.imageOverlay('assets/gtamap.jpg', bounds).addTo(pickerMap);
    pickerMap.fitBounds(bounds);

    // Clique no mapa
    pickerMap.on('click', function (e) {
        const ly = e.latlng.lat;
        const lx = e.latlng.lng;

        // Clamp dentro dos bounds
        const clampedX = Math.max(0, Math.min(MAP_W, lx));
        const clampedY = Math.max(0, Math.min(MAP_H, ly));

        // Percentagem dentro do mapa
        const mapXpct = (clampedX / MAP_W) * 100;
        const mapYpct = ((MAP_H - clampedY) / MAP_H) * 100;  // Y invertido

        // Conversão para coords mundo GTA V
        const worldX = (mapXpct / 100 * 8500) - 4000;
        const worldY = 8000 - (mapYpct / 100 * 12000);

        pendingCoords = {
            worldX: Math.round(worldX * 10) / 10,
            worldY: Math.round(worldY * 10) / 10,
            worldZ: 30.0,
            mapX: Math.round(mapXpct * 100) / 100,
            mapY: Math.round(mapYpct * 100) / 100,
        };

        // Pin
        if (pickerMarker) pickerMap.removeLayer(pickerMarker);
        pickerMarker = L.marker([clampedY, clampedX], {
            icon: L.divIcon({
                className: '',
                html: '<div class="landing-pin">📍</div>',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
            }),
            zIndexOffset: 1000,
        }).addTo(pickerMap);

        // Mostrar painel de confirmação
        const panel = document.getElementById('picker-confirm');
        panel.classList.remove('hidden');

        const label = document.getElementById('picker-coords-label');
        label.textContent = `Ponto selecionado · X: ${pendingCoords.worldX.toFixed(0)} · Y: ${pendingCoords.worldY.toFixed(0)}`;
    });

    // Botão confirmar
    document.getElementById('btn-confirm').addEventListener('click', function () {
        if (!pendingCoords) return;
        nuiCallback('zoneConfirmed', pendingCoords);
        document.getElementById('picker-view').classList.add('hidden');
        document.getElementById('picker-confirm').classList.add('hidden');
    });
}
