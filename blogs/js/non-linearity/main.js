/**
 * Non-Linearity Blog Visualizations
 * Interactive canvas visualizations for the "Meaning of Non-Linearity" article
 */

import { initViz2D } from './viz-2d.js';
import { initVizRowsCols } from './viz-rows-cols.js';
import { initVizYat } from './viz-yat.js';
import { initVizPolarity } from './viz-polarity.js';
import { initVizLift } from './viz-lift.js';
import { initVizXOR } from './viz-xor.js';
import { initVizOrthogonality } from './viz-orthogonality.js';
import { initVizYatField } from './viz-yat-field.js';
import { initVizEntropy } from './viz-entropy.js';
import { initVizDimensions } from './viz-dimensions.js';
import { initVizYatMatrix } from './viz-yat-matrix.js';
import { initVizMetricCompare } from './viz-metric-compare.js';
import { initVizGradients } from './viz-gradients.js';
import { initVizBoundaries } from './viz-boundaries.js';

document.addEventListener('DOMContentLoaded', () => {
    initViz2D();
    initVizRowsCols();
    initVizYat();
    initVizPolarity();
    initVizLift();
    initVizXOR();
    initVizOrthogonality();
    initVizYatField();
    initVizEntropy();
    initVizDimensions();
    initVizYatMatrix();
    initVizMetricCompare();
    initVizGradients();
    initVizBoundaries();
});
