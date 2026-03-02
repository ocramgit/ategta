/**
 * scoreboard.js — Final results display with special awards
 */

const ScoreboardModule = (() => {

    function init(results, zone) {
        // Zone label
        const zoneEl = document.getElementById('zone-result-label');
        if (zoneEl) zoneEl.textContent = '📍 ' + (zone?.label || '–');

        // Build table rows
        const tbody = document.getElementById('scoreboard-body');
        tbody.innerHTML = '';

        results.forEach((r, i) => {
            const tr = document.createElement('tr');
            tr.style.animationDelay = (i * 0.12) + 's';

            const rankSymbol = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank;
            const rankClass = ['rank-1', 'rank-2', 'rank-3'][r.rank - 1] || '';

            const distText = r.landed ? r.dist + 'm' : '–';
            const dmgLabel = r.dmgLabel || '–';

            tr.innerHTML = `
                <td class="rank-cell ${rankClass}">${rankSymbol}</td>
                <td class="player-name-cell">${escapeHtml(r.name)}</td>
                <td class="pts-cell">${fmtPts(r.distPts)} <span style="color:var(--text-dim);font-size:11px">(${distText})</span></td>
                <td><span class="dmg-chip">${dmgLabel}</span> <span class="pts-cell" style="font-size:12px">+${fmtPts(r.dmgPts)}</span></td>
                <td class="pts-cell">${r.votes}×  <span style="font-size:11px;color:var(--text-dim)">+${fmtPts(r.votePts)}</span></td>
                <td class="total-cell">${fmtPts(r.total)}</td>
            `;
            tbody.appendChild(tr);
        });

        // Special awards
        buildAwards(results);
    }

    function buildAwards(results) {
        const container = document.getElementById('special-awards');
        container.innerHTML = '';

        if (!results || results.length === 0) return;

        const awards = [];

        // Best position (lowest dist)
        const landed = results.filter(r => r.landed && r.dist < 9000);
        if (landed.length > 0) {
            const best = [...landed].sort((a, b) => a.dist - b.dist)[0];
            awards.push({
                icon: '📍',
                title: 'Melhor Posicionamento',
                name: best.name,
                sub: best.dist + 'm do alvo',
            });
        }

        // Most destroyed plane
        const mostDmg = [...results].sort((a, b) => b.dmgPts - a.dmgPts)[0];
        if (mostDmg && mostDmg.dmgPts > 0) {
            awards.push({
                icon: '💥',
                title: 'Aeronave Mais Destruída',
                name: mostDmg.name,
                sub: mostDmg.dmgLabel,
            });
        }

        // Most votes
        const mostVoted = [...results].sort((a, b) => b.votes - a.votes)[0];
        if (mostVoted && mostVoted.votes > 0) {
            awards.push({
                icon: '❤️',
                title: 'Mais Votado',
                name: mostVoted.name,
                sub: mostVoted.votes + ' voto(s)',
            });
        }

        // Overall champion
        if (results[0]) {
            awards.push({
                icon: '🏆',
                title: 'Campeão',
                name: results[0].name,
                sub: fmtPts(results[0].total) + ' pts',
            });
        }

        awards.forEach((a, i) => {
            const card = document.createElement('div');
            card.className = 'award-card';
            card.style.animationDelay = (0.5 + i * 0.1) + 's';
            card.innerHTML = `
                <div class="award-icon">${a.icon}</div>
                <div class="award-title">${a.title}</div>
                <div class="award-name">${escapeHtml(a.name)}</div>
                <div class="award-sub">${a.sub}</div>
            `;
            container.appendChild(card);
        });
    }

    function fmtPts(n) {
        return Number(n || 0).toLocaleString('pt-PT') + ' pts';
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    return { init };
})();
