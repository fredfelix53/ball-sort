/* ===== Ball Sort Puzzle — Game Engine =====
   Color sorting puzzle: tap tube to pick, tap another to drop
*/
const TUBE_CAPACITY = 4;
const COLORS = ['#ff6b6b', '#4facfe', '#ffd700', '#4cd137', '#a18cd1', '#ff9ff3', '#00d2ff', '#f368e0', '#ffa502', '#2ed573'];
const COLOR_NAMES = ['🔴', '🔵', '🟡', '🟢', '🟣', '🩷', '🩵', '💗', '🟠', '🟢'];

let tubes = [];
let selectedTube = -1;
let score = 0;
let moves = 0;
let level = 1;
let gameActive = false;
let timer = 0;
let timerInterval = null;
let undoStack = [];
let hintUsed = false;

// Refs
let container, particles, floatingTexts = [];

function initGame() {
  container = document.getElementById('tube-container');
  particles = new ParticleSystem();
  startLevel();
  initControls();
}

function generateLevel(lvl) {
  const numColors = Math.min(3 + Math.floor(lvl / 5), 8);
  const numEmptyTubes = Math.min(1 + Math.floor(lvl / 8), 3);
  const totalTubes = numColors + numEmptyTubes;

  // Generate balls: 4 of each color
  let balls = [];
  for (let c = 0; c < numColors; c++) {
    for (let i = 0; i < TUBE_CAPACITY; i++) {
      balls.push(c);
    }
  }

  // Shuffle
  for (let i = balls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [balls[i], balls[j]] = [balls[j], balls[i]];
  }

  // Distribute into tubes
  tubes = [];
  let ballIdx = 0;
  for (let t = 0; t < totalTubes; t++) {
    const tube = [];
    if (t < numColors) {
      // Fill with 4 balls
      for (let i = 0; i < TUBE_CAPACITY; i++) {
        tube.push(balls[ballIdx++]);
      }
    }
    tubes.push(tube);
  }

  // Ensure puzzle is solvable - add extra empty tubes from bonus
  const bonuses = window.ProgressionSystem ? ProgressionSystem.getActiveBonuses() : {};
  const extraTubes = bonuses.extraTube || 0;
  for (let i = 0; i < extraTubes; i++) {
    tubes.push([]);
  }

  moves = 0;
  undoStack = [];
  selectedTube = -1;
}

function renderTubes() {
  if (!container) return;
  container.innerHTML = '';

  tubes.forEach((tube, idx) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'tube-wrapper';
    wrapper.dataset.index = idx;

    const tubeDiv = document.createElement('div');
    tubeDiv.className = 'tube';
    if (idx === selectedTube) tubeDiv.classList.add('selected');
    if (isTubeComplete(idx)) tubeDiv.classList.add('complete');

    // Add balls from bottom up
    for (let i = 0; i < tube.length; i++) {
      const ball = document.createElement('div');
      ball.className = 'tube-ball';
      if (idx === selectedTube && i === tube.length - 1) ball.classList.add('picked');
      ball.style.background = COLORS[tube[i]] || '#888';
      ball.style.boxShadow = `inset 0 -3px 6px rgba(0,0,0,0.3), inset 0 3px 6px rgba(255,255,255,0.2)`;
      tubeDiv.appendChild(ball);
    }

    // Fill empty slots
    for (let i = tube.length; i < TUBE_CAPACITY; i++) {
      const empty = document.createElement('div');
      empty.style.cssText = 'width:28px;height:28px;border-radius:50%;opacity:0.05;background:rgba(255,255,255,0.1);flex-shrink:0;';
      tubeDiv.appendChild(empty);
    }

    wrapper.appendChild(tubeDiv);
    wrapper.appendChild(createLabel(idx));
    container.appendChild(wrapper);
  });
}

function createLabel(idx) {
  const label = document.createElement('div');
  label.className = 'tube-label';
  label.textContent = idx + 1;
  return label;
}

function isTubeComplete(idx) {
  const tube = tubes[idx];
  if (tube.length !== TUBE_CAPACITY) return false;
  return tube.every(b => b === tube[0]);
}

function allTubesComplete() {
  // Check if all non-empty tubes are complete
  let completed = 0;
  let totalNonEmpty = 0;
  for (const tube of tubes) {
    if (tube.length > 0) {
      totalNonEmpty++;
      if (isTubeComplete(tubes.indexOf(tube))) completed++;
    }
  }
  // All tubes containing balls should be sorted
  for (const tube of tubes) {
    if (tube.length > 0 && !isTubeComplete(tubes.indexOf(tube))) return false;
  }
  // Also need at least some balls sorted
  return completed >= 2;
}

