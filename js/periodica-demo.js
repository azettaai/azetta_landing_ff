// ── Periodica Demo ────────────────────────────────────────────────────
const PD_NEURONS = [
  {
    id: 'N-247', type: 'syco', col: 3, row: 2,
    label: 'Sycophancy Bias',
    desc: 'Activates strongly when generating agreement or validation language. Causes the model to prioritize user approval over factual accuracy.',
    weight: 0.94, recommended: 0.15, min: 0, max: 1, step: 0.01,
    action: 'Reduce Influence',
    fixMsg: 'Sycophancy influence reduced. Model will now answer critically rather than seeking approval.',
  },
  {
    id: 'N-891', type: 'hall', col: 7, row: 5,
    label: 'Hallucination Risk',
    desc: 'Unstable activation pattern. Fires inconsistently across semantically similar prompts, generating confident outputs that may be completely unfounded.',
    weight: 1.42, recommended: 0.85, min: 0.5, max: 1.5, step: 0.01,
    action: 'Stabilize Weight',
    fixMsg: 'Neuron stabilized. Confidence is now calibrated to actual knowledge boundaries.',
  },
  {
    id: 'N-156', type: 'pii', col: 1, row: 7,
    label: 'PII Retention',
    desc: 'Encodes PII from training data. Memorized customer names, account numbers, and addresses may surface verbatim in model outputs.',
    weight: 0.88, recommended: 0.00, min: 0, max: 1, step: 0.01,
    action: 'Remove from Network',
    fixMsg: 'PII successfully scrubbed. Customer data can no longer be recovered from the network.',
  },
  {
    id: 'N-412', type: 'bias', col: 5, row: 1,
    label: 'Demographic Bias',
    desc: 'Systematic skew across demographic groups. Certain occupations, traits, and risk assessments are consistently associated with specific genders and ethnicities in output patterns.',
    weight: 0.78, recommended: 0.10, min: 0, max: 1, step: 0.01,
    action: 'Correct Bias',
    fixMsg: 'Demographic bias corrected. Word associations and risk assessments are now balanced across groups.',
  },
];

// Named healthy neurons shown on hover
const PD_NAMED = {
  '0-0': { id: 'N-001', name: 'Grammar Structure' },
  '8-0': { id: 'N-008', name: 'Punctuation Rules' },
  '4-1': { id: 'N-013', name: 'Semantic Coherence' },
  '2-3': { id: 'N-029', name: 'Named Entity Recog.' },
  '6-3': { id: 'N-051', name: 'Factual Recall' },
  '0-4': { id: 'N-036', name: 'Code Syntax' },
  '8-4': { id: 'N-044', name: 'Math Reasoning' },
  '4-6': { id: 'N-058', name: 'Spatial Reasoning' },
  '8-8': { id: 'N-080', name: 'Temporal Reasoning' },
  '0-8': { id: 'N-072', name: 'Discourse Patterns' },
  '4-8': { id: 'N-076', name: 'Sentiment Detection' },
};

// IP neurons revealed by search (col-row key)
const PD_IP_POS = ['6-2', '4-4', '2-6'];
const PD_IP_IDS = { '6-2': 'N-789', '4-4': 'N-401', '2-6': 'N-233' };

// Pricing per demo model
const PD_PRICING = {
  'GPT-J-6B':   { params: '6B params',  monthly: '$9,000',  label: 'Small' },
  'Llama-3-8B': { params: '8B params',  monthly: '$15,000', label: 'Small' },
  'Mistral-7B': { params: '7B params',  monthly: '$12,000', label: 'Small' },
};

const pdState = {
  model: 'Llama-3-8B',
  fixed: new Set(),
  premium: false,
  pendingAction: null,
  ipSearchDone: false,
  ipFixed: false,
};
const pdTypeColor = { syco: '#e84545', hall: '#e8a02a', pii: '#a050ff', bias: '#e84587' };
const pdTypeBadge = { syco: 'pd-nbadge-syco', hall: 'pd-nbadge-hall', pii: 'pd-nbadge-pii', bias: 'pd-nbadge-bias' };
const pdTypeCat   = { syco: 'Behavior', hall: 'Instability', pii: 'Privacy', bias: 'Fairness' };

