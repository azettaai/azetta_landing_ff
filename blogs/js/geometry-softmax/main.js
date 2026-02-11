/**
 * Geometry of Softmax - Blog Visualizations
 * Interactive canvas visualizations for the "Geometry of Softmax" article
 */

import { initVizTextbookLines } from './viz-textbook-lines.js';
import { initVizSpaceSplitting } from './viz-space-splitting.js';
import { initVizDotAnatomy } from './viz-dot-anatomy.js';
import { initVizMagnitudeDominance } from './viz-magnitude-dominance.js';
import { initVizPotentialFields } from './viz-potential-fields.js';
import { initVizGravityVsLinear } from './viz-gravity-vs-linear.js';
import { initVizSweepComparison } from './viz-sweep-comparison.js';

document.addEventListener('DOMContentLoaded', () => {
    initVizTextbookLines();
    initVizSpaceSplitting();
    initVizDotAnatomy();
    initVizMagnitudeDominance();
    initVizPotentialFields();
    initVizGravityVsLinear();
    initVizSweepComparison();
});