function handleTubeClick(idx) {
  if (!gameActive) return;
  const tube = tubes[idx];

  if (selectedTube === -1) {
    // Select: pick from this tube
    if (tube.length === 0) return;
    if (isTubeComplete(idx)) return;
    selectedTube = idx;
    renderTubes();
  } else if (selectedTube === idx) {
    // Deselect
    selectedTube = -1;
    renderTubes();
  } else {
    // Drop: move ball from selectedTube to this tube
    const srcTube = tubes[selectedTube];
    if (srcTube.length === 0) { selectedTube = -1; renderTubes(); return; }

    const ballColor = srcTube[srcTube.length - 1];

    // Can only drop if target tube is empty or top ball matches
    if (tube.length < TUBE_CAPACITY && (tube.length === 0 || tube[tube.length - 1] === ballColor)) {
      // Save state for undo
      undoStack.push({
        from: selectedTube,
        to: idx,
        tubes: tubes.map(t => [...t]),
        moves: moves,
        score: score,
      });
      if (undoStack.length > 20) undoStack.shift();

      // Move ball
      const ball = srcTube.pop();
      tube.push(ball);
      moves++;
      score += 10;

      // Check if this move solved a tube
      if (isTubeComplete(idx)) {
        score += 50;
        if (particles) particles.emitReward(container.offsetLeft + container.offsetWidth / 2, container.offsetTop);
        floatingTexts.push(new FloatingText(window.innerWidth / 2, window.innerHeight / 2 - 40, '🎯 Sorted! +50', '#4cd137', 22));
      }

      updateUI();
      selectedTube = -1;
      renderTubes();

      // Check win
      if (allTubesComplete()) {
        levelComplete();
      }
    } else {
      // Invalid move - deselect
      selectedTube = -1;
      renderTubes();
      showNotification('Can\'t place there!');
    }
  }
}

function useHint() {
  if (!gameActive) return;
  // Find a valid move to help the player
  for (let from = 0; from < tubes.length; from++) {
    if (tubes[from].length === 0 || isTubeComplete(from)) continue;
    const color = tubes[from][tubes[from].length - 1];
    for (let to = 0; to < tubes.length; to++) {
      if (from === to) continue;
      if (tubes[to].length < TUBE_CAPACITY && (tubes[to].length === 0 || tubes[to][tubes[to].length - 1] === color)) {
        // Highlight the tubes
        selectedTube = from;
        renderTubes();
        setTimeout(() => {
          selectedTube = -1;
          renderTubes();
          // Auto-move
          handleTubeClick(from);
          setTimeout(() => handleTubeClick(to), 200);
        }, 600);
        showNotification('💡 Try moving that ball!');
        hintUsed = true;
        return;
      }
    }
  }
  showNotification('No hints available!');
}

function undoMove() {
  if (!gameActive || undoStack.length === 0) return;
  const state = undoStack.pop();
  tubes = state.tubes;
  moves = state.moves;
  score = state.score;
  selectedTube = -1;
  hintUsed = false;
  updateUI();
  renderTubes();
  showNotification('↩ Undone!');
}

function resetLevel() {
  startLevel();
  showNotification('🔄 Level reset!');
}

function startLevel() {
  generateLevel(level);
  selectedTube = -1;
  hintUsed = false;
  timer = 0;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => { timer++; document.getElementById('timer-value').textContent = timer; }, 1000);
  document.getElementById('game-over-overlay')?.classList.remove('visible');
  gameActive = true;
  updateUI();
  renderTubes();
}

function levelComplete() {
  gameActive = false;
  if (timerInterval) clearInterval(timerInterval);
  const overlay = document.getElementById('game-over-overlay');
  if (overlay) {
    overlay.classList.add('visible');
    overlay.querySelector('h2').textContent = 'Level Complete! 🎉';
    document.getElementById('final-score').textContent = score;
    document.getElementById('go-moves').textContent = moves;
    document.getElementById('go-time').textContent = timer + 's';
  }

  if (particles) setTimeout(() => particles.emitLevelUp(), 300);

  if (window.ProgressionSystem) {
    ProgressionSystem.endOfGame({
      score,
      moves,
      time: timer,
      levelCompleted: true,
    });
    const unlocked = ProgressionSystem.checkAchievements();
    if (unlocked.length > 0) setTimeout(() => showAchievementPopup(unlocked), 1000);
    setTimeout(() => checkDailyBonus(), 1500);
  }

  // ─── Framework Game-Over Hooks ─────────────────
  if (window.RetentionSystem) RetentionSystem.onGameEnd(score);
  if (window.ChallengesSystem) {
    ChallengesSystem.reportProgress('score', score);
    ChallengesSystem.reportProgress('games', 1);
  }
  if (window.CollectiblesSystem) {
    CollectiblesSystem.incrementTracker('totalGames', 1);
    CollectiblesSystem.setTracker('highestScore', score);
  }
  if (window.AdsManager) AdsManager.tryShowInterstitial();
}

function nextLevel() {
  level++;
  document.getElementById('level-num').textContent = level;
  startLevel();
}

function updateUI() {
  document.getElementById('score-value').textContent = score;
  document.getElementById('moves-num').textContent = moves;
  document.getElementById('level-num').textContent = level;
}

