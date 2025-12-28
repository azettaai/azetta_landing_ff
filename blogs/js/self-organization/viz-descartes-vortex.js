import { COLORS, hexToRgba } from './common.js';

export function initVizDescartesVortex() {
    const canvas = document.getElementById('viz-descartes-vortex');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let time = 0;
    let w, h;
    let showDominance = false; // Toggle for showing gravitational dominance regions

    // Vortex centers - each represents a "sun" with its planetary system
    let vortices = [
        { x: 0.3, y: 0.5, strength: 1.2, rotation: 1, color: '#f4a261' },
        { x: 0.7, y: 0.5, strength: 0.9, rotation: -1, color: '#4ea8de' }
    ];

    const vortexColors = ['#f4a261', '#4ea8de', '#2dd4bf', '#ed217c', '#9b5de5', '#6bff6b'];
    let colorIndex = 2;

    // Particles flowing in the vortex field
    let particles = [];
    const maxParticles = 300;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        w = rect.width;
        h = rect.height;
        canvas.width = w * window.devicePixelRatio;
        canvas.height = h * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < maxParticles; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                trail: [],
                size: 1 + Math.random() * 2
            });
        }
    }

    function getVortexVelocity(px, py) {
        let vx = 0, vy = 0;

        for (const v of vortices) {
            const cx = v.x * w;
            const cy = v.y * h;
            const dx = px - cx;
            const dy = py - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 5) continue;

            // Circular flow around vortex center (like planets orbiting)
            const speed = v.strength * 150 / (dist + 20);
            const tangentX = -dy / dist * v.rotation;
            const tangentY = dx / dist * v.rotation;

            // Add slight inward pull (like gravity)
            const inwardStrength = v.strength * 30 / (dist + 50);
            const inwardX = -dx / dist * inwardStrength;
            const inwardY = -dy / dist * inwardStrength;

            vx += tangentX * speed + inwardX;
            vy += tangentY * speed + inwardY;
        }

        return { vx, vy };
    }

    // Find which vortex has the strongest gravitational influence at a point
    function getDominantVortex(px, py) {
        let maxInfluence = -Infinity;
        let dominantIdx = 0;

        for (let i = 0; i < vortices.length; i++) {
            const v = vortices[i];
            const cx = v.x * w;
            const cy = v.y * h;
            const dx = px - cx;
            const dy = py - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Gravitational influence (inverse-square law weighted by strength)
            const influence = (v.strength * v.strength) / (dist * dist + 1);

            if (influence > maxInfluence) {
                maxInfluence = influence;
                dominantIdx = i;
            }
        }

        return { idx: dominantIdx, influence: maxInfluence };
    }

    function drawDominanceMap() {
        const resolution = 8;

        for (let x = 0; x < w; x += resolution) {
            for (let y = 0; y < h; y += resolution) {
                const { idx, influence } = getDominantVortex(x + resolution / 2, y + resolution / 2);
                const v = vortices[idx];

                // Normalize influence for alpha
                const alpha = Math.min(influence * 500, 0.4);

                ctx.fillStyle = hexToRgba(v.color, alpha);
                ctx.fillRect(x, y, resolution, resolution);
            }
        }

        // Draw boundary lines between regions
        ctx.lineWidth = 2;
        for (let x = resolution; x < w - resolution; x += resolution) {
            for (let y = resolution; y < h - resolution; y += resolution) {
                const current = getDominantVortex(x, y).idx;
                const right = getDominantVortex(x + resolution, y).idx;
                const bottom = getDominantVortex(x, y + resolution).idx;

                if (current !== right) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.beginPath();
                    ctx.moveTo(x + resolution / 2, y - resolution / 2);
                    ctx.lineTo(x + resolution / 2, y + resolution / 2);
                    ctx.stroke();
                }
                if (current !== bottom) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.beginPath();
                    ctx.moveTo(x - resolution / 2, y + resolution / 2);
                    ctx.lineTo(x + resolution / 2, y + resolution / 2);
                    ctx.stroke();
                }
            }
        }
    }

    function draw() {
        // Clear with semi-transparent black for trail effect
        if (showDominance) {
            ctx.fillStyle = '#0d0d15';
            ctx.fillRect(0, 0, w, h);
            drawDominanceMap();
        } else {
            ctx.fillStyle = 'rgba(13, 13, 21, 0.2)';
            ctx.fillRect(0, 0, w, h);
        }

        // Draw flow field arrows (only when not showing dominance)
        if (!showDominance) {
            const gridSize = 40;
            ctx.lineWidth = 1;
            for (let x = gridSize / 2; x < w; x += gridSize) {
                for (let y = gridSize / 2; y < h; y += gridSize) {
                    const { vx, vy } = getVortexVelocity(x, y);
                    const mag = Math.sqrt(vx * vx + vy * vy);
                    if (mag < 0.1) continue;

                    const angle = Math.atan2(vy, vx);
                    const len = Math.min(mag * 0.15, 15);

                    ctx.strokeStyle = hexToRgba(COLORS.vortex, 0.2 + mag * 0.01);
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
                    ctx.stroke();
                }
            }
        }

        // Update and draw particles
        for (const p of particles) {
            const { vx, vy } = getVortexVelocity(p.x, p.y);

            p.vx = p.vx * 0.92 + vx * 0.08;
            p.vy = p.vy * 0.92 + vy * 0.08;

            p.x += p.vx * 0.5;
            p.y += p.vy * 0.5;

            if (p.x < -10) p.x = w + 10;
            if (p.x > w + 10) p.x = -10;
            if (p.y < -10) p.y = h + 10;
            if (p.y > h + 10) p.y = -10;

            p.trail.unshift({ x: p.x, y: p.y });
            if (p.trail.length > 12) p.trail.pop();

            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const brightness = Math.min(speed / 10, 1);

            // Color particle by dominant vortex
            const { idx } = getDominantVortex(p.x, p.y);
            const particleColor = showDominance ? vortices[idx].color : COLORS.vortex;

            for (let i = 0; i < p.trail.length; i++) {
                const t = 1 - i / p.trail.length;
                const alpha = t * 0.8 * brightness;
                const size = p.size * t;

                ctx.fillStyle = hexToRgba(particleColor, alpha);
                ctx.beginPath();
                ctx.arc(p.trail[i].x, p.trail[i].y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
            glow.addColorStop(0, hexToRgba(particleColor, 0.8 * brightness));
            glow.addColorStop(0.5, hexToRgba(particleColor, 0.3 * brightness));
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = hexToRgba('#ffffff', 0.9 * brightness);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw vortex centers (suns/stars)
        for (let i = 0; i < vortices.length; i++) {
            const v = vortices[i];
            const cx = v.x * w;
            const cy = v.y * h;
            const pulse = 1 + Math.sin(time * 3 + i) * 0.15;
            const baseRadius = 12 + v.strength * 8;

            // Outer glow
            const outerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80 * pulse);
            outerGlow.addColorStop(0, hexToRgba(v.color, 0.6));
            outerGlow.addColorStop(0.3, hexToRgba(v.color, 0.2));
            outerGlow.addColorStop(0.7, hexToRgba(v.color, 0.05));
            outerGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(cx, cy, 80 * pulse, 0, Math.PI * 2);
            ctx.fill();

            // Inner core with 3D effect
            const coreGrad = ctx.createRadialGradient(cx - 5, cy - 5, 0, cx, cy, baseRadius * pulse);
            coreGrad.addColorStop(0, '#ffffff');
            coreGrad.addColorStop(0.2, '#ffdd88');
            coreGrad.addColorStop(0.5, v.color);
            coreGrad.addColorStop(1, hexToRgba(v.color, 0.8));
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, baseRadius * pulse, 0, Math.PI * 2);
            ctx.fill();

            // Rotation indicator
            const rotAngle = time * 2 * v.rotation;
            ctx.strokeStyle = hexToRgba(v.color, 0.5);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, (baseRadius + 10) * pulse, rotAngle, rotAngle + Math.PI * 0.5);
            ctx.stroke();

            // Strength label
            ctx.font = '9px "Courier New", monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.textAlign = 'center';
            ctx.fillText(`S=${v.strength.toFixed(1)}`, cx, cy + baseRadius * pulse + 15);
        }

        // Toggle button
        const btnX = w - 130;
        const btnY = 15;
        const btnW = 115;
        const btnH = 28;

        ctx.fillStyle = showDominance ? 'rgba(45, 212, 191, 0.3)' : 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = showDominance ? '#2dd4bf' : COLORS.dim;
        ctx.lineWidth = 1;
        ctx.strokeRect(btnX, btnY, btnW, btnH);

        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.fillStyle = showDominance ? '#2dd4bf' : COLORS.light;
        ctx.textAlign = 'center';
        ctx.fillText(showDominance ? '◉ DOMINANCE' : '○ DOMINANCE', btnX + btnW / 2, btnY + 18);

        // Info panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(10, 10, 220, 70);
        ctx.strokeStyle = COLORS.primary;
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, 220, 70);

        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.fillStyle = COLORS.light;
        ctx.textAlign = 'left';
        ctx.fillText('DESCARTES VORTEX THEORY', 20, 28);
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = COLORS.dim;
        ctx.fillText(`Stars: ${vortices.length} | Particles: ${particles.length}`, 20, 43);
        ctx.fillStyle = COLORS.primary;
        ctx.fillText('Click: add star | R-click: remove', 20, 56);
        ctx.fillStyle = showDominance ? '#2dd4bf' : COLORS.dim;
        ctx.fillText('Toggle shows gravity territories', 20, 69);

        time += 0.016;
        animationFrame = requestAnimationFrame(draw);
    }

    function handleClick(e) {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Check if clicking on toggle button
        const btnX = w - 130;
        const btnY = 15;
        const btnW = 115;
        const btnH = 28;

        if (clickX >= btnX && clickX <= btnX + btnW && clickY >= btnY && clickY <= btnY + btnH) {
            showDominance = !showDominance;
            return;
        }

        const x = clickX / w;
        const y = clickY / h;

        // Add new vortex
        vortices.push({
            x, y,
            strength: 0.8 + Math.random() * 0.8,
            rotation: Math.random() > 0.5 ? 1 : -1,
            color: vortexColors[colorIndex % vortexColors.length]
        });
        colorIndex++;
    }

    function handleRightClick(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / w;
        const y = (e.clientY - rect.top) / h;

        // Find and remove closest vortex
        let closestIdx = -1;
        let closestDist = Infinity;

        for (let i = 0; i < vortices.length; i++) {
            const dx = vortices[i].x - x;
            const dy = vortices[i].y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist && dist < 0.1) {
                closestDist = dist;
                closestIdx = i;
            }
        }

        if (closestIdx >= 0 && vortices.length > 1) {
            vortices.splice(closestIdx, 1);
        }
    }

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('contextmenu', handleRightClick);

    resize();
    initParticles();

    ctx.fillStyle = '#0d0d15';
    ctx.fillRect(0, 0, w, h);

    draw();

    window.addEventListener('resize', () => {
        resize();
        initParticles();
        ctx.fillStyle = '#0d0d15';
        ctx.fillRect(0, 0, w, h);
    });
}