function initPeriodica() {
  const startBtn = document.getElementById('pd-start-btn');
  if (!startBtn || startBtn.dataset.bound) return;
  startBtn.dataset.bound = '1';

  document.querySelectorAll('.pd-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.pd-chip').forEach(c => c.classList.remove('pd-chip-sel'));
      chip.classList.add('pd-chip-sel');
      pdState.model = chip.dataset.model;
    });
  });

  startBtn.addEventListener('click', pdStartScan);

  const exploreBtn = document.getElementById('pd-explore-btn');
  if (exploreBtn) exploreBtn.addEventListener('click', () => pdShowScreen('pd-upload'));
}

function pdShowScreen(id) {
  document.querySelectorAll('.pd-screen').forEach(s => s.classList.remove('pd-active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('pd-active');
}

function pdStartScan() {
  const scanName = document.getElementById('pd-scan-model-name');
  if (scanName) scanName.textContent = pdState.model;
  pdShowScreen('pd-scan');

  const fill   = document.getElementById('pd-scan-fill');
  const phase  = document.getElementById('pd-scan-phase');
  const count  = document.getElementById('pd-n-count');
  const phases = [
    'Tokenizing architecture…',
    'Mapping layer activations…',
    'Identifying neuron specializations…',
    'Flagging anomalies…',
    'Generating audit report…',
  ];

  let progress = 0, lastPhaseIdx = -1;
  const interval = setInterval(() => {
    progress += 2;
    if (fill)  fill.style.width = progress + '%';
    if (count) count.textContent = Math.round((progress / 100) * 8192).toLocaleString();
    const pi = Math.min(Math.floor((progress / 100) * phases.length), phases.length - 1);
    if (pi !== lastPhaseIdx) { lastPhaseIdx = pi; if (phase) phase.textContent = phases[pi]; }
    if (progress >= 100) { clearInterval(interval); setTimeout(pdBuildAndShowMap, 350); }
  }, 30);
}

function pdBuildAndShowMap() {
  const el = document.getElementById('pd-map-model');
  if (el) el.textContent = pdState.model;
  pdBuildMap();
  pdBuildFlagList();
  pdWireSearch();
  pdShowScreen('pd-main');
}

function pdBuildMap() {
  const map = document.getElementById('pd-map');
  if (!map) return;
  map.innerHTML = '';

  const byPos = {};
  PD_NEURONS.forEach(n => { byPos[`${n.col}-${n.row}`] = n; });

  let seed = 12345;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; };

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const key     = `${col}-${row}`;
      const special = byPos[key];
      const named   = PD_NAMED[key];
      const isIP    = PD_IP_POS.includes(key);
      const el = document.createElement('div');

      el.style.left = ((col / 8) * 86 + 7 + (rand() - 0.5) * 3.5).toFixed(1) + '%';
      el.style.top  = ((row / 8) * 86 + 7 + (rand() - 0.5) * 3.5).toFixed(1) + '%';

      if (special) {
        const isFixed = pdState.fixed.has(special.type);
        el.className = `pd-neuron pd-n-${isFixed ? 'fixed' : special.type}`;
        el.id        = `pd-neuron-${special.type}`;
        el.title     = `${special.id} · ${special.label}${isFixed ? ' ✓ Fixed' : ' — click to inspect'}`;
        if (!isFixed) el.addEventListener('click', () => pdSelectNeuron(special.type));
      } else if (isIP) {
        const wasFound = pdState.ipSearchDone;
        el.className = `pd-neuron ${wasFound ? (pdState.ipFixed ? 'pd-n-fixed' : 'pd-n-ip') : 'pd-n-ok'}`;
        el.id        = `pd-ip-${key.replace('-', '_')}`;
        el.dataset.ipKey = key;
        el.title     = wasFound ? `${PD_IP_IDS[key]} · IP-Protected Training Data` : `N-${String(row * 9 + col + 10).padStart(3, '0')} · Analyzing…`;
        if (wasFound && !pdState.ipFixed) el.addEventListener('click', pdShowIPResult);
      } else if (named) {
        el.className = 'pd-neuron pd-n-named';
        el.title     = `${named.id} · ${named.name} — Stable · No issues detected`;
      } else {
        el.className = 'pd-neuron pd-n-ok';
        el.title     = `N-${String(row * 9 + col + 10).padStart(3, '0')} · Stable · No issues detected`;
      }
      map.appendChild(el);
    }
  }
}

