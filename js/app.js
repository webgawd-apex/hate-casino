/* ─────────────────────────────────────────
   HateCasino — app.js
   Game logic · Wallet · Chat · Airdrop
───────────────────────────────────────── */

// ─────────────────────────────────────────
// STATE
// ─────────────────────────────────────────

const state = {
  connected:    false,
  walletName:   '',
  balance:      4.28,
  betActive:    false,
  currentMult:  1.00,
  crashPoint:   1.00,
  crashTimer:   null,
  selectedSide: 'heads',
  flipping:     false,
  airdropSecs:  47 * 60 + 22,
  airdropTimer: null,
};


// ─────────────────────────────────────────
// WALLET
// ─────────────────────────────────────────

function openModal()  { document.getElementById('walletModal').classList.add('open'); }
function closeModal() { document.getElementById('walletModal').classList.remove('open'); }

function connectWallet(name) {
  state.connected  = true;
  state.walletName = name;
  closeModal();

  const btn = document.getElementById('connectBtn');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v4l3 3"/>
    </svg>
    ${state.balance.toFixed(2)} SOL
  `;
  btn.style.cssText = `
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
  `;

  document.getElementById('balanceDisplay').textContent = state.balance.toFixed(2) + ' ◎';
  document.getElementById('walletSub').textContent      = name + ' · Connected';

  addChatMsg('🌐', 'System', `${name} wallet connected. Welcome to HateCasino!`);
}

function updateBalanceUI() {
  document.getElementById('balanceDisplay').textContent = state.balance.toFixed(2) + ' ◎';
  if (state.connected) {
    document.getElementById('connectBtn').innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4l3 3"/>
      </svg>
      ${state.balance.toFixed(2)} SOL
    `;
  }
}


// ─────────────────────────────────────────
// GAME SWITCH
// ─────────────────────────────────────────

function switchGame(game) {
  const isCrash = game === 'crash';

  document.getElementById('crashGame').style.display    = isCrash ? '' : 'none';
  document.getElementById('coinflipGame').style.display = isCrash ? 'none' : '';

  document.getElementById('tabCrash').classList.toggle('active', isCrash);
  document.getElementById('tabCoinflip').classList.toggle('active', !isCrash);

  document.querySelectorAll('.nav-link').forEach((el, i) => {
    el.classList.toggle('active', i === (isCrash ? 0 : 1));
  });
  document.querySelectorAll('.game-btn').forEach((el, i) => {
    el.classList.toggle('active', i === (isCrash ? 0 : 1));
  });
}


// ─────────────────────────────────────────
// CRASH GAME
// ─────────────────────────────────────────

// --- Bet controls ---
function setBet(val) {
  document.getElementById('crashBet').value = val;
  updatePotential();
}
function halfBet() {
  const input = document.getElementById('crashBet');
  input.value = (parseFloat(input.value) / 2).toFixed(3);
  updatePotential();
}
function doubleBet() {
  const input = document.getElementById('crashBet');
  input.value = (parseFloat(input.value) * 2).toFixed(3);
  updatePotential();
}
function updatePotential() {
  const bet  = parseFloat(document.getElementById('crashBet').value)    || 0;
  const auto = parseFloat(document.getElementById('autoCashout').value) || 2;
  document.getElementById('potentialWin').textContent = (bet * auto).toFixed(3) + ' SOL';
}

document.getElementById('crashBet').addEventListener('input', updatePotential);
document.getElementById('autoCashout').addEventListener('input', updatePotential);

// --- Main action ---
function crashAction() {
  if (!state.connected) { openModal(); return; }

  if (!state.betActive) {
    state.betActive = true;
    const btn = document.getElementById('crashActionBtn');
    btn.textContent = 'CASH OUT';
    btn.classList.add('cashout');
    startCrashRound();
  } else {
    cashOut();
  }
}

// --- Round lifecycle ---
function startCrashRound() {
  state.currentMult = 1.00;

  const el = document.getElementById('crashMultiplier');
  el.classList.remove('bust');
  el.classList.add('safe');
  document.getElementById('crashStatusText').textContent = 'ROUND ACTIVE — CASH OUT BEFORE IT CRASHES!';

  // Crash point: skewed toward low values like a real crash game
  state.crashPoint = Math.max(1.01, Math.pow(Math.random() * 4, 2) + 1.0);

  state.crashTimer = setInterval(() => {
    state.currentMult += 0.01 + (state.currentMult * 0.003);
    el.textContent = state.currentMult.toFixed(2) + 'x';
    updateCrashSvg(state.currentMult, state.crashPoint);

    const auto = parseFloat(document.getElementById('autoCashout').value);
    if (auto > 1.0 && state.currentMult >= auto) {
      cashOut();
      return;
    }

    if (state.currentMult >= state.crashPoint) {
      bust(state.crashPoint);
    }
  }, 80);
}

