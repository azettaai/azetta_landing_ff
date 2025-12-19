import { COLORS, drawText } from './common.js';

/**
 * Visualization: Cosmic Scale of Computation
 * Shows the universe's computational power vs human brain
 */
export function initVizCosmic() {
    const canvas = document.getElementById('viz-cosmic');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let time = 0;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // Star field
    const stars = Array.from({ length: 100 }, () => ({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.0005 + 0.0002
    }));

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        // Dark space background
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, w, h);

        // Stars
        stars.forEach(star => {
            star.x += star.speed;
            if (star.x > 1) star.x = 0;

            const twinkle = Math.sin(time * 0.1 + star.x * 10) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.6})`;
            ctx.beginPath();
            ctx.arc(star.x * w, star.y * h, star.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Universe representation (left side)
        const universeX = w * 0.3;
        const universeY = h * 0.5;
        const universeR = 80 + Math.sin(time * 0.02) * 5;

        // Spiral galaxy effect
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            for (let t = 0; t < Math.PI * 4; t += 0.1) {
                const r = (t / (Math.PI * 4)) * universeR * 0.9;
                const angle = t + i * (Math.PI * 2 / 3) + time * 0.01;
                const x = universeX + Math.cos(angle) * r;
                const y = universeY + Math.sin(angle) * r * 0.4;
                if (t === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(27, 153, 139, ${0.3 - i * 0.08})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Universe core glow
        const coreGlow = ctx.createRadialGradient(universeX, universeY, 0, universeX, universeY, universeR);
        coreGlow.addColorStop(0, 'rgba(27, 153, 139, 0.4)');
        coreGlow.addColorStop(0.3, 'rgba(27, 153, 139, 0.1)');
        coreGlow.addColorStop(1, 'rgba(27, 153, 139, 0)');
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(universeX, universeY, universeR, 0, Math.PI * 2);
        ctx.fill();

        // Stats for universe
        drawText(ctx, 'UNIVERSE', universeX, h * 0.15, { color: COLORS.primary, size: 11 });
        drawText(ctx, '13.8 billion years', universeX, universeY + universeR + 25, { color: '#666', size: 9 });
        drawText(ctx, '10⁸⁰ particles', universeX, universeY + universeR + 40, { color: '#555', size: 8 });

        // Brain representation (right side)
        const brainX = w * 0.7;
        const brainY = h * 0.5;
        const brainR = 25;

        // Simple brain shape
        ctx.fillStyle = 'rgba(237, 33, 124, 0.15)';
        ctx.strokeStyle = COLORS.secondary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(brainX, brainY, brainR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Brain neurons (simplified)
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + time * 0.02;
            const nx = brainX + Math.cos(angle) * brainR * 0.5;
            const ny = brainY + Math.sin(angle) * brainR * 0.5;
            ctx.fillStyle = COLORS.secondary;
            ctx.beginPath();
            ctx.arc(nx, ny, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Stats for brain
        drawText(ctx, 'HUMAN BRAIN', brainX, h * 0.15, { color: COLORS.secondary, size: 11 });
        drawText(ctx, '~5 million years', brainX, brainY + brainR + 35, { color: '#666', size: 9 });
        drawText(ctx, '10¹¹ neurons', brainX, brainY + brainR + 50, { color: '#555', size: 8 });

        // Comparison arrow
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(universeX + universeR + 20, universeY);
        ctx.lineTo(brainX - brainR - 20, brainY);
        ctx.stroke();
        ctx.setLineDash([]);

        drawText(ctx, 'vs', w * 0.5, universeY, { color: '#444', size: 10 });

        // Scale comparison bar
        const barY = h - 35;
        const barWidth = w * 0.6;
        const barHeight = 8;
        const barX = w * 0.2;

        // Universe bar (full)
        ctx.fillStyle = 'rgba(27, 153, 139, 0.3)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Brain bar (tiny)
        ctx.fillStyle = COLORS.secondary;
        ctx.fillRect(barX, barY, barWidth * 0.000001, barHeight); // Effectively invisible

        drawText(ctx, 'Computational capacity (log scale)', w / 2, barY - 10, { color: '#444', size: 8 });

        time++;
        requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', () => { resize(); });
}
