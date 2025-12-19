import { initVizBlackBox } from './viz-black-box.js';
import { initVizPaths } from './viz-paths.js';
import { initVizCosmic } from './viz-cosmic.js';
import { initVizOptimization } from './viz-optimization.js';

document.addEventListener('DOMContentLoaded', () => {
    initVizBlackBox();
    initVizPaths();
    initVizCosmic();
    initVizOptimization();
});