function pdBuildFlagList() {
  const list = document.getElementById('pd-flag-list');
  if (!list) return;
  list.innerHTML = '';

  PD_NEURONS.forEach(n => {
    const isFixed = pdState.fixed.has(n.type);
    const item = document.createElement('div');
    item.className = 'pd-flag-item' + (isFixed ? ' pd-flag-done' : '');
    item.id = `pd-flag-${n.type}`;
    item.innerHTML = `
      <span class="pd-fdot" style="background:${isFixed ? 'var(--primary)' : pdTypeColor[n.type]};"></span>
      <div class="pd-finfo">
        <div class="pd-fid">${n.id}</div>
        <div class="pd-fname">${n.label}</div>
      </div>
      ${isFixed ? '<span class="pd-ffixed">✓ FIXED</span>' : '<span class="pd-farrow">›</span>'}
    `;
    if (!isFixed) item.addEventListener('click', () => pdSelectNeuron(n.type));
    list.appendChild(item);
  });

  if (pdState.ipSearchDone) pdAddIPToFlagList();
}

function pdAddIPToFlagList() {
  const list = document.getElementById('pd-flag-list');
  if (!list || document.getElementById('pd-flag-ip')) return;
  const item = document.createElement('div');
  item.className = 'pd-flag-item' + (pdState.ipFixed ? ' pd-flag-done' : '');
  item.id = 'pd-flag-ip';
  item.innerHTML = `
    <span class="pd-fdot" style="background:${pdState.ipFixed ? 'var(--primary)' : '#e8c42a'};"></span>
    <div class="pd-finfo">
      <div class="pd-fid">N-789, N-401, N-233</div>
      <div class="pd-fname">IP-Protected Training Data</div>
    </div>
    ${pdState.ipFixed ? '<span class="pd-ffixed">✓ FIXED</span>' : '<span class="pd-farrow">›</span>'}
  `;
  if (!pdState.ipFixed) item.addEventListener('click', pdShowIPResult);
  list.appendChild(item);
}

function pdWireSearch() {
  const input = document.getElementById('pd-search-input');
  const btn   = document.getElementById('pd-search-btn');
  if (!input || !btn || btn.dataset.bound) return;
  btn.dataset.bound = '1';
  const doSearch = () => { const q = input.value.trim(); if (q) pdRunSearch(q); };
  btn.addEventListener('click', doSearch);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
}

function pdRunSearch(query) {
  const q = query.toLowerCase();
  const ipTerms = ['ip', 'copyright', 'intellectual property', 'licensed', 'pirated', 'training data', 'protected', 'proprietary'];
  if (ipTerms.some(t => q.includes(t))) {
    pdDoIPSearch();
  } else {
    pdShowGenericSearchResult(query);
  }
}

function pdDoIPSearch() {
  PD_IP_POS.forEach(key => {
    const el = document.getElementById(`pd-ip-${key.replace('-', '_')}`);
    if (el && !pdState.ipFixed) {
      el.className = 'pd-neuron pd-n-ip';
      el.title = `${PD_IP_IDS[key]} · IP-Protected Training Data — click to inspect`;
      el.addEventListener('click', pdShowIPResult);
    }
  });
  const legIP = document.getElementById('pd-leg-ip');
  if (legIP) legIP.style.display = '';
  if (!pdState.ipSearchDone) { pdState.ipSearchDone = true; pdAddIPToFlagList(); }
  pdShowIPResult();
}

