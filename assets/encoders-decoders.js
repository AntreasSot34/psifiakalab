/* ==========================================================================
   Encoders & Decoders - Interactive Simulators
   1. Decoder N→2^N (with one-hot output visualization)
   2. BCD to 7-Segment Display (with real SVG segment animation)
   3. Priority Encoder (with multi-input support)
   ========================================================================== */

(function() {
  'use strict';

  /* ============================================================
     1. DECODER N→2^N
     ============================================================ */
  (function decoder() {
    const nSlider = document.getElementById('dec-N');
    const nOut = document.getElementById('dec-N-val');
    const binEl = document.getElementById('dec-bin');
    const activeEl = document.getElementById('dec-active');
    const totalEl = document.getElementById('dec-total');
    const inputsEl = document.getElementById('dec-inputs');
    const outputsEl = document.getElementById('dec-outputs');
    
    if (!nSlider || !inputsEl) return;
    
    let N = 3;
    let bits = [0, 0, 0, 0]; // A0, A1, A2, A3 (LSB first)
    
    function buildInputs() {
      inputsEl.innerHTML = '';
      // Build from MSB to LSB
      for (let i = N - 1; i >= 0; i--) {
        const c = document.createElement('div');
        c.className = 'bit-toggle';
        c.innerHTML = `
          <span class="bit-toggle-label">A${i}${i === N - 1 ? '<sub style="font-size:.7em;color:var(--c-muted)">MSB</sub>' : ''}</span>
          <button class="bit-btn" data-idx="${i}" data-bit="${bits[i]}">${bits[i]}</button>
        `;
        inputsEl.appendChild(c);
      }
      // Bind clicks
      inputsEl.querySelectorAll('.bit-btn').forEach(btn => {
        const i = parseInt(btn.dataset.idx, 10);
        btn.classList.toggle('is-high', bits[i] === 1);
        btn.addEventListener('click', () => {
          bits[i] = 1 - bits[i];
          btn.dataset.bit = bits[i];
          btn.textContent = bits[i];
          btn.classList.toggle('is-high', bits[i] === 1);
          update();
        });
      });
    }
    
    function buildOutputs() {
      outputsEl.innerHTML = '';
      const total = Math.pow(2, N);
      for (let i = 0; i < total; i++) {
        const c = document.createElement('div');
        c.className = 'output-led-mini';
        c.innerHTML = `
          <span class="output-led-mini-label">Y<sub>${i}</sub></span>
          <div class="led-mini" id="dec-y-${i}">0</div>
        `;
        outputsEl.appendChild(c);
      }
    }
    
    function update() {
      N = parseInt(nSlider.value, 10);
      nOut.textContent = N + ' bits';
      
      if (inputsEl.children.length !== N) {
        // Reset bits beyond N
        for (let i = N; i < 4; i++) bits[i] = 0;
        buildInputs();
        buildOutputs();
      }
      
      // Compute decimal value (only first N bits)
      let value = 0;
      for (let i = 0; i < N; i++) {
        if (bits[i]) value += Math.pow(2, i);
      }
      
      // Build binary string MSB first
      let binStr = '';
      for (let i = N - 1; i >= 0; i--) binStr += bits[i];
      binEl.textContent = binStr;
      activeEl.textContent = 'Y' + value;
      totalEl.textContent = Math.pow(2, N);
      
      // Update output LEDs
      const total = Math.pow(2, N);
      for (let i = 0; i < total; i++) {
        const led = document.getElementById('dec-y-' + i);
        if (led) {
          const isActive = i === value;
          led.textContent = isActive ? '1' : '0';
          led.classList.toggle('is-high', isActive);
        }
      }
    }
    
    nSlider.addEventListener('input', update);
    buildInputs();
    buildOutputs();
    update();
  })();

  /* ============================================================
     2. BCD TO 7-SEGMENT DISPLAY
     ============================================================ */
  (function sevenSegment() {
    const inputsEl = document.getElementById('seg-inputs');
    const bcdEl = document.getElementById('seg-bcd');
    const decEl = document.getElementById('seg-dec');
    const onEl = document.getElementById('seg-on');
    const cycleBtn = document.getElementById('seg-cycle');
    const resetBtn = document.getElementById('seg-reset');
    
    if (!inputsEl) return;
    
    // Segment table for digits 0-9
    // [a, b, c, d, e, f, g] — 1 means lit
    const segMap = {
      0: [1,1,1,1,1,1,0],
      1: [0,1,1,0,0,0,0],
      2: [1,1,0,1,1,0,1],
      3: [1,1,1,1,0,0,1],
      4: [0,1,1,0,0,1,1],
      5: [1,0,1,1,0,1,1],
      6: [0,0,1,1,1,1,1],
      7: [1,1,1,0,0,0,0],
      8: [1,1,1,1,1,1,1],
      9: [1,1,1,0,0,1,1]
    };
    
    let bits = [0, 0, 0, 0]; // A0 (LSB) ... A3 (MSB)
    let cycleInt = null;
    
    function buildInputs() {
      inputsEl.innerHTML = '';
      // From MSB (A3) to LSB (A0)
      for (let i = 3; i >= 0; i--) {
        const c = document.createElement('div');
        c.className = 'bit-toggle';
        c.innerHTML = `
          <span class="bit-toggle-label">A${i}${i === 3 ? '<sub style="font-size:.7em;color:var(--c-muted)">MSB</sub>' : ''}</span>
          <button class="bit-btn" data-idx="${i}" data-bit="${bits[i]}">${bits[i]}</button>
        `;
        inputsEl.appendChild(c);
      }
      inputsEl.querySelectorAll('.bit-btn').forEach(btn => {
        const i = parseInt(btn.dataset.idx, 10);
        btn.classList.toggle('is-high', bits[i] === 1);
        btn.addEventListener('click', () => {
          bits[i] = 1 - bits[i];
          syncButtons();
          update();
        });
      });
    }
    
    function syncButtons() {
      inputsEl.querySelectorAll('.bit-btn').forEach(btn => {
        const i = parseInt(btn.dataset.idx, 10);
        btn.dataset.bit = bits[i];
        btn.textContent = bits[i];
        btn.classList.toggle('is-high', bits[i] === 1);
      });
    }
    
    function getDecimal() {
      let v = 0;
      for (let i = 0; i < 4; i++) {
        if (bits[i]) v += Math.pow(2, i);
      }
      return v;
    }
    
    function update() {
      const dec = getDecimal();
      const bcdStr = bits.slice().reverse().join('');
      bcdEl.textContent = bcdStr;
      decEl.textContent = dec;
      
      // Get segment pattern (handle invalid BCD 10-15)
      const pattern = segMap[dec] || [0,0,0,0,0,0,0];
      const segs = ['a','b','c','d','e','f','g'];
      const litColor = '#ff5c39'; // primary
      const dimColor = '#1a1d2e'; // ink (dark)
      
      const litSegs = [];
      segs.forEach((s, i) => {
        const el = document.getElementById('seg-' + s);
        if (el) {
          const lit = pattern[i] === 1;
          el.setAttribute('fill', lit ? litColor : dimColor);
          if (lit) litSegs.push(s);
        }
      });
      
      onEl.textContent = litSegs.length > 0 ? litSegs.join(',') : '(none)';
      
      // If invalid BCD, show warning
      if (dec > 9) {
        decEl.textContent = dec + ' ⚠️';
        decEl.style.color = 'var(--c-low)';
      } else {
        decEl.style.color = 'var(--c-primary)';
      }
    }
    
    cycleBtn.addEventListener('click', () => {
      if (cycleInt) {
        clearInterval(cycleInt);
        cycleInt = null;
        cycleBtn.textContent = '▶️ Auto Cycle 0-9';
      } else {
        let cur = getDecimal();
        if (cur > 9) cur = 0;
        cycleInt = setInterval(() => {
          cur = (cur + 1) % 10;
          // Set bits to cur
          for (let i = 0; i < 4; i++) {
            bits[i] = (cur >> i) & 1;
          }
          syncButtons();
          update();
        }, 700);
        cycleBtn.textContent = '⏸ Pause';
      }
    });
    
    resetBtn.addEventListener('click', () => {
      bits = [0, 0, 0, 0];
      syncButtons();
      if (cycleInt) {
        clearInterval(cycleInt);
        cycleInt = null;
        cycleBtn.textContent = '▶️ Auto Cycle 0-9';
      }
      update();
    });
    
    buildInputs();
    update();
  })();

  /* ============================================================
     3. PRIORITY ENCODER
     ============================================================ */
  (function priorityEncoder() {
    const inputsEl = document.getElementById('pri-inputs');
    const outputsEl = document.getElementById('pri-outputs');
    const pressedEl = document.getElementById('pri-pressed');
    const maxEl = document.getElementById('pri-max');
    const bcdEl = document.getElementById('pri-bcd');
    const clearBtn = document.getElementById('pri-clear');
    
    if (!inputsEl) return;
    
    let pressed = new Array(10).fill(0); // D0-D9
    
    function buildInputs() {
      inputsEl.innerHTML = '';
      for (let i = 0; i < 10; i++) {
        const c = document.createElement('div');
        c.className = 'bit-toggle';
        c.innerHTML = `
          <span class="bit-toggle-label">D${i}</span>
          <button class="bit-btn" data-idx="${i}" data-bit="${pressed[i]}">${pressed[i]}</button>
        `;
        inputsEl.appendChild(c);
      }
      inputsEl.querySelectorAll('.bit-btn').forEach(btn => {
        const i = parseInt(btn.dataset.idx, 10);
        btn.classList.toggle('is-high', pressed[i] === 1);
        btn.addEventListener('click', () => {
          pressed[i] = 1 - pressed[i];
          btn.dataset.bit = pressed[i];
          btn.textContent = pressed[i];
          btn.classList.toggle('is-high', pressed[i] === 1);
          update();
        });
      });
    }
    
    function buildOutputs() {
      outputsEl.innerHTML = '';
      // Y3 Y2 Y1 Y0 (MSB first)
      for (let i = 3; i >= 0; i--) {
        const c = document.createElement('div');
        c.className = 'output-led';
        c.innerHTML = `
          <span class="output-led-label">Y${i}</span>
          <div class="led" id="pri-y-${i}">0</div>
        `;
        outputsEl.appendChild(c);
      }
    }
    
    function update() {
      // Find highest active input
      let maxActive = -1;
      const pressedList = [];
      for (let i = 0; i < 10; i++) {
        if (pressed[i] === 1) {
          pressedList.push(i);
          if (i > maxActive) maxActive = i;
        }
      }
      
      pressedEl.textContent = pressedList.length === 0 ? '(κανένα)' : pressedList.map(n => 'D' + n).join(', ');
      
      if (maxActive < 0) {
        maxEl.textContent = '—';
        bcdEl.textContent = '0000';
        // All outputs 0
        for (let i = 0; i < 4; i++) {
          const led = document.getElementById('pri-y-' + i);
          if (led) {
            led.textContent = '0';
            led.classList.remove('is-high');
          }
        }
      } else {
        maxEl.textContent = 'D' + maxActive + ' = ' + maxActive;
        // Encode max as BCD (4 bits)
        const bcdStr = maxActive.toString(2).padStart(4, '0');
        bcdEl.textContent = bcdStr;
        for (let i = 0; i < 4; i++) {
          const bit = (maxActive >> i) & 1;
          const led = document.getElementById('pri-y-' + i);
          if (led) {
            led.textContent = bit;
            led.classList.toggle('is-high', bit === 1);
          }
        }
      }
    }
    
    clearBtn.addEventListener('click', () => {
      pressed = new Array(10).fill(0);
      inputsEl.querySelectorAll('.bit-btn').forEach(btn => {
        btn.dataset.bit = 0;
        btn.textContent = '0';
        btn.classList.remove('is-high');
      });
      update();
    });
    
    buildInputs();
    buildOutputs();
    update();
  })();

})();
