/* ==========================================================================
   Parity Bit - Interactive Simulators
   1. Parity Generator - calculates P from data bits with step-by-step XOR
   2. Parity Checker - simulates transmitter -> noisy channel -> receiver
   3. BCD Parity Table - clickable table showing parity for 0-15
   ========================================================================== */

(function() {
  'use strict';

  /* ============================================================
     1. PARITY GENERATOR
     ============================================================ */
  (function generator() {
    const typeSel = document.getElementById('gen-type');
    const ARowEl = document.getElementById('gen-A-row');
    const countEl = document.getElementById('gen-count');
    const decEl = document.getElementById('gen-dec');
    const PEl = document.getElementById('gen-P');
    const totalEl = document.getElementById('gen-total');
    const fullEl = document.getElementById('gen-full');
    const calcEl = document.getElementById('gen-calc');

    if (!typeSel || !ARowEl) return;

    let bits = [0, 0, 0, 0]; // bit 0 = A0 (LSB), bit 3 = A3 (MSB)

    function buildARow() {
      ARowEl.innerHTML = '';
      // From MSB (A3) to LSB (A0)
      for (let i = 3; i >= 0; i--) {
        const c = document.createElement('div');
        c.className = 'bit-toggle';
        c.innerHTML = `
          <span class="bit-toggle-label">A${i}${i === 3 ? '<sub style="font-size:.7em;color:var(--c-muted)">MSB</sub>' : ''}</span>
          <button class="bit-btn" data-idx="${i}" data-bit="${bits[i]}">${bits[i]}</button>
        `;
        ARowEl.appendChild(c);
      }
      ARowEl.querySelectorAll('.bit-btn').forEach(btn => {
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

    function update() {
      const isEven = typeSel.value === 'even';

      // Count of 1s in data
      let count = 0;
      for (let i = 0; i < 4; i++) if (bits[i]) count++;

      // XOR result of data bits = parity for even (1 if odd count)
      let xorResult = bits[0] ^ bits[1] ^ bits[2] ^ bits[3];

      // For even parity, P = xorResult (makes total even)
      // For odd parity, P = NOT xorResult (makes total odd)
      const P = isEven ? xorResult : (1 - xorResult);

      // Decimal value of data
      let dec = 0;
      for (let i = 0; i < 4; i++) if (bits[i]) dec += Math.pow(2, i);

      countEl.textContent = count;
      decEl.textContent = dec;
      PEl.textContent = P;
      PEl.style.color = P === 1 ? 'var(--c-high)' : 'var(--c-low)';
      totalEl.textContent = count + P;

      // Build the full transmitted code: A3 A2 A1 A0 P
      fullEl.innerHTML = '';
      for (let i = 3; i >= 0; i--) {
        const c = document.createElement('div');
        c.className = 'output-led';
        c.innerHTML = `
          <span class="output-led-label">A${i}</span>
          <div class="led ${bits[i] === 1 ? 'is-high' : ''}">${bits[i]}</div>
        `;
        fullEl.appendChild(c);
      }
      // Separator
      const sep = document.createElement('div');
      sep.style.cssText = 'display:flex;align-items:center;font-family:var(--f-mono);color:var(--c-muted);font-size:1.5rem;';
      sep.textContent = '|';
      fullEl.appendChild(sep);
      // Parity bit
      const pCell = document.createElement('div');
      pCell.className = 'output-led';
      pCell.innerHTML = `
        <span class="output-led-label" style="color:var(--c-primary);">P</span>
        <div class="led ${P === 1 ? 'is-high' : ''}" style="border-color:var(--c-primary);box-shadow:3px 3px 0 var(--c-primary);">${P}</div>
      `;
      fullEl.appendChild(pCell);

      // Step-by-step XOR
      const steps = [];
      steps.push(`A₃ ⊕ A₂ = ${bits[3]} ⊕ ${bits[2]} = ${bits[3] ^ bits[2]}`);
      const s1 = bits[3] ^ bits[2];
      steps.push(`(${s1}) ⊕ A₁ = ${s1} ⊕ ${bits[1]} = ${s1 ^ bits[1]}`);
      const s2 = s1 ^ bits[1];
      steps.push(`(${s2}) ⊕ A₀ = ${s2} ⊕ ${bits[0]} = ${s2 ^ bits[0]}`);
      if (isEven) {
        steps.push(`<strong>P = ${P}</strong> (άρτια ισοτιμία)`);
      } else {
        steps.push(`Συμπλήρωμα: NOT(${xorResult}) = <strong>P = ${P}</strong> (περιττή ισοτιμία)`);
      }
      calcEl.innerHTML = steps.map(s => '<div>' + s + '</div>').join('');
    }

    typeSel.addEventListener('change', update);
    buildARow();
    update();
  })();

  /* ============================================================
     2. PARITY CHECKER (Transmitter -> Channel -> Receiver)
     ============================================================ */
  (function checker() {
    const typeSel = document.getElementById('chk-type');
    const txEl = document.getElementById('chk-tx');
    const channelEl = document.getElementById('chk-channel');
    const rxEl = document.getElementById('chk-rx');
    const CEl = document.getElementById('chk-C');
    const resultEl = document.getElementById('chk-result');
    const randomBtn = document.getElementById('chk-random');
    const noiseBtn = document.getElementById('chk-noise');
    const clearBtn = document.getElementById('chk-clear');

    if (!typeSel) return;

    // 5 bits total: [A3, A2, A1, A0, P]
    let txBits = [0, 0, 0, 0, 0]; // What transmitter sends
    let channelBits = [0, 0, 0, 0, 0]; // What's in the channel (can be flipped)

    function calcParity(dataBits, isEven) {
      const xor = dataBits[0] ^ dataBits[1] ^ dataBits[2] ^ dataBits[3];
      return isEven ? xor : (1 - xor);
    }

    function buildTxRow() {
      txEl.innerHTML = '';
      const labels = ['A₃', 'A₂', 'A₁', 'A₀', 'P'];
      for (let i = 0; i < 5; i++) {
        const c = document.createElement('div');
        c.className = 'output-led';
        const isParity = i === 4;
        c.innerHTML = `
          <span class="output-led-label" ${isParity ? 'style="color:var(--c-primary);"' : ''}>${labels[i]}</span>
          <div class="led ${txBits[i] === 1 ? 'is-high' : ''}" ${isParity ? 'style="border-color:var(--c-primary);box-shadow:3px 3px 0 var(--c-primary);"' : ''}>${txBits[i]}</div>
        `;
        txEl.appendChild(c);
      }
    }

    function buildChannelRow() {
      channelEl.innerHTML = '';
      const labels = ['A₃', 'A₂', 'A₁', 'A₀', 'P'];
      for (let i = 0; i < 5; i++) {
        const c = document.createElement('div');
        c.className = 'bit-toggle';
        const flipped = channelBits[i] !== txBits[i];
        c.innerHTML = `
          <span class="bit-toggle-label" ${flipped ? 'style="color:var(--c-low);"' : ''}>${labels[i]}${flipped ? ' ⚠' : ''}</span>
          <button class="bit-btn" data-idx="${i}" data-bit="${channelBits[i]}" ${flipped ? 'style="border-color:var(--c-low);box-shadow:3px 3px 0 var(--c-low);"' : ''}>${channelBits[i]}</button>
        `;
        channelEl.appendChild(c);
      }
      channelEl.querySelectorAll('.bit-btn').forEach(btn => {
        const i = parseInt(btn.dataset.idx, 10);
        btn.classList.toggle('is-high', channelBits[i] === 1);
        btn.addEventListener('click', () => {
          channelBits[i] = 1 - channelBits[i];
          buildChannelRow();
          buildRxRow();
          updateResult();
        });
      });
    }

    function buildRxRow() {
      rxEl.innerHTML = '';
      const labels = ['A₃', 'A₂', 'A₁', 'A₀', 'P'];
      for (let i = 0; i < 5; i++) {
        const c = document.createElement('div');
        c.className = 'output-led';
        const isParity = i === 4;
        const flipped = channelBits[i] !== txBits[i];
        c.innerHTML = `
          <span class="output-led-label" ${isParity ? 'style="color:var(--c-primary);"' : ''} ${flipped ? 'style="color:var(--c-low);"' : ''}>${labels[i]}</span>
          <div class="led ${channelBits[i] === 1 ? 'is-high' : ''}" ${flipped ? 'style="border-color:var(--c-low);box-shadow:3px 3px 0 var(--c-low);"' : (isParity ? 'style="border-color:var(--c-primary);box-shadow:3px 3px 0 var(--c-primary);"' : '')}>${channelBits[i]}</div>
        `;
        rxEl.appendChild(c);
      }
    }

    function updateResult() {
      const isEven = typeSel.value === 'even';
      // C = XOR of all 5 received bits
      const C = channelBits[0] ^ channelBits[1] ^ channelBits[2] ^ channelBits[3] ^ channelBits[4];

      CEl.textContent = C;

      // For even parity: C=0 means OK, C=1 means error
      // For odd parity: C=1 means OK, C=0 means error
      const isOK = isEven ? (C === 0) : (C === 1);

      if (isOK) {
        resultEl.innerHTML = '✅ <span style="color:var(--c-high);">OK — δεδομένα έγκυρα</span>';
      } else {
        resultEl.innerHTML = '❌ <span style="color:var(--c-low);">ΣΦΑΛΜΑ — εντοπίστηκε αλλοίωση!</span>';
      }
    }

    function generateNewMessage() {
      const isEven = typeSel.value === 'even';
      // Random data
      const data = [
        Math.round(Math.random()),
        Math.round(Math.random()),
        Math.round(Math.random()),
        Math.round(Math.random())
      ];
      const P = calcParity(data, isEven);
      txBits = [data[3], data[2], data[1], data[0], P]; // [A3, A2, A1, A0, P]
      channelBits = txBits.slice(); // No noise initially
      buildTxRow();
      buildChannelRow();
      buildRxRow();
      updateResult();
    }

    function injectNoise() {
      // Flip a random bit in the channel
      const i = Math.floor(Math.random() * 5);
      channelBits[i] = 1 - channelBits[i];
      buildChannelRow();
      buildRxRow();
      updateResult();
    }

    function clearAll() {
      const isEven = typeSel.value === 'even';
      txBits = [0, 0, 0, 0, calcParity([0,0,0,0], isEven)];
      channelBits = txBits.slice();
      buildTxRow();
      buildChannelRow();
      buildRxRow();
      updateResult();
    }

    typeSel.addEventListener('change', () => {
      // Recalculate P for current data
      const isEven = typeSel.value === 'even';
      const data = [txBits[3], txBits[2], txBits[1], txBits[0]]; // [A0, A1, A2, A3]
      const P = calcParity(data, isEven);
      txBits[4] = P;
      // Reset channel to match transmitter
      channelBits = txBits.slice();
      buildTxRow();
      buildChannelRow();
      buildRxRow();
      updateResult();
    });

    randomBtn.addEventListener('click', generateNewMessage);
    noiseBtn.addEventListener('click', injectNoise);
    clearBtn.addEventListener('click', clearAll);

    generateNewMessage();
  })();

  /* ============================================================
     3. BCD PARITY TABLE (interactive 0-15 grid)
     ============================================================ */
  (function parityTable() {
    const grid = document.getElementById('tbl-grid');
    const detail = document.getElementById('tbl-detail');

    if (!grid) return;

    let selectedNum = null;

    function buildGrid() {
      grid.innerHTML = '';
      for (let n = 0; n < 16; n++) {
        const bin = n.toString(2).padStart(4, '0'); // MSB first
        const bits = bin.split('').map(b => parseInt(b, 10));
        const xor = bits.reduce((a, b) => a ^ b, 0);
        const evenP = xor; // P for even parity
        const oddP = 1 - xor; // P for odd parity

        const cell = document.createElement('div');
        cell.className = 'parity-cell';
        if (n === selectedNum) cell.classList.add('is-active');
        cell.dataset.num = n;
        cell.innerHTML = `
          <div class="parity-num">${n}</div>
          <div class="parity-bin mono">${bin}</div>
          <div class="parity-pair">
            <span class="parity-tag">E:</span><span class="parity-bit ${evenP === 1 ? 'is-one' : ''}">${evenP}</span>
            <span class="parity-tag">O:</span><span class="parity-bit ${oddP === 1 ? 'is-one' : ''}">${oddP}</span>
          </div>
        `;
        cell.addEventListener('click', () => {
          selectedNum = n;
          showDetail(n);
          buildGrid();
        });
        grid.appendChild(cell);
      }
    }

    function showDetail(n) {
      const bin = n.toString(2).padStart(4, '0');
      const bits = bin.split('').map(b => parseInt(b, 10)); // [A3, A2, A1, A0]
      const ones = bits.filter(b => b === 1).length;
      const xor = bits.reduce((a, b) => a ^ b, 0);
      const evenP = xor;
      const oddP = 1 - xor;

      const html = `
        <strong>Αριθμός ${n}:</strong> <span class="mono">${bin}</span> (A₃A₂A₁A₀)<br>
        <div style="margin-top:8px;">
          • Πλήθος 1: <strong>${ones}</strong> (${ones % 2 === 0 ? 'ζυγός' : 'περιττός'})<br>
          • XOR: ${bits[0]} ⊕ ${bits[1]} ⊕ ${bits[2]} ⊕ ${bits[3]} = <strong>${xor}</strong><br>
          • <strong>Άρτια ισοτιμία (Even):</strong> P = <span style="color:${evenP === 1 ? 'var(--c-high)' : 'var(--c-low)'};font-weight:700;">${evenP}</span> → σύνολο 1: ${ones + evenP} (${(ones + evenP) % 2 === 0 ? 'ζυγός ✓' : 'περιττός ✗'})<br>
          • <strong>Περιττή ισοτιμία (Odd):</strong> P = <span style="color:${oddP === 1 ? 'var(--c-high)' : 'var(--c-low)'};font-weight:700;">${oddP}</span> → σύνολο 1: ${ones + oddP} (${(ones + oddP) % 2 !== 0 ? 'περιττός ✓' : 'ζυγός ✗'})
        </div>
      `;
      detail.innerHTML = html;
    }

    buildGrid();
  })();

})();
