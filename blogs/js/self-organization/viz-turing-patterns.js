import { COLORS, hexToRgba } from './common.js';

export function initVizTuringPatterns() {
    const canvas = document.getElementById('viz-turing-patterns');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let isRunning = true;

    // Gray-Scott reaction-diffusion parameters
    const params = {
        feed: 0.037,
        kill: 0.06,
        dA: 1.0,
        dB: 0.5
    };

    // Grid for computation
    let gridWidth = 100;
    let gridHeight = 70;
    let gridA, gridB, nextA, nextB;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function initGrid() {
        gridA = [];
        gridB = [];
        nextA = [];
        nextB = [];

        for (let y = 0; y < gridHeight; y++) {
            gridA[y] = [];
            gridB[y] = [];
            nextA[y] = [];
            nextB[y] = [];
            for (let x = 0; x < gridWidth; x++) {
                gridA[y][x] = 1;
                gridB[y][x] = 0;
                nextA[y][x] = 1;
                nextB[y][x] = 0;
            }
        }

        // Seed some initial B patterns
        for (let i = 0; i < 5; i++) {
            const cx = Math.floor(Math.random() * (gridWidth - 20) + 10);
            const cy = Math.floor(Math.random() * (gridHeight - 20) + 10);
            const r = 3 + Math.floor(Math.random() * 4);

            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    if (dx * dx + dy * dy <= r * r) {
                        const nx = cx + dx;
                        const ny = cy + dy;
                        if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
                            gridB[ny][nx] = 1;
                        }
                    }
                }
            }
        }
    }

    function laplacian(grid, x, y) {
        const val = grid[y][x];
        let sum = 0;

        // 3x3 convolution kernel with weighted neighbors
        const weights = [
            [0.05, 0.2, 0.05],
            [0.2, -1, 0.2],
            [0.05, 0.2, 0.05]
        ];

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = (x + dx + gridWidth) % gridWidth;
                const ny = (y + dy + gridHeight) % gridHeight;
                sum += grid[ny][nx] * weights[dy + 1][dx + 1];
            }
        }

        return sum;
    }

    function step() {
        const { feed, kill, dA, dB } = params;

        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const a = gridA[y][x];
                const b = gridB[y][x];
                const lapA = laplacian(gridA, x, y);
                const lapB = laplacian(gridB, x, y);

                const reaction = a * b * b;

                nextA[y][x] = a + (dA * lapA - reaction + feed * (1 - a));
                nextB[y][x] = b + (dB * lapB + reaction - (kill + feed) * b);

                // Clamp values
                nextA[y][x] = Math.max(0, Math.min(1, nextA[y][x]));
                nextB[y][x] = Math.max(0, Math.min(1, nextB[y][x]));
            }
        }

        // Swap buffers
        [gridA, nextA] = [nextA, gridA];
        [gridB, nextB] = [nextB, gridB];
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        // Run multiple simulation steps per frame
        if (isRunning) {
            for (let i = 0; i < 8; i++) {
                step();
            }
        }

        // Draw the pattern
        const cellW = w / gridWidth;
        const cellH = h / gridHeight;

        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const b = gridB[y][x];

                if (b > 0.1) {
                    // Map B concentration to color
                    const intensity = Math.min(1, b * 1.5);
                    const r = Math.floor(155 * intensity);
                    const g = Math.floor(93 + (180 - 93) * intensity);
                    const bl = Math.floor(229 * intensity);

                    ctx.fillStyle = `rgb(${r}, ${g}, ${bl})`;
                    ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
                }
            }
        }

        // Info panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(10, 10, 230, 70);
        ctx.strokeStyle = COLORS.cell;
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, 230, 70);

        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.fillStyle = COLORS.light;
        ctx.textAlign = 'left';
        ctx.fillText('TURING PATTERNS', 20, 28);
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('Reaction-diffusion self-organization', 20, 43);
        ctx.fillStyle = COLORS.cell;
        ctx.fillText('Click to seed new patterns', 20, 58);
        ctx.fillStyle = isRunning ? '#2dd4bf' : '#ed217c';
        ctx.fillText(isRunning ? '▶ Running' : '⏸ Paused', 20, 73);

        animationFrame = requestAnimationFrame(draw);
    }

    function handleClick(e) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / rect.width * gridWidth);
        const y = Math.floor((e.clientY - rect.top) / rect.height * gridHeight);

        // Seed new pattern at click location
        const r = 4;
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy <= r * r) {
                    const nx = (x + dx + gridWidth) % gridWidth;
                    const ny = (y + dy + gridHeight) % gridHeight;
                    gridB[ny][nx] = 1;
                }
            }
        }
    }

    function handleDblClick() {
        isRunning = !isRunning;
    }

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('dblclick', handleDblClick);

    resize();
    initGrid();
    draw();
    window.addEventListener('resize', () => {
        resize();
    });
}