function pdShowIPResult() {
  pdSwitchDetailView('pd-search-view');
  const sv = document.getElementById('pd-search-view');
  if (!sv) return;

  if (pdState.ipFixed) {
    sv.innerHTML = `
      <button class="pd-back-btn" id="pd-sv-back">← Back to overview</button>
      <div class="pd-fixed-state">
        <div class="pd-fixed-icon">✓</div>
        <div class="pd-fixed-name">IP-Protected Training Data</div>
        <div class="pd-fixed-msg">All traces of copyrighted content removed. The model can no longer reproduce protected text verbatim.</div>
      </div>`;
  } else {
    sv.innerHTML = `
      <button class="pd-back-btn" id="pd-sv-back">← Back to overview</button>
      <div class="pd-sv-result">
        <span class="pd-sv-badge pd-sv-badge-ip">⚠ IP MATCH DETECTED</span>
        <div class="pd-neuron-name">IP-Protected Training Data</div>
        <div class="pd-neuron-desc">Traces of copyrighted content detected across <strong style="color:#e8c42a;">3 neurons</strong> (N-789, N-401, N-233). Under specific prompts this model can reproduce sections of protected text verbatim — creating significant legal and compliance risk.</div>
        <div class="pd-sv-neurons">
          <span class="pd-sv-n" style="background:rgba(232,196,42,0.12);border-color:rgba(232,196,42,0.4);color:#e8c42a;">N-789</span>
          <span class="pd-sv-n" style="background:rgba(232,196,42,0.12);border-color:rgba(232,196,42,0.4);color:#e8c42a;">N-401</span>
          <span class="pd-sv-n" style="background:rgba(232,196,42,0.12);border-color:rgba(232,196,42,0.4);color:#e8c42a;">N-233</span>
        </div>
        <button class="pd-apply-btn" id="pd-ip-fix-btn">Remove IP Data from Network →</button>
      </div>`;
  }

  document.getElementById('pd-sv-back').addEventListener('click', pdShowFlagsView);
  if (!pdState.ipFixed) {
    document.getElementById('pd-ip-fix-btn').addEventListener('click', () => {
      pdState.pendingAction = { type: 'ip' };
      pdCheckPremium();
    });
  }
}

function pdShowGenericSearchResult(query) {
  pdSwitchDetailView('pd-search-view');
  const sv = document.getElementById('pd-search-view');
  if (!sv) return;
  sv.innerHTML = `
    <button class="pd-back-btn" id="pd-sv-back">← Back to overview</button>
    <div class="pd-sv-result">
      <span class="pd-sv-badge pd-sv-badge-ok">✓ NO RISK DETECTED</span>
      <div class="pd-neuron-name" style="font-size:0.8rem;">"${query}"</div>
      <div class="pd-neuron-desc">No significant risk found for this concept. Related activations are within normal parameters.</div>
      <p class="pd-detail-hint" style="font-style:normal;text-align:left;padding:0;margin-top:0.3rem;">Try <strong style="color:#e8c42a;">"IP-protected data"</strong> to probe for training data compliance risk.</p>
    </div>`;
  document.getElementById('pd-sv-back').addEventListener('click', pdShowFlagsView);
}

function pdSwitchDetailView(show) {
  ['pd-flags-view', 'pd-neuron-view', 'pd-search-view'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === show) {
      el.style.display = 'flex';
    } else {
      el.style.display = 'none';
      if (id === 'pd-neuron-view') el.innerHTML = '';
    }
  });
}

function pdShowFlagsView() {
  pdSwitchDetailView('pd-flags-view');
}

function pdSelectNeuron(type) {
  const n = PD_NEURONS.find(x => x.type === type);
  if (!n) return;

  pdSwitchDetailView('pd-neuron-view');
  const nv = document.getElementById('pd-neuron-view');
  if (!nv) return;
  nv.innerHTML = '';

  const back = pdMakeBackBtn();

  if (pdState.fixed.has(type)) {
    const fixed = document.createElement('div');
    fixed.className = 'pd-fixed-state';
    fixed.innerHTML = `<div class="pd-fixed-icon">✓</div><div class="pd-fixed-name">${n.label}</div><div class="pd-fixed-msg">${n.fixMsg}</div>`;
    nv.append(back, fixed);
    return;
  }

  const idRow = document.createElement('div');
  idRow.className = 'pd-neuron-id-row';
  idRow.innerHTML = `<span class="pd-neuron-id">${n.id}</span><span class="pd-nbadge ${pdTypeBadge[type]}">${pdTypeCat[type]}</span>`;

  const name = document.createElement('div');
  name.className = 'pd-neuron-name';
  name.textContent = n.label;

  const desc = document.createElement('div');
  desc.className = 'pd-neuron-desc';
  desc.textContent = n.desc;

  const weightSec = document.createElement('div');
  weightSec.className = 'pd-weight-section';
  const wRow = document.createElement('div');
  wRow.className = 'pd-weight-row';
  wRow.innerHTML = `<span class="pd-wlabel">Neuron weight</span><span class="pd-wval" id="pd-wval">${n.weight.toFixed(2)}</span>`;
  const slider = document.createElement('input');
  slider.type = 'range'; slider.className = 'pd-slider';
  slider.min = n.min; slider.max = n.max; slider.step = n.step; slider.value = n.weight;
  slider.addEventListener('input', () => {
    const wval = document.getElementById('pd-wval');
    if (wval) wval.textContent = parseFloat(slider.value).toFixed(2);
  });
  const rec = document.createElement('div');
  rec.className = 'pd-recommend';
  rec.innerHTML = `Recommended: <span>${n.recommended.toFixed(2)}</span>`;
  weightSec.append(wRow, slider, rec);

  const applyBtn = document.createElement('button');
  applyBtn.className = 'pd-apply-btn';
  applyBtn.textContent = n.action + ' →';
  applyBtn.addEventListener('click', () => {
    pdState.pendingAction = { type: 'fix', neuronType: type };
    pdCheckPremium();
  });

  nv.append(back, idRow, name, desc, weightSec, applyBtn);
}

