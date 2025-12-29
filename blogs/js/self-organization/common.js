// Shared color palette for self-organization visualizations
export const COLORS = {
    primary: '#1b998b',
    accent: '#ed217c',
    light: '#e8e8e8',
    dim: '#555555',
    grid: 'rgba(27, 153, 139, 0.15)',
    vortex: '#4ea8de',      // vortex field
    mass: '#f4a261',        // gravitational mass
    cell: '#9b5de5',        // biological cells
    neuron: '#2dd4bf',      // SOM neurons
    trajectory: '#ed217c'   // training trajectories
};

// Utility functions
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

export function dot(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += a[i] * b[i];
    }
    return sum;
}

export function magnitude(v) {
    return Math.sqrt(dot(v, v));
}

export function normalize(v) {
    const mag = magnitude(v);
    if (mag === 0) return v.map(() => 0);
    return v.map(x => x / mag);
}

export function euclideanDist(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
}

export function yat(a, b) {
    const d = dot(a, b);
    const dist = euclideanDist(a, b);
    if (dist < 0.001) return Infinity;
    return (d * d) / (dist * dist);
}

// Generate random vector with given dimension
export function randomVector(dim, scale = 1) {
    const v = [];
    for (let i = 0; i < dim; i++) {
        v.push((Math.random() * 2 - 1) * scale);
    }
    return v;
}

// Hex to RGBA utility
export function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Softmax function
export function softmax(arr, temperature = 1) {
    const maxVal = Math.max(...arr);
    const exps = arr.map(x => Math.exp((x - maxVal) / temperature));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
}

// Help tooltip system
export function drawHelpButton(ctx, x, y, isHovered, color = '#888') {
    const r = 12;
    ctx.fillStyle = isHovered ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isHovered ? '#fff' : color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = isHovered ? '#fff' : color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x, y + 1);
    ctx.textBaseline = 'alphabetic';

    return { x: x - r, y: y - r, w: r * 2, h: r * 2 };
}

export function drawResetButton(ctx, x, y, isHovered, color = '#888') {
    const r = 12;
    ctx.fillStyle = isHovered ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isHovered ? '#fff' : color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = isHovered ? '#fff' : color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↻', x, y + 2);
    ctx.textBaseline = 'alphabetic';

    return { x: x - r, y: y - r, w: r * 2, h: r * 2 };
}

export function drawHelpTooltip(ctx, w, h, lines, accentColor = '#1b998b') {
    const padding = 16;
    const lineHeight = 18;
    const tooltipW = Math.min(w - 40, 280);
    const tooltipH = lines.length * lineHeight + padding * 2 + 10;
    const tooltipX = (w - tooltipW) / 2;
    const tooltipY = (h - tooltipH) / 2;

    // Background
    ctx.fillStyle = 'rgba(10, 10, 20, 0.95)';
    ctx.fillRect(tooltipX, tooltipY, tooltipW, tooltipH);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(tooltipX, tooltipY, tooltipW, tooltipH);

    // Header
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = accentColor;
    ctx.textAlign = 'center';
    ctx.fillText('HOW TO USE', w / 2, tooltipY + padding + 4);

    // Lines
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'left';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const y = tooltipY + padding + 24 + i * lineHeight;

        if (line.startsWith('•')) {
            ctx.fillStyle = accentColor;
            ctx.fillText('•', tooltipX + padding, y);
            ctx.fillStyle = '#ccc';
            ctx.fillText(line.slice(2), tooltipX + padding + 12, y);
        } else {
            ctx.fillStyle = '#888';
            ctx.fillText(line, tooltipX + padding, y);
        }
    }

    // Click to close hint
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('Click anywhere to close', w / 2, tooltipY + tooltipH - 10);
}

export function isPointInRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}
