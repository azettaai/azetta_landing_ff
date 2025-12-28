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
