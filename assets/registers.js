/* ==========================================================================
   Shift Registers - Interactive Simulators
   1. Shift Register Visualizer (SISO/SIPO/PISO/PIPO)
   2. Ring Counter vs Johnson Counter
   3. Multiply/Divide via Shift
   ========================================================================== */

(function() {
  'use strict';

  function cssColor(name, fallback) {
    return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
  }

  /* ============================================================
     1. SHIFT REGISTER VISUALIZER
     ============================================================ */
  (function shiftRegister() {
    const typeSel = document.getElementById('sr-type');
    const serialDiv = document.getElementById('sr-serial-input');
    const parallelDiv = document.getElementById('sr-parallel-input');
    const parallelBitsEl = document.getElementById('sr-parallel-bits');
    const dinBtn = document.getElementById('sr-din');
    const ffRowEl = document.getElementById('sr-ff-row');
    const outputEl = document.getElementById('sr-out-val');
    const clockBtn = document.getElementById('sr-clock');
    const loadBtn = document.getElementById('sr-load');
    const resetBtn = document.getElementById('sr-reset');
    const pulsesEl = document.getElementById('sr-pulses');
    
    if (!typeSel || !ffRowEl) return;
    
    const N = 4;
    let bits = [0, 0, 0, 0]; // FF0 (leftmost) ... FF3 (rightmost)
    let parallelBits = [0, 0, 0, 0];
    let pulses = 0;
    let serialOutBit = 0; // last bit shifted out (for SISO/PISO)
    let type = 'siso';
    
    function buildFFRow() {
      ffRowEl.innerHTML = '';
      for (let i = 0; i < N; i++) {
        const c = document.createElement('div');
        c.className = 'output-led';
        c.innerHTML = `
          <span class="output-led-label">FF${i}</span>
          <div class="led" id="sr-ff-${i}">0</div>
        `;
        ffRowEl.appendChild(c);
      }
    }
    
    function buildParallelInputs() {
      parallelBitsEl.innerHTML = '';
      for (let i = 0; i < N; i++) {
        const wrap = document.createElement('div');
        wrap.className = 'bit-toggle';
        wrap.innerHTML = `
          <span class="bit-toggle-label">D${i}</span>
          <button class="bit-btn" id="sr-din-${i}" data-bit="${parallelBits[i]}">${parallelBits[i]}</button>
        `;
        parallelBitsEl.appendChild(wrap);
      }
      // Bind handlers
      for (let i = 0; i < N; i++) {
        const b = document.getElementById('sr-din-' + i);
        if (b) {
          b.classList.toggle('is-high', parallelBits[i] === 1);
          b.addEventListener('click', () => {
            parallelBits[i] = 1 - parallelBits[i];
            b.dataset.bit = parallelBits[i];
            b.textContent = parallelBits[i];
            b.classList.toggle('is-high', parallelBits[i] === 1);
          });
        }
      }
    }
    
    function updateFFs() {
      for (let i = 0; i < N; i++) {
        const led = document.getElementById('sr-ff-' + i);
        if (led) {
          led.textContent = bits[i];
          led.classList.toggle('is-high', bits[i] === 1);
        }
      }
      // Output display depends on type
      if (type === 'siso' || type === 'piso') {
        outputEl.textContent = '...' + serialOutBit + ' (last bit out)';
      } else {
        // SIPO, PIPO: parallel output = all 4 bits
        outputEl.textContent = bits.join('');
      }
    }
    
    function changeType() {
      type = typeSel.value;
      // Reset state
      bits = [0, 0, 0, 0];
      pulses = 0;
      serialOutBit = 0;
      pulsesEl.textContent = 'Παλμοί: 0';
      
      // Show/hide inputs
      const isSerial = (type === 'siso' || type === 'sipo');
      serialDiv.style.display = isSerial ? 'flex' : 'none';
      parallelDiv.style.display = isSerial ? 'none' : 'flex';
      
      // Show LOAD button only for parallel input
      loadBtn.style.display = isSerial ? 'none' : 'inline-block';
      
      if (!isSerial) buildParallelInputs();
      
      updateFFs();
    }
    
    // Serial DIN button
    dinBtn.addEventListener('click', () => {
      const cur = parseInt(dinBtn.dataset.bit, 10);
      const newVal = 1 - cur;
      dinBtn.dataset.bit = newVal;
      dinBtn.textContent = newVal;
      dinBtn.classList.toggle('is-high', newVal === 1);
    });
    
    // Clock pulse: shift right (FF0 ← Din, FF1 ← FF0, FF2 ← FF1, FF3 ← FF2, out = FF3)
    clockBtn.addEventListener('click', () => {
      // Shift right: serial out is FF[N-1], data shifts from FF[i-1] to FF[i]
      serialOutBit = bits[N - 1];
      for (let i = N - 1; i > 0; i--) {
        bits[i] = bits[i - 1];
      }
      bits[0] = parseInt(dinBtn.dataset.bit, 10);
      pulses++;
      pulsesEl.textContent = 'Παλμοί: ' + pulses;
      updateFFs();
    });
    
    // LOAD: parallel load from input bits
    loadBtn.addEventListener('click', () => {
      bits = parallelBits.slice();
      pulses++;
      pulsesEl.textContent = 'Παλμοί: ' + pulses + ' (LOAD)';
      updateFFs();
    });
    
    resetBtn.addEventListener('click', () => {
      bits = [0, 0, 0, 0];
      parallelBits = [0, 0, 0, 0];
      pulses = 0;
      serialOutBit = 0;
      pulsesEl.textContent = 'Παλμοί: 0';
      // Reset DIN button
      dinBtn.dataset.bit = 0;
      dinBtn.textContent = '0';
      dinBtn.classList.remove('is-high');
      // Reset parallel inputs if shown
      if (typeSel.value === 'piso' || typeSel.value === 'pipo') {
        buildParallelInputs();
      }
      updateFFs();
    });
    
    typeSel.addEventListener('change', changeType);
    
    buildFFRow();
    changeType();
  })();

  /* ============================================================
     2. RING vs JOHNSON COUNTER
     ============================================================ */
  (function ringJohnson() {
    const typeSel = document.getElementById('rj-type');
    const nSlider = document.getElementById('rj-N');
    const nOut = document.getElementById('rj-N-val');
    const statesEl = document.getElementById('rj-states');
    const freqEl = document.getElementById('rj-freq');
    const pulsesEl = document.getElementById('rj-pulses');
    const ffRowEl = document.getElementById('rj-ff-row');
    const clockBtn = document.getElementById('rj-clock');
    const autoBtn = document.getElementById('rj-auto');
    const resetBtn = document.getElementById('rj-reset');
    const canvas = document.getElementById('rj-canvas');
    
    if (!typeSel || !ffRowEl) return;
    
    let type = 'ring';
    let N = 4;
    let bits = [];
    let pulses = 0;
    let history = []; // Last 8 states
    let autoInt = null;
    
    function initState() {
      bits = new Array(N).fill(0);
      if (type === 'ring') bits[0] = 1; // Start with single 1
      pulses = 0;
      history = [bits.slice()];
    }
    
    function buildFFRow() {
      ffRowEl.innerHTML = '';
      for (let i = 0; i < N; i++) {
        const c = document.createElement('div');
        c.className = 'output-led';
        c.innerHTML = `
          <span class="output-led-label">Q${i}</span>
          <div class="led" id="rj-ff-${i}">0</div>
        `;
        ffRowEl.appendChild(c);
      }
    }
    
    function update() {
      type = typeSel.value;
      const newN = parseInt(nSlider.value, 10);
      
      if (newN !== N || ffRowEl.children.length !== newN) {
        N = newN;
        initState();
        buildFFRow();
      }
      
      nOut.textContent = N;
      
      // Number of distinct states
      const numStates = type === 'ring' ? N : 2 * N;
      statesEl.textContent = numStates;
      freqEl.textContent = '1/' + numStates;
      pulsesEl.textContent = pulses;
      
      // Update LEDs
      for (let i = 0; i < N; i++) {
        const led = document.getElementById('rj-ff-' + i);
        if (led) {
          led.textContent = bits[i];
          led.classList.toggle('is-high', bits[i] === 1);
        }
      }
      
      drawTiming();
    }
    
    function step() {
      if (type === 'ring') {
        // Shift right, with FF[N-1] feeding back into FF[0]
        const last = bits[N - 1];
        for (let i = N - 1; i > 0; i--) bits[i] = bits[i - 1];
        bits[0] = last;
      } else {
        // Johnson: complement of FF[N-1] feeds into FF[0]
        const last = bits[N - 1];
        for (let i = N - 1; i > 0; i--) bits[i] = bits[i - 1];
        bits[0] = 1 - last;
      }
      pulses++;
      history.push(bits.slice());
      if (history.length > 10) history.shift();
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
      const colors = [
        cssColor('--c-primary', '#ff5c39'),
        cssColor('--c-tertiary', '#16a34a'),
        cssColor('--c-purple', '#8b5cf6'),
        cssColor('--c-quaternary', '#f59e0b'),
        '#ec4899',
        '#06b6d4'
      ];
      
      const padL = 50, padR = 20, padT = 20, padB = 20;
      const numTracks = N + 1;
      const tH = (h - padT - padB) / numTracks;
      
      const NUM_PULSES = Math.min(history.length, 8);
      const sX = padL + 30;
      const stepW = (w - sX - padR) / Math.max(NUM_PULSES, 1);
      
      // Vertical grid
      ctx.strokeStyle = colMuted;
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      for (let i = 0; i <= NUM_PULSES; i++) {
        const x = sX + i * stepW;
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, h - padB);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      
      // CLK
      ctx.font = '700 12px JetBrains Mono, monospace';
      ctx.fillStyle = colInk;
      ctx.fillText('CLK', 8, padT + tH/2 + 4);
      
      ctx.strokeStyle = colClock;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const cyL = padT + tH - 8, cyH = padT + 8;
      let cx = sX;
      ctx.moveTo(cx, cyL);
      for (let i = 0; i < NUM_PULSES; i++) {
        ctx.lineTo(cx + stepW * 0.4, cyL);
        ctx.lineTo(cx + stepW * 0.4, cyH);
        ctx.lineTo(cx + stepW * 0.9, cyH);
        ctx.lineTo(cx + stepW * 0.9, cyL);
        cx += stepW;
      }
      ctx.lineTo(cx, cyL);
      ctx.stroke();
      
      // Each Q signal
      const display = history.slice(-NUM_PULSES);
      while (display.length < NUM_PULSES) display.unshift(new Array(N).fill(0));
      
      for (let bit = 0; bit < N; bit++) {
        const tY = padT + (bit + 1) * tH;
        const yL = tY + tH - 8;
        const yH = tY + 8;
        
        ctx.fillStyle = colInk;
        ctx.font = '700 12px JetBrains Mono, monospace';
        ctx.fillText('Q' + bit, 8, tY + tH/2 + 4);
        
        ctx.strokeStyle = colors[bit % colors.length];
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        let x = sX;
        let curY = display[0][bit] === 1 ? yH : yL;
        ctx.moveTo(x, curY);
        for (let i = 0; i < NUM_PULSES; i++) {
          const newY = display[i][bit] === 1 ? yH : yL;
          const eX = sX + i * stepW + stepW * 0.4;
          ctx.lineTo(eX, curY);
          if (newY !== curY) {
            ctx.lineTo(eX, newY);
            curY = newY;
          }
        }
        ctx.lineTo(sX + NUM_PULSES * stepW, curY);
        ctx.stroke();
      }
    }
    
    typeSel.addEventListener('change', () => {
      initState();
      update();
    });
    nSlider.addEventListener('input', () => {
      N = parseInt(nSlider.value, 10);
      initState();
      buildFFRow();
      update();
    });
    clockBtn.addEventListener('click', step);
    autoBtn.addEventListener('click', () => {
      if (autoInt) {
        clearInterval(autoInt);
        autoInt = null;
        autoBtn.textContent = '▶️ Auto';
      } else {
        autoInt = setInterval(step, 600);
        autoBtn.textContent = '⏸ Pause';
      }
    });
    resetBtn.addEventListener('click', () => {
      initState();
      if (autoInt) {
        clearInterval(autoInt);
        autoInt = null;
        autoBtn.textContent = '▶️ Auto';
      }
      update();
    });
    
    initState();
    buildFFRow();
    update();
  })();

  /* ============================================================
     3. MULTIPLY/DIVIDE BY SHIFTING
     ============================================================ */
  (function multShift() {
    const bitInputEl = document.getElementById('ms-bit-input');
    const binEl = document.getElementById('ms-bin');
    const decEl = document.getElementById('ms-dec');
    const hexEl = document.getElementById('ms-hex');
    const leftBtn = document.getElementById('ms-left');
    const rightBtn = document.getElementById('ms-right');
    const resetBtn = document.getElementById('ms-reset');
    const logEl = document.getElementById('ms-log');
    
    if (!bitInputEl) return;
    
    const NBITS = 8;
    let bits = [0, 0, 0, 0, 0, 1, 1, 0]; // 6
    let history = [];
    
    function buildBitInputs() {
      bitInputEl.innerHTML = '';
      for (let i = 0; i < NBITS; i++) {
        const wrap = document.createElement('div');
        wrap.className = 'bit-toggle';
        wrap.style.gap = '4px';
        wrap.innerHTML = `
          <span class="mono muted" style="font-size:0.75rem;">2<sup>${NBITS - 1 - i}</sup></span>
          <button class="bit-btn" id="ms-bit-${i}" data-bit="${bits[i]}" style="width:50px;height:50px;font-size:1.3rem;">${bits[i]}</button>
        `;
        bitInputEl.appendChild(wrap);
      }
      // Bind clicks
      for (let i = 0; i < NBITS; i++) {
        const b = document.getElementById('ms-bit-' + i);
        if (b) {
          b.classList.toggle('is-high', bits[i] === 1);
          b.addEventListener('click', () => {
            bits[i] = 1 - bits[i];
            b.dataset.bit = bits[i];
            b.textContent = bits[i];
            b.classList.toggle('is-high', bits[i] === 1);
            update();
          });
        }
      }
    }
    
    function syncBitButtons() {
      for (let i = 0; i < NBITS; i++) {
        const b = document.getElementById('ms-bit-' + i);
        if (b) {
          b.dataset.bit = bits[i];
          b.textContent = bits[i];
          b.classList.toggle('is-high', bits[i] === 1);
        }
      }
    }
    
    function getDecimal() {
      let v = 0;
      for (let i = 0; i < NBITS; i++) {
        v = v * 2 + bits[i];
      }
      return v;
    }
    
    function update() {
      const bin = bits.join('');
      const dec = getDecimal();
      binEl.textContent = bin;
      decEl.textContent = dec;
      hexEl.textContent = '0x' + dec.toString(16).toUpperCase().padStart(2, '0');
    }
    
    function addToLog(text) {
      history.unshift(text);
      if (history.length > 8) history.pop();
      logEl.innerHTML = history.map(h => '<div>' + h + '</div>').join('');
    }
    
    leftBtn.addEventListener('click', () => {
      const before = getDecimal();
      const beforeBin = bits.join('');
      // Shift left: bits[0] is dropped, bits[i] = bits[i+1], bits[N-1] = 0
      const dropped = bits[0];
      for (let i = 0; i < NBITS - 1; i++) bits[i] = bits[i + 1];
      bits[NBITS - 1] = 0;
      const after = getDecimal();
      syncBitButtons();
      update();
      const overflow = dropped === 1 ? ' ⚠️ overflow!' : '';
      addToLog('⬅️ Shift Left: ' + beforeBin + ' (' + before + ') → ' + bits.join('') + ' (' + after + ')' + overflow);
    });
    
    rightBtn.addEventListener('click', () => {
      const before = getDecimal();
      const beforeBin = bits.join('');
      // Shift right: bits[N-1] is dropped, bits[i] = bits[i-1], bits[0] = 0
      const dropped = bits[NBITS - 1];
      for (let i = NBITS - 1; i > 0; i--) bits[i] = bits[i - 1];
      bits[0] = 0;
      const after = getDecimal();
      syncBitButtons();
      update();
      const remainder = dropped === 1 ? ' (υπόλοιπο 1)' : '';
      addToLog('➡️ Shift Right: ' + beforeBin + ' (' + before + ') → ' + bits.join('') + ' (' + after + ')' + remainder);
    });
    
    resetBtn.addEventListener('click', () => {
      bits = [0, 0, 0, 0, 0, 1, 1, 0];
      syncBitButtons();
      update();
      history = [];
      logEl.innerHTML = '';
    });
    
    buildBitInputs();
    update();
  })();

})();