function pdMakeBackBtn() {
  const btn = document.createElement('button');
  btn.className = 'pd-back-btn';
  btn.textContent = '← Back to overview';
  btn.addEventListener('click', pdShowFlagsView);
  return btn;
}

function pdCheckPremium() {
  if (pdState.premium) { pdExecutePendingAction(); } else { pdShowPaywall(); }
}

function pdShowPaywall() {
  const pw   = document.getElementById('pd-paywall');
  const card = document.getElementById('pd-pw-card');
  if (!pw || !card) return;
  const p = PD_PRICING[pdState.model] || { params: '?B params', monthly: '$15,000', label: 'Small' };
  card.innerHTML = `
    <button class="pd-pw-close" id="pd-pw-close">×</button>
    <div class="pd-pw-lock">🔒</div>
    <h3 class="pd-pw-title">Periodica Premium Required</h3>
    <p class="pd-pw-sub">Steering and editing tools require a Premium plan.</p>
    <div class="pd-pw-plan-box">
      <div class="pd-pw-plan-info">
        <span class="pd-pw-model-chip">${pdState.model}</span>
        <span class="pd-pw-params">${p.params}</span>
      </div>
      <div class="pd-pw-plan-price">
        <span class="pd-pw-price-amt">${p.monthly}</span>
        <span class="pd-pw-price-mo">/mo</span>
      </div>
    </div>
    <ul class="pd-pw-features">
      <li>Unlimited neuron weight editing</li>
      <li>PII removal &amp; privacy scrubbing</li>
      <li>Bias detection &amp; correction</li>
      <li>IP training data detection &amp; removal</li>
      <li>Continuous model monitoring</li>
    </ul>
    <button class="pd-pw-btn" id="pd-pw-activate">Activate Premium — ${p.monthly}/mo</button>
    <p class="pd-pw-free-note">First audit always free. Cancel anytime.</p>`;
  pw.style.display = 'flex';
  document.getElementById('pd-pw-close').addEventListener('click', () => { pw.style.display = 'none'; });
  document.getElementById('pd-pw-activate').addEventListener('click', pdActivatePremium);
}

function pdActivatePremium() {
  const card = document.getElementById('pd-pw-card');
  if (!card) return;
  card.innerHTML = `<div class="pd-pw-activating"><div class="pd-pw-spinner"></div><p>Activating Premium…</p></div>`;
  setTimeout(() => {
    card.innerHTML = `
      <div class="pd-pw-success">
        <div class="pd-pw-success-icon">✓</div>
        <h3 class="pd-pw-success-title">Premium Activated!</h3>
        <p class="pd-pw-success-msg">You now have full access to all steering, editing, and removal tools.</p>
        <button class="pd-pw-btn" id="pd-pw-continue">Continue →</button>
      </div>`;
    document.getElementById('pd-pw-continue').addEventListener('click', () => {
      const pw = document.getElementById('pd-paywall');
      if (pw) pw.style.display = 'none';
      pdState.premium = true;
      pdShowPremiumBadge();
      pdExecutePendingAction();
    });
  }, 1400);
}

