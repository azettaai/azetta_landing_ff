import { COLORS, hexToRgba, lerp, euclideanDist } from './common.js';

export function initVizSomTraining() {
    const canvas = document.getElementById('viz-som-training');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let isTraining = true;
    let epoch = 0;
    let step = 0;

    // SOM grid parameters
    const gridSize = 10;
    let neurons = [];

    // Training data (2D points in a shape)
    let dataPoints = [];
    let currentDataIdx = 0;

    // Training parameters
    let learningRate = 0.5;
    let neighborhoodRadius = 4;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function initNeurons() {
        neurons = [];
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        const cx = w / 2;
        const cy = h / 2;

        // Initialize neurons in a small random cluster at center
        for (let i = 0; i < gridSize; i++) {
            neurons[i] = [];
            for (let j = 0; j < gridSize; j++) {
                neurons[i][j] = {
                    x: cx + (Math.random() - 0.5) * 40,
                    y: cy + (Math.random() - 0.5) * 40,
                    gridI: i,
                    gridJ: j
                };
            }
        }
    }

    function initData() {
        dataPoints = [];
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        const cx = w / 2;
        const cy = h / 2;

        // Generate data in a circular/ring pattern
        for (let i = 0; i < 200; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 80 + Math.random() * 80;
            dataPoints.push({
                x: cx + Math.cos(angle) * radius,
                y: cy + Math.sin(angle) * radius
            });
        }

        // Add some inner points too
        for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 60;
            dataPoints.push({
                x: cx + Math.cos(angle) * radius,
                y: cy + Math.sin(angle) * radius
            });
        }

        // Shuffle
        dataPoints.sort(() => Math.random() - 0.5);
    }

    function findBMU(dataPoint) {
        let bmu = null;
        let minDist = Infinity;

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const n = neurons[i][j];
                const dist = Math.sqrt((n.x - dataPoint.x) ** 2 + (n.y - dataPoint.y) ** 2);
                if (dist < minDist) {
                    minDist = dist;
                    bmu = n;
                }
            }
        }

        return bmu;
    }

    function trainStep() {
        if (!isTraining) return;

        const dataPoint = dataPoints[currentDataIdx];
        const bmu = findBMU(dataPoint);

        // Update all neurons based on distance to BMU in grid space
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const n = neurons[i][j];
                const gridDist = Math.sqrt((n.gridI - bmu.gridI) ** 2 + (n.gridJ - bmu.gridJ) ** 2);

                if (gridDist <= neighborhoodRadius) {
                    // Gaussian neighborhood function
                    const influence = Math.exp(-(gridDist * gridDist) / (2 * neighborhoodRadius * neighborhoodRadius));
                    const lr = learningRate * influence;

                    n.x += lr * (dataPoint.x - n.x);
                    n.y += lr * (dataPoint.y - n.y);
                }
            }
        }

        currentDataIdx = (currentDataIdx + 1) % dataPoints.length;
        step++;

        // Decay parameters
        if (step % dataPoints.length === 0) {
            epoch++;
            learningRate *= 0.98;
            neighborhoodRadius *= 0.98;

            if (learningRate < 0.01) learningRate = 0.01;
            if (neighborhoodRadius < 0.5) neighborhoodRadius = 0.5;
        }
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, w, h);

        // Train multiple steps per frame
        if (isTraining) {
            for (let i = 0; i < 5; i++) {
                trainStep();
            }
        }

        // Draw data points (faint)
        for (const p of dataPoints) {
            ctx.fillStyle = hexToRgba(COLORS.dim, 0.3);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw SOM grid connections
        ctx.strokeStyle = hexToRgba(COLORS.neuron, 0.6);
        ctx.lineWidth = 1.5;

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const n = neurons[i][j];

                // Connect to right neighbor
                if (j < gridSize - 1) {
                    const right = neurons[i][j + 1];
                    ctx.beginPath();
                    ctx.moveTo(n.x, n.y);
                    ctx.lineTo(right.x, right.y);
                    ctx.stroke();
                }

                // Connect to bottom neighbor
                if (i < gridSize - 1) {
                    const bottom = neurons[i + 1][j];
                    ctx.beginPath();
                    ctx.moveTo(n.x, n.y);
                    ctx.lineTo(bottom.x, bottom.y);
                    ctx.stroke();
                }
            }
        }

        // Draw neurons
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const n = neurons[i][j];

                // Glow
                const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 12);
                glow.addColorStop(0, hexToRgba(COLORS.neuron, 0.4));
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(n.x, n.y, 12, 0, Math.PI * 2);
                ctx.fill();

                // Core
                ctx.fillStyle = COLORS.neuron;
                ctx.beginPath();
                ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Highlight current data point
        if (isTraining) {
            const p = dataPoints[currentDataIdx];
            ctx.strokeStyle = COLORS.accent;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Info panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(10, 10, 220, 75);
        ctx.strokeStyle = COLORS.neuron;
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, 220, 75);

        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.fillStyle = COLORS.light;
        ctx.textAlign = 'left';
        ctx.fillText('SELF-ORGANIZING MAP', 20, 28);
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText(`Epoch: ${epoch} | LR: ${learningRate.toFixed(3)}`, 20, 43);
        ctx.fillText(`Neighborhood: ${neighborhoodRadius.toFixed(2)}`, 20, 58);
        ctx.fillStyle = isTraining ? '#2dd4bf' : '#ed217c';
        ctx.fillText(isTraining ? 'Click to pause' : 'Click to resume', 20, 73);

        animationFrame = requestAnimationFrame(draw);
    }

    function handleClick() {
        isTraining = !isTraining;
    }

    function handleDblClick() {
        // Reset
        epoch = 0;
        step = 0;
        learningRate = 0.5;
        neighborhoodRadius = 4;
        initNeurons();
        initData();
        isTraining = true;
    }

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('dblclick', handleDblClick);

    resize();
    initNeurons();
    initData();
    draw();
    window.addEventListener('resize', () => {
        resize();
        initNeurons();
        initData();
        epoch = 0;
        step = 0;
        learningRate = 0.5;
        neighborhoodRadius = 4;
    });
}
