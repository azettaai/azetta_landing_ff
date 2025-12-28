/**
 * Self-Organization Blog Visualizations
 * Interactive canvas visualizations for the "Universe of Self-Organization" article
 */

import { initVizDescartesVortex } from './viz-descartes-vortex.js';
import { initVizSpacetimeCurvature } from './viz-spacetime-curvature.js';
import { initVizTuringPatterns } from './viz-turing-patterns.js';
import { initVizSomTraining } from './viz-som-training.js';
import { initVizYatVortex } from './viz-yat-vortex.js';
import { initVizTrainingDynamics } from './viz-training-dynamics.js';

document.addEventListener('DOMContentLoaded', () => {
    initVizDescartesVortex();
    initVizSpacetimeCurvature();
    initVizTuringPatterns();
    initVizSomTraining();
    initVizYatVortex();
    initVizTrainingDynamics();
});
