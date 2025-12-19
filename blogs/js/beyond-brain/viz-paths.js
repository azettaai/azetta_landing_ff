import { COLORS, drawText } from './common.js';

/**
 * Visualization: Biology vs Physics Paths
 * Shows two paths to AGI: mimicking biology (dead end) vs physics principles (success)
 */
export function initVizPaths() {
    const canvas = document.getElementById('viz-paths');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let time = 0;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // Particles walking each path
    const biologyParticles = [];
    const physicsParticles = [];

    for (let i = 0; i < 6; i++) {
        biologyParticles.push({ progress: i / 6, speed: 0.0015, confused: Math.random() * Math.PI * 2 });
        physicsParticles.push({ progress: i / 6, speed: 0.003, trail: [] });
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        // Deep space background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#0a0812');
        bgGrad.addColorStop(0.5, '#0d0d15');
        bgGrad.addColorStop(1, '#0a1210');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Layout
        const startX = w * 0.06;
        const endX = w * 0.94;
        const topY = h * 0.28;
        const bottomY = h * 0.72;
        const midY = h * 0.5;

        // === STARTING POINT (LEFT) ===
        const startCircleR = 28;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.beginPath();
        ctx.arc(startX + 30, midY, startCircleR + 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(startX + 30, midY, startCircleR, 0, Math.PI * 2);
        ctx.stroke();

        drawText(ctx, 'TODAY', startX + 30, midY + 3, { color: '#777', size: 9 });
        drawText(ctx, 'Current AI', startX + 30, midY + startCircleR + 18, { color: '#444', size: 8 });

        // Fork arrows from start
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        // To top
        ctx.beginPath();
        ctx.moveTo(startX + 55, midY - 10);
        ctx.quadraticCurveTo(startX + 80, midY - 30, startX + 100, topY + 20);
        ctx.stroke();
        // To bottom
        ctx.beginPath();
        ctx.moveTo(startX + 55, midY + 10);
        ctx.quadraticCurveTo(startX + 80, midY + 30, startX + 100, bottomY - 20);
        ctx.stroke();

        // ═══════════════════════════════════════════════════════════════
        // TOP: BIOLOGY PATH - Chaotic, foggy, dead end
        // ═══════════════════════════════════════════════════════════════

        // Dark fog/confusion zone
        const fogGrad = ctx.createRadialGradient(w * 0.55, topY, 20, w * 0.55, topY, w * 0.4);
        fogGrad.addColorStop(0, 'rgba(237, 33, 124, 0.12)');
        fogGrad.addColorStop(0.6, 'rgba(237, 33, 124, 0.05)');
        fogGrad.addColorStop(1, 'rgba(237, 33, 124, 0)');
        ctx.fillStyle = fogGrad;
        ctx.beginPath();
        ctx.ellipse(w * 0.55, topY, w * 0.4, h * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Chaotic branching paths (multiple dead ends)
        const drawChaoticPath = (startPx, startPy, seed) => {
            ctx.strokeStyle = `rgba(237, 33, 124, ${0.4 + seed * 0.2})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(startPx, startPy);

            let px = startPx;
            let py = startPy;
            for (let i = 0; i < 15; i++) {
                const angle = Math.sin(i * 0.5 + seed + time * 0.02) * 0.6;
                px += 18;
                py += Math.sin(i + seed * 10 + time * 0.03) * 8;
                ctx.lineTo(px, py);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            return { x: px, y: py };
        };

        // Multiple branching paths
        const branch1End = drawChaoticPath(startX + 100, topY - 15, 0);
        const branch2End = drawChaoticPath(startX + 100, topY + 15, 1.5);
        const branch3End = drawChaoticPath(startX + 140, topY + 35, 3);

        // Dead end walls for each branch
        const drawDeadEnd = (x, y) => {
            ctx.fillStyle = 'rgba(237, 33, 124, 0.3)';
            ctx.strokeStyle = COLORS.secondary;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x - 5, y - 20, 10, 40, 3);
            ctx.fill();
            ctx.stroke();

            // X mark
            ctx.strokeStyle = 'rgba(237, 33, 124, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 8, y - 8);
            ctx.lineTo(x + 8, y + 8);
            ctx.moveTo(x + 8, y - 8);
            ctx.lineTo(x - 8, y + 8);
            ctx.stroke();
        };

        drawDeadEnd(branch1End.x + 15, branch1End.y);
        drawDeadEnd(branch2End.x + 15, branch2End.y);
        drawDeadEnd(branch3End.x + 15, branch3End.y);

        // Confused particles on top path
        biologyParticles.forEach((p, i) => {
            p.progress += p.speed;
            p.confused += 0.05;
            if (p.progress > 0.85) p.progress = 0;

            const pathIndex = i % 3;
            const seed = pathIndex * 1.5;
            let px = startX + 100 + (w * 0.45) * p.progress;
            let py = topY + (pathIndex - 1) * 20 + Math.sin(p.confused) * 12;

            // Wobble effect
            px += Math.sin(time * 0.05 + i) * 5;
            py += Math.cos(time * 0.04 + i * 2) * 5;

            ctx.fillStyle = `rgba(237, 33, 124, ${0.5 + Math.sin(time * 0.1 + i) * 0.3})`;
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();

            // Question mark above particle
            if (p.progress > 0.6) {
                ctx.fillStyle = 'rgba(237, 33, 124, 0.5)';
                ctx.font = '10px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('?', px, py - 12);
            }
        });

        // Top labels
        drawText(ctx, 'BIOLOGY PATH', startX + 105, topY - h * 0.12, { color: COLORS.secondary, size: 11, align: 'left' });
        drawText(ctx, '"Scale it up, hope for emergence"', startX + 105, topY - h * 0.12 + 15, { color: '#555', size: 8, align: 'left' });

        // Dead end label
        drawText(ctx, 'DEAD ENDS', endX - 80, topY, { color: 'rgba(237, 33, 124, 0.7)', size: 10 });

        // ═══════════════════════════════════════════════════════════════
        // BOTTOM: PHYSICS PATH - Clean, illuminated, reaches goal
        // ═══════════════════════════════════════════════════════════════

        // Light beam effect
        const lightGrad = ctx.createLinearGradient(startX + 100, bottomY, endX - 50, bottomY);
        lightGrad.addColorStop(0, 'rgba(27, 153, 139, 0)');
        lightGrad.addColorStop(0.2, 'rgba(27, 153, 139, 0.08)');
        lightGrad.addColorStop(0.8, 'rgba(27, 153, 139, 0.2)');
        lightGrad.addColorStop(1, 'rgba(27, 153, 139, 0.4)');
        ctx.fillStyle = lightGrad;
        ctx.beginPath();
        ctx.moveTo(startX + 100, bottomY - 25);
        ctx.lineTo(endX - 50, bottomY - 15);
        ctx.lineTo(endX - 50, bottomY + 15);
        ctx.lineTo(startX + 100, bottomY + 25);
        ctx.closePath();
        ctx.fill();

        // Clean direct path with glow
        ctx.strokeStyle = 'rgba(27, 153, 139, 0.25)';
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(startX + 100, bottomY);
        ctx.lineTo(endX - 80, bottomY);
        ctx.stroke();

        ctx.strokeStyle = COLORS.primary;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startX + 100, bottomY);
        ctx.lineTo(endX - 80, bottomY);
        ctx.stroke();

        // Milestones on physics path
        const milestones = [
            { x: 0.3, label: 'Axioms' },
            { x: 0.5, label: 'Metrics' },
            { x: 0.7, label: 'Theorems' }
        ];

        milestones.forEach(m => {
            const mx = startX + 100 + (endX - 80 - startX - 100) * m.x;
            ctx.fillStyle = 'rgba(27, 153, 139, 0.3)';
            ctx.beginPath();
            ctx.arc(mx, bottomY, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = COLORS.primary;
            ctx.beginPath();
            ctx.arc(mx, bottomY, 4, 0, Math.PI * 2);
            ctx.fill();
            drawText(ctx, m.label, mx, bottomY + 22, { color: '#555', size: 7 });
        });

        // Physics particles with trails
        physicsParticles.forEach((p, i) => {
            p.progress += p.speed;
            if (p.progress > 1) {
                p.progress = 0;
                p.trail = [];
            }

            const px = startX + 100 + (endX - 80 - startX - 100) * p.progress;
            const py = bottomY;

            // Store trail
            p.trail.push({ x: px, y: py });
            if (p.trail.length > 15) p.trail.shift();

            // Draw trail
            p.trail.forEach((pt, ti) => {
                const alpha = ti / p.trail.length * 0.5;
                ctx.fillStyle = `rgba(27, 153, 139, ${alpha})`;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 2 + ti / p.trail.length * 2, 0, Math.PI * 2);
                ctx.fill();
            });

            // Main particle
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = COLORS.primary;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Bottom labels
        drawText(ctx, 'PHYSICS PATH', startX + 105, bottomY + h * 0.14, { color: COLORS.primary, size: 11, align: 'left' });
        drawText(ctx, '"Understand first principles"', startX + 105, bottomY + h * 0.14 + 15, { color: '#555', size: 8, align: 'left' });

        // ═══════════════════════════════════════════════════════════════
        // AGI GOAL - Glowing destination
        // ═══════════════════════════════════════════════════════════════

        const goalX = endX - 35;
        const goalY = bottomY;
        const pulse = Math.sin(time * 0.05) * 0.15 + 0.85;

        // Radiating rings
        for (let r = 45; r > 20; r -= 8) {
            const alpha = 0.15 * pulse * (45 - r) / 25;
            ctx.strokeStyle = `rgba(27, 153, 139, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(goalX, goalY, r + Math.sin(time * 0.03 + r) * 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Goal glow
        const goalGlow = ctx.createRadialGradient(goalX, goalY, 0, goalX, goalY, 30);
        goalGlow.addColorStop(0, `rgba(255, 255, 255, ${0.9 * pulse})`);
        goalGlow.addColorStop(0.3, `rgba(27, 153, 139, ${0.8 * pulse})`);
        goalGlow.addColorStop(1, `rgba(27, 153, 139, ${0.3 * pulse})`);
        ctx.fillStyle = goalGlow;
        ctx.beginPath();
        ctx.arc(goalX, goalY, 25, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = '#0d0d15';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AGI', goalX, goalY + 4);

        drawText(ctx, 'True Intelligence', goalX, goalY + 42, { color: COLORS.primary, size: 9 });

        // Title
        drawText(ctx, 'TWO PATHS TO INTELLIGENCE', w / 2, 22, { color: '#555', size: 11 });

        time++;
        requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', () => { resize(); });
}
