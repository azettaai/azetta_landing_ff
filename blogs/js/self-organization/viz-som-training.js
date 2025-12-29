import { COLORS, hexToRgba, drawHelpButton, drawResetButton, drawHelpTooltip, isPointInRect } from './common.js';

/**
 * Self-Organizing Map Training
 */
export async function initVizSomTraining() {
    const canvas = document.getElementById('viz-som-training');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let isTraining = true;
    let epoch = 0, step = 0;
    let showHelp = false;
    let helpBtnRect = null;
    let resetBtnRect = null;
    let mouseX = 0, mouseY = 0;

    const HELP_LINES = [
        '• Click to pause/resume',
        '• Click ↻ to reset training',
        '',
        'Kohonen\'s SOM:',
        '• Finds best matching unit',
        '• Updates neighborhood',
        '• Grid unfolds to data shape'
    ];

    const gridSize = 10;
    let neurons = [], dataPoints = [], currentDataIdx = 0;
    let learningRate = 0.5, neighborhoodRadius = 4;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function initNeurons() {
        neurons = [];
        const w = canvas.getBoundingClientRect().width, h = canvas.getBoundingClientRect().height;
        const cx = w / 2, cy = h / 2;
        for (let i = 0; i < gridSize; i++) {
            neurons[i] = [];
            for (let j = 0; j < gridSize; j++) {
                neurons[i][j] = { x: cx + (Math.random() - 0.5) * 40, y: cy + (Math.random() - 0.5) * 40, gridI: i, gridJ: j };
            }
        }
    }

    function initData() {
        dataPoints = [];
        const w = canvas.getBoundingClientRect().width, h = canvas.getBoundingClientRect().height;
        const cx = w / 2, cy = h / 2;
        for (let i = 0; i < 200; i++) {
            const angle = Math.random() * Math.PI * 2, radius = 80 + Math.random() * 80;
            dataPoints.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
        }
        for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2, radius = Math.random() * 60;
            dataPoints.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
        }
        dataPoints.sort(() => Math.random() - 0.5);
    }

    function reset() {
        epoch = 0; step = 0; currentDataIdx = 0;
        learningRate = 0.5; neighborhoodRadius = 4;
        initNeurons(); initData(); isTraining = true;
    }

    function findBMU(dataPoint) {
        let bmu = null, minDist = Infinity;
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const n = neurons[i][j];
                const dist = Math.sqrt((n.x - dataPoint.x) ** 2 + (n.y - dataPoint.y) ** 2);
                if (dist < minDist) { minDist = dist; bmu = n; }
            }
        }
        return bmu;
    }

    function trainStep() {
        if (!isTraining) return;
        const dataPoint = dataPoints[currentDataIdx];
        const bmu = findBMU(dataPoint);
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const n = neurons[i][j];
                const gridDist = Math.sqrt((n.gridI - bmu.gridI) ** 2 + (n.gridJ - bmu.gridJ) ** 2);
                if (gridDist <= neighborhoodRadius) {
                    const influence = Math.exp(-(gridDist * gridDist) / (2 * neighborhoodRadius * neighborhoodRadius));
                    const lr = learningRate * influence;
                    n.x += lr * (dataPoint.x - n.x);
                    n.y += lr * (dataPoint.y - n.y);
                }
            }
        }
        currentDataIdx = (currentDataIdx + 1) % dataPoints.length;
        step++;
        if (step % dataPoints.length === 0) {
            epoch++;
            learningRate *= 0.98;
            neighborhoodRadius *= 0.98;
            if (learningRate < 0.01) learningRate = 0.01;
            if (neighborhoodRadius < 0.5) neighborhoodRadius = 0.5;
        }
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width, h = canvas.getBoundingClientRect().height;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(0, 0, w, h);

        if (isTraining) for (let i = 0; i < 5; i++) trainStep();

        for (const p of dataPoints) {
            ctx.fillStyle = hexToRgba(COLORS.dim, 0.25);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = hexToRgba(COLORS.neuron, 0.5);
        ctx.lineWidth = 1.5;
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const n = neurons[i][j];
                if (j < gridSize - 1) { ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(neurons[i][j + 1].x, neurons[i][j + 1].y); ctx.stroke(); }
                if (i < gridSize - 1) { ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(neurons[i + 1][j].x, neurons[i + 1][j].y); ctx.stroke(); }
            }
        }

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const n = neurons[i][j];
                const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 10);
                glow.addColorStop(0, hexToRgba(COLORS.neuron, 0.4));
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(n.x, n.y, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = COLORS.neuron;
                ctx.beginPath();
                ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (isTraining) {
            const p = dataPoints[currentDataIdx];
            ctx.strokeStyle = COLORS.accent;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Info panel
        const panelW = 130, panelH = 44, panelX = w - panelW - 10, panelY = h - panelH - 10;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#aaa';
        ctx.fillText(`Epoch ${epoch} | σ=${neighborhoodRadius.toFixed(1)}`, panelX + 8, panelY + 16);
        ctx.fillStyle = isTraining ? '#2dd4bf' : '#ed217c';
        ctx.fillText(isTraining ? '▶ Training' : '⏸ Paused', panelX + 8, panelY + 32);

        // Title
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(8, 8, 45, 20);
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.fillStyle = '#2dd4bf';
        ctx.fillText("SOM", 14, 22);

        // Buttons
        const isResetHovered = resetBtnRect && isPointInRect(mouseX, mouseY, resetBtnRect);
        resetBtnRect = drawResetButton(ctx, w - 58, 22, isResetHovered, '#2dd4bf');

        const isHelpHovered = helpBtnRect && isPointInRect(mouseX, mouseY, helpBtnRect);
        helpBtnRect = drawHelpButton(ctx, w - 22, 22, isHelpHovered, '#2dd4bf');

        if (showHelp) drawHelpTooltip(ctx, w, h, HELP_LINES, '#2dd4bf');

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
        isTraining = !isTraining;
    }

    function handleDblClick() {
        if (!showHelp) reset();
    }

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('dblclick', handleDblClick);
    resize();
    initNeurons();
    initData();
    draw();
    window.addEventListener('resize', () => { resize(); reset(); });
}
