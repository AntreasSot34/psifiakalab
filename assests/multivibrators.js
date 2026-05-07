/* ==========================================================================
   Multivibrators - Interactive Simulators
   1. Astable Multivibrator (IC 555) - shows frequency, duty cycle, waveform
   2. Monostable Multivibrator - shows pulse on trigger
   3. Schmitt Trigger - converts noisy sine to square pulses
   ========================================================================== */

(function() {
  'use strict';

  /* Helper: format time/frequency cleanly */
  function fmtTime(seconds) {
    if (seconds >= 1) return seconds.toFixed(2) + ' s';
    if (seconds >= 0.001) return (seconds * 1000).toFixed(2) + ' ms';
    if (seconds >= 0.000001) return (seconds * 1e6).toFixed(2) + ' μs';
    return (seconds * 1e9).toFixed(0) + ' ns';
  }
  function fmtFreq(hz) {
    if (hz >= 1e6) return (hz / 1e6).toFixed(2) + ' MHz';
    if (hz >= 1000) return (hz / 1000).toFixed(2) + ' kHz';
    if (hz >= 1) return hz.toFixed(2) + ' Hz';
    return (hz * 1000).toFixed(2) + ' mHz';
  }

  /* Get CSS color helper */
  function cssColor(name, fallback) {
    return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
  }

  /* ============================================================
     1. ASTABLE MULTIVIBRATOR (IC 555)
     ============================================================ */
  (function astable() {
    const r1Slider = document.getElementById('ast-R1');
    const r2Slider = document.getElementById('ast-R2');
    const cSlider = document.getElementById('ast-C');
    const r1Out = document.getElementById('ast-R1-val');
    const r2Out = document.getElementById('ast-R2-val');
    const cOut = document.getElementById('ast-C-val');
    const freqEl = document.getElementById('ast-freq');
    const periodEl = document.getElementById('ast-period');
    const tHEl = document.getElementById('ast-tH');
    const tLEl = document.getElementById('ast-tL');
    const dutyEl = document.getElementById('ast-duty');
    const canvas = document.getElementById('ast-canvas');
    
    if (!r1Slider || !canvas) return;
    
    function fmtR(kohm) {
      if (kohm >= 1000) return (kohm / 1000).toFixed(1) + ' MΩ';
      return kohm + ' kΩ';
    }
    function fmtC(nf) {
      if (nf >= 1000) return (nf / 1000).toFixed(1) + ' μF';
      return nf + ' nF';
    }
    
    function update() {
      const R1 = parseFloat(r1Slider.value) * 1000; // Ω
      const R2 = parseFloat(r2Slider.value) * 1000; // Ω
      const C = parseFloat(cSlider.value) * 1e-9; // F
      
      // 555 astable formulas
      const tH = 0.693 * (R1 + R2) * C;
      const tL = 0.693 * R2 * C;
      const T = tH + tL;
      const f = 1 / T;
      const duty = (tH / T) * 100;
      
      r1Out.textContent = fmtR(parseFloat(r1Slider.value));
      r2Out.textContent = fmtR(parseFloat(r2Slider.value));
      cOut.textContent = fmtC(parseFloat(cSlider.value));
      
      freqEl.textContent = fmtFreq(f);
      periodEl.textContent = fmtTime(T);
      tHEl.textContent = fmtTime(tH);
      tLEl.textContent = fmtTime(tL);
      dutyEl.textContent = duty.toFixed(1) + ' %';
      
      drawWaveform(tH, tL);
    }
    
    function drawWaveform(tH, tL) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      const colInk = cssColor('--c-ink', '#1a1d2e');
      const colMuted = cssColor('--c-muted', '#8b8fa8');
      const colPrimary = cssColor('--c-primary', '#ff5c39');
      const colHigh = cssColor('--c-high', '#16a34a');
      
      const padL = 50, padR = 20, padT = 30, padB = 30;
      const plotW = w - padL - padR;
      const plotH = h - padT - padB;
      const yHigh = padT + 10;
      const yLow = padT + plotH - 10;
      
      // Compute period and how many cycles to show (target ~3 cycles visible)
      const T = tH + tL;
      const cycles = 3;
      const xPerSec = plotW / (cycles * T);
      
      // Background grid
      ctx.strokeStyle = colMuted;
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      // Horizontal lines for HIGH and LOW
      ctx.beginPath();
      ctx.moveTo(padL, yHigh); ctx.lineTo(w - padR, yHigh);
      ctx.moveTo(padL, yLow); ctx.lineTo(w - padR, yLow);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      
      // Y-axis labels
      ctx.font = '600 12px JetBrains Mono, monospace';
      ctx.fillStyle = colMuted;
      ctx.fillText('HIGH', 8, yHigh + 4);
      ctx.fillText('LOW', 8, yLow + 4);
      
      // Title
      ctx.fillStyle = colInk;
      ctx.font = '700 13px Bricolage Grotesque, serif';
      ctx.fillText('Έξοδος (Q)', padL, 18);
      
      // Draw the waveform (start at HIGH)
      ctx.strokeStyle = colPrimary;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      
      let t = 0;
      let x = padL;
      let isHigh = true;
      ctx.moveTo(x, yHigh);
      
      while (t < cycles * T && x < w - padR) {
        const segLen = isHigh ? tH : tL;
        const segXLen = segLen * xPerSec;
        const newX = Math.min(x + segXLen, w - padR);
        const curY = isHigh ? yHigh : yLow;
        const nextY = isHigh ? yLow : yHigh;
        
        ctx.lineTo(newX, curY);
        if (newX < w - padR) {
          ctx.lineTo(newX, nextY);
        }
        
        x = newX;
        t += segLen;
        isHigh = !isHigh;
      }
      ctx.stroke();
      
      // Time axis label
      ctx.fillStyle = colMuted;
      ctx.font = '600 11px JetBrains Mono, monospace';
      ctx.fillText('χρόνος →', w - padR - 60, h - 8);
      
      // Mark first period with dashed bracket
      const firstPeriodEnd = padL + T * xPerSec;
      ctx.strokeStyle = colInk;
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padL, h - 22);
      ctx.lineTo(firstPeriodEnd, h - 22);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = colInk;
      ctx.font = '600 11px JetBrains Mono, monospace';
      const labelX = padL + (firstPeriodEnd - padL) / 2 - 12;
      ctx.fillText('T', labelX, h - 8);
    }
    
    [r1Slider, r2Slider, cSlider].forEach(s => s.addEventListener('input', update));
    update();
  })();

  /* ============================================================
     2. MONOSTABLE MULTIVIBRATOR
     ============================================================ */
  (function monostable() {
    const rSlider = document.getElementById('mon-R');
    const cSlider = document.getElementById('mon-C');
    const rOut = document.getElementById('mon-R-val');
    const cOut = document.getElementById('mon-C-val');
    const timeEl = document.getElementById('mon-time');
    const stateEl = document.getElementById('mon-state');
    const triggerBtn = document.getElementById('mon-trigger');
    const resetBtn = document.getElementById('mon-reset');
    const canvas = document.getElementById('mon-canvas');
    
    if (!rSlider || !canvas) return;
    
    let triggers = []; // array of {triggerTime, pulseTime}
    let startTime = performance.now();
    let animId = null;
    
    function fmtR(kohm) { return kohm + ' kΩ'; }
    function fmtC(nf) {
      if (nf >= 1000) return (nf / 1000).toFixed(1) + ' μF';
      return nf + ' nF';
    }
    
    function getPulseTime() {
      const R = parseFloat(rSlider.value) * 1000;
      const C = parseFloat(cSlider.value) * 1e-9;
      return 1.1 * R * C;
    }
    
    function update() {
      rOut.textContent = fmtR(parseFloat(rSlider.value));
      cOut.textContent = fmtC(parseFloat(cSlider.value));
      const t = getPulseTime();
      timeEl.textContent = fmtTime(t);
      draw();
    }
    
    function draw() {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      const colInk = cssColor('--c-ink', '#1a1d2e');
      const colMuted = cssColor('--c-muted', '#8b8fa8');
      const colPrimary = cssColor('--c-primary', '#ff5c39');
      const colSecondary = cssColor('--c-secondary', '#2563eb');
      const colHigh = cssColor('--c-high', '#16a34a');
      
      const padL = 60, padR = 20, padT = 25, padB = 25;
      const plotH = (h - padT - padB) / 2;
      const trackInY = padT;
      const trackOutY = padT + plotH + 10;
      
      // Visible window: 5 seconds
      const windowSec = 5;
      const xPerSec = (w - padL - padR) / windowSec;
      const now = (performance.now() - startTime) / 1000;
      const tStart = Math.max(0, now - windowSec);
      
      // Track labels and rails
      ctx.font = '700 12px Bricolage Grotesque, serif';
      ctx.fillStyle = colInk;
      ctx.fillText('TRIGGER (in)', 8, trackInY + 12);
      ctx.fillText('Q (out)', 8, trackOutY + 12);
      
      // Grid lines
      ctx.strokeStyle = colMuted;
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      [trackInY + 8, trackInY + plotH - 8, trackOutY + 8, trackOutY + plotH - 8].forEach(y => {
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      
      // Compute current output state
      let isHigh = false;
      let pulseEnd = 0;
      for (const tr of triggers) {
        if (tr.triggerTime <= now && now < tr.triggerTime + tr.pulseTime) {
          isHigh = true;
          pulseEnd = tr.triggerTime + tr.pulseTime;
        }
      }
      stateEl.textContent = isHigh ? 'HIGH' : 'LOW';
      stateEl.classList.toggle('is-high', isHigh);
      stateEl.classList.toggle('is-low', !isHigh);
      
      // Draw input (triggers as narrow pulses ~30ms wide)
      const triggerWidth = 0.05; // 50ms visible pulses
      ctx.strokeStyle = colSecondary;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      let x = padL;
      let lastY = trackInY + plotH - 8;
      ctx.moveTo(x, lastY);
      
      triggers.forEach(tr => {
        if (tr.triggerTime < tStart) return;
        const tx = padL + (tr.triggerTime - tStart) * xPerSec;
        if (tx > w - padR) return;
        ctx.lineTo(tx, lastY);
        ctx.lineTo(tx, trackInY + 8);
        const txEnd = padL + (tr.triggerTime + triggerWidth - tStart) * xPerSec;
        ctx.lineTo(Math.min(txEnd, w - padR), trackInY + 8);
        ctx.lineTo(Math.min(txEnd, w - padR), lastY);
      });
      const xNow = padL + (now - tStart) * xPerSec;
      ctx.lineTo(Math.min(xNow, w - padR), lastY);
      ctx.stroke();
      
      // Draw output
      ctx.strokeStyle = colPrimary;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let outY = trackOutY + plotH - 8;
      ctx.moveTo(padL, outY);
      let curOut = false;
      
      // Build pulse events: rising at trigger, falling at trigger+pulseTime
      const events = [];
      triggers.forEach(tr => {
        events.push({ t: tr.triggerTime, type: 'up' });
        events.push({ t: tr.triggerTime + tr.pulseTime, type: 'down' });
      });
      events.sort((a, b) => a.t - b.t);
      
      events.forEach(ev => {
        if (ev.t < tStart || ev.t > now) return;
        const ex = padL + (ev.t - tStart) * xPerSec;
        ctx.lineTo(ex, outY);
        if (ev.type === 'up') {
          outY = trackOutY + 8;
          ctx.lineTo(ex, outY);
          curOut = true;
        } else if (ev.type === 'down' && curOut) {
          ctx.lineTo(ex, trackOutY + plotH - 8);
          outY = trackOutY + plotH - 8;
          curOut = false;
        }
      });
      ctx.lineTo(Math.min(xNow, w - padR), outY);
      ctx.stroke();
      
      // "now" cursor
      ctx.strokeStyle = colInk;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(xNow, padT - 5);
      ctx.lineTo(xNow, h - padB + 5);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      
      // X-axis label
      ctx.fillStyle = colMuted;
      ctx.font = '600 11px JetBrains Mono, monospace';
      ctx.fillText('χρόνος →', w - padR - 60, h - 4);
    }
    
    function loop() {
      draw();
      animId = requestAnimationFrame(loop);
    }
    
    triggerBtn.addEventListener('click', () => {
      const now = (performance.now() - startTime) / 1000;
      const pulseTime = getPulseTime();
      // Non-retriggerable: only trigger if not already in pulse
      let inPulse = false;
      for (const tr of triggers) {
        if (tr.triggerTime <= now && now < tr.triggerTime + tr.pulseTime) {
          inPulse = true;
          break;
        }
      }
      if (!inPulse) {
        triggers.push({ triggerTime: now, pulseTime: pulseTime });
        // Cleanup old triggers
        triggers = triggers.filter(t => t.triggerTime > now - 10);
      }
    });
    
    resetBtn.addEventListener('click', () => {
      triggers = [];
      startTime = performance.now();
    });
    
    [rSlider, cSlider].forEach(s => s.addEventListener('input', update));
    update();
    loop();
  })();

  /* ============================================================
     3. SCHMITT TRIGGER
     ============================================================ */
  (function schmitt() {
    const vhSlider = document.getElementById('smt-VH');
    const vlSlider = document.getElementById('smt-VL');
    const noiseSlider = document.getElementById('smt-noise');
    const vhOut = document.getElementById('smt-VH-val');
    const vlOut = document.getElementById('smt-VL-val');
    const noiseOut = document.getElementById('smt-noise-val');
    const hystEl = document.getElementById('smt-hyst');
    const modeSelect = document.getElementById('smt-mode');
    const canvas = document.getElementById('smt-canvas');
    
    if (!vhSlider || !canvas) return;
    
    // Pre-generate noise samples for stability
    const NUM_SAMPLES = 400;
    let noiseSamples = [];
    function regenerateNoise() {
      noiseSamples = [];
      for (let i = 0; i < NUM_SAMPLES; i++) {
        noiseSamples.push((Math.random() - 0.5) * 2);
      }
    }
    regenerateNoise();
    
    function update() {
      let VH = parseFloat(vhSlider.value);
      let VL = parseFloat(vlSlider.value);
      // Ensure VH > VL (swap if user inverts)
      if (VL >= VH) {
        VL = VH - 0.2;
        vlSlider.value = VL;
      }
      const noise = parseFloat(noiseSlider.value);
      
      vhOut.textContent = VH.toFixed(1) + ' V';
      vlOut.textContent = VL.toFixed(1) + ' V';
      noiseOut.textContent = noise + ' %';
      hystEl.textContent = (VH - VL).toFixed(1) + ' V';
      
      draw(VH, VL, noise);
    }
    
    function draw(VH, VL, noisePct) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      const colInk = cssColor('--c-ink', '#1a1d2e');
      const colMuted = cssColor('--c-muted', '#8b8fa8');
      const colPrimary = cssColor('--c-primary', '#ff5c39');
      const colSecondary = cssColor('--c-secondary', '#2563eb');
      const colTertiary = cssColor('--c-tertiary', '#16a34a');
      
      const isInverting = modeSelect ? modeSelect.value === 'inverting' : true;
      
      const padL = 60, padR = 20, padT = 30, padB = 35;
      const plotH = h - padT - padB;
      
      // Voltage axis: 0 to 5V on input/threshold area (top 70%)
      const voltSection = plotH * 0.65;
      const outSection = plotH * 0.30;
      const voltY0 = padT + voltSection; // y for 0V
      const voltScale = voltSection / 5; // px per volt
      
      const outYHigh = padT + voltSection + 15;
      const outYLow = h - padB - 5;
      
      // Threshold lines (VH and VL)
      const yVH = voltY0 - VH * voltScale;
      const yVL = voltY0 - VL * voltScale;
      
      // Hysteresis band
      ctx.fillStyle = colPrimary;
      ctx.globalAlpha = 0.08;
      ctx.fillRect(padL, yVH, w - padL - padR, yVL - yVH);
      ctx.globalAlpha = 1;
      
      // Threshold lines
      ctx.strokeStyle = colPrimary;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, yVH); ctx.lineTo(w - padR, yVH);
      ctx.moveTo(padL, yVL); ctx.lineTo(w - padR, yVL);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Threshold labels
      ctx.fillStyle = colPrimary;
      ctx.font = '700 11px JetBrains Mono, monospace';
      ctx.fillText('V_H = ' + VH.toFixed(1) + 'V', w - padR - 90, yVH - 4);
      ctx.fillText('V_L = ' + VL.toFixed(1) + 'V', w - padR - 90, yVL + 14);
      
      // Compute input signal samples + noise
      const numPts = 400;
      const cycles = 2.2;
      const inputVals = [];
      for (let i = 0; i < numPts; i++) {
        const t = (i / numPts) * cycles * 2 * Math.PI;
        // Sine wave centered at 2.5V, amplitude 2V, range [0.5, 4.5]
        let v = 2.5 + 2 * Math.sin(t);
        // Add noise
        v += (noisePct / 100) * 1.5 * noiseSamples[i % NUM_SAMPLES];
        v = Math.max(0, Math.min(5, v));
        inputVals.push(v);
      }
      
      // Draw input signal (blue, sine + noise)
      ctx.strokeStyle = colSecondary;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const xStep = (w - padL - padR) / (numPts - 1);
      for (let i = 0; i < numPts; i++) {
        const x = padL + i * xStep;
        const y = voltY0 - inputVals[i] * voltScale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Compute Schmitt trigger output
      const outputVals = [];
      let outState = 0; // 0 or 1
      for (let i = 0; i < numPts; i++) {
        const v = inputVals[i];
        if (isInverting) {
          // Rising past VH -> output 0
          // Falling past VL -> output 1
          if (v > VH) outState = 0;
          else if (v < VL) outState = 1;
        } else {
          // Non-inverting: rising past VH -> 1, falling past VL -> 0
          if (v > VH) outState = 1;
          else if (v < VL) outState = 0;
        }
        outputVals.push(outState);
      }
      
      // Draw output (orange, square wave below)
      ctx.strokeStyle = colPrimary;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let prevY = outputVals[0] === 1 ? outYHigh : outYLow;
      ctx.moveTo(padL, prevY);
      for (let i = 1; i < numPts; i++) {
        const x = padL + i * xStep;
        const y = outputVals[i] === 1 ? outYHigh : outYLow;
        if (y !== prevY) {
          ctx.lineTo(x, prevY);
          ctx.lineTo(x, y);
          prevY = y;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      // Voltage axis labels
      ctx.fillStyle = colMuted;
      ctx.font = '600 10px JetBrains Mono, monospace';
      for (let v = 0; v <= 5; v++) {
        const y = voltY0 - v * voltScale;
        ctx.fillText(v + 'V', 8, y + 3);
        // Tick
        ctx.strokeStyle = colMuted;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL - 4, y); ctx.lineTo(padL, y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      
      // Output labels
      ctx.fillStyle = colMuted;
      ctx.fillText('1', 8, outYHigh + 3);
      ctx.fillText('0', 8, outYLow + 3);
      
      // Track titles
      ctx.fillStyle = colSecondary;
      ctx.font = '700 12px Bricolage Grotesque, serif';
      ctx.fillText('Είσοδος (V_in)', padL, padT - 12);
      ctx.fillStyle = colPrimary;
      ctx.fillText('Έξοδος (V_out)', padL, outYHigh - 8);
      
      // Time axis
      ctx.fillStyle = colMuted;
      ctx.font = '600 11px JetBrains Mono, monospace';
      ctx.fillText('χρόνος →', w - padR - 60, h - 8);
    }
    
    [vhSlider, vlSlider, noiseSlider].forEach(s => s.addEventListener('input', update));
    if (modeSelect) modeSelect.addEventListener('change', update);
    
    // Regenerate noise periodically for visual movement
    setInterval(() => {
      regenerateNoise();
      update();
    }, 800);
    
    update();
  })();

})();