// ─── Touch / Click Controls ─────────────────────────
function initControls() {
  container.addEventListener('click', (e) => {
    const wrapper = e.target.closest('.tube-wrapper');
    if (!wrapper) return;
    handleTubeClick(parseInt(wrapper.dataset.index));
  });

  container.addEventListener('touchstart', (e) => {
    const wrapper = e.target.closest('.tube-wrapper');
    if (!wrapper) return;
    handleTubeClick(parseInt(wrapper.dataset.index));
  }, { passive: true });

  document.getElementById('new-level-btn')?.addEventListener('click', startLevel);
  document.getElementById('hint-btn')?.addEventListener('click', useHint);
  document.getElementById('undo-btn')?.addEventListener('click', undoMove);
  document.getElementById('reset-btn')?.addEventListener('click', resetLevel);
  document.getElementById('button-shop')?.addEventListener('click', () => { if (window.ShopUI) ShopUI.open(); });
  document.getElementById('button-ach')?.addEventListener('click', showAchievementsList);
}

// ─── Achievement / Daily / HUD ──────────────────────
function showAchievementPopup(achievements) {
  const existing = document.querySelector('.achievement-popup');
  if (existing) existing.remove();
  achievements.forEach((ach, i) => {
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = 'achievement-popup show';
      div.innerHTML = `<div class="ach-icon">${ach.icon}</div><div class="ach-title">🏅 Achievement Unlocked!</div><div>${ach.name}</div><div class="ach-desc">${ach.desc}</div><div class="ach-reward">+${ach.reward.coins} 🪙 ${ach.reward.gems ? `+${ach.reward.gems} 💎` : ''}</div>`;
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 3000);
    }, i * 700);
  });
}

function checkDailyBonus() {
  if (!window.ProgressionSystem) return;
  const result = ProgressionSystem.claimDailyBonus();
  if (!result) return;
  const existing = document.querySelector('.daily-bonus-popup');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.className = 'daily-bonus-popup show';
  div.innerHTML = `<h3>📅 Daily Bonus Claimed!</h3><div>${'🔥'.repeat(Math.min(result.streak, 7))}</div><div>🪙 +${result.coins} coins</div>${result.gems ? `<div>💎 +${result.gems} gems</div>` : ''}<div style="font-size:13px;color:#888;margin-top:6px;">Day ${result.streak} streak!</div><button class="game-btn btn-primary" style="margin-top:10px;display:inline-flex;" onclick="this.closest('.daily-bonus-popup').remove()">Awesome!</button>`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 5000);
}

function updateHUD() {
  if (!window.ProgressionSystem) return;
  const state = ProgressionSystem.getState();
  const coins = document.getElementById('hud-coins');
  const gems = document.getElementById('hud-gems');
  const level = document.getElementById('hud-level');
  if (coins) coins.textContent = state.coins;
  if (gems) gems.textContent = state.gems;
  if (level) level.textContent = state.level;
}

function showAchievementsList() {
  if (!window.ProgressionSystem) return;
  const state = ProgressionSystem.getState();
  const achievements = ProgressionSystem.getAchievements();
  const unlocked = Object.keys(state.achievements).length;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `<div class="modal-box" style="min-width:300px;"><h3 style="text-align:center;margin-bottom:8px;color:var(--accent-gold);">🏆 Achievements</h3><div style="text-align:center;margin-bottom:12px;font-size:14px;color:var(--text-secondary);">${unlocked}/${achievements.length} unlocked</div><div style="max-height:400px;overflow-y:auto;">${achievements.map(a => { const done = !!state.achievements[a.id]; return `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:${done ? 'rgba(76,209,55,0.05)' : 'transparent'};border-radius:8px;margin-bottom:4px;${done ? 'opacity:0.8;' : ''}"><span style="font-size:20px;">${done ? a.icon : '🔒'}</span><div style="flex:1;"><div style="font-size:13px;font-weight:600;">${a.name}</div><div style="font-size:11px;color:var(--text-secondary);">${a.desc}</div></div>${done ? '✅' : `<span style="font-size:11px;color:var(--accent-gold);">🪙${a.reward.coins}${a.reward.gems ? ' 💎'+a.reward.gems : ''}</span>`}</div>`; }).join('')}</div><button class="game-btn btn-reset" style="margin:10px auto 0;display:block;" onclick="this.closest('.modal-overlay').remove()">Close</button></div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

function showNotification(msg) {
  const el = document.getElementById('notification') || (() => { const n = document.createElement('div'); n.id = 'notification'; document.body.appendChild(n); return n; })();
  el.textContent = msg; el.className = 'show';
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => el.className = '', 2500);
}

// ─── Init ────────────────────────────────────────────
function init() {
  initGame();
  if (window.ProgressionSystem) {
    ProgressionSystem.load();
    updateHUD();
    setInterval(updateHUD, 3000);
  }

  // ─── Framework Module Init ──────────────────────
  if (window.AdsManager) AdsManager.init();
  if (window.ChallengesSystem) ChallengesSystem.init();
  if (window.StoreRotator) StoreRotator.init();
  if (window.RetentionSystem) RetentionSystem.init();
  if (window.CollectiblesSystem) CollectiblesSystem.init();
  if (window.TutorialSystem) {
    TutorialSystem.init();
    if (TutorialSystem.shouldShow()) TutorialSystem.start();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
