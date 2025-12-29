/**
 * Self-Organization Blog Visualizations
 * Interactive canvas visualizations for the "Universe of Self-Organization" article
 */

import { initVizDescartesVortex } from './viz-descartes-vortex.js';
import { initVizSpacetimeCurvature } from './viz-spacetime-curvature.js';
import { initVizTuringPatterns } from './viz-turing-patterns.js';
import { initVizGameOfLife } from './viz-game-of-life.js';
import { initVizChemotaxis } from './viz-chemotaxis.js';
import { initVizSomTraining } from './viz-som-training.js';
import { initVizYatVortex } from './viz-yat-vortex.js';
import { initVizTrainingDynamics } from './viz-training-dynamics.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Self-Organization Visualizations: Initializing...');

    // Initialize all visualizations
    const initializers = [
        { name: 'Descartes Vortex', fn: initVizDescartesVortex },
        { name: 'Spacetime Curvature', fn: initVizSpacetimeCurvature },
        { name: 'Turing Patterns', fn: initVizTuringPatterns },
        { name: 'Game of Life', fn: initVizGameOfLife },
        { name: 'Chemotaxis', fn: initVizChemotaxis },
        { name: 'SOM Training', fn: initVizSomTraining },
        { name: 'YAT Vortex', fn: initVizYatVortex },
        { name: 'Training Dynamics', fn: initVizTrainingDynamics }
    ];

    for (const { name, fn } of initializers) {
        try {
            await fn();
            console.log(`✓ ${name} initialized`);
        } catch (e) {
            console.warn(`✗ ${name} initialization failed:`, e);
        }
    }

    console.log('Self-Organization Visualizations: All initialized');
});
