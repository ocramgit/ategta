/**
 * map.js — Landing zone map display with animated marker
 * Uses percentage-based positioning so it works on any screen size.
 */

const MapModule = (() => {
    let timerInterval = null;

    function init(zone, plane, flightTimeSec) {
        // Plane and zone info
        document.getElementById('plane-name').textContent = plane.label;
        document.getElementById('zone-name').textContent = zone.label;
        document.getElementById('zone-hint').textContent = zone.hint || '';
        document.getElementById('marker-label').textContent = zone.label;

        // Position marker using percentage coords from config
        const marker = document.getElementById('landing-marker');
        marker.style.left = zone.mapX + '%';
        marker.style.top = zone.mapY + '%';

        // Initial timer display
        updateTimer(flightTimeSec);

        // Clear old feed
        document.getElementById('landed-feed').innerHTML = '';
    }

    function updateTimer(seconds) {
        const el = document.getElementById('hud-timer');
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        el.textContent = m + ':' + String(s).padStart(2, '0');

        // Visual warnings
        el.classList.remove('warning', 'danger');
        if (seconds <= 30) el.classList.add('danger');
        else if (seconds <= 60) el.classList.add('warning');
    }

    function addLandedFeed(name, count, total) {
        const feed = document.getElementById('landed-feed');
        const item = document.createElement('div');
        item.className = 'feed-item';
        item.innerHTML = `<span class="feed-name">✅ ${escapeHtml(name)}</span> aterrou! (${count}/${total})`;
        feed.appendChild(item);

        // Auto-remove old entries (keep max 6)
        const items = feed.querySelectorAll('.feed-item');
        if (items.length > 6) items[0].remove();
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    return { init, updateTimer, addLandedFeed };
})();
