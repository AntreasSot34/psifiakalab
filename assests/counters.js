/* ==========================================================================
   Counters - Interactive Simulators
   1. Binary Counter Visualizer (with FF LEDs + timing diagram)
   2. Mod-N Counter Designer
   3. Frequency Divider
   ========================================================================== */

(function() {
  'use strict';

  function cssColor(name, fallback) {
    return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
  }
  
  function fmtFreq(hz) {
    if (hz >= 1e6) return (hz / 1e6).toFixed(2) + ' MHz';
    if (hz >= 1000) return (hz / 1000).toFixed(2) + ' kHz';
    if (hz >= 1) return hz.toFixed(1) + ' Hz';
    return (hz * 1000).toFixed(1) + ' mHz';
  }

  /* ============================================================
     1. BINARY COUNTER VISUALIZER
     ============================================================ */
  (function binaryCounter() {
    const bitsSlider = document.getElementById('bin-bits');
    const dirSel = document.getElementById('bin-dir');
    const bitsOut = document.getElementById('bin-bits-val');
    const decEl = document.getElementById('bin-dec');
    const binEl = document.getElementById('bin-bin');
    const pulsesEl = document.getElementById('bin-pulses');
    const maxEl = document.getElementById('bin-max');
    const ledsEl = document.getElementById('bin-leds');
    const clockBtn = document.getElementById('bin-clock');
    const autoBtn = document.getElementById('bin-auto');
    const resetBtn = document.getElementById('bin-reset');
    const canvas = document.getElementById('bin-canvas');
    
    if (!bitsSlider || !canvas) return;
    
    let bits = 3;
    let dir = 'up';
    let value = 0;
    let pulses = 0;
    let history = []; // array of values per pulse
    let autoInterval = null;
    
    function maxVal() { return Math.pow(2, bits); }
    
    function buildLeds() {
      ledsEl.innerHTML = '';
      // Build from MSB to LSB
      for (let i = bits - 1; i >= 0; i--) {
        const bitContainer = document.createElement('div');
        bitContainer.className = 'output-led';
        bitContainer.innerHTML = `
          <span class="output-led-label">Q${i}${i === bits - 1 ? '<sub style="font-size:.7em;color:var(--c-muted)">MSB</sub>' : i === 0 ? '<sub style="font-size:.7em;color:var(--c-muted)">LSB</sub>' : ''}</span>
          <div class="led" id="bin-led-${i}">0</div>
        `;
        ledsEl.appendChild(bitContainer);
      }
    }
    
    function update() {
      bits = parseInt(bitsSlider.value, 10);
      dir = dirSel.value;
      bitsOut.textContent = bits + ' bits';
      maxEl.textContent = maxVal();
      
      // Clamp value
      if (value >= maxVal()) value = 0;
      
      decEl.textContent = value;
      binEl.textContent = value.toString(2).padStart(bits, '0');
      pulsesEl.textContent = pulses;
      
      // Build LEDs if bit count changed
      if (ledsEl.children.length !== bits) {
        buildLeds();
        history = [];
      }
      
      // Update LED states
      for (let i = 0; i < bits; i++) {
        const led = document.getElementById('bin-led-' + i);
        if (led) {
          const bitVal = (value >> i) & 1;
          led.textContent = bitVal;
          led.classList.toggle('is-high', bitVal === 1);
        }
      }
      
      drawTiming();
    }
    
    function step() {
      if (dir === 'up') {
        value = (value + 1) % maxVal();
      } else {
        value = (value - 1 + maxVal()) % maxVal();
      }
      pulses++;
      history.push(value);
      if (history.length > 8) history.shift();
      update();
    }
    
    function drawTiming() {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      const colInk = cssColor('--c-ink', '#1a1d2e');
      const colMuted = cssColor('--c-muted', '#8b8fa8');
      const colClock = cssColor('--c-secondary', '#2563eb');
      const colPrimary = cssColor('--c-primary', '#ff5c39');
      const colTertiary = cssColor('--c-tertiary', '#16a34a');
      const colPurple = cssColor('--c-purple', '#8b5cf6');
      const colQuad = cssColor('--c-quaternary', '#f59e0b');
      
      const padL = 50, padR = 20, padT = 25, padB = 20;
      const numTracks = bits + 1;
      const trackHeight = (h - padT - padB) / numTracks;
      
      const NUM_PULSES = 8;
      const startX = padL + 30;
      const stepW = (w - startX - padR) / NUM_PULSES;
      
      // Compute history of last 8 values
      let display = history.slice(-NUM_PULSES);
      while (display.length < NUM_PULSES) display.unshift(0);
      
      // Draw vertical grid (one per pulse)
      ctx.strokeStyle = colMuted;
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      for (let i = 0; i <= NUM_PULSES; i++) {
        const x = startX + i * stepW;
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, h - padB);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      
      // Draw CLK on top
      ctx.font = '700 12px JetBrains Mono, monospace';
      ctx.fillStyle = colInk;
      ctx.fillText('CLK', 8, padT + trackHeight/2 + 4);
      
      ctx.strokeStyle = colClock;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const clkY_lo = padT + trackHeight - 10;
      const clkY_hi = padT + 10;
      let cx = startX;
      ctx.moveTo(cx, clkY_lo);
      for (let i = 0; i < NUM_PULSES; i++) {
        ctx.lineTo(cx + stepW * 0.4, clkY_lo);
        ctx.lineTo(cx + stepW * 0.4, clkY_hi);
        ctx.lineTo(cx + stepW * 0.9, clkY_hi);
        ctx.lineTo(cx + stepW * 0.9, clkY_lo);
        cx += stepW;
      }
      ctx.lineTo(cx, clkY_lo);
      ctx.stroke();
      
      // Draw each Q_i bit
      const colors = [colPrimary, colTertiary, colPurple, colQuad];
      for (let bit = 0; bit < bits; bit++) {
        const trackY = padT + (bit + 1) * trackHeight;
        const yLo = trackY + trackHeight - 10;
        const yHi = trackY + 10;
        
        // Label
        ctx.fillStyle = colInk;
        ctx.font = '700 12px JetBrains Mono, monospace';
        ctx.fillText('Q' + bit, 8, trackY + trackHeight/2 + 4);
        
        // Draw signal
        ctx.strokeStyle = colors[bit % colors.length];
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        let x = startX;
        let curY = ((display[0] >> bit) & 1) === 1 ? yHi : yLo;
        ctx.moveTo(x, curY);
        for (let i = 0; i < NUM_PULSES; i++) {
          const newY = ((display[i] >> bit) & 1) === 1 ? yHi : yLo;
          // Hold until edge (at 0.4 of step)
          const edgeX = startX + i * stepW + stepW * 0.4;
          ctx.lineTo(edgeX, curY);
          if (newY !== curY) {
            ctx.lineTo(edgeX, newY);
            curY = newY;
          }
        }
        ctx.lineTo(startX + NUM_PULSES * stepW, curY);
        ctx.stroke();
      }
      
      // Pulse number labels at bottom
      ctx.fillStyle = colMuted;
      ctx.font = '600 11px JetBrains Mono, monospace';
      const startPulse = Math.max(0, pulses - NUM_PULSES + 1);
      for (let i = 0; i < NUM_PULSES; i++) {
        const px = startX + i * stepW + stepW/2 - 8;
        ctx.fillText('#' + (startPulse + i + 1), px, h - 4);
      }
    }
    
    clockBtn.addEventListener('click', step);
    
    autoBtn.addEventListener('click', () => {
      if (autoInterval) {
        clearInterval(autoInterval);
        autoInterval = null;
        autoBtn.textContent = '▶️ Auto';
      } else {
        autoInterval = setInterval(step, 600);
        autoBtn.textContent = '⏸ Pause';
      }
    });
    
    resetBtn.addEventListener('click', () => {
      value = 0;
      pulses = 0;
      history = [];
      if (autoInterval) {
        clearInterval(autoInterval);
        autoInterval = null;
        autoBtn.textContent = '▶️ Auto';
      }
      update();
    });
    
    bitsSlider.addEventListener('input', () => {
      value = 0;
      pulses = 0;
      history = [];
      update();
    });
    dirSel.addEventListener('change', () => {
      value = 0;
      pulses = 0;
      history = [];
      update();
    });
    
    update();
  })();

  /* ============================================================
     2. MOD-N COUNTER DESIGNER
     ============================================================ */
  (function modNCounter() {
    const nSlider = document.getElementById('mod-N');
    const nOut = document.getElementById('mod-N-val');
    const modEl = document.getElementById('mod-mod');
    const ffEl = document.getElementById('mod-ff');
    const maxEl = document.getElementById('mod-max');
    const unusedEl = document.getElementById('mod-unused');
    const grid = document.getElementById('mod-states-grid');
    const stepBtn = document.getElementById('mod-step');
    const autoBtn = document.getElementById('mod-auto');
    const resetBtn = document.getElementById('mod-reset');
    
    if (!nSlider || !grid) return;
    
    let N = 10;
    let currentState = 0;
    let autoInt = null;
    
    function update() {
      N = parseInt(nSlider.value, 10);
      nOut.textContent = N;
      
      // Calculate FF needed: smallest n such that 2^n >= N
      const ff = Math.ceil(Math.log2(N === 1 ? 2 : N));
      const maxMod = Math.pow(2, ff);
      const unused = maxMod - N;
      
      modEl.textContent = N;
      ffEl.textContent = ff;
      maxEl.textContent = maxMod;
      unusedEl.textContent = unused;
      
      // Clamp current state
      if (currentState >= N) currentState = 0;
      
      // Build grid
      grid.innerHTML = '';
      for (let i = 0; i < maxMod; i++) {
        const cell = document.createElement('div');
        cell.className = 'state-cell';
        const isUsed = i < N;
        const isActive = i === currentState && isUsed;
        if (!isUsed) cell.classList.add('is-unused');
        if (isActive) cell.classList.add('is-active');
        cell.innerHTML = `
          <div class="state-num">${i}</div>
          <div class="state-bin mono">${i.toString(2).padStart(ff, '0')}</div>
        `;
        grid.appendChild(cell);
      }
    }
    
    function step() {
      currentState = (currentState + 1) % N;
      update();
    }
    
    nSlider.addEventListener('input', () => {
      currentState = 0;
      update();
    });
    
    stepBtn.addEventListener('click', step);
    
    autoBtn.addEventListener('click', () => {
      if (autoInt) {
        clearInterval(autoInt);
        autoInt = null;
        autoBtn.textContent = '▶️ Auto';
      } else {
        autoInt = setInterval(step, 500);
        autoBtn.textContent = '⏸ Pause';
      }
    });
    
    resetBtn.addEventListener('click', () => {
      currentState = 0;
      if (autoInt) {
        clearInterval(autoInt);
        autoInt = null;
        autoBtn.textContent = '▶️ Auto';
      }
      update();
    });
    
    update();
  })();

  /* ============================================================
     3. FREQUENCY DIVIDER
     ============================================================ */
  (function freqDivider() {
    const fSlider = document.getElementById('div-fclk');
    const bitsSlider = document.getElementById('div-bits');
    const fOut = document.getElementById('div-fclk-val');
    const bitsOut = document.getElementById('div-bits-val');
    const resultsEl = document.getElementById('div-results');
    const canvas = document.getElementById('div-canvas');
    
    if (!fSlider || !canvas) return;
    
    function update() {
      const fclk = parseInt(fSlider.value, 10);
      const bits = parseInt(bitsSlider.value, 10);
      
      fOut.textContent = fmtFreq(fclk);
      bitsOut.textContent = bits + ' bits';
      
      // Build result cards
      resultsEl.innerHTML = '';
      
      // CLK card
      const clkCard = document.createElement('div');
      clkCard.className = 'result-card';
      clkCard.style.borderColor = 'var(--c-secondary)';
      clkCard.innerHTML = `
        <div class="result-label">f_CLK</div>
        <div class="result-value" style="color: var(--c-secondary);">${fmtFreq(fclk)}</div>
      `;
      resultsEl.appendChild(clkCard);
      
      // Per-bit divisions
      for (let i = 0; i < bits; i++) {
        const div = Math.pow(2, i + 1);
        const card = document.createElement('div');
        card.className = 'result-card';
        const fOut = fclk / div;
        card.innerHTML = `
          <div class="result-label">Q${i} = f/${div}</div>
          <div class="result-value">${fmtFreq(fOut)}</div>
        `;
        resultsEl.appendChild(card);
      }
      
      drawTiming(fclk, bits);
    }
    
    function drawTiming(fclk, bits) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      const colInk = cssColor('--c-ink', '#1a1d2e');
      const colMuted = cssColor('--c-muted', '#8b8fa8');
      const colClock = cssColor('--c-secondary', '#2563eb');
      const colPrimary = cssColor('--c-primary', '#ff5c39');
      const colTertiary = cssColor('--c-tertiary', '#16a34a');
      const colPurple = cssColor('--c-purple', '#8b5cf6');
      const colQuad = cssColor('--c-quaternary', '#f59e0b');
      
      const padL = 80, padR = 20, padT = 25, padB = 30;
      const numTracks = bits + 1;
      const trackH = (h - padT - padB) / numTracks;
      
      // Show enough cycles for the slowest signal: 2^bits cycles of CLK
      const MAX_CYCLES = Math.min(16, Math.pow(2, bits));
      const startX = padL;
      const plotW = w - startX - padR;
      const stepW = plotW / MAX_CYCLES;
      
      // Vertical grid
      ctx.strokeStyle = colMuted;
      ctx.globalAlpha = 0.12;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      for (let i = 0; i <= MAX_CYCLES; i++) {
        const x = startX + i * stepW;
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, h - padB);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      
      // Draw CLK
      const clkY_lo = padT + trackH - 8;
      const clkY_hi = padT + 8;
      ctx.font = '700 12px JetBrains Mono, monospace';
      ctx.fillStyle = colInk;
      ctx.fillText('CLK', 6, padT + trackH/2 + 4);
      ctx.fillStyle = colMuted;
      ctx.font = '600 10px JetBrains Mono, monospace';
      ctx.fillText(fmtFreq(fclk), 6, padT + trackH/2 + 18);
      
      ctx.strokeStyle = colClock;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let cx = startX;
      ctx.moveTo(cx, clkY_lo);
      for (let i = 0; i < MAX_CYCLES; i++) {
        ctx.lineTo(cx + stepW * 0.4, clkY_lo);
        ctx.lineTo(cx + stepW * 0.4, clkY_hi);
        ctx.lineTo(cx + stepW * 0.9, clkY_hi);
        ctx.lineTo(cx + stepW * 0.9, clkY_lo);
        cx += stepW;
      }
      ctx.lineTo(cx, clkY_lo);
      ctx.stroke();
      
      // For each Q_i: toggles on rising edge, period = 2^(i+1) clock cycles
      const colors = [colPrimary, colTertiary, colPurple, colQuad];
      for (let bit = 0; bit < bits; bit++) {
        const tY = padT + (bit + 1) * trackH;
        const yLo = tY + trackH - 8;
        const yHi = tY + 8;
        
        ctx.fillStyle = colInk;
        ctx.font = '700 12px JetBrains Mono, monospace';
        ctx.fillText('Q' + bit, 6, tY + trackH/2);
        ctx.fillStyle = colMuted;
        ctx.font = '600 10px JetBrains Mono, monospace';
        ctx.fillText(fmtFreq(fclk / Math.pow(2, bit + 1)), 6, tY + trackH/2 + 14);
        
        // Q_i toggles every 2^i clock pulses (counted by rising edges)
        // Q0 has period 2 clock cycles; Q1 has period 4; etc.
        ctx.strokeStyle = colors[bit % colors.length];
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        let x = startX;
        let state = 0;
        ctx.moveTo(x, yLo);
        const togglePeriod = Math.pow(2, bit); // toggle every these many CLK pulses
        for (let i = 0; i < MAX_CYCLES; i++) {
          // Each clock cycle: rising edge at 0.4*stepW
          const edgeX = startX + i * stepW + stepW * 0.4;
          // Hold current state until edge
          ctx.lineTo(edgeX, state === 1 ? yHi : yLo);
          // Toggle if this pulse is a multiple of togglePeriod
          if ((i + 1) % togglePeriod === 0) {
            state = 1 - state;
            ctx.lineTo(edgeX, state === 1 ? yHi : yLo);
          }
        }
        ctx.lineTo(startX + MAX_CYCLES * stepW, state === 1 ? yHi : yLo);
        ctx.stroke();
      }
      
      // Bottom axis
      ctx.fillStyle = colMuted;
      ctx.font = '600 10px JetBrains Mono, monospace';
      ctx.fillText('χρόνος →', w - padR - 70, h - 6);
    }
    
    fSlider.addEventListener('input', update);
    bitsSlider.addEventListener('input', update);
    update();
  })();

})();
