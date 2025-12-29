import { COLORS, hexToRgba, drawHelpButton, drawResetButton, drawHelpTooltip, isPointInRect } from './common.js';

/**
 * Conway's Game of Life
 */
export async function initVizGameOfLife() {
    const canvas = document.getElementById('viz-game-of-life');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w, h;
    let cellSize = 6;
    let cols, rows;
    let grid, nextGrid;
    let paused = false;
    let generation = 0;
    let frameCount = 0;
    let showHelp = false;
    let helpBtnRect = null;
    let resetBtnRect = null;
    let mouseX = 0, mouseY = 0;

    const HELP_LINES = [
        '• Click to pause/resume',
        '• Shift+Click to toggle a cell',
        '• Click ↻ to reset grid',
        '',
        'Conway\'s Rules:',
        '• 2-3 neighbors → survive',
        '• 3 neighbors → birth'
    ];

    function resize() {
        const rect = canvas.getBoundingClientRect();
        w = rect.width;
        h = rect.height;
        canvas.width = w * window.devicePixelRatio;
        canvas.height = h * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        cols = Math.floor(w / cellSize);
        rows = Math.floor(h / cellSize);
        initGrid();
    }

    function initGrid() {
        grid = []; nextGrid = [];
        for (let y = 0; y < rows; y++) {
            grid[y] = []; nextGrid[y] = [];
            for (let x = 0; x < cols; x++) {
                grid[y][x] = Math.random() < 0.2 ? 1 : 0;
                nextGrid[y][x] = 0;
            }
        }
        generation = 0;
    }

    function countNeighbors(x, y) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                count += grid[(y + dy + rows) % rows][(x + dx + cols) % cols];
            }
        }
        return count;
    }

    function step() {
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const n = countNeighbors(x, y);
                nextGrid[y][x] = grid[y][x] ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
            }
        }
        [grid, nextGrid] = [nextGrid, grid];
        generation++;
    }

    function draw() {
        ctx.fillStyle = '#0a0a10';
        ctx.fillRect(0, 0, w, h);

        frameCount++;
        if (!paused && frameCount % 5 === 0) step();

        let aliveCount = 0;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (grid[y][x]) {
                    aliveCount++;
                    const n = countNeighbors(x, y);
                    ctx.fillStyle = `hsl(${165 + n * 8}, 65%, 50%)`;
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
                }
            }
        }

        // Grid lines
        ctx.strokeStyle = 'rgba(27, 153, 139, 0.03)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= cols; x += 5) {
            ctx.beginPath(); ctx.moveTo(x * cellSize, 0); ctx.lineTo(x * cellSize, h); ctx.stroke();
        }
        for (let y = 0; y <= rows; y += 5) {
            ctx.beginPath(); ctx.moveTo(0, y * cellSize); ctx.lineTo(w, y * cellSize); ctx.stroke();
        }

        // Info panel
        const density = Math.round(aliveCount / (cols * rows) * 100);
        const panelW = 130, panelH = 44, panelX = w - panelW - 10, panelY = h - panelH - 10;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = 'rgba(27, 153, 139, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#aaa';
        ctx.fillText(`Gen ${generation} | ${density}%`, panelX + 8, panelY + 16);
        ctx.fillStyle = paused ? '#ed217c' : '#2dd4bf';
        ctx.fillText(paused ? '⏸ Paused' : '▶ Running', panelX + 8, panelY + 32);

        // Title
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(8, 8, 100, 20);
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.fillStyle = '#1b998b';
        ctx.fillText("GAME OF LIFE", 14, 22);

        // Buttons - top right (spaced)
        const isResetHovered = resetBtnRect && isPointInRect(mouseX, mouseY, resetBtnRect);
        resetBtnRect = drawResetButton(ctx, w - 58, 22, isResetHovered, '#1b998b');

        const isHelpHovered = helpBtnRect && isPointInRect(mouseX, mouseY, helpBtnRect);
        helpBtnRect = drawHelpButton(ctx, w - 22, 22, isHelpHovered, '#1b998b');

        if (showHelp) drawHelpTooltip(ctx, w, h, HELP_LINES, '#1b998b');

        requestAnimationFrame(draw);
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
        if (resetBtnRect && isPointInRect(clickX, clickY, resetBtnRect)) { initGrid(); paused = false; return; }

        const x = Math.floor(clickX / cellSize), y = Math.floor(clickY / cellSize);
        if (x >= 0 && x < cols && y >= 0 && y < rows) {
            if (e.shiftKey) grid[y][x] = grid[y][x] ? 0 : 1;
            else paused = !paused;
        }
    }

    function handleDblClick() {
        if (!showHelp) { initGrid(); paused = false; }
    }

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('dblclick', handleDblClick);
    resize();
    draw();
    window.addEventListener('resize', resize);
}
