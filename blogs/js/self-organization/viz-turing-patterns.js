import { COLORS, hexToRgba, drawHelpButton, drawResetButton, drawHelpTooltip, isPointInRect } from './common.js';

/**
 * Turing Patterns - Gray-Scott Reaction-Diffusion
 */
export async function initVizTuringPatterns() {
    const canvas = document.getElementById('viz-turing-patterns');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let isRunning = true;
    let showHelp = false;
    let helpBtnRect = null;
    let resetBtnRect = null;
    let mouseX = 0, mouseY = 0;

    const HELP_LINES = [
        '• Click to seed a new pattern',
        '• Click ↻ to reset simulation',
        '• Double-click to pause/resume',
        '',
        'Gray-Scott model creates:',
        '• Spots, stripes, waves',
        '• Found in nature (zebrafish)'
    ];

    const params = { feed: 0.037, kill: 0.06, dA: 1.0, dB: 0.5 };
    const gridWidth = 100, gridHeight = 70;
    let gridA, gridB, nextA, nextB;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function initGrid() {
        gridA = []; gridB = []; nextA = []; nextB = [];
        for (let y = 0; y < gridHeight; y++) {
            gridA[y] = []; gridB[y] = []; nextA[y] = []; nextB[y] = [];
            for (let x = 0; x < gridWidth; x++) {
                gridA[y][x] = 1; gridB[y][x] = 0;
                nextA[y][x] = 1; nextB[y][x] = 0;
            }
        }
        for (let i = 0; i < 5; i++) {
            const cx = Math.floor(Math.random() * (gridWidth - 20) + 10);
            const cy = Math.floor(Math.random() * (gridHeight - 20) + 10);
            const r = 3 + Math.floor(Math.random() * 4);
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    if (dx * dx + dy * dy <= r * r) {
                        const nx = cx + dx, ny = cy + dy;
                        if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) gridB[ny][nx] = 1;
                    }
                }
            }
        }
    }

    function laplacian(grid, x, y) {
        const weights = [[0.05, 0.2, 0.05], [0.2, -1, 0.2], [0.05, 0.2, 0.05]];
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                sum += grid[(y + dy + gridHeight) % gridHeight][(x + dx + gridWidth) % gridWidth] * weights[dy + 1][dx + 1];
            }
        }
        return sum;
    }

    function step() {
        const { feed, kill, dA, dB } = params;
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const a = gridA[y][x], b = gridB[y][x];
                const reaction = a * b * b;
                nextA[y][x] = Math.max(0, Math.min(1, a + (dA * laplacian(gridA, x, y) - reaction + feed * (1 - a))));
                nextB[y][x] = Math.max(0, Math.min(1, b + (dB * laplacian(gridB, x, y) + reaction - (kill + feed) * b)));
            }
        }
        [gridA, nextA] = [nextA, gridA];
        [gridB, nextB] = [nextB, gridB];
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        if (isRunning) for (let i = 0; i < 8; i++) step();

        const cellW = w / gridWidth, cellH = h / gridHeight;
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const b = gridB[y][x];
                if (b > 0.1) {
                    const i = Math.min(1, b * 1.5);
                    ctx.fillStyle = `rgb(${Math.floor(155 * i)}, ${Math.floor(93 + 87 * i)}, ${Math.floor(229 * i)})`;
                    ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
                }
            }
        }

        // Info panel
        const panelW = 130, panelH = 44, panelX = w - panelW - 10, panelY = h - panelH - 10;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = 'rgba(155, 93, 229, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Reaction-Diffusion', panelX + 8, panelY + 16);
        ctx.fillStyle = isRunning ? '#2dd4bf' : '#ed217c';
        ctx.fillText(isRunning ? '▶ Running' : '⏸ Paused', panelX + 8, panelY + 32);

        // Title
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(8, 8, 110, 20);
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.fillStyle = '#9b5de5';
        ctx.fillText("TURING PATTERNS", 14, 22);

        // Buttons
        const isResetHovered = resetBtnRect && isPointInRect(mouseX, mouseY, resetBtnRect);
        resetBtnRect = drawResetButton(ctx, w - 58, 22, isResetHovered, '#9b5de5');

        const isHelpHovered = helpBtnRect && isPointInRect(mouseX, mouseY, helpBtnRect);
        helpBtnRect = drawHelpButton(ctx, w - 22, 22, isHelpHovered, '#9b5de5');

        if (showHelp) drawHelpTooltip(ctx, w, h, HELP_LINES, '#9b5de5');

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
        if (resetBtnRect && isPointInRect(clickX, clickY, resetBtnRect)) { initGrid(); return; }

        const x = Math.floor(clickX / rect.width * gridWidth);
        const y = Math.floor(clickY / rect.height * gridHeight);
        const r = 4;
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy <= r * r) {
                    gridB[(y + dy + gridHeight) % gridHeight][(x + dx + gridWidth) % gridWidth] = 1;
                }
            }
        }
    }

    function handleDblClick() {
        if (!showHelp) isRunning = !isRunning;
    }

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('dblclick', handleDblClick);
    resize();
    initGrid();
    draw();
    window.addEventListener('resize', resize);
}