function cashOut() {
  if (!state.betActive) return;
  clearInterval(state.crashTimer);

  const bet    = parseFloat(document.getElementById('crashBet').value) || 0.1;
  const profit = (bet * state.currentMult - bet).toFixed(3);

  state.betActive  = false;
  state.balance   += parseFloat(profit);

  const btn = document.getElementById('crashActionBtn');
  btn.textContent = 'BET NOW';
  btn.classList.remove('cashout');

  document.getElementById('crashStatusText').textContent =
    `CASHED OUT AT ${state.currentMult.toFixed(2)}x  +${profit} SOL 🎉`;

  updateBalanceUI();
  addChatMsg('🎲', 'You', `Cashed out at ${state.currentMult.toFixed(2)}x! +${profit} SOL`);
  setTimeout(prepareNextRound, 2000);
}

function bust(crashPoint) {
  clearInterval(state.crashTimer);

  const bet = parseFloat(document.getElementById('crashBet').value) || 0.1;
  state.betActive = false;
  state.balance   = Math.max(0, state.balance - bet);

  const el = document.getElementById('crashMultiplier');
  el.classList.remove('safe');
  el.classList.add('bust');
  el.textContent = crashPoint.toFixed(2) + 'x';

  const btn = document.getElementById('crashActionBtn');
  btn.textContent = 'BET NOW';
  btn.classList.remove('cashout');

  document.getElementById('crashStatusText').textContent =
    `BUSTED AT ${crashPoint.toFixed(2)}x`;

  updateBalanceUI();
  addRecentRound(crashPoint);
  setTimeout(prepareNextRound, 2500);
}

function prepareNextRound() {
  const roundEl = document.getElementById('roundNum');
  roundEl.textContent = parseInt(roundEl.textContent) + 1;

  const el = document.getElementById('crashMultiplier');
  el.classList.remove('bust');
  el.classList.add('safe');
  el.textContent = '—';

  document.getElementById('crashStatusText').textContent =
    'PLACE BETS — NEXT ROUND STARTING...';

  resetCrashSvg();
}

function addRecentRound(val) {
  const row  = document.getElementById('recentRounds');
  const chip = document.createElement('span');
  chip.className   = 'round-chip ' + (val >= 2 ? 'high' : 'low');
  chip.textContent = val.toFixed(2) + 'x';
  row.prepend(chip);

  const chips = row.querySelectorAll('.round-chip');
  if (chips.length > 12) chips[chips.length - 1].remove();
}

// --- SVG curve ---
function updateCrashSvg(m, max) {
  const progress = Math.min((m - 1) / (max - 1), 1);
  const x = 800 * progress;
  const y = 340 - (progress * progress * 320);

  document.getElementById('crashLine').setAttribute('d',
    `M0,320 Q${x * 0.3},${320 - progress * 80} ${x},${y}`);
  document.getElementById('crashArea').setAttribute('d',
    `M0,340 L0,320 Q${x * 0.3},${320 - progress * 80} ${x},${y} L${x},340 Z`);
}
function resetCrashSvg() {
  document.getElementById('crashLine').setAttribute('d', 'M0,320 L0,320');
  document.getElementById('crashArea').setAttribute('d', 'M0,340 L0,340 Z');
}


// ─────────────────────────────────────────
// COINFLIP GAME
// ─────────────────────────────────────────

function selectSide(side) {
  state.selectedSide = side;
  document.getElementById('headsBtn').classList.toggle('selected', side === 'heads');
  document.getElementById('tailsBtn').classList.toggle('selected', side === 'tails');
}

function setFlipBet(val) {
  document.getElementById('flipBet').value = val;
}

