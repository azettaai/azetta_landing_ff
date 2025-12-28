import { COLORS, hexToRgba } from './common.js';

/**
 * General Relativity: Gravitational Lensing
 * 
 * Shows how mass bends light paths - a real prediction of GR.
 * Background stars get distorted as their light bends around massive objects.
 * Can create Einstein rings and arcs.
 */
export function initVizSpacetimeCurvature() {
    const canvas = document.getElementById('viz-spacetime-curvature');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w, h;
    let time = 0;

    // Masses that bend light
    let masses = [
        { x: 0.5, y: 0.5, mass: 150, color: '#1a1a2e' }
    ];

    let currentMassSize = 'medium';
    const massSizes = { small: 80, medium: 150, large: 250 };

    // Background stars (distant light sources)
    const bgStars = [];
    for (let i = 0; i < 120; i++) {
        bgStars.push({
            x: Math.random(),
            y: Math.random(),
            brightness: 0.3 + Math.random() * 0.7,
            size: 1 + Math.random() * 2,
            color: ['#ffffff', '#ffd700', '#87ceeb', '#ffb6c1', '#98fb98'][Math.floor(Math.random() * 5)]
        });
    }

    function resize() {
        const rect = canvas.getBoundingClientRect();
        w = rect.width;
        h = rect.height;
        canvas.width = w * window.devicePixelRatio;
        canvas.height = h * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // Calculate how a point of light is deflected by gravitational lensing
    // Using simplified thin lens approximation
    function getLensedPosition(starX, starY) {
        let lensedX = starX * w;
        let lensedY = starY * h;
        let totalDeflection = 0;

        for (const m of masses) {
            const mx = m.x * w;
            const my = m.y * h;

            // Vector from mass to star
            const dx = lensedX - mx;
            const dy = lensedY - my;
            const r = Math.sqrt(dx * dx + dy * dy);

            if (r < 5) continue;

            // Einstein radius (simplified) - where ring forms
            const einsteinRadius = Math.sqrt(m.mass) * 3;

            // Deflection angle: α ≈ 4GM/(c²r) → simplified as eR²/r
            // Light bends TOWARD the mass
            const deflectionMagnitude = (einsteinRadius * einsteinRadius) / (r + 10);

            // Deflection direction is toward the mass (opposite to dx, dy)
            lensedX -= (dx / r) * deflectionMagnitude;
            lensedY -= (dy / r) * deflectionMagnitude;

            totalDeflection += deflectionMagnitude;
        }

        return { x: lensedX, y: lensedY, deflection: totalDeflection };
    }

    // Check if a ray from infinity would form an Einstein ring
    function getEinsteinRing(mx, my, mass) {
        const einsteinRadius = Math.sqrt(mass) * 3;
        return einsteinRadius;
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);

        // Deep space background
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
        bgGrad.addColorStop(0, '#0a0a12');
        bgGrad.addColorStop(0.5, '#050508');
        bgGrad.addColorStop(1, '#020204');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Draw lensed background stars
        for (const star of bgStars) {
            const lensed = getLensedPosition(star.x, star.y);

            // Magnification based on deflection (lensing amplifies brightness)
            const magnification = 1 + lensed.deflection * 0.02;
            const finalBrightness = Math.min(star.brightness * magnification, 1);
            const finalSize = star.size * Math.sqrt(magnification);

            // Distortion creates streaks for highly deflected stars
            if (lensed.deflection > 20) {
                // Draw as arc/streak
                const originalX = star.x * w;
                const originalY = star.y * h;

                // Draw streak from original toward lensed position
                const grad = ctx.createLinearGradient(originalX, originalY, lensed.x, lensed.y);
                grad.addColorStop(0, hexToRgba(star.color, 0.1));
                grad.addColorStop(0.5, hexToRgba(star.color, finalBrightness * 0.6));
                grad.addColorStop(1, hexToRgba(star.color, finalBrightness));

                ctx.strokeStyle = grad;
                ctx.lineWidth = finalSize * 0.7;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(originalX, originalY);
                ctx.lineTo(lensed.x, lensed.y);
                ctx.stroke();
            }

            // Star glow
            const glow = ctx.createRadialGradient(lensed.x, lensed.y, 0, lensed.x, lensed.y, finalSize * 4);
            glow.addColorStop(0, hexToRgba(star.color, finalBrightness * 0.8));
            glow.addColorStop(0.3, hexToRgba(star.color, finalBrightness * 0.3));
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(lensed.x, lensed.y, finalSize * 4, 0, Math.PI * 2);
            ctx.fill();

            // Star core
            ctx.fillStyle = hexToRgba(star.color, finalBrightness);
            ctx.beginPath();
            ctx.arc(lensed.x, lensed.y, finalSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Einstein rings around each mass
        for (const m of masses) {
            const mx = m.x * w;
            const my = m.y * h;
            const eRadius = getEinsteinRing(mx, my, m.mass);

            // Einstein ring glow
            for (let r = 0; r < 3; r++) {
                const ringR = eRadius * (1.5 + r * 0.3);
                const alpha = 0.15 - r * 0.04;
                ctx.strokeStyle = `rgba(150, 200, 255, ${alpha})`;
                ctx.lineWidth = 3 - r;
                ctx.beginPath();
                ctx.arc(mx, my, ringR, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Critical curve label
            ctx.font = '9px "Courier New", monospace';
            ctx.fillStyle = 'rgba(150, 200, 255, 0.5)';
            ctx.textAlign = 'center';
            ctx.fillText('Einstein radius', mx, my - eRadius * 1.8 - 8);
        }

        // Draw masses (black holes / massive objects)
        for (const m of masses) {
            const mx = m.x * w;
            const my = m.y * h;
            const radius = 8 + m.mass * 0.03;

            // Event horizon glow (for black hole visualization)
            const eventHorizonGlow = ctx.createRadialGradient(mx, my, radius * 0.5, mx, my, radius * 3);
            eventHorizonGlow.addColorStop(0, 'rgba(0, 0, 0, 1)');
            eventHorizonGlow.addColorStop(0.3, 'rgba(20, 20, 40, 0.9)');
            eventHorizonGlow.addColorStop(0.6, 'rgba(50, 50, 100, 0.3)');
            eventHorizonGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = eventHorizonGlow;
            ctx.beginPath();
            ctx.arc(mx, my, radius * 3, 0, Math.PI * 2);
            ctx.fill();

            // Accretion disk hint
            ctx.save();
            ctx.translate(mx, my);
            ctx.scale(1, 0.3);
            const diskGrad = ctx.createRadialGradient(0, 0, radius, 0, 0, radius * 2.5);
            diskGrad.addColorStop(0, 'rgba(255, 150, 50, 0.6)');
            diskGrad.addColorStop(0.5, 'rgba(255, 100, 50, 0.3)');
            diskGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = diskGrad;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Black hole core
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(mx, my, radius, 0, Math.PI * 2);
            ctx.fill();

            // Photon sphere ring
            ctx.strokeStyle = 'rgba(255, 200, 100, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(mx, my, radius * 1.5, 0, Math.PI * 2);
            ctx.stroke();

            // Mass label
            ctx.font = 'bold 10px "Courier New", monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.textAlign = 'center';
            ctx.fillText(`M = ${Math.round(m.mass)}`, mx, my + radius * 3 + 15);
        }

        // Light ray demonstration
        // Draw a few light paths showing bending
        const numRays = 8;
        for (let i = 0; i < numRays; i++) {
            const startY = (i + 0.5) / numRays * h;

            ctx.beginPath();
            ctx.moveTo(0, startY);

            // Trace ray path
            let rayX = 0, rayY = startY;
            const rayDirX = 1, rayDirY = 0;
            const steps = 50;

            for (let step = 0; step < steps; step++) {
                rayX = (step / steps) * w;

                // Calculate deflection at this point
                let deflectY = 0;
                for (const m of masses) {
                    const mx = m.x * w;
                    const my = m.y * h;
                    const dy = startY - my;
                    const dx = rayX - mx;
                    const r = Math.sqrt(dx * dx + dy * dy);

                    if (r > 10) {
                        const eR = Math.sqrt(m.mass) * 3;
                        const deflection = (eR * eR) / (r * r) * 50;
                        deflectY += (dy > 0 ? -1 : 1) * deflection * Math.exp(-Math.abs(dx) / 100);
                    }
                }

                const newY = startY + deflectY;
                ctx.lineTo(rayX, newY);
            }

            ctx.strokeStyle = `rgba(255, 220, 100, ${0.15 + (i % 2) * 0.05})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Info panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
        ctx.fillRect(12, 12, 280, 78);
        ctx.strokeStyle = 'rgba(150, 200, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(12, 12, 280, 78);

        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillStyle = '#e8e8ff';
        ctx.textAlign = 'left';
        ctx.fillText('GRAVITATIONAL LENSING', 22, 30);
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('Light bends around mass — Einstein 1915', 22, 46);
        ctx.fillStyle = 'rgba(150, 200, 255, 0.7)';
        ctx.fillText(`Next mass: ${currentMassSize.toUpperCase()} (M=${massSizes[currentMassSize]})`, 22, 60);
        ctx.fillStyle = '#666';
        ctx.fillText('Click: add/remove mass | Right-click: cycle size', 22, 74);

        time += 0.016;
        requestAnimationFrame(draw);
    }

    function handleClick(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / w;
        const y = (e.clientY - rect.top) / h;

        // Check if clicking on existing mass to remove
        for (let i = 0; i < masses.length; i++) {
            const m = masses[i];
            const dx = m.x - x;
            const dy = m.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < 0.05) {
                masses.splice(i, 1);
                return;
            }
        }

        // Add new mass
        masses.push({
            x, y,
            mass: massSizes[currentMassSize],
            color: '#1a1a2e'
        });
    }

    function handleRightClick(e) {
        e.preventDefault();
        if (currentMassSize === 'small') currentMassSize = 'medium';
        else if (currentMassSize === 'medium') currentMassSize = 'large';
        else currentMassSize = 'small';
    }

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('contextmenu', handleRightClick);

    resize();
    draw();
    window.addEventListener('resize', resize);
}
