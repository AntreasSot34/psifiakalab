/* ==========================================================================
   DAC / ADC Converters - Interactive Simulators
   1. DAC 4-bit Visualizer (digital -> voltage with staircase)
   2. ADC Sampling Visualization (sine -> samples -> quantized levels)
   3. Resolution Calculator (bits, FS, levels visualization)
   ========================================================================== */

(function() {
  'use strict';

  function cssColor(name, fallback) {
    return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
  }

  /* ============================================================
     1. DAC 4-bit VISUALIZER
     ============================================================ */
  (function dac() {
    const VfsSlider = document.getElementById('dac-Vfs');
    const VfsOut = document.getElementById('dac-Vfs-val');
    const DRowEl = document.getElementById('dac-D-row');
    const binEl = document.getElementById('dac-bin');
    const decEl = document.getElementById('dac-dec');
    const VoutEl = document.getElementById('dac-Vout');
    const resEl = document.getElementById('dac-res');
    const canvas = document.getElementById('dac-canvas');
    
    if (!VfsSlider || !canvas) return;
    
    const N = 4; // 4-bit DAC
    let D = [0, 0, 0, 0]; // D0 (LSB) ... D3 (MSB)
    
    function buildDRow() {
      DRowEl.innerHTML = '';
      // From MSB (D3) to LSB (D0)
      for (let i = N - 1; i >= 0; i--) {
        const c = document.createElement('div');
        c.className = 'bit-toggle';
        c.innerHTML = `
          <span class="bit-toggle-label">D${i}${i === N - 1 ? '<sub style="font-size:.7em;color:var(--c-muted)">MSB</sub>' : (i === 0 ? '<sub style="font-size:.7em;color:var(--c-muted)">LSB</sub>' : '')}</span>
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
    
    function getDecimal() {
      let v = 0;
      for (let i = 0; i < N; i++) if (D[i]) v += Math.pow(2, i);
      return v;
    }
    
    function update() {
      const Vfs = parseFloat(VfsSlider.value);
      VfsOut.textContent = Vfs + ' V';
      
      const dec = getDecimal();
      // Vout = (D / 2^N) * Vfs OR (D / (2^N - 1)) * Vfs
      // We use the formula: Vout = D * Vfs / (2^N - 1) (range is [0, Vfs])
      const maxVal = Math.pow(2, N) - 1;
      const Vout = (dec / maxVal) * Vfs;
      const resolution = Vfs / maxVal;
      
      // Build binary MSB first
      let binStr = '';
      for (let i = N - 1; i >= 0; i--) binStr += D[i];
      
      binEl.textContent = binStr;
      decEl.textContent = dec;
      VoutEl.textContent = Vout.toFixed(3) + ' V';
      resEl.textContent = resolution.toFixed(3) + ' V/βήμα';
      
      drawStaircase(dec, Vfs);
    }
    
    function drawStaircase(currentDec, Vfs) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      const colInk = cssColor('--c-ink', '#1a1d2e');
      const colMuted = cssColor('--c-muted', '#8b8fa8');
      const colPrimary = cssColor('--c-primary', '#ff5c39');
      const colHigh = cssColor('--c-high', '#16a34a');
      
      const padL = 60, padR = 30, padT = 25, padB = 35;
      const plotW = w - padL - padR;
      const plotH = h - padT - padB;
      
      const numLevels = 16;
      const stepW = plotW / numLevels;
      
      // Y axis (voltage, 0 to Vfs)
      const yFor = v => padT + plotH - (v / Vfs) * plotH;
      
      // Draw horizontal grid lines
      ctx.strokeStyle = colMuted;
      ctx.globalAlpha = 0.12;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      for (let i = 0; i <= 5; i++) {
        const v = (Vfs * i) / 5;
        const y = yFor(v);
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      
      // Y axis labels
      ctx.fillStyle = colMuted;
      ctx.font = '600 10px JetBrains Mono, monospace';
      for (let i = 0; i <= 5; i++) {
        const v = (Vfs * i) / 5;
        const y = yFor(v);
        ctx.fillText(v.toFixed(1) + 'V', 8, y + 3);
      }
      
      // Draw axes
      ctx.strokeStyle = colInk;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL, h - padB);
      ctx.lineTo(w - padR, h - padB);
      ctx.stroke();
      
      // Draw all 16 levels as bars
      const maxVal = numLevels - 1;
      for (let i = 0; i < numLevels; i++) {
        const v = (i / maxVal) * Vfs;
        const x = padL + i * stepW;
        const y = yFor(v);
        const isCurrent = i === currentDec;
        
        // Bar
        ctx.fillStyle = isCurrent ? colPrimary : colMuted;
        ctx.globalAlpha = isCurrent ? 1 : 0.35;
        ctx.fillRect(x + 2, y, stepW - 4, h - padB - y);
        ctx.globalAlpha = 1;
        
        // Border
        ctx.strokeStyle = isCurrent ? colInk : colMuted;
        ctx.lineWidth = isCurrent ? 2 : 1;
        ctx.strokeRect(x + 2, y, stepW - 4, h - padB - y);
        
        // Label below: decimal number
        ctx.fillStyle = isCurrent ? colInk : colMuted;
        ctx.font = isCurrent ? '700 11px JetBrains Mono, monospace' : '600 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(i, x + stepW / 2, h - padB + 14);
        
        // Voltage on top (only every other for clarity)
        if (isCurrent) {
          ctx.fillStyle = colPrimary;
          ctx.font = '700 11px JetBrains Mono, monospace';
          ctx.fillText(v.toFixed(2) + 'V', x + stepW / 2, y - 6);
        }
      }
      ctx.textAlign = 'left';
      
      // Title
      ctx.fillStyle = colInk;
      ctx.font = '700 12px Bricolage Grotesque, serif';
      ctx.fillText('V_out vs Ψηφιακή είσοδος', padL, padT - 10);
      ctx.fillStyle = colMuted;
      ctx.font = '600 11px JetBrains Mono, monospace';
      ctx.fillText('Ψηφιακή τιμή →', w - padR - 100, h - 8);
    }
    
    VfsSlider.addEventListener('input', update);
    buildDRow();
    update();
  })();

  /* ============================================================
     2. ADC SAMPLING VISUALIZATION
     ============================================================ */
  (function adcSampling() {
    const bitsSlider = document.getElementById('adc-bits');
    const fsSlider = document.getElementById('adc-fs');
    const fmaxSlider = document.getElementById('adc-fmax');
    const bitsOut = document.getElementById('adc-bits-val');
    const fsOut = document.getElementById('adc-fs-val');
    const fmaxOut = document.getElementById('adc-fmax-val');
    const levelsEl = document.getElementById('adc-levels');
    const errorEl = document.getElementById('adc-error');
    const aliasEl = document.getElementById('adc-alias');
    const canvas = document.getElementById('adc-canvas');
    
    if (!bitsSlider || !canvas) return;
    
    function update() {
      const bits = parseInt(bitsSlider.value, 10);
      const samplesPerCycle = parseInt(fsSlider.value, 10);
      const cycles = parseInt(fmaxSlider.value, 10);
      
      const levels = Math.pow(2, bits);
      const maxError = (100 / levels) / 2; // ±half LSB %
      
      bitsOut.textContent = bits + ' bits (' + levels + ' επίπεδα)';
      fsOut.textContent = samplesPerCycle;
      fmaxOut.textContent = cycles + ' κύκλοι';
      levelsEl.textContent = levels;
      errorEl.textContent = '±' + maxError.toFixed(2) + '%';
      
      // Nyquist check: samples per cycle must be > 2 to avoid aliasing
      if (samplesPerCycle < 4) {
        aliasEl.innerHTML = '⚠️ <span style="color:var(--c-low);">Aliasing!</span>';
      } else if (samplesPerCycle < 8) {
        aliasEl.innerHTML = '⚠️ Οριακό';
        aliasEl.style.color = 'var(--c-quaternary)';
      } else {
        aliasEl.innerHTML = '✅ <span style="color:var(--c-high);">OK</span>';
      }
      
      draw(bits, samplesPerCycle, cycles, levels);
    }
    
    function draw(bits, samplesPerCycle, cycles, levels) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      const colInk = cssColor('--c-ink', '#1a1d2e');
      const colMuted = cssColor('--c-muted', '#8b8fa8');
      const colSec = cssColor('--c-secondary', '#2563eb');
      const colPrimary = cssColor('--c-primary', '#ff5c39');
      const colQuad = cssColor('--c-quaternary', '#f59e0b');
      
      const padL = 60, padR = 30, padT = 25, padB = 35;
      const plotW = w - padL - padR;
      const plotH = h - padT - padB;
      
      // Y range: signal goes from 0 to FS (1V for normalization)
      const FS = 1;
      const yFor = v => padT + plotH - (v / FS) * plotH;
      
      // Draw quantization level lines (faint)
      ctx.strokeStyle = colMuted;
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      for (let i = 0; i < levels; i++) {
        const v = (i / (levels - 1)) * FS;
        const y = yFor(v);
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      
      // Y axis labels
      ctx.fillStyle = colMuted;
      ctx.font = '600 10px JetBrains Mono, monospace';
      ctx.fillText('FS', 8, padT + 6);
      ctx.fillText('FS/2', 8, padT + plotH/2 + 3);
      ctx.fillText('0', 8, h - padB);
      
      // Draw axes
      ctx.strokeStyle = colInk;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL, h - padB);
      ctx.lineTo(w - padR, h - padB);
      ctx.stroke();
      
      // Generate continuous sine
      const NUM_PTS = 500;
      const xStep = plotW / (NUM_PTS - 1);
      const sineFn = t => 0.5 + 0.45 * Math.sin(t * cycles * 2 * Math.PI);
      
      // Draw continuous sine (blue)
      ctx.strokeStyle = colSec;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < NUM_PTS; i++) {
        const t = i / (NUM_PTS - 1);
        const v = sineFn(t);
        const x = padL + i * xStep;
        const y = yFor(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Compute samples
      const totalSamples = samplesPerCycle * cycles;
      const samples = [];
      for (let i = 0; i <= totalSamples; i++) {
        const t = i / totalSamples;
        const v = sineFn(t);
        // Quantize to nearest level
        const quantIdx = Math.round(v * (levels - 1));
        const quantV = quantIdx / (levels - 1);
        samples.push({ t: t, v: v, qV: quantV, qIdx: quantIdx });
      }
      
      // Draw quantized staircase (orange)
      ctx.strokeStyle = colPrimary;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'miter';
      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const x = padL + samples[i].t * plotW;
        const y = yFor(samples[i].qV);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // Stepped horizontal
          const prevX = padL + samples[i - 1].t * plotW;
          const prevY = yFor(samples[i - 1].qV);
          ctx.lineTo(x, prevY);
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      // Draw sample points (yellow circles)
      ctx.fillStyle = colQuad;
      ctx.strokeStyle = colInk;
      ctx.lineWidth = 1.5;
      samples.forEach(s => {
        const x = padL + s.t * plotW;
        const y = yFor(s.v);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      
      // Legend
      ctx.font = '700 12px Bricolage Grotesque, serif';
      ctx.fillStyle = colSec;
      ctx.fillText('— Αναλογικό σήμα', padL + 10, padT - 10);
      ctx.fillStyle = colQuad;
      ctx.fillText('● Δείγματα', padL + 200, padT - 10);
      ctx.fillStyle = colPrimary;
      ctx.fillText('⫶ Ψηφιακή έξοδος', padL + 320, padT - 10);
      
      ctx.fillStyle = colMuted;
      ctx.font = '600 11px JetBrains Mono, monospace';
      ctx.fillText('χρόνος →', w - padR - 70, h - 10);
    }
    
    [bitsSlider, fsSlider, fmaxSlider].forEach(s => s.addEventListener('input', update));
    update();
  })();

  /* ============================================================
     3. RESOLUTION CALCULATOR
     ============================================================ */
  (function resolution() {
    const bitsSlider = document.getElementById('res-bits');
    const fsSlider = document.getElementById('res-fs');
    const bitsOut = document.getElementById('res-bits-val');
    const fsOut = document.getElementById('res-fs-val');
    const levelsEl = document.getElementById('res-levels');
    const divisorEl = document.getElementById('res-divisor');
    const resolutionEl = document.getElementById('res-resolution');
    const accuracyEl = document.getElementById('res-accuracy');
    const canvas = document.getElementById('res-canvas');
    
    if (!bitsSlider || !canvas) return;
    
    function fmtV(v) {
      if (v < 0.001) return (v * 1e6).toFixed(2) + ' μV';
      if (v < 1) return (v * 1000).toFixed(2) + ' mV';
      return v.toFixed(3) + ' V';
    }
    
    function update() {
      const bits = parseInt(bitsSlider.value, 10);
      const Vfs = parseFloat(fsSlider.value);
      
      const levels = Math.pow(2, bits);
      const divisor = levels - 1;
      const res = Vfs / divisor;
      const accuracy = (res / Vfs) * 100 / 2; // ±half LSB %
      
      bitsOut.textContent = bits + ' bits';
      fsOut.textContent = Vfs + ' V';
      levelsEl.textContent = levels.toLocaleString();
      divisorEl.textContent = divisor.toLocaleString();
      resolutionEl.textContent = fmtV(res);
      accuracyEl.textContent = '±' + accuracy.toFixed(3) + '%';
      
      draw(bits, Vfs, levels);
    }
    
    function draw(bits, Vfs, levels) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      const colInk = cssColor('--c-ink', '#1a1d2e');
      const colMuted = cssColor('--c-muted', '#8b8fa8');
      const colPrimary = cssColor('--c-primary', '#ff5c39');
      
      const padL = 60, padR = 30, padT = 25, padB = 30;
      const plotW = w - padL - padR;
      const plotH = h - padT - padB;
      
      // Draw axes
      ctx.strokeStyle = colInk;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL, h - padB);
      ctx.lineTo(w - padR, h - padB);
      ctx.stroke();
      
      // Y axis label (Voltage)
      ctx.fillStyle = colInk;
      ctx.font = '700 11px Bricolage Grotesque, serif';
      ctx.fillText('Τάση (V)', 8, padT - 4);
      
      // Y axis ticks
      ctx.fillStyle = colMuted;
      ctx.font = '600 10px JetBrains Mono, monospace';
      for (let i = 0; i <= 5; i++) {
        const v = (Vfs * i) / 5;
        const y = padT + plotH - (v / Vfs) * plotH;
        ctx.fillText(v.toFixed(1), 8, y + 3);
        ctx.strokeStyle = colMuted;
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.moveTo(padL - 3, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      
      // Draw level lines
      // For high bits, only show every Nth level for clarity
      const stride = levels > 64 ? Math.ceil(levels / 64) : 1;
      const visibleLevels = Math.ceil(levels / stride);
      
      ctx.strokeStyle = colPrimary;
      ctx.lineWidth = levels > 256 ? 0.5 : (levels > 64 ? 1 : 1.5);
      ctx.globalAlpha = levels > 256 ? 0.4 : 0.8;
      
      for (let i = 0; i < levels; i += stride) {
        const v = (i / (levels - 1)) * Vfs;
        const y = padT + plotH - (v / Vfs) * plotH;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      
      // Info box top right
      const infoX = w - padR - 220;
      const infoY = padT + 10;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = colInk;
      ctx.lineWidth = 2;
      ctx.fillRect(infoX, infoY, 210, 60);
      ctx.strokeRect(infoX, infoY, 210, 60);
      
      ctx.fillStyle = colInk;
      ctx.font = '700 12px Bricolage Grotesque, serif';
      ctx.fillText(bits + '-bit DAC', infoX + 10, infoY + 18);
      ctx.font = '600 11px JetBrains Mono, monospace';
      ctx.fillStyle = colMuted;
      ctx.fillText(levels.toLocaleString() + ' επίπεδα', infoX + 10, infoY + 35);
      ctx.fillText('FS = ' + Vfs + 'V', infoX + 10, infoY + 50);
      
      if (stride > 1) {
        ctx.fillStyle = colMuted;
        ctx.font = 'italic 10px JetBrains Mono, monospace';
        ctx.fillText('(εμφάνιση 1 σε ' + stride + ' επιπέδων)', padL, h - 8);
      }
    }
    
    [bitsSlider, fsSlider].forEach(s => s.addEventListener('input', update));
    update();
  })();

})();
