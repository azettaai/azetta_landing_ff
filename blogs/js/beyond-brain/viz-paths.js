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

    for (let i = 0; i < 5; i++) {
        biologyParticles.push({ progress: Math.random(), speed: 0.002 + Math.random() * 0.001 });
        physicsParticles.push({ progress: Math.random(), speed: 0.003 + Math.random() * 0.001 });
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        ctx.fillStyle = '#0d0d15';
        ctx.fillRect(0, 0, w, h);

        // Generous spacing
        const startX = w * 0.08;
        const endX = w * 0.92;
        const topPathY = h * 0.22;
        const bottomPathY = h * 0.78;
        const centerY = h * 0.5;

        // Divider line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.moveTo(startX + 60, centerY);
        ctx.lineTo(endX - 60, centerY);
        ctx.stroke();
        ctx.setLineDash([]);

        // === TOP: BIOLOGY PATH ===
        const bioStartY = topPathY + 30;
        const wallX = endX - 80;

        // Background fog
        ctx.fillStyle = 'rgba(237, 33, 124, 0.05)';
        ctx.fillRect(startX, topPathY - 20, wallX - startX + 20, h * 0.25);

        // Chaotic wavy path
        ctx.strokeStyle = COLORS.secondary;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(startX + 20, bioStartY);

        for (let x = startX + 30; x < wallX - 20; x += 5) {
            const progress = (x - startX) / (wallX - startX);
            const wave1 = Math.sin(x * 0.08 + time * 0.03) * 15;
            const wave2 = Math.sin(x * 0.12) * 10;
            const drift = Math.sin(progress * Math.PI) * -20;
            ctx.lineTo(x, bioStartY + wave1 + wave2 + drift);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Dead end wall
        ctx.fillStyle = 'rgba(237, 33, 124, 0.25)';
        ctx.fillRect(wallX - 8, topPathY - 10, 16, h * 0.22);
        ctx.strokeStyle = COLORS.secondary;
        ctx.lineWidth = 2;
        ctx.strokeRect(wallX - 8, topPathY - 10, 16, h * 0.22);

        // X mark on wall
        ctx.strokeStyle = COLORS.secondary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(wallX - 12, topPathY + 30);
        ctx.lineTo(wallX + 12, topPathY + 60);
        ctx.moveTo(wallX + 12, topPathY + 30);
        ctx.lineTo(wallX - 12, topPathY + 60);
        ctx.stroke();

        // Biology particles
        biologyParticles.forEach(p => {
            p.progress += p.speed;
            if (p.progress > 0.92) p.progress = 0;

            const px = startX + 20 + (wallX - startX - 50) * p.progress;
            const progress = p.progress;
            const wave1 = Math.sin(px * 0.08 + time * 0.03) * 15;
            const wave2 = Math.sin(px * 0.12) * 10;
            const drift = Math.sin(progress * Math.PI) * -20;
            const py = bioStartY + wave1 + wave2 + drift;

            ctx.fillStyle = COLORS.secondary;
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Biology labels
        drawText(ctx, 'BIOLOGY PATH', startX + 20, topPathY - 30, { color: COLORS.secondary, size: 11, align: 'left' });
        drawText(ctx, '"Scale it up and hope for emergence"', startX + 20, topPathY - 15, { color: '#555', size: 8, align: 'left' });
        drawText(ctx, 'DEAD END', wallX, topPathY + h * 0.25 + 15, { color: COLORS.secondary, size: 10 });

        // === BOTTOM: PHYSICS PATH ===
        const physStartY = bottomPathY - 30;
        const goalX = endX - 40;

        // Light trail glow
        ctx.fillStyle = 'rgba(27, 153, 139, 0.08)';
        ctx.fillRect(startX, bottomPathY - h * 0.12, endX - startX, h * 0.25);

        // Clean smooth path
        ctx.strokeStyle = COLORS.primary;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startX + 20, physStartY);
        ctx.bezierCurveTo(
            w * 0.35, physStartY + 20,
            w * 0.65, physStartY - 20,
            goalX - 35, physStartY
        );
        ctx.stroke();

        // Glow effect
        ctx.strokeStyle = 'rgba(27, 153, 139, 0.2)';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(startX + 20, physStartY);
        ctx.bezierCurveTo(
            w * 0.35, physStartY + 20,
            w * 0.65, physStartY - 20,
            goalX - 35, physStartY
        );
        ctx.stroke();

        // Physics particles with trails
        physicsParticles.forEach(p => {
            p.progress += p.speed;
            if (p.progress > 1) p.progress = 0;

            const t = p.progress;
            const mt = 1 - t;

            // Bezier position
            const px = mt * mt * mt * (startX + 20) +
                3 * mt * mt * t * (w * 0.35) +
                3 * mt * t * t * (w * 0.65) +
                t * t * t * (goalX - 35);
            const py = mt * mt * mt * physStartY +
                3 * mt * mt * t * (physStartY + 20) +
                3 * mt * t * t * (physStartY - 20) +
                t * t * t * physStartY;

            // Trail
            ctx.fillStyle = 'rgba(27, 153, 139, 0.3)';
            ctx.beginPath();
            ctx.arc(px - 10, py, 3, 0, Math.PI * 2);
            ctx.fill();

            // Particle
            ctx.fillStyle = COLORS.primary;
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        // Physics labels
        drawText(ctx, 'PHYSICS PATH', startX + 20, bottomPathY + h * 0.15, { color: COLORS.primary, size: 11, align: 'left' });
        drawText(ctx, '"Understand first principles"', startX + 20, bottomPathY + h * 0.15 + 15, { color: '#555', size: 8, align: 'left' });

        // === AGI GOAL ===
        const pulse = Math.sin(time * 0.04) * 0.2 + 0.8;

        // Outer rings
        for (let r = 40; r > 25; r -= 6) {
            ctx.fillStyle = `rgba(27, 153, 139, ${0.15 * pulse * (40 - r) / 15})`;
            ctx.beginPath();
            ctx.arc(goalX, physStartY, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Core
        const goalGrad = ctx.createRadialGradient(goalX, physStartY, 0, goalX, physStartY, 25);
        goalGrad.addColorStop(0, `rgba(27, 153, 139, ${pulse})`);
        goalGrad.addColorStop(1, `rgba(27, 153, 139, ${0.5 * pulse})`);
        ctx.fillStyle = goalGrad;
        ctx.beginPath();
        ctx.arc(goalX, physStartY, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0d0d15';
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AGI', goalX, physStartY + 4);

        // Title
        drawText(ctx, 'TWO PATHS TO INTELLIGENCE', w / 2, 18, { color: '#666', size: 10 });

        time++;
        requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', () => { resize(); });
}
