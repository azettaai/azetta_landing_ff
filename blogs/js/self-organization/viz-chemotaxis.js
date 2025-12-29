import { COLORS, hexToRgba, drawHelpButton, drawHelpTooltip, isPointInRect } from './common.js';

/**
 * Bacterial Chemotaxis Simulation
 * λ(t) = λ₀ * exp(-α * dc/dt)
 */

export async function initVizChemotaxis() {
    const canvas = document.getElementById('viz-chemotaxis');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w, h;
    let time = 0;
    let showHelp = false;
    let showHeatmap = false;
    let helpBtnRect = null;
    let heatmapBtnRect = null;
    let resetBtnRect = null;
    let mouseX = 0, mouseY = 0;

    const HELP_LINES = [
        '• Click anywhere to add food',
        '• Click directly on food to remove it',
        '• Toggle HEATMAP to see density',
        '• Click ↻ to reset simulation',
        '',
        'Bacteria use run-and-tumble:',
        '• Green = toward food',
        '• Red = away (tumbling)'
    ];

    let foodSources = [
        { x: 0.2, y: 0.25 },
        { x: 0.8, y: 0.75 }
    ];

    const NUM_BACTERIA = 150;
    let bacteria = [];
    let recentTumbles = [];

    // Heatmap grid
    const heatmapRes = 20;
    let heatmapGrid = [];

    const BASE_TUMBLE_RATE = 0.08;
    const GRADIENT_SENSITIVITY = 25.0;
    const RUN_SPEED = 2.0;
    const DIFFUSION_RADIUS = 70;
    const MIN_TUMBLE_RATE = 0.005;
    const MAX_TUMBLE_RATE = 0.20;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        w = rect.width;
        h = rect.height;
        canvas.width = w * window.devicePixelRatio;
        canvas.height = h * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        initBacteria();
        initHeatmap();
    }

    function initHeatmap() {
        const cols = Math.ceil(w / heatmapRes);
        const rows = Math.ceil(h / heatmapRes);
        heatmapGrid = [];
        for (let y = 0; y < rows; y++) {
            heatmapGrid[y] = [];
            for (let x = 0; x < cols; x++) {
                heatmapGrid[y][x] = 0;
            }
        }
    }

    function updateHeatmap() {
        // Decay existing values
        for (let y = 0; y < heatmapGrid.length; y++) {
            for (let x = 0; x < heatmapGrid[y].length; x++) {
                heatmapGrid[y][x] *= 0.98;
            }
        }
        // Add bacteria positions
        for (const b of bacteria) {
            const gx = Math.floor(b.x / heatmapRes);
            const gy = Math.floor(b.y / heatmapRes);
            if (gy >= 0 && gy < heatmapGrid.length && gx >= 0 && gx < heatmapGrid[0].length) {
                heatmapGrid[gy][gx] += 0.15;
            }
        }
    }

    function initBacteria() {
        bacteria = [];
        recentTumbles = [];
        for (let i = 0; i < NUM_BACTERIA; i++) {
            const b = {
                x: Math.random() * w,
                y: Math.random() * h,
                angle: Math.random() * Math.PI * 2,
                prevConcentration: 0,
                dcdt: 0,
                state: 'run',
                runLength: 0,
                trail: []
            };
            b.prevConcentration = getConcentration(b.x, b.y);
            bacteria.push(b);
        }
    }

    function getConcentration(x, y) {
        let total = 0;
        const sigma = DIFFUSION_RADIUS;
        for (const food of foodSources) {
            const fx = food.x * w, fy = food.y * h;
            const dx = x - fx, dy = y - fy;
            total += Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
        }
        return total;
    }

    function getDominantFood(x, y) {
        let maxConc = 0, dominant = 0;
        const sigma = DIFFUSION_RADIUS;
        for (let i = 0; i < foodSources.length; i++) {
            const fx = foodSources[i].x * w, fy = foodSources[i].y * h;
            const dx = x - fx, dy = y - fy;
            const conc = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
            if (conc > maxConc) { maxConc = conc; dominant = i; }
        }
        return { index: dominant, concentration: maxConc };
    }

    function updateBacteria() {
        recentTumbles = recentTumbles.filter(t => time - t.time < 25);
        for (const b of bacteria) {
            const currentConc = getConcentration(b.x, b.y);
            b.dcdt = currentConc - b.prevConcentration;
            let tumbleRate = BASE_TUMBLE_RATE * Math.exp(-GRADIENT_SENSITIVITY * b.dcdt);
            tumbleRate = Math.max(MIN_TUMBLE_RATE, Math.min(MAX_TUMBLE_RATE, tumbleRate));

            if (Math.random() < tumbleRate) {
                b.angle = Math.random() * Math.PI * 2;
                b.state = 'tumble';
                recentTumbles.push({ x: b.x, y: b.y, time, dcdt: b.dcdt });
                b.runLength = 0;
            } else {
                b.state = 'run';
                b.runLength++;
            }

            b.x += Math.cos(b.angle) * RUN_SPEED;
            b.y += Math.sin(b.angle) * RUN_SPEED;

            if (b.x < 5) { b.x = 5; b.angle = Math.PI - b.angle; }
            if (b.x > w - 5) { b.x = w - 5; b.angle = Math.PI - b.angle; }
            if (b.y < 5) { b.y = 5; b.angle = -b.angle; }
            if (b.y > h - 5) { b.y = h - 5; b.angle = -b.angle; }

            b.prevConcentration = currentConc;
            b.trail.push({ x: b.x, y: b.y, state: b.state });
            if (b.trail.length > 20) b.trail.shift();
        }
    }

    function drawHeatmapOverlay() {
        for (let y = 0; y < heatmapGrid.length; y++) {
            for (let x = 0; x < heatmapGrid[y].length; x++) {
                const val = Math.min(heatmapGrid[y][x], 2);
                if (val > 0.1) {
                    // Blue to red gradient based on density
                    const t = val / 2;
                    const r = Math.floor(255 * t);
                    const g = Math.floor(100 * (1 - t));
                    const b = Math.floor(255 * (1 - t));
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.3 + t * 0.4})`;
                    ctx.fillRect(x * heatmapRes, y * heatmapRes, heatmapRes, heatmapRes);
                }
            }
        }
    }

    function draw() {
        ctx.fillStyle = '#0a0a10';
        ctx.fillRect(0, 0, w, h);

        updateHeatmap();

        // Draw heatmap if active
        if (showHeatmap) {
            drawHeatmapOverlay();
        } else {
            // Concentration field (only when not showing heatmap)
            const resolution = 12;
            const foodColors = ['rgba(255, 180, 80, ', 'rgba(80, 180, 255, ', 'rgba(180, 255, 80, ', 'rgba(255, 80, 180, '];
            for (let x = 0; x < w; x += resolution) {
                for (let y = 0; y < h; y += resolution) {
                    const { index, concentration } = getDominantFood(x + resolution / 2, y + resolution / 2);
                    if (concentration > 0.02) {
                        ctx.fillStyle = foodColors[index % 4] + Math.min(concentration * 0.15, 0.1) + ')';
                        ctx.fillRect(x, y, resolution, resolution);
                    }
                }
            }
        }

        // Food sources
        for (let fi = 0; fi < foodSources.length; fi++) {
            const food = foodSources[fi];
            const fx = food.x * w, fy = food.y * h;
            const foodColor = fi === 0 ? '#ffb450' : fi === 1 ? '#50b4ff' : '#b4ff50';

            if (!showHeatmap) {
                for (let r = DIFFUSION_RADIUS; r > 20; r -= 25) {
                    ctx.strokeStyle = hexToRgba(foodColor, 0.05 * (1 - r / DIFFUSION_RADIUS));
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(fx, fy, r, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            const pulse = 1 + Math.sin(time * 0.06) * 0.08;
            const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, 20 * pulse);
            glow.addColorStop(0, hexToRgba(foodColor, 0.5));
            glow.addColorStop(0.4, hexToRgba(foodColor, 0.2));
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(fx, fy, 20 * pulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = foodColor;
            ctx.beginPath();
            ctx.arc(fx, fy, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Tumble events
        if (!showHeatmap) {
            for (const t of recentTumbles) {
                const age = time - t.time;
                const alpha = 0.4 * (1 - age / 25);
                ctx.strokeStyle = t.dcdt < 0 ? `rgba(255, 80, 80, ${alpha})` : `rgba(80, 255, 80, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(t.x, t.y, 3 + age * 0.3, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        updateBacteria();

        // Trails (reduced when heatmap active)
        if (!showHeatmap) {
            for (const b of bacteria) {
                if (b.trail.length > 1) {
                    for (let i = 1; i < b.trail.length; i++) {
                        const t0 = b.trail[i - 1], t1 = b.trail[i];
                        const alpha = 0.05 + (i / b.trail.length) * 0.1;
                        ctx.strokeStyle = t1.state === 'run' ? `rgba(80, 200, 80, ${alpha})` : `rgba(255, 80, 80, ${alpha})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(t0.x, t0.y);
                        ctx.lineTo(t1.x, t1.y);
                        ctx.stroke();
                    }
                }
            }
        }

        // Bacteria
        for (const b of bacteria) {
            const bodyHue = b.dcdt > 0.002 ? 120 : b.dcdt < -0.002 ? 0 : 50;
            const bodyColor = `hsl(${bodyHue}, 70%, 55%)`;
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.ellipse(b.x, b.y, 4, 2.5, b.angle, 0, Math.PI * 2);
            ctx.fill();

            if (!showHeatmap) {
                const flagLen = 5 + Math.min(b.runLength * 0.15, 6);
                ctx.strokeStyle = hexToRgba(bodyColor, 0.5);
                ctx.lineWidth = 1;
                const wiggle = Math.sin(time * 0.4 + b.x * 0.05) * 0.3;
                ctx.beginPath();
                ctx.moveTo(b.x - Math.cos(b.angle) * 3, b.y - Math.sin(b.angle) * 3);
                ctx.lineTo(b.x - Math.cos(b.angle + wiggle) * flagLen, b.y - Math.sin(b.angle + wiggle) * flagLen);
                ctx.stroke();
            }
        }

        let nearFood = 0;
        for (const b of bacteria) {
            if (getDominantFood(b.x, b.y).concentration > 0.3) nearFood++;
        }
        const percentage = Math.round(nearFood / NUM_BACTERIA * 100);

        // Info panel - bottom right
        const panelW = 160, panelH = 44;
        const panelX = w - panelW - 10, panelY = h - panelH - 10;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = 'rgba(244, 162, 97, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#aaa';
        ctx.fillText('λ = λ₀·exp(−α·dc/dt)', panelX + 8, panelY + 16);
        ctx.fillStyle = percentage > 30 ? '#64ff64' : '#aaa';
        ctx.fillText(`At food: ${percentage}%`, panelX + 8, panelY + 32);

        // Title - top left
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(8, 8, 95, 20);
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.fillStyle = '#f4a261';
        ctx.fillText("CHEMOTAXIS", 14, 22);

        // Heatmap toggle - after title
        const heatmapBtnX = 108, heatmapBtnY = 8, heatmapBtnW = 70, heatmapBtnH = 20;
        heatmapBtnRect = { x: heatmapBtnX, y: heatmapBtnY, w: heatmapBtnW, h: heatmapBtnH };
        const isHeatmapHovered = isPointInRect(mouseX, mouseY, heatmapBtnRect);

        ctx.fillStyle = showHeatmap ? 'rgba(237, 33, 124, 0.3)' : (isHeatmapHovered ? 'rgba(255,255,255,0.1)' : 'rgba(0, 0, 0, 0.6)');
        ctx.fillRect(heatmapBtnX, heatmapBtnY, heatmapBtnW, heatmapBtnH);
        ctx.strokeStyle = showHeatmap ? '#ed217c' : '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(heatmapBtnX, heatmapBtnY, heatmapBtnW, heatmapBtnH);
        ctx.font = '9px "Courier New", monospace';
        ctx.fillStyle = showHeatmap ? '#ed217c' : '#888';
        ctx.textAlign = 'center';
        ctx.fillText(showHeatmap ? '◉ HEAT' : '○ HEAT', heatmapBtnX + heatmapBtnW / 2, heatmapBtnY + 14);

        // Buttons - top right (spaced properly)
        // Reset button
        const resetBtnX = w - 58, resetBtnY = 10;
        resetBtnRect = { x: resetBtnX, y: resetBtnY, w: 24, h: 24 };
        const isResetHovered = isPointInRect(mouseX, mouseY, resetBtnRect);

        ctx.fillStyle = isResetHovered ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.arc(resetBtnX + 12, resetBtnY + 12, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isResetHovered ? '#fff' : '#888';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(resetBtnX + 12, resetBtnY + 12, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.fillStyle = isResetHovered ? '#fff' : '#888';
        ctx.textAlign = 'center';
        ctx.fillText('↻', resetBtnX + 12, resetBtnY + 17);

        // Help button
        const isHelpHovered = helpBtnRect && isPointInRect(mouseX, mouseY, helpBtnRect);
        helpBtnRect = drawHelpButton(ctx, w - 22, 22, isHelpHovered, '#f4a261');

        // Help overlay
        if (showHelp) {
            drawHelpTooltip(ctx, w, h, HELP_LINES, '#f4a261');
        }

        time++;
        requestAnimationFrame(draw);
    }

    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    }

    function handleClick(e) {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Check help button
        if (helpBtnRect && isPointInRect(clickX, clickY, helpBtnRect)) {
            showHelp = !showHelp;
            return;
        }

        // Close help if open
        if (showHelp) {
            showHelp = false;
            return;
        }

        // Check reset button
        if (resetBtnRect && isPointInRect(clickX, clickY, resetBtnRect)) {
            foodSources = [{ x: 0.2, y: 0.25 }, { x: 0.8, y: 0.75 }];
            initBacteria();
            initHeatmap();
            return;
        }

        // Check heatmap toggle
        if (heatmapBtnRect && isPointInRect(clickX, clickY, heatmapBtnRect)) {
            showHeatmap = !showHeatmap;
            return;
        }

        const x = clickX / w, y = clickY / h;

        // Check food removal
        for (let i = 0; i < foodSources.length; i++) {
            const dx = foodSources[i].x - x, dy = foodSources[i].y - y;
            if (Math.sqrt(dx * dx + dy * dy) < 0.05 && foodSources.length > 1) {
                foodSources.splice(i, 1);
                return;
            }
        }

        if (foodSources.length < 4) {
            foodSources.push({ x, y });
        }
    }

    function handleDblClick() {
        if (showHelp) return;
        foodSources = [{ x: 0.2, y: 0.25 }, { x: 0.8, y: 0.75 }];
        initBacteria();
        initHeatmap();
    }

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('dblclick', handleDblClick);

    resize();
    draw();
    window.addEventListener('resize', resize);
}
