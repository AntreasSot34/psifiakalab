/* ==========================================================================
   Flip-Flop Interactive Simulators
   1. SR Latch (asynchronous)
   2. JK Flip-Flop (clocked, positive edge-triggered)
   3. Timing diagram visualizer
   ========================================================================== */

(function() {
  'use strict';

  /* ===== Helper: toggle bit button ===== */
  function setBit(btn, value) {
    btn.dataset.bit = value;
    btn.textContent = value;
    btn.classList.toggle('is-high', value === 1);
  }
  function getBit(btn) {
    return parseInt(btn.dataset.bit, 10) || 0;
  }
  function setLed(led, value) {
    led.textContent = value;
    led.classList.toggle('is-high', value === 1);
    led.classList.toggle('is-low', value !== 1);
  }

  /* ============================================================
     1. SR LATCH SIMULATOR
     ============================================================ */
  (function srLatch() {
    const btnS = document.getElementById('sr-S');
    const btnR = document.getElementById('sr-R');
    const ledQ = document.getElementById('sr-Q');
    const ledQbar = document.getElementById('sr-Qbar');
    const status = document.getElementById('sr-status');
    const table = document.getElementById('sr-table');
    
    if (!btnS || !btnR) return;
    
    let Q = 0; // current state (memory)
    
    function update() {
      const S = getBit(btnS);
      const R = getBit(btnR);
      
      let newState = 'memory';
      let qNext = Q;
      let allowed = true;
      
      if (S === 0 && R === 0) {
        // memory - keep Q
        qNext = Q;
        newState = 'Memory (διατήρηση)';
      } else if (S === 0 && R === 1) {
        qNext = 0;
        newState = 'Reset → Q=0';
      } else if (S === 1 && R === 0) {
        qNext = 1;
        newState = 'Set → Q=1';
      } else {
        // forbidden
        allowed = false;
        newState = '⚠️ ΑΠΑΓΟΡΕΥΜΕΝΗ ΚΑΤΑΣΤΑΣΗ!';
      }
      
      if (allowed) {
        Q = qNext;
        setLed(ledQ, Q);
        setLed(ledQbar, 1 - Q);
        status.innerHTML = 'Κατάσταση: <strong>' + newState + '</strong>';
        status.style.color = '';
      } else {
        // Show both Q and Qbar = 0 to visualize the contradiction
        setLed(ledQ, 0);
        setLed(ledQbar, 0);
        ledQ.style.background = '#ef4444';
        ledQbar.style.background = '#ef4444';
        status.innerHTML = '<strong>' + newState + '</strong> Q και Q̄ είναι και τα δύο 0!';
        status.style.color = '#ef4444';
        // Restore styling after a moment
        setTimeout(() => {
          ledQ.style.background = '';
          ledQbar.style.background = '';
        }, 1200);
      }
      
      // Highlight active row
      table.querySelectorAll('tbody tr').forEach(row => {
        row.classList.toggle('is-active',
          parseInt(row.dataset.s, 10) === S && parseInt(row.dataset.r, 10) === R);
      });
    }
    
    [btnS, btnR].forEach(btn => {
      btn.addEventListener('click', () => {
        setBit(btn, 1 - getBit(btn));
        update();
      });
    });
    
    update(); // initial
  })();

  /* ============================================================
     2. JK FLIP-FLOP SIMULATOR
     ============================================================ */
  (function jkFF() {
    const btnJ = document.getElementById('jk-J');
    const btnK = document.getElementById('jk-K');
    const ledQ = document.getElementById('jk-Q');
    const ledQbar = document.getElementById('jk-Qbar');
    const clockBtn = document.getElementById('jk-clock');
    const resetBtn = document.getElementById('jk-reset');
    const counter = document.getElementById('jk-counter');
    
    if (!btnJ || !btnK || !clockBtn) return;
    
    let Q = 0;
    let pulseCount = 0;
    
    function updateOutputs() {
      setLed(ledQ, Q);
      setLed(ledQbar, 1 - Q);
    }
    
    [btnJ, btnK].forEach(btn => {
      btn.addEventListener('click', () => {
        setBit(btn, 1 - getBit(btn));
      });
    });
    
    clockBtn.addEventListener('click', () => {
      const J = getBit(btnJ);
      const K = getBit(btnK);
      
      // Apply JK rule on positive clock edge
      if (J === 0 && K === 0) {
        // memory - no change
      } else if (J === 0 && K === 1) {
        Q = 0;
      } else if (J === 1 && K === 0) {
        Q = 1;
      } else {
        // toggle
        Q = 1 - Q;
      }
      
      pulseCount++;
      counter.textContent = 'Παλμοί: ' + pulseCount;
      
      // Brief flash animation
      ledQ.style.transform = 'scale(1.15)';
      setTimeout(() => { ledQ.style.transform = ''; }, 150);
      
      updateOutputs();
    });
    
    resetBtn.addEventListener('click', () => {
      Q = 0;
      pulseCount = 0;
      counter.textContent = 'Παλμοί: 0';
      setBit(btnJ, 0);
      setBit(btnK, 0);
      updateOutputs();
    });
    
    updateOutputs();
  })();

  /* ============================================================
     3. TIMING DIAGRAM VISUALIZER
     ============================================================ */
  (function timingDiagram() {
    const container = document.getElementById('timing-cells');
    const canvas = document.getElementById('timing-canvas');
    const randomBtn = document.getElementById('timing-randomize');
    const resetBtn = document.getElementById('timing-reset');
    
    if (!container || !canvas) return;
    
    const NUM_PULSES = 8;
    let jValues = new Array(NUM_PULSES).fill(0);
    let kValues = new Array(NUM_PULSES).fill(0);
    
    /* ----- Build the input cell grid ----- */
    function buildCells() {
      container.innerHTML = '';
      
      // Header row: blank + pulse numbers
      const blankCell = document.createElement('div');
      container.appendChild(blankCell);
      for (let i = 0; i < NUM_PULSES; i++) {
        const c = document.createElement('div');
        c.className = 'mono center muted';
        c.style.fontSize = '0.85rem';
        c.textContent = '#' + (i + 1);
        container.appendChild(c);
      }
      
      // J row
      const jLabel = document.createElement('div');
      jLabel.className = 'mono';
      jLabel.style.fontWeight = '700';
      jLabel.textContent = 'J:';
      container.appendChild(jLabel);
      for (let i = 0; i < NUM_PULSES; i++) {
        const btn = makeMiniBitBtn('j', i, jValues[i]);
        container.appendChild(btn);
      }
      
      // K row
      const kLabel = document.createElement('div');
      kLabel.className = 'mono';
      kLabel.style.fontWeight = '700';
      kLabel.textContent = 'K:';
      container.appendChild(kLabel);
      for (let i = 0; i < NUM_PULSES; i++) {
        const btn = makeMiniBitBtn('k', i, kValues[i]);
        container.appendChild(btn);
      }
    }
    
    function makeMiniBitBtn(input, index, val) {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.style.padding = '8px';
      btn.style.minHeight = '40px';
      btn.style.fontSize = '1rem';
      btn.style.background = val === 1 ? 'var(--c-high)' : 'var(--c-low)';
      btn.style.color = 'white';
      btn.textContent = val;
      btn.addEventListener('click', () => {
        const newVal = 1 - (input === 'j' ? jValues[index] : kValues[index]);
        if (input === 'j') jValues[index] = newVal;
        else kValues[index] = newVal;
        btn.style.background = newVal === 1 ? 'var(--c-high)' : 'var(--c-low)';
        btn.textContent = newVal;
        drawTiming();
      });
      return btn;
    }
    
    /* ----- Draw the timing diagram on canvas ----- */
    function drawTiming() {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      
      // Clear
      ctx.clearRect(0, 0, w, h);
      
      // Get computed colors from CSS variables
      const styles = getComputedStyle(document.body);
      const colInk = styles.getPropertyValue('--c-ink').trim() || '#1a1d2e';
      const colClock = styles.getPropertyValue('--c-clock').trim() || '#2563eb';
      const colJ = styles.getPropertyValue('--c-tertiary').trim() || '#16a34a';
      const colK = styles.getPropertyValue('--c-purple').trim() || '#8b5cf6';
      const colQ = styles.getPropertyValue('--c-primary').trim() || '#ff5c39';
      const colMuted = styles.getPropertyValue('--c-muted').trim() || '#8b8fa8';
      
      const labelX = 50;
      const startX = 70;
      const usableW = w - startX - 20;
      const stepW = usableW / NUM_PULSES;
      
      // Track Y positions for each signal
      const tracks = [
        { label: 'CLK', y: 40, hi: 22, color: colClock },
        { label: 'J',   y: 90, hi: 22, color: colJ },
        { label: 'K',   y: 140, hi: 22, color: colK },
        { label: 'Q',   y: 200, hi: 22, color: colQ }
      ];
      
      // Draw labels
      ctx.font = '700 14px JetBrains Mono, monospace';
      ctx.fillStyle = colInk;
      tracks.forEach(t => {
        ctx.fillText(t.label, 12, t.y + 4);
      });
      
      // Draw vertical grid lines (one per pulse)
      ctx.strokeStyle = colMuted;
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      for (let i = 0; i <= NUM_PULSES; i++) {
        const x = startX + i * stepW;
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x, h - 10);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      
      // Pulse number labels
      ctx.font = '600 11px JetBrains Mono, monospace';
      ctx.fillStyle = colMuted;
      for (let i = 0; i < NUM_PULSES; i++) {
        const x = startX + i * stepW + stepW / 2;
        ctx.fillText('#' + (i + 1), x - 8, 14);
      }
      
      ctx.lineWidth = 2.5;
      
      // Draw CLK (positive-edge pulses)
      ctx.strokeStyle = colClock;
      ctx.beginPath();
      const clkY_lo = tracks[0].y + tracks[0].hi;
      const clkY_hi = tracks[0].y - tracks[0].hi;
      let x = startX;
      ctx.moveTo(x, clkY_lo);
      for (let i = 0; i < NUM_PULSES; i++) {
        // Each pulse: half low, then up, then half high
        ctx.lineTo(x + stepW * 0.4, clkY_lo);
        ctx.lineTo(x + stepW * 0.4, clkY_hi);
        ctx.lineTo(x + stepW * 0.9, clkY_hi);
        ctx.lineTo(x + stepW * 0.9, clkY_lo);
        x += stepW;
      }
      ctx.lineTo(x, clkY_lo);
      ctx.stroke();
      
      // Helper to draw a digital signal line
      function drawSignal(values, track, useEdges) {
        ctx.strokeStyle = track.color;
        ctx.beginPath();
        let curY = (values[0] === 1) ? track.y - track.hi : track.y + track.hi;
        ctx.moveTo(startX, curY);
        
        if (useEdges) {
          // Q changes only on positive edge of clock (at 0.4 of each step)
          for (let i = 0; i < NUM_PULSES; i++) {
            const edgeX = startX + i * stepW + stepW * 0.4;
            // hold until edge
            ctx.lineTo(edgeX, curY);
            // step at edge
            const newY = (values[i] === 1) ? track.y - track.hi : track.y + track.hi;
            if (newY !== curY) {
              ctx.lineTo(edgeX, newY);
              curY = newY;
            }
            // continue to next edge
          }
          ctx.lineTo(startX + NUM_PULSES * stepW, curY);
        } else {
          // J/K — value held throughout each pulse window
          for (let i = 0; i < NUM_PULSES; i++) {
            const newY = (values[i] === 1) ? track.y - track.hi : track.y + track.hi;
            const xStart = startX + i * stepW;
            const xEnd = startX + (i + 1) * stepW;
            if (newY !== curY) {
              ctx.lineTo(xStart, newY);
              curY = newY;
            }
            ctx.lineTo(xEnd, curY);
          }
        }
        ctx.stroke();
      }
      
      // Compute Q values (positive-edge JK)
      const qValues = [];
      let Q = 0;
      for (let i = 0; i < NUM_PULSES; i++) {
        const J = jValues[i];
        const K = kValues[i];
        if (J === 0 && K === 0) {
          // hold
        } else if (J === 0 && K === 1) Q = 0;
        else if (J === 1 && K === 0) Q = 1;
        else Q = 1 - Q;
        qValues.push(Q);
      }
      
      drawSignal(jValues, tracks[1], false);
      drawSignal(kValues, tracks[2], false);
      drawSignal(qValues, tracks[3], true);
    }
    
    randomBtn.addEventListener('click', () => {
      jValues = jValues.map(() => Math.round(Math.random()));
      kValues = kValues.map(() => Math.round(Math.random()));
      buildCells();
      drawTiming();
    });
    
    resetBtn.addEventListener('click', () => {
      jValues.fill(0);
      kValues.fill(0);
      buildCells();
      drawTiming();
    });
    
    buildCells();
    drawTiming();
  })();

})();
