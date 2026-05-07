/* ==========================================================================
   Logic Families - Interactive Simulators
   1. Logic Level Tester - shows V_IL, V_IH zones, tests a voltage
   2. Fan-Out Simulator - visualizes load on a gate
   3. TTL vs CMOS Comparison - animated bar charts
   ========================================================================== */

(function() {
  'use strict';

  function cssColor(name, fallback) {
    return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
  }

  /* ============================================================
     1. LOGIC LEVEL TESTER
     ============================================================ */
  (function logicLevels() {
    const familySel = document.getElementById('lvl-family');
    const vSlider = document.getElementById('lvl-V');
    const vOut = document.getElementById('lvl-V-val');
    const vilEl = document.getElementById('lvl-VIL');
    const vihEl = document.getElementById('lvl-VIH');
    const resultEl = document.getElementById('lvl-result');
    const canvas = document.getElementById('lvl-canvas');
    
    if (!familySel || !canvas) return;
    
    // Logic level specs by family
    // VCC: supply voltage
    // VOL_max: max output for logic 0
    // VOH_min: min output for logic 1  
    // VIL_max: max input that's interpreted as 0
    // VIH_min: min input that's interpreted as 1
    const families = {
      ttl:    { name: 'TTL (74xx)',    vcc: 5.0,  VOL: 0.4, VOH: 2.4, VIL: 0.8, VIH: 2.0,  color: '#2563eb' },
      cmos5:  { name: 'CMOS @ 5V',     vcc: 5.0,  VOL: 0.5, VOH: 4.4, VIL: 1.5, VIH: 3.5,  color: '#16a34a' },
      cmos3:  { name: 'CMOS @ 3.3V',   vcc: 3.3,  VOL: 0.4, VOH: 2.9, VIL: 0.8, VIH: 2.0,  color: '#8b5cf6' },
      lvcmos: { name: 'LVCMOS @ 1.8V', vcc: 1.8,  VOL: 0.45, VOH: 1.35, VIL: 0.63, VIH: 1.17, color: '#ff5c39' }
    };
    
    function update() {
      const fam = families[familySel.value];
      const V = parseFloat(vSlider.value);
      
      // Adjust slider max based on VCC
      vSlider.max = fam.vcc;
      
      vOut.textContent = V.toFixed(2) + ' V';
      vilEl.textContent = fam.VIL.toFixed(2) + ' V';
      vihEl.textContent = fam.VIH.toFixed(2) + ' V';
      
      // Determine result
      let result, color;
      if (V <= fam.VIL) {
        result = 'Λογικό 0';
        color = 'var(--c-low)';
      } else if (V >= fam.VIH) {
        result = 'Λογικό 1';
        color = 'var(--c-high)';
      } else {
        result = '⚠️ Απροσδιόριστη';
        color = 'var(--c-quaternary)';
      }
      resultEl.textContent = result;
      resultEl.style.color = color;
      
      draw(fam, V);
    }
    
    function draw(fam, V) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      const colInk = cssColor('--c-ink', '#1a1d2e');
      const colMuted = cssColor('--c-muted', '#8b8fa8');
      const colHigh = cssColor('--c-high', '#16a34a');
      const colLow = cssColor('--c-low', '#ef4444');
      const colWarn = cssColor('--c-quaternary', '#f59e0b');
      
      const padL = 70, padR = 30, padT = 25, padB = 30;
      const plotW = w - padL - padR;
      const plotH = h - padT - padB;
      
      // Y maps voltage 0 to vcc -> bottom to top
      const yFor = v => padT + plotH - (v / fam.vcc) * plotH;
      
      // Three zones for INPUT (right side):
      // - Low zone: 0 to VIL (red tint)
      // - Indeterminate: VIL to VIH (yellow tint)
      // - High zone: VIH to VCC (green tint)
      const zoneXStart = padL + 30;
      const zoneXEnd = w - padR - 60;
      
      const yVCC = yFor(fam.vcc);
      const yVIH = yFor(fam.VIH);
      const yVIL = yFor(fam.VIL);
      const y0 = yFor(0);
      
      // Background zones
      ctx.fillStyle = colHigh;
      ctx.globalAlpha = 0.12;
      ctx.fillRect(zoneXStart, yVCC, zoneXEnd - zoneXStart, yVIH - yVCC);
      ctx.fillStyle = colWarn;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(zoneXStart, yVIH, zoneXEnd - zoneXStart, yVIL - yVIH);
      ctx.fillStyle = colLow;
      ctx.globalAlpha = 0.12;
      ctx.fillRect(zoneXStart, yVIL, zoneXEnd - zoneXStart, y0 - yVIL);
      ctx.globalAlpha = 1;
      
      // Zone borders (dashed)
      ctx.strokeStyle = colInk;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(zoneXStart, yVIH); ctx.lineTo(zoneXEnd, yVIH);
      ctx.moveTo(zoneXStart, yVIL); ctx.lineTo(zoneXEnd, yVIL);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      
      // Zone outline
      ctx.strokeStyle = colInk;
      ctx.lineWidth = 2;
      ctx.strokeRect(zoneXStart, yVCC, zoneXEnd - zoneXStart, y0 - yVCC);
      
      // Voltage axis
      ctx.strokeStyle = colInk;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padL, yVCC);
      ctx.lineTo(padL, y0);
      ctx.stroke();
      
      // Y-axis tick labels
      ctx.fillStyle = colMuted;
      ctx.font = '600 11px JetBrains Mono, monospace';
      const ticks = [0, fam.VIL, fam.VIH, fam.vcc];
      ticks.forEach(t => {
        const y = yFor(t);
        ctx.beginPath();
        ctx.moveTo(padL - 4, y);
        ctx.lineTo(padL, y);
        ctx.stroke();
        ctx.fillText(t.toFixed(2) + 'V', 8, y + 4);
      });
      
      // Zone labels
      ctx.font = '700 13px Bricolage Grotesque, serif';
      ctx.fillStyle = colHigh;
      ctx.fillText('Λογικό 1 (HIGH)', zoneXStart + 12, (yVCC + yVIH) / 2 + 4);
      ctx.fillStyle = colWarn;
      ctx.fillText('⚠ Απροσδιόριστη', zoneXStart + 12, (yVIH + yVIL) / 2 + 4);
      ctx.fillStyle = colLow;
      ctx.fillText('Λογικό 0 (LOW)', zoneXStart + 12, (yVIL + y0) / 2 + 4);
      
      // V_IH and V_IL labels on right
      ctx.fillStyle = colInk;
      ctx.font = '600 11px JetBrains Mono, monospace';
      ctx.fillText('V_IH = ' + fam.VIH + 'V', zoneXEnd + 6, yVIH + 4);
      ctx.fillText('V_IL = ' + fam.VIL + 'V', zoneXEnd + 6, yVIL + 4);
      
      // Test voltage indicator (horizontal line + arrow)
      const yV = yFor(V);
      ctx.strokeStyle = colInk;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(zoneXStart - 25, yV);
      ctx.lineTo(zoneXEnd + 4, yV);
      ctx.stroke();
      
      // Arrow tip
      ctx.fillStyle = colInk;
      ctx.beginPath();
      ctx.moveTo(zoneXStart - 25, yV);
      ctx.lineTo(zoneXStart - 18, yV - 5);
      ctx.lineTo(zoneXStart - 18, yV + 5);
      ctx.closePath();
      ctx.fill();
      
      // V label
      ctx.fillStyle = colInk;
      ctx.font = '700 13px Bricolage Grotesque, serif';
      ctx.fillText('V_in', padL + 4, yV + (yV < padT + 20 ? 14 : -6));
      
      // Title
      ctx.fillStyle = colInk;
      ctx.font = '700 13px Bricolage Grotesque, serif';
      ctx.fillText(fam.name + '  (V_CC = ' + fam.vcc + 'V)', padL, padT - 8);
    }
    
    familySel.addEventListener('change', update);
    vSlider.addEventListener('input', update);
    update();
  })();

  /* ============================================================
     2. FAN-OUT SIMULATOR
     ============================================================ */
  (function fanOut() {
    const famSel = document.getElementById('fo-family');
    const nSlider = document.getElementById('fo-N');
    const nOut = document.getElementById('fo-N-val');
    const limitEl = document.getElementById('fo-limit');
    const loadEl = document.getElementById('fo-load');
    const statusEl = document.getElementById('fo-status');
    const canvas = document.getElementById('fo-canvas');
    
    if (!famSel || !canvas) return;
    
    const limits = { ttl: 10, cmos: 50 };
    
    function update() {
      const family = famSel.value;
      const limit = limits[family];
      const N = parseInt(nSlider.value, 10);
      
      // Update slider max based on family
      nSlider.max = family === 'ttl' ? 18 : 60;
      
      nOut.textContent = N;
      limitEl.textContent = limit;
      loadEl.textContent = N;
      
      let status, color;
      if (N <= limit * 0.7) {
        status = '✅ OK (ασφαλής)';
        color = 'var(--c-high)';
      } else if (N <= limit) {
        status = '⚠️ Στο όριο';
        color = 'var(--c-quaternary)';
      } else if (N <= limit * 1.3) {
        status = '🚨 Υπερφόρτωση';
        color = 'var(--c-low)';
      } else {
        status = '💥 Σφάλμα!';
        color = 'var(--c-low)';
      }
      statusEl.textContent = status;
      statusEl.style.color = color;
      
      draw(family, N, limit);
    }
    
    function draw(family, N, limit) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      const colInk = cssColor('--c-ink', '#1a1d2e');
      const colMuted = cssColor('--c-muted', '#8b8fa8');
      const colHigh = cssColor('--c-high', '#16a34a');
      const colLow = cssColor('--c-low', '#ef4444');
      const colPrimary = cssColor('--c-primary', '#ff5c39');
      const colSec = cssColor('--c-secondary', '#2563eb');
      const colWarn = cssColor('--c-quaternary', '#f59e0b');
      
      // Driver gate on left
      const driverX = 80;
      const driverY = h / 2;
      const driverW = 70;
      const driverH = 50;
      
      // Output signal quality based on overload
      const overloadPct = N / limit;
      let signalColor;
      if (overloadPct <= 0.7) signalColor = colHigh;
      else if (overloadPct <= 1.0) signalColor = colWarn;
      else signalColor = colLow;
      
      // Draw driver gate (triangle/inverter shape)
      ctx.fillStyle = signalColor;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(driverX - driverW/2, driverY - driverH/2, driverW, driverH);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = colInk;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(driverX - driverW/2, driverY - driverH/2, driverW, driverH);
      
      // Driver label
      ctx.fillStyle = colInk;
      ctx.font = '700 14px Bricolage Grotesque, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Driver', driverX, driverY - 4);
      ctx.font = '600 11px JetBrains Mono, monospace';
      ctx.fillText('IC', driverX, driverY + 12);
      ctx.textAlign = 'left';
      
      // Cap N for visual purposes (max gates to draw = 60)
      const visN = Math.min(N, 60);
      
      // Compute load gate positions (right side, in a fan layout)
      const loadX0 = 320;
      const loadW = 38;
      const loadH = 28;
      
      // Calculate optimal grid layout
      const cols = Math.ceil(Math.sqrt(visN * 1.6));
      const rows = Math.ceil(visN / cols);
      const colSpacing = Math.min(45, (w - loadX0 - 30) / cols);
      const rowSpacing = Math.min(38, (h - 30) / rows);
      const gridW = (cols - 1) * colSpacing + loadW;
      const gridH = (rows - 1) * rowSpacing + loadH;
      const startY = (h - gridH) / 2;
      
      // Output line from driver to fan-out junction
      const junctionX = loadX0 - 30;
      ctx.strokeStyle = signalColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(driverX + driverW/2, driverY);
      ctx.lineTo(junctionX, driverY);
      ctx.stroke();
      
      // Junction dot
      ctx.fillStyle = colInk;
      ctx.beginPath();
      ctx.arc(junctionX, driverY, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw load gates and connections
      let drawn = 0;
      for (let r = 0; r < rows && drawn < visN; r++) {
        for (let c = 0; c < cols && drawn < visN; c++) {
          const gx = loadX0 + c * colSpacing;
          const gy = startY + r * rowSpacing;
          
          // Connection line from junction
          ctx.strokeStyle = signalColor;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = overloadPct > 1.0 ? 0.5 : 0.85;
          ctx.beginPath();
          ctx.moveTo(junctionX, driverY);
          ctx.lineTo(gx, gy + loadH/2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          
          // Load gate
          ctx.fillStyle = signalColor;
          ctx.globalAlpha = 0.15;
          ctx.fillRect(gx, gy, loadW, loadH);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = colInk;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(gx, gy, loadW, loadH);
          
          // Mark "broken" gates if over 130%
          if (drawn >= limit && overloadPct > 1.3) {
            ctx.strokeStyle = colLow;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(gx + 6, gy + 6);
            ctx.lineTo(gx + loadW - 6, gy + loadH - 6);
            ctx.moveTo(gx + loadW - 6, gy + 6);
            ctx.lineTo(gx + 6, gy + loadH - 6);
            ctx.stroke();
          }
          
          drawn++;
        }
      }
      
      // If N > 60, indicate truncation
      if (N > 60) {
        ctx.fillStyle = colInk;
        ctx.font = '700 12px Bricolage Grotesque, serif';
        ctx.fillText('+' + (N - 60) + ' πύλες (όχι όλες ορατές)', loadX0, h - 8);
      }
      
      // Top-left status indicator
      ctx.fillStyle = colInk;
      ctx.font = '700 12px Bricolage Grotesque, serif';
      const famName = family === 'ttl' ? 'TTL' : 'CMOS';
      ctx.fillText('Οικογένεια: ' + famName + '  |  Όριο: ' + limit, 8, 18);
      ctx.fillStyle = signalColor;
      ctx.fillText('Φόρτος: ' + N + ' (' + Math.round(overloadPct * 100) + '% του ορίου)', 8, 36);
    }
    
    famSel.addEventListener('change', update);
    nSlider.addEventListener('input', update);
    update();
  })();

  /* ============================================================
     3. TTL vs CMOS COMPARISON BARS
     ============================================================ */
  (function comparison() {
    const messageEl = document.getElementById('cmp-message');
    const barsEl = document.getElementById('cmp-bars');
    const buttons = {
      power:  document.getElementById('cmp-power'),
      speed:  document.getElementById('cmp-speed'),
      fanout: document.getElementById('cmp-fanout'),
      noise:  document.getElementById('cmp-noise')
    };
    
    if (!messageEl || !barsEl) return;
    
    // For each metric: { ttl_value, cmos_value, lower_is_better, unit, label, ttl_winner_text, cmos_winner_text }
    const metrics = {
      power: {
        ttl: 80, cmos: 5,
        lowerIsBetter: true,
        unit: 'mW',
        label: 'Κατανάλωση Ισχύος',
        winner: 'cmos',
        message: '✅ Νικητής: CMOS — καταναλώνει 16× λιγότερη ενέργεια από TTL!'
      },
      speed: {
        ttl: 10, cmos: 80,
        lowerIsBetter: true,
        unit: 'ns',
        label: 'Καθυστέρηση Διάδοσης',
        winner: 'ttl',
        message: '✅ Νικητής: TTL — 8× πιο γρήγορη από κλασσική CMOS!'
      },
      fanout: {
        ttl: 10, cmos: 50,
        lowerIsBetter: false,
        unit: 'πύλες',
        label: 'Ικανότητα Οδήγησης (Fan-Out)',
        winner: 'cmos',
        message: '✅ Νικητής: CMOS — οδηγεί 5× περισσότερες πύλες!'
      },
      noise: {
        ttl: 0.4, cmos: 2.0,
        lowerIsBetter: false,
        unit: 'V',
        label: 'Περιθώριο Θορύβου',
        winner: 'cmos',
        message: '✅ Νικητής: CMOS — αντέχει 5× περισσότερο θόρυβο!'
      }
    };
    
    function showMetric(key) {
      const m = metrics[key];
      messageEl.textContent = m.message;
      messageEl.style.color = m.winner === 'ttl' ? 'var(--c-secondary)' : 'var(--c-tertiary)';
      
      // Highlight active button
      Object.entries(buttons).forEach(([k, b]) => {
        b.classList.toggle('btn--primary', k === key);
      });
      
      // Render bars
      const maxVal = Math.max(m.ttl, m.cmos);
      const ttlPct = (m.ttl / maxVal) * 100;
      const cmosPct = (m.cmos / maxVal) * 100;
      
      barsEl.innerHTML = `
        <div class="cmp-bar-row">
          <div class="cmp-bar-label">TTL ${m.winner === 'ttl' ? '🏆' : ''}</div>
          <div class="cmp-bar-track">
            <div class="cmp-bar-fill" style="width:${ttlPct}%; background: var(--c-secondary);">
              <span>${m.ttl} ${m.unit}</span>
            </div>
          </div>
        </div>
        <div class="cmp-bar-row">
          <div class="cmp-bar-label">CMOS ${m.winner === 'cmos' ? '🏆' : ''}</div>
          <div class="cmp-bar-track">
            <div class="cmp-bar-fill" style="width:${cmosPct}%; background: var(--c-tertiary);">
              <span>${m.cmos} ${m.unit}</span>
            </div>
          </div>
        </div>
        <div class="cmp-hint">${m.lowerIsBetter ? '↓ Μικρότερο είναι καλύτερο' : '↑ Μεγαλύτερο είναι καλύτερο'}</div>
      `;
    }
    
    Object.entries(buttons).forEach(([k, b]) => {
      b.addEventListener('click', () => showMetric(k));
    });
    
    // Show first metric by default
    showMetric('power');
  })();

})();
