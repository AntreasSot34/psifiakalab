/* ==========================================================================
   Comparators - Interactive Simulators
   1. 1-bit Digital Comparator with truth table highlight
   2. N-bit Digital Comparator with algorithm explanation
   3. Voltage Comparator (op-amp) - sine vs reference
   ========================================================================== */

(function() {
  'use strict';

  function cssColor(name, fallback) {
    return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
  }

  /* ============================================================
     1. 1-BIT DIGITAL COMPARATOR
     ============================================================ */
  (function comp1bit() {
    const btnA = document.getElementById('c1-A');
    const btnB = document.getElementById('c1-B');
    const ledX = document.getElementById('c1-X');
    const ledY = document.getElementById('c1-Y');
    const ledZ = document.getElementById('c1-Z');
    const status = document.getElementById('c1-status');
    const table = document.getElementById('c1-table');
    
    if (!btnA || !btnB) return;
    
    function setBit(btn, val) {
      btn.dataset.bit = val;
      btn.textContent = val;
      btn.classList.toggle('is-high', val === 1);
    }
    function setLed(led, val) {
      led.textContent = val;
      led.classList.toggle('is-high', val === 1);
    }
    
    function update() {
      const A = parseInt(btnA.dataset.bit, 10);
      const B = parseInt(btnB.dataset.bit, 10);
      
      const X = (A === 1 && B === 0) ? 1 : 0; // A > B
      const Y = (A === B) ? 1 : 0;             // A = B
      const Z = (A === 0 && B === 1) ? 1 : 0; // A < B
      
      setLed(ledX, X);
      setLed(ledY, Y);
      setLed(ledZ, Z);
      
      // Status
      let txt, color;
      if (X) { txt = 'A &gt; B → <span style="color:var(--c-primary);">A μεγαλύτερο</span>'; }
      else if (Z) { txt = 'A &lt; B → <span style="color:var(--c-secondary);">B μεγαλύτερο</span>'; }
      else { txt = 'A = B → <span style="color:var(--c-tertiary);">Ίσα</span>'; }
      status.innerHTML = txt;
      
      // Highlight table row
      table.querySelectorAll('tbody tr').forEach(row => {
        row.classList.toggle('is-active',
          parseInt(row.dataset.a, 10) === A && parseInt(row.dataset.b, 10) === B);
      });
    }
    
    [btnA, btnB].forEach(btn => {
      btn.addEventListener('click', () => {
        setBit(btn, 1 - parseInt(btn.dataset.bit, 10));
        update();
      });
    });
    
    update();
  })();

  /* ============================================================
     2. N-BIT DIGITAL COMPARATOR
     ============================================================ */
  (function compNbit() {
    const bitsSlider = document.getElementById('cn-bits');
    const bitsOut = document.getElementById('cn-bits-val');
    const ARowEl = document.getElementById('cn-A-row');
    const BRowEl = document.getElementById('cn-B-row');
    const ADecEl = document.getElementById('cn-Adec');
    const BDecEl = document.getElementById('cn-Bdec');
    const relEl = document.getElementById('cn-rel');
    const ledX = document.getElementById('cn-X');
    const ledY = document.getElementById('cn-Y');
    const ledZ = document.getElementById('cn-Z');
    const stepsEl = document.getElementById('cn-steps');
    const randomBtn = document.getElementById('cn-random');
    const resetBtn = document.getElementById('cn-reset');
    
    if (!bitsSlider) return;
    
    let bits = 3;
    let A = [0, 0, 0, 0]; // bit 0 = LSB, bit 3 = MSB
    let B = [0, 0, 0, 0];
    
    function buildRow(rowEl, prefix, vals) {
      rowEl.innerHTML = '';
      // From MSB to LSB visually
      for (let i = bits - 1; i >= 0; i--) {
        const c = document.createElement('div');
        c.className = 'bit-toggle';
        c.innerHTML = `
          <span class="bit-toggle-label">${prefix}${i}${i === bits - 1 ? '<sub style="font-size:.7em;color:var(--c-muted)">MSB</sub>' : ''}</span>
          <button class="bit-btn" data-prefix="${prefix}" data-idx="${i}" data-bit="${vals[i]}">${vals[i]}</button>
        `;
        rowEl.appendChild(c);
      }
      rowEl.querySelectorAll('.bit-btn').forEach(btn => {
        const i = parseInt(btn.dataset.idx, 10);
        const target = btn.dataset.prefix === 'A' ? A : B;
        btn.classList.toggle('is-high', target[i] === 1);
        btn.addEventListener('click', () => {
          target[i] = 1 - target[i];
          btn.dataset.bit = target[i];
          btn.textContent = target[i];
          btn.classList.toggle('is-high', target[i] === 1);
          update();
        });
      });
    }
    
    function syncBits(rowEl, prefix, vals) {
      rowEl.querySelectorAll('.bit-btn').forEach(btn => {
        const i = parseInt(btn.dataset.idx, 10);
        btn.dataset.bit = vals[i];
        btn.textContent = vals[i];
        btn.classList.toggle('is-high', vals[i] === 1);
      });
    }
    
    function getDec(arr) {
      let v = 0;
      for (let i = 0; i < bits; i++) {
        if (arr[i]) v += Math.pow(2, i);
      }
      return v;
    }
    
    function setLed(led, val) {
      led.textContent = val;
      led.classList.toggle('is-high', val === 1);
    }
    
    function update() {
      bits = parseInt(bitsSlider.value, 10);
      bitsOut.textContent = bits + ' bits';
      
      // Reset bits beyond current size
      for (let i = bits; i < 4; i++) { A[i] = 0; B[i] = 0; }
      
      if (ARowEl.children.length !== bits) {
        buildRow(ARowEl, 'A', A);
        buildRow(BRowEl, 'B', B);
      }
      
      const ADec = getDec(A);
      const BDec = getDec(B);
      ADecEl.textContent = ADec;
      BDecEl.textContent = BDec;
      
      const X = ADec > BDec ? 1 : 0;
      const Y = ADec === BDec ? 1 : 0;
      const Z = ADec < BDec ? 1 : 0;
      
      setLed(ledX, X);
      setLed(ledY, Y);
      setLed(ledZ, Z);
      
      // Relation
      if (X) relEl.innerHTML = '<span style="color:var(--c-primary);">A &gt; B</span>';
      else if (Z) relEl.innerHTML = '<span style="color:var(--c-secondary);">A &lt; B</span>';
      else relEl.innerHTML = '<span style="color:var(--c-tertiary);">A = B</span>';
      
      // Algorithm explanation: compare from MSB
      const steps = [];
      let decided = false;
      for (let i = bits - 1; i >= 0; i--) {
        if (decided) break;
        const aBit = A[i], bBit = B[i];
        if (aBit === bBit) {
          steps.push(`bit ${i}: A${i}=${aBit}, B${i}=${bBit} → ίσα, συνέχισε...`);
        } else if (aBit > bBit) {
          steps.push(`bit ${i}: A${i}=${aBit}, B${i}=${bBit} → A${i}=1 → <strong>A &gt; B ✓</strong>`);
          decided = true;
        } else {
          steps.push(`bit ${i}: A${i}=${aBit}, B${i}=${bBit} → B${i}=1 → <strong>A &lt; B ✓</strong>`);
          decided = true;
        }
      }
      if (!decided) steps.push('Όλα τα bits ίδια → <strong>A = B ✓</strong>');
      
      stepsEl.innerHTML = steps.map(s => '<div>' + s + '</div>').join('');
    }
    
    bitsSlider.addEventListener('input', () => {
      A = [0, 0, 0, 0];
      B = [0, 0, 0, 0];
      update();
    });
    
    randomBtn.addEventListener('click', () => {
      for (let i = 0; i < bits; i++) {
        A[i] = Math.round(Math.random());
        B[i] = Math.round(Math.random());
      }
      syncBits(ARowEl, 'A', A);
      syncBits(BRowEl, 'B', B);
      update();
    });
    
    resetBtn.addEventListener('click', () => {
      A = [0, 0, 0, 0];
      B = [0, 0, 0, 0];
      syncBits(ARowEl, 'A', A);
      syncBits(BRowEl, 'B', B);
      update();
    });
    
    update();
  })();

  /* ============================================================
     3. VOLTAGE COMPARATOR (Op-Amp)
     ============================================================ */
  (function voltageComp() {
    const vrefSlider = document.getElementById('vc-Vref');
    const vplusSlider = document.getElementById('vc-Vplus');
    const vampSlider = document.getElementById('vc-Vamp');
    const vrefOut = document.getElementById('vc-Vref-val');
    const vplusOut = document.getElementById('vc-Vplus-val');
    const vampOut = document.getElementById('vc-Vamp-val');
    const vinEl = document.getElementById('vc-Vin');
    const vrefOutEl = document.getElementById('vc-Vref-out');
    const dutyEl = document.getElementById('vc-duty');
    const canvas = document.getElementById('vc-canvas');
    
    if (!vrefSlider || !canvas) return;
    
    function update() {
      let vref = parseFloat(vrefSlider.value);
      const vplus = parseFloat(vplusSlider.value);
      const vminus = -vplus;
      const vamp = parseFloat(vampSlider.value);
      
      // Clamp Vref to ±vamp range for visibility
      if (vref > vamp) vref = vamp;
      if (vref < -vamp) vref = -vamp;
      
      vrefOut.textContent = vref.toFixed(1) + ' V';
      vplusOut.textContent = '+' + vplus + ' V';
      vampOut.textContent = vamp + ' V';
      vinEl.textContent = '±' + vamp + ' V';
      vrefOutEl.textContent = vref.toFixed(1) + ' V';
      
      // Compute duty cycle: fraction of sine where sin > vref/vamp
      const ratio = vref / vamp;
      let duty;
      if (ratio >= 1) duty = 0;
      else if (ratio <= -1) duty = 100;
      else {
        // Time fraction where sin(t) > ratio
        // sin(t) = ratio at t = asin(ratio); the sine is above ratio for time [pi - asin, asin] (mirrored)
        // Actually: sin(t) > ratio for t in (asin, pi-asin) within one period [0, 2pi]
        const a = Math.asin(ratio);
        const aboveTime = Math.PI - 2 * a; // duration above ratio
        duty = (aboveTime / (2 * Math.PI)) * 100;
      }
      dutyEl.textContent = duty.toFixed(0) + '%';
      
      draw(vref, vplus, vminus, vamp);
    }
    
    function draw(vref, vplus, vminus, vamp) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      const colInk = cssColor('--c-ink', '#1a1d2e');
      const colMuted = cssColor('--c-muted', '#8b8fa8');
      const colSec = cssColor('--c-secondary', '#2563eb');
      const colPrimary = cssColor('--c-primary', '#ff5c39');
      const colHigh = cssColor('--c-high', '#16a34a');
      
      const padL = 60, padR = 20, padT = 25, padB = 35;
      const plotH = h - padT - padB;
      
      // Two sections: top 65% for V_in (analog), bottom 30% for V_out (digital)
      const inSec = plotH * 0.65;
      const outSec = plotH * 0.30;
      const inY0 = padT + inSec / 2; // y for 0V in input section
      const inScale = (inSec / 2) / vamp; // px per volt for input area
      
      const outYHigh = padT + inSec + 15;
      const outYLow = h - padB - 5;
      const outScale = (outYLow - outYHigh) / 2; // px per (vplus - vminus) range / 2
      
      // Background grid for input
      ctx.strokeStyle = colMuted;
      ctx.globalAlpha = 0.12;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      // 0V line
      ctx.beginPath();
      ctx.moveTo(padL, inY0);
      ctx.lineTo(w - padR, inY0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      
      // V_ref line (across input section)
      const yRef = inY0 - vref * inScale;
      ctx.strokeStyle = colPrimary;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, yRef);
      ctx.lineTo(w - padR, yRef);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // V_ref label
      ctx.fillStyle = colPrimary;
      ctx.font = '700 12px JetBrains Mono, monospace';
      ctx.fillText('V_ref = ' + vref.toFixed(1) + 'V', w - padR - 110, yRef - 4);
      
      // Generate sine wave V_in
      const NUM_PTS = 400;
      const cycles = 2.5;
      const xStep = (w - padL - padR) / (NUM_PTS - 1);
      
      // Draw V_in (sine, blue)
      ctx.strokeStyle = colSec;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const inputVals = [];
      for (let i = 0; i < NUM_PTS; i++) {
        const t = (i / NUM_PTS) * cycles * 2 * Math.PI;
        const v = vamp * Math.sin(t);
        inputVals.push(v);
        const x = padL + i * xStep;
        const y = inY0 - v * inScale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Voltage axis for input
      ctx.fillStyle = colMuted;
      ctx.font = '600 10px JetBrains Mono, monospace';
      const inputTicks = [-vamp, 0, vamp];
      inputTicks.forEach(v => {
        const y = inY0 - v * inScale;
        ctx.fillText((v >= 0 ? '+' : '') + v.toFixed(0) + 'V', 8, y + 3);
        // Tick mark
        ctx.strokeStyle = colMuted;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL - 4, y);
        ctx.lineTo(padL, y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
      
      // Track labels
      ctx.fillStyle = colSec;
      ctx.font = '700 12px Bricolage Grotesque, serif';
      ctx.fillText('V_in (αναλογικό)', padL, padT - 8);
      
      // Draw V_out (square, orange)
      ctx.strokeStyle = colPrimary;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let prevY = inputVals[0] > vref ? outYHigh : outYLow;
      ctx.moveTo(padL, prevY);
      for (let i = 1; i < NUM_PTS; i++) {
        const x = padL + i * xStep;
        const y = inputVals[i] > vref ? outYHigh : outYLow;
        if (y !== prevY) {
          ctx.lineTo(x, prevY);
          ctx.lineTo(x, y);
          prevY = y;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      // Output labels
      ctx.fillStyle = colMuted;
      ctx.font = '600 10px JetBrains Mono, monospace';
      ctx.fillText('+' + vplus + 'V', 8, outYHigh + 3);
      ctx.fillText(vminus + 'V', 8, outYLow + 3);
      
      ctx.fillStyle = colPrimary;
      ctx.font = '700 12px Bricolage Grotesque, serif';
      ctx.fillText('V_out (ψηφιακό)', padL, outYHigh - 8);
      
      // Time axis
      ctx.fillStyle = colMuted;
      ctx.font = '600 11px JetBrains Mono, monospace';
      ctx.fillText('χρόνος →', w - padR - 60, h - 8);
    }
    
    [vrefSlider, vplusSlider, vampSlider].forEach(s => s.addEventListener('input', update));
    update();
  })();

})();
