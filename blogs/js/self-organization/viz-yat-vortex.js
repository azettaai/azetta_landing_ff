import { COLORS, hexToRgba, dot, magnitude, softmax, drawHelpButton, drawResetButton, drawHelpTooltip, isPointInRect } from './common.js';

/**
 * YAT Classifier Vortex
 */
export async function initVizYatVortex() {
    const canvas = document.getElementById('viz-yat-vortex');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame, time = 0;
    let showHelp = false;
    let helpBtnRect = null;
    let resetBtnRect = null;
    let mouseX = 0, mouseY = 0;

    const HELP_LINES = [
        '• Click to add a neuron',
        '• Click on neuron to remove',
        '• Click ↻ to reset to 3 neurons',
        '',
        'YAT metric:',
        '• Yat(x,w) = (x·w)² / ||x-w||²',
        '• Colors show territories'
    ];

    let neurons = [
        { x: 0.3, y: 0.3, color: '#ed217c' },
        { x: 0.7, y: 0.3, color: '#4ea8de' },
        { x: 0.5, y: 0.7, color: '#2dd4bf' }
    ];
    const neuronColors = ['#ed217c', '#4ea8de', '#2dd4bf', '#f4a261', '#9b5de5', '#6bff6b'];

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function reset() {
        neurons = [
            { x: 0.3, y: 0.3, color: '#ed217c' },
            { x: 0.7, y: 0.3, color: '#4ea8de' },
            { x: 0.5, y: 0.7, color: '#2dd4bf' }
        ];
    }

    function computeYat(px, py, nx, ny) {
        const dotProd = px * nx + py * ny;
        const distSq = (px - nx) ** 2 + (py - ny) ** 2;
        return distSq < 0.0001 ? 1000 : (dotProd * dotProd) / distSq;
    }

    function getWinningNeuron(px, py) {
        const scores = neurons.map(n => computeYat(px - 0.5, py - 0.5, n.x - 0.5, n.y - 0.5));
        const probs = softmax(scores, 0.5);
        let maxIdx = 0;
        for (let i = 1; i < probs.length; i++) if (probs[i] > probs[maxIdx]) maxIdx = i;
        return { idx: maxIdx, probs };
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width, h = canvas.getBoundingClientRect().height;
        ctx.clearRect(0, 0, w, h);

        const resolution = 6;
        for (let x = 0; x < w; x += resolution) {
            for (let y = 0; y < h; y += resolution) {
                const { idx, probs } = getWinningNeuron(x / w, y / h);
                ctx.fillStyle = hexToRgba(neurons[idx].color, probs[idx] * 0.35);
                ctx.fillRect(x, y, resolution, resolution);
            }
        }

        const spacing = 40;
        for (let x = spacing; x < w; x += spacing) {
            for (let y = spacing; y < h; y += spacing) {
                const px = x / w, py = y / h;
                let gx = 0, gy = 0;
                for (const n of neurons) {
                    const dx = n.x - px, dy = n.y - py, dist = Math.sqrt(dx * dx + dy * dy);
                    const yat = computeYat(px - 0.5, py - 0.5, n.x - 0.5, n.y - 0.5);
                    if (dist > 0.01) { gx += (dx / dist) * yat * 0.05; gy += (dy / dist) * yat * 0.05; }
                }
                const mag = Math.sqrt(gx * gx + gy * gy);
                if (mag > 0.01) {
                    const len = Math.min(mag * 100, 10), angle = Math.atan2(gy, gx);
                    ctx.strokeStyle = hexToRgba(COLORS.light, 0.25);
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
                    ctx.stroke();
                }
            }
        }

        for (let i = 0; i < neurons.length; i++) {
            const n = neurons[i], nx = n.x * w, ny = n.y * h;
            const pulse = 1 + Math.sin(time * 2 + i * 0.8) * 0.1;

            const glow = ctx.createRadialGradient(nx, ny, 0, nx, ny, 45 * pulse);
            glow.addColorStop(0, hexToRgba(n.color, 0.5));
            glow.addColorStop(0.5, hexToRgba(n.color, 0.15));
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(nx, ny, 45 * pulse, 0, Math.PI * 2);
            ctx.fill();

            const core = ctx.createRadialGradient(nx - 3, ny - 3, 0, nx, ny, 12);
            core.addColorStop(0, '#fff');
            core.addColorStop(0.3, n.color);
            core.addColorStop(1, hexToRgba(n.color, 0.7));
            ctx.fillStyle = core;
            ctx.beginPath();
            ctx.arc(nx, ny, 10 * pulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = 'bold 9px "Courier New", monospace';
            ctx.fillStyle = COLORS.light;
            ctx.textAlign = 'center';
            ctx.fillText(`N${i + 1}`, nx, ny + 22);
        }

        // Info panel
        const panelW = 130, panelH = 44, panelX = w - panelW - 10, panelY = h - panelH - 10;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = 'rgba(27, 153, 139, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        ctx.font = '9px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Yat = (x·w)²/||x-w||²', panelX + 8, panelY + 15);
        ctx.fillText(`${neurons.length} neurons`, panelX + 8, panelY + 32);

        // Title
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(8, 8, 80, 20);
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.fillStyle = '#1b998b';
        ctx.fillText("YAT VORTEX", 14, 22);

        // Buttons
        const isResetHovered = resetBtnRect && isPointInRect(mouseX, mouseY, resetBtnRect);
        resetBtnRect = drawResetButton(ctx, w - 58, 22, isResetHovered, '#1b998b');

        const isHelpHovered = helpBtnRect && isPointInRect(mouseX, mouseY, helpBtnRect);
        helpBtnRect = drawHelpButton(ctx, w - 22, 22, isHelpHovered, '#1b998b');

        if (showHelp) drawHelpTooltip(ctx, w, h, HELP_LINES, '#1b998b');

        time += 0.016;
        animationFrame = requestAnimationFrame(draw);
    }

    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    }

    function handleClick(e) {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left, clickY = e.clientY - rect.top;
        if (helpBtnRect && isPointInRect(clickX, clickY, helpBtnRect)) { showHelp = !showHelp; return; }
        if (showHelp) { showHelp = false; return; }
        if (resetBtnRect && isPointInRect(clickX, clickY, resetBtnRect)) { reset(); return; }

        const x = clickX / rect.width, y = clickY / rect.height;
        for (let i = 0; i < neurons.length; i++) {
            const dx = neurons[i].x - x, dy = neurons[i].y - y;
            if (Math.sqrt(dx * dx + dy * dy) < 0.04 && neurons.length > 2) { neurons.splice(i, 1); return; }
        }
        if (neurons.length < 6) neurons.push({ x, y, color: neuronColors[neurons.length % 6] });
    }

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    resize();
    draw();
    window.addEventListener('resize', resize);
}
