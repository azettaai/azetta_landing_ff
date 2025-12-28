import { COLORS, hexToRgba, dot, magnitude, softmax } from './common.js';

export function initVizYatVortex() {
    const canvas = document.getElementById('viz-yat-vortex');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;

    // Neurons (class prototypes)
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

    function computeYat(px, py, nx, ny) {
        // Treat positions as 2D vectors from origin
        const dotProd = px * nx + py * ny;
        const distSq = (px - nx) ** 2 + (py - ny) ** 2;
        if (distSq < 0.0001) return 1000;
        return (dotProd * dotProd) / distSq;
    }

    function getWinningNeuron(px, py, w, h) {
        const yatScores = [];

        for (const n of neurons) {
            const nx = n.x - 0.5;
            const ny = n.y - 0.5;
            const score = computeYat(px - 0.5, py - 0.5, nx, ny);
            yatScores.push(score);
        }

        const probs = softmax(yatScores, 0.5);
        let maxIdx = 0;
        let maxProb = probs[0];

        for (let i = 1; i < probs.length; i++) {
            if (probs[i] > maxProb) {
                maxProb = probs[i];
                maxIdx = i;
            }
        }

        return { idx: maxIdx, probs, yatScores };
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        ctx.clearRect(0, 0, w, h);

        // Draw decision boundary field
        const resolution = 6;
        for (let x = 0; x < w; x += resolution) {
            for (let y = 0; y < h; y += resolution) {
                const px = x / w;
                const py = y / h;

                const { idx, probs } = getWinningNeuron(px, py, w, h);
                const neuron = neurons[idx];
                const confidence = probs[idx];

                ctx.fillStyle = hexToRgba(neuron.color, confidence * 0.4);
                ctx.fillRect(x, y, resolution, resolution);
            }
        }

        // Draw flow field (gradient arrows)
        const arrowSpacing = 35;
        for (let x = arrowSpacing; x < w; x += arrowSpacing) {
            for (let y = arrowSpacing; y < h; y += arrowSpacing) {
                const px = x / w;
                const py = y / h;

                // Compute gradient direction (toward highest YAT)
                let gx = 0, gy = 0;
                for (const n of neurons) {
                    const dx = n.x - px;
                    const dy = n.y - py;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const yat = computeYat(px - 0.5, py - 0.5, n.x - 0.5, n.y - 0.5);

                    if (dist > 0.01) {
                        gx += (dx / dist) * yat * 0.05;
                        gy += (dy / dist) * yat * 0.05;
                    }
                }

                const mag = Math.sqrt(gx * gx + gy * gy);
                if (mag > 0.01) {
                    const len = Math.min(mag * 100, 12);
                    const angle = Math.atan2(gy, gx);

                    ctx.strokeStyle = hexToRgba(COLORS.light, 0.3);
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
                    ctx.stroke();

                    // Arrow head
                    const headLen = 3;
                    ctx.beginPath();
                    ctx.moveTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
                    ctx.lineTo(
                        x + Math.cos(angle) * len - Math.cos(angle - 0.5) * headLen,
                        y + Math.sin(angle) * len - Math.sin(angle - 0.5) * headLen
                    );
                    ctx.stroke();
                }
            }
        }

        // Draw neurons with pulsing animation
        for (let i = 0; i < neurons.length; i++) {
            const n = neurons[i];
            const nx = n.x * w;
            const ny = n.y * h;
            const pulse = 1 + Math.sin(time * 2 + i * 0.8) * 0.1;

            // Outer glow
            const glow = ctx.createRadialGradient(nx, ny, 0, nx, ny, 50 * pulse);
            glow.addColorStop(0, hexToRgba(n.color, 0.5));
            glow.addColorStop(0.5, hexToRgba(n.color, 0.15));
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(nx, ny, 50 * pulse, 0, Math.PI * 2);
            ctx.fill();

            // Core
            const core = ctx.createRadialGradient(nx - 4, ny - 4, 0, nx, ny, 15);
            core.addColorStop(0, '#fff');
            core.addColorStop(0.3, n.color);
            core.addColorStop(1, hexToRgba(n.color, 0.7));
            ctx.fillStyle = core;
            ctx.beginPath();
            ctx.arc(nx, ny, 12 * pulse, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.font = 'bold 10px "Courier New", monospace';
            ctx.fillStyle = COLORS.light;
            ctx.textAlign = 'center';
            ctx.fillText(`N${i + 1}`, nx, ny + 28);
        }

        // Info panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(10, 10, 230, 65);
        ctx.strokeStyle = COLORS.primary;
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, 230, 65);

        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.fillStyle = COLORS.light;
        ctx.textAlign = 'left';
        ctx.fillText('YAT CLASSIFIER VORTEX', 20, 28);
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText(`Neurons: ${neurons.length} | Yat(x,w)²/||x-w||²`, 20, 43);
        ctx.fillStyle = COLORS.primary;
        ctx.fillText('Click to add neurons', 20, 58);

        time += 0.016;
        animationFrame = requestAnimationFrame(draw);
    }

    function handleClick(e) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        // Check if clicking on existing neuron (to remove)
        for (let i = 0; i < neurons.length; i++) {
            const dx = neurons[i].x - x;
            const dy = neurons[i].y - y;
            if (Math.sqrt(dx * dx + dy * dy) < 0.04) {
                if (neurons.length > 2) {
                    neurons.splice(i, 1);
                }
                return;
            }
        }

        // Add new neuron
        if (neurons.length < 6) {
            neurons.push({
                x, y,
                color: neuronColors[neurons.length % neuronColors.length]
            });
        }
    }

    canvas.addEventListener('click', handleClick);

    resize();
    draw();
    window.addEventListener('resize', resize);
}