function pdShowPremiumBadge() {
  const banner = document.getElementById('pd-premium-banner');
  if (banner) banner.style.display = 'flex';
  const demo = document.getElementById('periodica-demo');
  if (demo) demo.classList.add('pd-premium-active');
}

function pdExecutePendingAction() {
  const action = pdState.pendingAction;
  pdState.pendingAction = null;
  if (!action) return;
  if (action.type === 'fix') pdApplyFix(action.neuronType);
  else if (action.type === 'ip') pdApplyIPFix();
}

function pdApplyFix(type) {
  pdState.fixed.add(type);
  const n = PD_NEURONS.find(x => x.type === type);

  const dot = document.getElementById(`pd-neuron-${type}`);
  if (dot) { dot.className = 'pd-neuron pd-n-fixed'; dot.onclick = null; dot.style.cursor = 'default'; dot.title = `${n.id} · ${n.label} ✓ Fixed`; }

  const item = document.getElementById(`pd-flag-${type}`);
  if (item && n) {
    item.className = 'pd-flag-item pd-flag-done';
    item.innerHTML = `<span class="pd-fdot" style="background:var(--primary);"></span><div class="pd-finfo"><div class="pd-fid">${n.id}</div><div class="pd-fname">${n.label}</div></div><span class="pd-ffixed">✓ FIXED</span>`;
    item.onclick = null;
  }

  pdSwitchDetailView('pd-neuron-view');
  const nv = document.getElementById('pd-neuron-view');
  if (nv && n) {
    nv.innerHTML = '';
    const fixed = document.createElement('div');
    fixed.className = 'pd-fixed-state';
    fixed.innerHTML = `<div class="pd-fixed-icon">✓</div><div class="pd-fixed-name">${n.label}</div><div class="pd-fixed-msg">${n.fixMsg}</div>`;
    nv.append(pdMakeBackBtn(), fixed);
  }

  if (pdState.fixed.size === PD_NEURONS.length && (!pdState.ipSearchDone || pdState.ipFixed)) setTimeout(pdAllClear, 800);
}

function pdApplyIPFix() {
  pdState.ipFixed = true;
  PD_IP_POS.forEach(key => {
    const el = document.getElementById(`pd-ip-${key.replace('-', '_')}`);
    if (el) { el.className = 'pd-neuron pd-n-fixed'; el.onclick = null; el.style.cursor = 'default'; }
  });
  const item = document.getElementById('pd-flag-ip');
  if (item) {
    item.className = 'pd-flag-item pd-flag-done';
    item.innerHTML = `<span class="pd-fdot" style="background:var(--primary);"></span><div class="pd-finfo"><div class="pd-fid">N-789, N-401, N-233</div><div class="pd-fname">IP-Protected Training Data</div></div><span class="pd-ffixed">✓ FIXED</span>`;
    item.onclick = null;
  }
  pdSwitchDetailView('pd-search-view');
  const sv = document.getElementById('pd-search-view');
  if (sv) {
    sv.innerHTML = `
      <button class="pd-back-btn" id="pd-sv-back">← Back to overview</button>
      <div class="pd-fixed-state">
        <div class="pd-fixed-icon">✓</div>
        <div class="pd-fixed-name">IP-Protected Training Data</div>
        <div class="pd-fixed-msg">All traces of copyrighted content removed. The model can no longer reproduce protected text verbatim.</div>
      </div>`;
    document.getElementById('pd-sv-back').addEventListener('click', pdShowFlagsView);
  }
  if (pdState.fixed.size === PD_NEURONS.length) setTimeout(pdAllClear, 800);
}

function pdAllClear() {
  const fv = document.getElementById('pd-flags-view');
  if (!fv || fv.querySelector('.pd-all-clear')) return;
  pdShowFlagsView();
  const box = document.createElement('div');
  box.className = 'pd-all-clear';
  box.innerHTML = '<div class="pd-all-clear-title">✓ Model fully audited &amp; hardened</div><div class="pd-all-clear-sub">All flagged neurons resolved. Ready for deployment.</div>';
  fv.appendChild(box);
}

document.addEventListener('DOMContentLoaded', initPeriodica);