function flipCoin() {
  if (!state.connected) { openModal(); return; }
  if (state.flipping) return;

  state.flipping = true;

  const bet     = parseFloat(document.getElementById('flipBet').value) || 0.1;
  const coin    = document.getElementById('coinDisplay');
  const result  = Math.random() < 0.5 ? 'heads' : 'tails';
  const resultEl = document.getElementById('flipResult');

  coin.classList.add('flipping');
  resultEl.textContent   = 'FLIPPING...';
  resultEl.style.color   = 'var(--muted)';
  document.getElementById('flipBtn').disabled = true;

  setTimeout(() => {
    coin.classList.remove('flipping');

    // Update coin appearance
    if (result === 'heads') {
      coin.className            = 'coin heads';
      coin.style.borderColor    = 'var(--gold)';
      coin.style.boxShadow      = '0 0 20px rgba(201,168,76,0.3)';
      coin.style.background     = 'radial-gradient(circle, #1a1200, #0d0d0d)';
      coin.textContent          = '☀️';
    } else {
      coin.className            = 'coin tails';
      coin.style.borderColor    = 'var(--red)';
      coin.style.boxShadow      = '0 0 20px var(--red-glow)';
      coin.style.background     = 'radial-gradient(circle, #0d001a, #0d0d0d)';
      coin.textContent          = '🌙';
    }

    const won    = result === state.selectedSide;
    const profit = (bet * 0.9).toFixed(3);

    resultEl.textContent = won
      ? `WON +${profit} SOL 🎉`
      : `LOST -${bet.toFixed(3)} SOL`;
    resultEl.style.color = won ? 'var(--green)' : 'var(--red)';

    if (won) state.balance += parseFloat(profit);
    else     state.balance  = Math.max(0, state.balance - bet);

    updateBalanceUI();
    addChatMsg('🪙', 'You', won
      ? `Coinflip WIN on ${result}! +${profit} SOL`
      : `Coinflip loss on ${result}.`
    );

    appendFlipHistory(bet, state.selectedSide, won, profit);

    state.flipping = false;
    document.getElementById('flipBtn').disabled = false;
  }, 800);
}

function appendFlipHistory(bet, side, won, profit) {
  const tbody = document.getElementById('flipHistory');
  const tr    = document.createElement('tr');
  tr.innerHTML = `
    <td class="td-addr">🪙 You</td>
    <td>${parseFloat(bet).toFixed(3)} ◎</td>
    <td>${side === 'heads' ? '☀️ Heads' : '🌙 Tails'}</td>
    <td class="${won ? 'td-win' : 'td-loss'}">${won ? 'WIN' : 'LOSS'}</td>
    <td class="${won ? 'td-win' : 'td-loss'}">${won ? '+' + profit : '-' + parseFloat(bet).toFixed(3)} ◎</td>
  `;
  tbody.prepend(tr);
}


// ─────────────────────────────────────────
// LIVE CHAT
// ─────────────────────────────────────────

const chatNames = [
  '👻 rug_resistant',
  '💀 darknode',
  '🪙 pump_maxi',
  '🔥 hatewinner',
  '🎒 sol_degen',
  '⚡ lamport',
  '🌊 wavefn',
];

const chatLines = [
  'going in heavy this round fr',
  'who else cashed at 2x?',
  'that 11x was crazy wtf',
  'HateCasino never disappoints',
  'LFG next round all in 🔥',
  'bust again 💀',
  'this is the way',
  'wagmi',
  '0.001 SOL to qualify for airdrop reminder',
  'this game has no chill lol',
  'anyone else using auto cashout?',
  'provably fair is the real deal',
  'solana so fast bro',
  'gg easy',
  'rip my balance',
];

function addChatMsg(avatar, name, text) {
  const msgs = document.getElementById('chatMsgs');
  const div  = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `
    <div class="chat-avatar">${avatar}</div>
    <div class="chat-body">
      <div class="chat-name">
        <span class="name">${name}</span>
        <span class="time">just now</span>
      </div>
      <div class="chat-text">${text}</div>
    </div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;

  // Trim to 30 messages
  const children = msgs.querySelectorAll('.chat-msg');
  if (children.length > 30) children[0].remove();
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const val   = input.value.trim();
  if (!val) return;
  addChatMsg(state.connected ? '🎰' : '🌐', state.connected ? state.walletName : 'Guest', val);
  input.value = '';
}

function chatKey(e) {
  if (e.key === 'Enter') sendChat();
}

// Simulate live chat activity
function scheduleNextChatMsg() {
  const delay = 4000 + Math.random() * 7000;
  setTimeout(() => {
    const name = chatNames[Math.floor(Math.random() * chatNames.length)];
    const text = chatLines[Math.floor(Math.random() * chatLines.length)];
    addChatMsg(name.split(' ')[0], name.split(' ').slice(1).join(' '), text);
    scheduleNextChatMsg();
  }, delay);
}
scheduleNextChatMsg();

// Online count fluctuation
setInterval(() => {
  const n = 120 + Math.floor(Math.random() * 60);
  document.getElementById('chatOnline').textContent = n + ' online';
  document.getElementById('onlineCount').textContent = n;
}, 9000);


// ─────────────────────────────────────────
// AIRDROP COUNTDOWN
// ─────────────────────────────────────────

state.airdropTimer = setInterval(() => {
  state.airdropSecs = Math.max(0, state.airdropSecs - 1);

  const m = Math.floor(state.airdropSecs / 60);
  const s = state.airdropSecs % 60;
  document.getElementById('airdropTimer').textContent =
    String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');

  if (state.airdropSecs === 0) {
    state.airdropSecs = 60 * 60;
    addChatMsg('🪂', 'System', '🎉 Airdrop distributed! Next one in 1 hour. Place bets to qualify!');
  }
}, 1000);
