import { COLORS, hexToRgba, drawHelpButton, drawResetButton, drawHelpTooltip, isPointInRect } from './common.js';

export async function initVizTrainingDynamics() {
    const canvas = document.getElementById('viz-training-dynamics');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;
    let isTraining = true;
    let w, h;
    let showHelp = false;
    let helpBtnRect = null;
    let resetBtnRect = null;
    let mouseX = 0, mouseY = 0;

    const HELP_LINES = [
        '• Click to pause/resume training',
        '• Double-click to reset',
        '',
        'Neural network training:',
        '• Neurons move toward attractors',
        '• Repulsion keeps them apart',
        '• θ* marks optimal positions'
    ];

    // Neurons with their weight trajectories
    let neurons = [];
    const numNeurons = 5;

    // Fixed attractors (optimal positions for each class)
    const attractors = [
        { x: 0.15, y: 0.2 },
        { x: 0.85, y: 0.2 },
        { x: 0.5, y: 0.85 },
        { x: 0.15, y: 0.75 },
        { x: 0.85, y: 0.75 }
    ];

    const neuronColors = ['#ed217c', '#4ea8de', '#2dd4bf', '#f4a261', '#9b5de5'];

    function resize() {
        const rect = canvas.getBoundingClientRect();
        w = rect.width;
        h = rect.height;
        canvas.width = w * window.devicePixelRatio;
        canvas.height = h * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function initNeurons() {
        neurons = [];
        for (let i = 0; i < numNeurons; i++) {
            neurons.push({
                x: 0.45 + Math.random() * 0.1,
                y: 0.45 + Math.random() * 0.1,
                vx: 0,
                vy: 0,
                trajectory: [],
                targetIdx: i,
                color: neuronColors[i]
            });
        }
    }

    function computeForce(neuron) {
        const target = attractors[neuron.targetIdx];

        // Gradient descent toward target (simulating loss minimization)
        let fx = (target.x - neuron.x) * 0.015;
        let fy = (target.y - neuron.y) * 0.015;

        // Add repulsion from other neurons (like orthogonality pressure)
        for (const other of neurons) {
            if (other === neuron) continue;
            const dx = neuron.x - other.x;
            const dy = neuron.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 0.3 && dist > 0.001) {
                const repulsion = 0.003 / (dist * dist);
                fx += (dx / dist) * repulsion;
                fy += (dy / dist) * repulsion;
            }
        }

        // Add some noise (stochastic gradient)
        fx += (Math.random() - 0.5) * 0.004;
        fy += (Math.random() - 0.5) * 0.004;

        return { fx, fy };
    }

    function step() {
        if (!isTraining) return;

        for (const n of neurons) {
            const { fx, fy } = computeForce(n);

            // Momentum update
            n.vx = n.vx * 0.92 + fx;
            n.vy = n.vy * 0.92 + fy;

            n.x += n.vx;
            n.y += n.vy;

            // Clamp to bounds
            n.x = Math.max(0.05, Math.min(0.95, n.x));
            n.y = Math.max(0.05, Math.min(0.95, n.y));

            // Store trajectory
            n.trajectory.push({ x: n.x, y: n.y });
            if (n.trajectory.length > 200) n.trajectory.shift();
        }
    }

    function draw() {
        // Clear with fade effect for trails
        ctx.fillStyle = 'rgba(13, 13, 21, 0.15)';
        ctx.fillRect(0, 0, w, h);

        // Step simulation
        step();

        // Draw phase space grid
        ctx.strokeStyle = hexToRgba(COLORS.primary, 0.08);
        ctx.lineWidth = 1;
        const gridSize = 35;
        for (let x = gridSize; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = gridSize; y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Draw attractors (fixed points) with basins
        for (let i = 0; i < attractors.length; i++) {
            const a = attractors[i];
            const ax = a.x * w;
            const ay = a.y * h;

            // Basin glow
            const basinGlow = ctx.createRadialGradient(ax, ay, 0, ax, ay, 60);
            basinGlow.addColorStop(0, hexToRgba(neuronColors[i], 0.15));
            basinGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = basinGlow;
            ctx.beginPath();
            ctx.arc(ax, ay, 60, 0, Math.PI * 2);
            ctx.fill();

            // Attractor basin circle (dashed)
            ctx.strokeStyle = hexToRgba(neuronColors[i], 0.3);
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(ax, ay, 45, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Attractor point with glow
            const pointGlow = ctx.createRadialGradient(ax, ay, 0, ax, ay, 15);
            pointGlow.addColorStop(0, hexToRgba(neuronColors[i], 0.6));
            pointGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = pointGlow;
            ctx.beginPath();
            ctx.arc(ax, ay, 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = hexToRgba(neuronColors[i], 0.7);
            ctx.beginPath();
            ctx.arc(ax, ay, 6, 0, Math.PI * 2);
            ctx.fill();

            // Cross marker
            ctx.strokeStyle = hexToRgba(neuronColors[i], 0.5);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(ax - 8, ay);
            ctx.lineTo(ax + 8, ay);
            ctx.moveTo(ax, ay - 8);
            ctx.lineTo(ax, ay + 8);
            ctx.stroke();

            // Label
            ctx.font = 'bold 10px "Courier New", monospace';
            ctx.fillStyle = hexToRgba(neuronColors[i], 0.8);
            ctx.textAlign = 'center';
            ctx.fillText(`θ*${i + 1}`, ax, ay - 18);
        }

        // Draw trajectories with gradient
        for (const n of neurons) {
            const traj = n.trajectory;
            if (traj.length < 2) continue;

            // Draw trajectory as series of segments with varying alpha
            for (let i = 1; i < traj.length; i++) {
                const t = i / traj.length;
                const alpha = t * 0.7;

                ctx.strokeStyle = hexToRgba(n.color, alpha);
                ctx.lineWidth = 1 + t * 2;
                ctx.beginPath();
                ctx.moveTo(traj[i - 1].x * w, traj[i - 1].y * h);
                ctx.lineTo(traj[i].x * w, traj[i].y * h);
                ctx.stroke();
            }
        }

        // Draw neurons (current positions)
        for (const n of neurons) {
            const nx = n.x * w;
            const ny = n.y * h;

            // Outer glow
            const glow = ctx.createRadialGradient(nx, ny, 0, nx, ny, 25);
            glow.addColorStop(0, hexToRgba(n.color, 0.7));
            glow.addColorStop(0.5, hexToRgba(n.color, 0.2));
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(nx, ny, 25, 0, Math.PI * 2);
            ctx.fill();

            // Core with 3D effect
            const coreGrad = ctx.createRadialGradient(nx - 3, ny - 3, 0, nx, ny, 10);
            coreGrad.addColorStop(0, '#ffffff');
            coreGrad.addColorStop(0.3, n.color);
            coreGrad.addColorStop(1, hexToRgba(n.color, 0.8));
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(nx, ny, 9, 0, Math.PI * 2);
            ctx.fill();

            // Velocity vector arrow
            const vMag = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
            if (vMag > 0.0005) {
                const vAngle = Math.atan2(n.vy, n.vx);
                const vLen = Math.min(vMag * 800, 35);

                ctx.strokeStyle = hexToRgba(n.color, 0.9);
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(nx, ny);
                ctx.lineTo(nx + Math.cos(vAngle) * vLen, ny + Math.sin(vAngle) * vLen);
                ctx.stroke();

                // Arrow head
                const headLen = 6;
                const headAngle = 0.4;
                ctx.beginPath();
                ctx.moveTo(
                    nx + Math.cos(vAngle) * vLen,
                    ny + Math.sin(vAngle) * vLen
                );
                ctx.lineTo(
                    nx + Math.cos(vAngle) * vLen - Math.cos(vAngle - headAngle) * headLen,
                    ny + Math.sin(vAngle) * vLen - Math.sin(vAngle - headAngle) * headLen
                );
                ctx.moveTo(
                    nx + Math.cos(vAngle) * vLen,
                    ny + Math.sin(vAngle) * vLen
                );
                ctx.lineTo(
                    nx + Math.cos(vAngle) * vLen - Math.cos(vAngle + headAngle) * headLen,
                    ny + Math.sin(vAngle) * vLen - Math.sin(vAngle + headAngle) * headLen
                );
                ctx.stroke();
            }
        }

        // Compact info - bottom right
        const panelW = 145;
        const panelH = 44;
        const panelX = w - panelW - 10;
        const panelY = h - panelH - 10;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = 'rgba(155, 93, 229, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#aaa';
        ctx.fillText('θ* = class attractors', panelX + 8, panelY + 16);
        ctx.fillStyle = isTraining ? '#2dd4bf' : '#ed217c';
        ctx.fillText(isTraining ? '▶ Click to pause' : '⏸ Click to run', panelX + 8, panelY + 32);

        // Title - top left
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(8, 8, 140, 20);
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.fillStyle = '#9b5de5';
        ctx.fillText("TRAINING DYNAMICS", 14, 22);

        // Help button
        const isResetHovered = resetBtnRect && isPointInRect(mouseX, mouseY, resetBtnRect);
        resetBtnRect = drawResetButton(ctx, w - 58, 22, isResetHovered, '#9b5de5');

        const isHelpHovered = helpBtnRect && isPointInRect(mouseX, mouseY, helpBtnRect);
        helpBtnRect = drawHelpButton(ctx, w - 22, 22, isHelpHovered, '#9b5de5');

        if (showHelp) drawHelpTooltip(ctx, w, h, HELP_LINES, '#9b5de5');

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
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Check help button
        if (helpBtnRect && isPointInRect(clickX, clickY, helpBtnRect)) {
            showHelp = !showHelp;
            return;
        }
        if (showHelp) { showHelp = false; return; }
        if (resetBtnRect && isPointInRect(clickX, clickY, resetBtnRect)) {
            initNeurons();
            isTraining = true;
            ctx.fillStyle = '#0d0d15';
            ctx.fillRect(0, 0, w, h);
            return;
        }

        // Toggle training
        isTraining = !isTraining;
    }

    function handleDblClick(e) {
        e.preventDefault();
        initNeurons();
        isTraining = true;
        // Clear the canvas for fresh start
        ctx.fillStyle = '#0d0d15';
        ctx.fillRect(0, 0, w, h);
    }

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('dblclick', handleDblClick);

    resize();
    initNeurons();

    // Initial clear
    ctx.fillStyle = '#0d0d15';
    ctx.fillRect(0, 0, w, h);

    draw();

    window.addEventListener('resize', () => {
        resize();
        initNeurons();
        ctx.fillStyle = '#0d0d15';
        ctx.fillRect(0, 0, w, h);
    });
}
