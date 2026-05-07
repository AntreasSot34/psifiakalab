/* ==========================================================================
   Multiplexers & Demultiplexers - Interactive Simulators
   1. MUX 4-to-1 / 8-to-1 with SVG flow visualization
   2. DEMUX 1-to-4 / 1-to-8
   3. Boolean function via MUX (truth table -> wiring)
   ========================================================================== */

(function() {
  'use strict';

  function cssColor(name, fallback) {
    return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
  }

  /* ============================================================
     1. MULTIPLEXER (MUX)
     ============================================================ */
  (function multiplexer() {
    const sizeSel = document.getElementById('mux-size');
    const DRowEl = document.getElementById('mux-D-row');
    const SRowEl = document.getElementById('mux-S-row');
    const SValEl = document.getElementById('mux-Sval');
    const SDecEl = document.getElementById('mux-Sdec');
    const DSelEl = document.getElementById('mux-Dsel');
    const YEl = document.getElementById('mux-Y');
    const svg = document.getElementById('mux-svg');
    
    if (!sizeSel || !svg) return;
    
    let size = 4;
    let nSelect = 2;
    let D = [0, 0, 0, 0, 0, 0, 0, 0]; // 8 inputs (only first `size` used)
    let S = [0, 0, 0]; // 3 select bits (only first `nSelect` used)
    
    function buildDRow() {
      DRowEl.innerHTML = '';
      for (let i = 0; i < size; i++) {
        const c = document.createElement('div');
        c.className = 'bit-toggle';
        c.innerHTML = `
          <span class="bit-toggle-label">D${i}</span>
          <button class="bit-btn" data-idx="${i}" data-bit="${D[i]}">${D[i]}</button>
        `;
        DRowEl.appendChild(c);
      }
      DRowEl.querySelectorAll('.bit-btn').forEach(btn => {
        const i = parseInt(btn.dataset.idx, 10);
        btn.classList.toggle('is-high', D[i] === 1);
        btn.addEventListener('click', () => {
          D[i] = 1 - D[i];
          btn.dataset.bit = D[i];
          btn.textContent = D[i];
          btn.classList.toggle('is-high', D[i] === 1);
          update();
        });
      });
    }
    
    function buildSRow() {
      SRowEl.innerHTML = '';
      for (let i = nSelect - 1; i >= 0; i--) {
        const c = document.createElement('div');
        c.className = 'bit-toggle';
        c.innerHTML = `
          <span class="bit-toggle-label" style="color:var(--c-secondary);">S${i}</span>
          <button class="bit-btn" data-idx="${i}" data-bit="${S[i]}" style="border-color:var(--c-secondary);box-shadow:3px 3px 0 var(--c-secondary);">${S[i]}</button>
        `;
        SRowEl.appendChild(c);
      }
      SRowEl.querySelectorAll('.bit-btn').forEach(btn => {
        const i = parseInt(btn.dataset.idx, 10);
        btn.classList.toggle('is-high', S[i] === 1);
        btn.addEventListener('click', () => {
          S[i] = 1 - S[i];
          btn.dataset.bit = S[i];
          btn.textContent = S[i];
          btn.classList.toggle('is-high', S[i] === 1);
          update();
        });
      });
    }
    
    function update() {
      size = parseInt(sizeSel.value, 10);
      nSelect = Math.log2(size);
      
      // Reset bits beyond current size
      for (let i = size; i < 8; i++) D[i] = 0;
      for (let i = nSelect; i < 3; i++) S[i] = 0;
      
      if (DRowEl.children.length !== size) {
        buildDRow();
        buildSRow();
      }
      
      // Compute select index
      let idx = 0;
      for (let i = 0; i < nSelect; i++) idx += S[i] * Math.pow(2, i);
      
      // Build binary string MSB first
      let SStr = '';
      for (let i = nSelect - 1; i >= 0; i--) SStr += S[i];
      
      const Y = D[idx];
      
      SValEl.textContent = SStr;
      SDecEl.textContent = idx;
      DSelEl.textContent = 'D' + idx + ' = ' + D[idx];
      YEl.textContent = Y;
      YEl.style.color = Y === 1 ? 'var(--c-high)' : 'var(--c-low)';
      
      drawSVG(idx, Y);
    }
    
    function drawSVG(activeIdx, Y) {
      const colInk = cssColor('--c-ink', '#1a1d2e');
      const colMuted = cssColor('--c-muted', '#8b8fa8');
      const colHigh = cssColor('--c-high', '#16a34a');
      const colLow = cssColor('--c-low', '#ef4444');
      const colPrimary = cssColor('--c-primary', '#ff5c39');
      const colSec = cssColor('--c-secondary', '#2563eb');
      
      // Box dimensions
      const boxX = 240, boxW = 120;
      const boxY = 50, boxH = 280;
      
      let html = '';
      
      // Draw lines from D inputs to box
      const inputSpacing = (boxH - 30) / (size - 1);
      for (let i = 0; i < size; i++) {
        const yPos = boxY + 15 + i * inputSpacing;
        const isActive = i === activeIdx;
        const lineColor = isActive ? (D[i] === 1 ? colHigh : colLow) : colMuted;
        const lineWidth = isActive ? 3 : 1.5;
        const opacity = isActive ? 1 : 0.5;
        
        // Line from left edge to box
        html += `<line x1="60" y1="${yPos}" x2="${boxX}" y2="${yPos}" stroke="${lineColor}" stroke-width="${lineWidth}" opacity="${opacity}"/>`;
        // D input label
        html += `<text x="20" y="${yPos + 5}" font-family="JetBrains Mono, monospace" font-size="14" font-weight="700" fill="${colInk}">D${i}=${D[i]}</text>`;
        // Circle at line start
        html += `<circle cx="60" cy="${yPos}" r="4" fill="${D[i] === 1 ? colHigh : colLow}"/>`;
      }
      
      // MUX box
      html += `<rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" fill="rgba(255,92,57,0.08)" stroke="${colInk}" stroke-width="3" rx="14"/>`;
      html += `<text x="${boxX + boxW/2}" y="${boxY + boxH/2 - 10}" text-anchor="middle" font-family="Bricolage Grotesque, serif" font-size="22" font-weight="800" fill="${colInk}">MUX</text>`;
      html += `<text x="${boxX + boxW/2}" y="${boxY + boxH/2 + 12}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="14" font-weight="600" fill="${colMuted}">${size}-σε-1</text>`;
      
      // Output line
      const outY = boxY + boxH / 2;
      const outColor = Y === 1 ? colHigh : colLow;
      html += `<line x1="${boxX + boxW}" y1="${outY}" x2="540" y2="${outY}" stroke="${outColor}" stroke-width="3"/>`;
      html += `<circle cx="540" cy="${outY}" r="6" fill="${outColor}" stroke="${colInk}" stroke-width="2"/>`;
      html += `<text x="555" y="${outY + 5}" font-family="Bricolage Grotesque, serif" font-size="18" font-weight="800" fill="${colInk}">Y=${Y}</text>`;
      
      // Select lines (from bottom)
      const sStartX = boxX + boxW / 2 - (nSelect - 1) * 15;
      for (let i = 0; i < nSelect; i++) {
        const xPos = sStartX + i * 30;
        html += `<line x1="${xPos}" y1="${boxY + boxH}" x2="${xPos}" y2="380" stroke="${colSec}" stroke-width="2"/>`;
        html += `<text x="${xPos}" y="395" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700" fill="${colSec}">S${nSelect - 1 - i}=${S[nSelect - 1 - i]}</text>`;
      }
      
      svg.innerHTML = html;
    }
    
    sizeSel.addEventListener('change', update);
    update();
  })();

  /* ============================================================
     2. DEMULTIPLEXER (DEMUX)
     ============================================================ */
  (function demultiplexer() {
    const sizeSel = document.getElementById('demux-size');
    const DRowEl = document.getElementById('demux-D-row');
    const SRowEl = document.getElementById('demux-S-row');
    const DValEl = document.getElementById('demux-Dval');
    const SValEl = document.getElementById('demux-Sval');
    const YActiveEl = document.getElementById('demux-Yactive');
    const YRowEl = document.getElementById('demux-Y-row');
    
    if (!sizeSel) return;
    
    let size = 4;
    let nSelect = 2;
    let D = 0;
    let S = [0, 0, 0];
    
    function buildDRow() {
      DRowEl.innerHTML = '';
      const c = document.createElement('div');
      c.className = 'bit-toggle';
      c.innerHTML = `
        <span class="bit-toggle-label">D</span>
        <button class="bit-btn" id="demux-D-btn" data-bit="${D}">${D}</button>
      `;
      DRowEl.appendChild(c);
      const btn = document.getElementById('demux-D-btn');
      btn.classList.toggle('is-high', D === 1);
      btn.addEventListener('click', () => {
        D = 1 - D;
        btn.dataset.bit = D;
        btn.textContent = D;
        btn.classList.toggle('is-high', D === 1);
        update();
      });
    }
    
    function buildSRow() {
      SRowEl.innerHTML = '';
      for (let i = nSelect - 1; i >= 0; i--) {
        const c = document.createElement('div');
        c.className = 'bit-toggle';
        c.innerHTML = `
          <span class="bit-toggle-label" style="color:var(--c-secondary);">S${i}</span>
          <button class="bit-btn" data-idx="${i}" data-bit="${S[i]}" style="border-color:var(--c-secondary);box-shadow:3px 3px 0 var(--c-secondary);">${S[i]}</button>
        `;
        SRowEl.appendChild(c);
      }
      SRowEl.querySelectorAll('.bit-btn').forEach(btn => {
        const i = parseInt(btn.dataset.idx, 10);
        btn.classList.toggle('is-high', S[i] === 1);
        btn.addEventListener('click', () => {
          S[i] = 1 - S[i];
          btn.dataset.bit = S[i];
          btn.textContent = S[i];
          btn.classList.toggle('is-high', S[i] === 1);
          update();
        });
      });
    }
    
    function buildYRow(activeIdx) {
      YRowEl.innerHTML = '';
      for (let i = 0; i < size; i++) {
        const isActive = i === activeIdx;
        const val = isActive ? D : 0;
        const c = document.createElement('div');
        c.className = 'output-led-mini';
        c.innerHTML = `
          <span class="output-led-mini-label">Y<sub>${i}</sub></span>
          <div class="led-mini ${val === 1 ? 'is-high' : ''}">${val}</div>
        `;
        YRowEl.appendChild(c);
      }
    }
    
    function update() {
      size = parseInt(sizeSel.value, 10);
      nSelect = Math.log2(size);
      
      for (let i = nSelect; i < 3; i++) S[i] = 0;
      
      if (DRowEl.children.length === 0) buildDRow();
      if (SRowEl.children.length !== nSelect) buildSRow();
      
      let idx = 0;
      for (let i = 0; i < nSelect; i++) idx += S[i] * Math.pow(2, i);
      
      let SStr = '';
      for (let i = nSelect - 1; i >= 0; i--) SStr += S[i];
      
      DValEl.textContent = D;
      DValEl.style.color = D === 1 ? 'var(--c-high)' : 'var(--c-low)';
      SValEl.textContent = SStr;
      YActiveEl.textContent = 'Y' + idx + ' = ' + D;
      
      buildYRow(idx);
    }
    
    sizeSel.addEventListener('change', update);
    update();
  })();

  /* ============================================================
     3. BOOLEAN FUNCTION via MUX
     ============================================================ */
  (function booleanMux() {
    const tableEl = document.getElementById('bool-table');
    const testRowEl = document.getElementById('bool-test-row');
    const ABCEl = document.getElementById('bool-ABC');
    const DSelEl = document.getElementById('bool-Dsel');
    const YEl = document.getElementById('bool-Y');
    const andBtn = document.getElementById('bool-and');
    const orBtn = document.getElementById('bool-or');
    const xorBtn = document.getElementById('bool-xor');
    const clearBtn = document.getElementById('bool-clear');
    
    if (!tableEl) return;
    
    // Y values for each (A,B,C) combination, indexed 0-7 (where index = ABC binary)
    let Y_table = [0, 0, 0, 0, 0, 0, 0, 0];
    let testABC = [0, 0, 0]; // [A, B, C]
    
    function buildTable() {
      const tbody = tableEl.querySelector('tbody');
      tbody.innerHTML = '';
      for (let i = 0; i < 8; i++) {
        const A = (i >> 2) & 1;
        const B = (i >> 1) & 1;
        const C = i & 1;
        const tr = document.createElement('tr');
        tr.dataset.idx = i;
        tr.innerHTML = `
          <td>${A}</td>
          <td>${B}</td>
          <td>${C}</td>
          <td><button class="bit-btn" data-idx="${i}" style="width:36px;height:36px;font-size:1rem;">${Y_table[i]}</button></td>
          <td class="mono"><strong>${Y_table[i] === 1 ? 'D' + i + ' → VCC' : 'D' + i + ' → GND'}</strong></td>
        `;
        tbody.appendChild(tr);
      }
      tbody.querySelectorAll('.bit-btn').forEach(btn => {
        const i = parseInt(btn.dataset.idx, 10);
        btn.classList.toggle('is-high', Y_table[i] === 1);
        btn.addEventListener('click', () => {
          Y_table[i] = 1 - Y_table[i];
          buildTable();
          update();
        });
      });
    }
    
    function buildTestRow() {
      testRowEl.innerHTML = '';
      const labels = ['A', 'B', 'C']; // [0]=A (S2), [1]=B (S1), [2]=C (S0)
      for (let i = 0; i < 3; i++) {
        const c = document.createElement('div');
        c.className = 'bit-toggle';
        c.innerHTML = `
          <span class="bit-toggle-label" style="color:var(--c-secondary);">${labels[i]}</span>
          <button class="bit-btn" data-idx="${i}" data-bit="${testABC[i]}" style="border-color:var(--c-secondary);box-shadow:3px 3px 0 var(--c-secondary);">${testABC[i]}</button>
        `;
        testRowEl.appendChild(c);
      }
      testRowEl.querySelectorAll('.bit-btn').forEach(btn => {
        const i = parseInt(btn.dataset.idx, 10);
        btn.classList.toggle('is-high', testABC[i] === 1);
        btn.addEventListener('click', () => {
          testABC[i] = 1 - testABC[i];
          btn.dataset.bit = testABC[i];
          btn.textContent = testABC[i];
          btn.classList.toggle('is-high', testABC[i] === 1);
          update();
        });
      });
    }
    
    function update() {
      // Index in table: A is MSB, C is LSB
      const A = testABC[0];
      const B = testABC[1];
      const C = testABC[2];
      const idx = (A << 2) | (B << 1) | C;
      const Y = Y_table[idx];
      
      ABCEl.textContent = '' + A + B + C;
      DSelEl.textContent = 'D' + idx + ' = ' + Y;
      YEl.textContent = Y;
      YEl.style.color = Y === 1 ? 'var(--c-high)' : 'var(--c-low)';
      
      // Highlight active row in table
      tableEl.querySelectorAll('tbody tr').forEach(tr => {
        tr.classList.toggle('is-active', parseInt(tr.dataset.idx, 10) === idx);
      });
    }
    
    function setFunction(fn) {
      for (let i = 0; i < 8; i++) {
        const A = (i >> 2) & 1;
        const B = (i >> 1) & 1;
        const C = i & 1;
        Y_table[i] = fn(A, B, C);
      }
      buildTable();
      update();
    }
    
    andBtn.addEventListener('click', () => setFunction((A, B, C) => A & B & C));
    orBtn.addEventListener('click', () => setFunction((A, B, C) => A | B | C));
    xorBtn.addEventListener('click', () => setFunction((A, B, C) => A ^ B ^ C));
    clearBtn.addEventListener('click', () => setFunction(() => 0));
    
    buildTable();
    buildTestRow();
    update();
  })();

})();
