/* ===== Ball Sort Puzzle — Full Progression System ===== */
(function() {
  'use strict';
  const SAVE_KEY = 'bs_progress';
  const DAILY_KEY = 'bs_daily_bonus';

  const UPGRADE_TIERS = {
    case: {
      name: 'Case', icon: '📦', maxLevel: 5, baseCost: 1000, costMultiplier: 2, gemCost: 50,
      levels: [
        { level: 0, name: 'Basic Rack',       bonus: { extraTube: 0, tubeBonus: 0 },    gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Wooden Rack',      bonus: { extraTube: 1, tubeBonus: 5 },    gemReq: 50,  coinsReq: 1000 },
        { level: 2, name: 'Metal Rack',       bonus: { extraTube: 1, tubeBonus: 15 },   gemReq: 80,  coinsReq: 2000 },
        { level: 3, name: 'Neon Rack',        bonus: { extraTube: 2, tubeBonus: 30 },   gemReq: 120, coinsReq: 4000 },
        { level: 4, name: 'Crystal Rack',     bonus: { extraTube: 2, tubeBonus: 50 },   gemReq: 200, coinsReq: 8000 },
        { level: 5, name: '💎 Infinity Rack', bonus: { extraTube: 3, tubeBonus: 100 },  gemReq: 500, coinsReq: 20000 },
      ]
    },
    outfit: {
      name: 'Outfit', icon: '👕', maxLevel: 5, baseCost: 600, costMultiplier: 2, gemCost: 40,
      levels: [
        { level: 0, name: 'Plain Gloves',     bonus: { hintCount: 0, undoCount: 0 },   gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Sorting Gloves',   bonus: { hintCount: 1, undoCount: 0 },   gemReq: 30,  coinsReq: 600 },
        { level: 2, name: 'Magnetic Gloves',  bonus: { hintCount: 1, undoCount: 1 },   gemReq: 60,  coinsReq: 1200 },
        { level: 3, name: 'Phantom Mitts',    bonus: { hintCount: 2, undoCount: 1 },   gemReq: 90,  coinsReq: 2400 },
        { level: 4, name: 'Crystal Gauntlets',bonus: { hintCount: 2, undoCount: 2 },   gemReq: 150, coinsReq: 4800 },
        { level: 5, name: '🔥 Phoenix Hands', bonus: { hintCount: 3, undoCount: 3 },   gemReq: 350, coinsReq: 12000 },
      ]
    },
    weapon: {
      name: 'Weapon', icon: '⚔️', maxLevel: 5, baseCost: 800, costMultiplier: 2, gemCost: 50,
      levels: [
        { level: 0, name: 'Finger',            bonus: { scoreMult: 1.0, undoBonus: 0 },   gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Spatula',           bonus: { scoreMult: 1.1, undoBonus: 1 },   gemReq: 50,  coinsReq: 800 },
        { level: 2, name: 'Tweezer',           bonus: { scoreMult: 1.2, undoBonus: 2 },   gemReq: 80,  coinsReq: 1600 },
        { level: 3, name: 'Magic Wand',        bonus: { scoreMult: 1.35, undoBonus: 3 },  gemReq: 120, coinsReq: 3200 },
        { level: 4, name: 'Laser Pointer',     bonus: { scoreMult: 1.5, undoBonus: 4 },   gemReq: 200, coinsReq: 6400 },
        { level: 5, name: '⚡ Sorting Star',   bonus: { scoreMult: 2.0, undoBonus: 5 },   gemReq: 500, coinsReq: 16000 },
      ]
    }
  };

  const PREMIUM_ITEMS = {
    legendarySkins: [
      { id: 'lg_void',       name: 'Void Balls',    desc: 'Dark matter ball skin',           price: 4.99,  gemPrice: 0,    tier: 'legendary', type: 'weapon_skin' },
      { id: 'lg_cosmic',     name: 'Cosmic Orbs',   desc: 'Galaxy-themed balls',              price: 6.99,  gemPrice: 0,    tier: 'legendary', type: 'weapon_skin' },
      { id: 'lg_flame',      name: 'Inferno Balls', desc: 'Living flame balls',               price: 8.99,  gemPrice: 0,    tier: 'legendary', type: 'weapon_skin' },
    ],
    premiumCases: [
      { id: 'pc_royal',      name: 'Royal Pass',     desc: '7 days: 2x coins + 50 gems/day',    price: 4.99,  gemPrice: 0,    type: 'subscription', duration: '7d' },
      { id: 'pc_vip',        name: 'VIP Status',     desc: '30 days: 3x coins + 100 gems/day',  price: 12.99, gemPrice: 0,    type: 'subscription', duration: '30d' },
    ],
    bundles: [
      { id: 'bundle_starter',  name: 'Starter Bundle',   desc: '200 gems + 5 hints + 5 undos',              price: 2.99,  gemPrice: 0,    type: 'one_time' },
      { id: 'bundle_mega',     name: 'Mega Power Pack',  desc: '500 gems + 20 hints + neon theme',          price: 7.99,  gemPrice: 0,    type: 'one_time' },
      { id: 'bundle_ultimate', name: 'Ultimate Bundle',  desc: '2000 gems + all themes + legendary balls',   price: 19.99, gemPrice: 0,    type: 'one_time' },
    ],
    removeAds: { id: 'remove_ads', name: 'Remove Ads', desc: 'Permanently remove all ads', price: 2.99, gemPrice: 0, type: 'one_time' },
  };

  const GEM_PACKS = [
    { id: 'gems_small',  name: 'Small Gem Pack',         gems: 100,  price: 0.99,  bonus: 0,    popular: false },
    { id: 'gems_medium', name: 'Standard Gem Pack',      gems: 500,  price: 3.99,  bonus: 50,   popular: true  },
    { id: 'gems_large',  name: 'Large Gem Pack',         gems: 1200, price: 7.99,  bonus: 200,  popular: false },
    { id: 'gems_mega',   name: 'Mega Gem Pack',          gems: 4000, price: 19.99, bonus: 1000, popular: false },
    { id: 'gems_ultra',  name: '🐳 Whale Pack',          gems: 10000,price: 39.99, bonus: 5000, popular: false },
  ];

  const CATALOG = {
    themes: [
      { id: 'default',   name: 'Glass Classic', price: 0,    desc: 'Clear glass tubes',           colors: { bg: '#0f1020', accent: '#1a1a2e' } },
      { id: 'glass',     name: 'Crystal Clear', price: 500,  desc: 'Pure crystal tubes',          colors: { bg: '#0a1525', accent: '#102030' } },
      { id: 'neon',      name: 'Neon Tubes',    price: 800,  desc: 'Neon-lit glass',              colors: { bg: '#1a0030', accent: '#2a0050' } },
      { id: 'nature',    name: 'Forest Glade',  price: 1000, desc: 'Natural greens',              colors: { bg: '#0a1a10', accent: '#1a2a20' } },
      { id: 'gold',      name: 'Golden Sort',   price: 1500, desc: 'Gold and amber',              colors: { bg: '#1a1000', accent: '#2a2000' } },
      { id: 'ocean',     name: 'Ocean Deep',    price: 2000, desc: 'Deep ocean blues',            colors: { bg: '#001520', accent: '#002a40' } },
      { id: 'sunset',    name: 'Sunset Glow',   price: 3000, desc: 'Warm sunset tones',           colors: { bg: '#2d1b3d', accent: '#4a1a3a' } },
      { id: 'royal',     name: 'Royal Gold',    price: 5000, desc: 'Gold & royal purple',         colors: { bg: '#1a0030', accent: '#3a1050' } },
    ],
    pieceStyles: [
      { id: 'classic',    name: 'Classic Balls', price: 0,    desc: 'Original ball style',       borderRadius: 0, glow: false },
      { id: 'glossy',     name: 'Glossy Orbs',   price: 600,  desc: 'Shiny glossy balls',        borderRadius: 8, glow: false },
      { id: 'glow',       name: 'Glow Balls',    price: 1200, desc: 'Balls with subtle glow',   borderRadius: 4, glow: true },
      { id: 'metallic',   name: 'Metallic',      price: 2000, desc: 'Metallic finish balls',     borderRadius: 5, glow: true },
      { id: 'neon_edge',  name: 'Neon Orbs',     price: 3500, desc: 'Neon-outlined balls',       borderRadius: 3, glow: true },
    ],
    powerupPacks: [
      { id: 'starter',   name: 'Starter Pack',   price: 200,  items: { hint: 3, undo: 3 },            desc: '3 of each' },
      { id: 'hint',      name: 'Hint Bundle',    price: 300,  items: { hint: 8 },                    desc: '8 hints' },
      { id: 'undoer',    name: 'Undo Pack',      price: 400,  items: { undo: 8 },                    desc: '8 undos' },
      { id: 'mega',      name: 'Mega Bundle',    price: 1000, items: { hint: 10, undo: 10 },          desc: '10 of each' },
    ],
    boosters: [
      { id: 'score_x2',   name: 'Score Booster',   price: 500,  desc: '2x score for next game',    effect: 'scoreMultiplier:2' },
      { id: 'auto_sort',  name: 'Auto Sort',       price: 800,  desc: 'Auto-complete 1 tube',      effect: 'autoTube:1' },
      { id: 'extra_time', name: 'Extra Time',      price: 600,  desc: '+30 seconds',               effect: 'extraTime:30' },
    ],
  };

  const ACHIEVEMENTS = [
    { id: 'first_play',      name: 'First Sort',        desc: 'Play your first game',                reward: { coins: 50, gems: 0 },    icon: '🎮',  check: p => p.totalPlays >= 1 },
    { id: 'level_1',         name: 'First Clear',       desc: 'Complete level 1',                    reward: { coins: 100, gems: 0 },   icon: '1️⃣',  check: p => p.levelsCompleted >= 1 },
    { id: 'level_10',        name: 'Tenth Sort',        desc: 'Complete 10 levels',                  reward: { coins: 250, gems: 5 },   icon: '🔟',  check: p => p.levelsCompleted >= 10 },
    { id: 'level_25',        name: 'Sorter',            desc: 'Complete 25 levels',                  reward: { coins: 500, gems: 10 },  icon: '🏆',  check: p => p.levelsCompleted >= 25 },
    { id: 'level_50',        name: 'Master Sorter',     desc: 'Complete 50 levels',                  reward: { coins: 1000, gems: 15 }, icon: '👑',  check: p => p.levelsCompleted >= 50 },
    { id: 'level_100',       name: 'Sorting Legend',    desc: 'Complete 100 levels',                 reward: { coins: 2000, gems: 30 }, icon: '🌟',  check: p => p.levelsCompleted >= 100 },
    { id: 'speed_10',        name: 'Speed Demon',       desc: 'Complete a level under 10 seconds',  reward: { coins: 200, gems: 0 },   icon: '⚡',  check: p => p.bestTime <= 10 },
    { id: 'speed_30',        name: 'Quick Sort',        desc: 'Complete a level under 30 seconds',   reward: { coins: 100, gems: 0 },   icon: '⏱️',  check: p => p.bestTime <= 30 },
    { id: 'speed_60',        name: 'Under Minute',      desc: 'Complete a level under a minute',     reward: { coins: 50, gems: 0 },    icon: '⏰',  check: p => p.bestTime <= 60 },
    { id: 'moves_10',        name: 'Minimum Mover',     desc: 'Complete a level in under 10 moves',  reward: { coins: 300, gems: 5 },   icon: '🔄',  check: p => p.bestMoves <= 10 },
    { id: 'moves_20',        name: 'Efficient',         desc: 'Complete a level in under 20 moves',  reward: { coins: 150, gems: 0 },   icon: '🎯',  check: p => p.bestMoves <= 20 },
    { id: 'combo_3',         name: 'Triple Tap',        desc: '3 moves without undo',               reward: { coins: 100, gems: 0 },   icon: '3️⃣',  check: p => p.bestStreak >= 3 },
    { id: 'combo_5',         name: 'Pure Run',          desc: '5 moves without undo',               reward: { coins: 200, gems: 5 },   icon: '5️⃣',  check: p => p.bestStreak >= 5 },
    { id: 'combo_10',        name: 'Flawless',          desc: '10 moves without undo',              reward: { coins: 500, gems: 10 },  icon: '💎',  check: p => p.bestStreak >= 10 },
    { id: 'streak_3',        name: '3-Day Streak',      desc: 'Play 3 days in a row',               reward: { coins: 200, gems: 0 },   icon: '🔥',  check: p => p.bestStreak >= 3 },
    { id: 'streak_7',        name: 'Week Warrior',      desc: 'Play 7 days in a row',               reward: { coins: 500, gems: 10 },  icon: '📅',  check: p => p.bestStreak >= 7 },
    { id: 'streak_14',       name: 'Fortnight Champion',desc: 'Play 14 days in a row',              reward: { coins: 1500, gems: 25 }, icon: '⏰',  check: p => p.bestStreak >= 14 },
    { id: 'streak_30',       name: 'Month Master',      desc: 'Play 30 days in a row',              reward: { coins: 5000, gems: 100 },icon: '👑',  check: p => p.bestStreak >= 30 },
    { id: 'weapon_1',        name: 'Tool Up',           desc: 'Upgrade weapon to level 1',          reward: { coins: 200, gems: 0 },   icon: '🔧',  check: p => (p.upgrades?.weapon || 0) >= 1 },
    { id: 'weapon_3',        name: 'Tool Master',       desc: 'Upgrade weapon to level 3',          reward: { coins: 500, gems: 10 },  icon: '⚒️',  check: p => (p.upgrades?.weapon || 0) >= 3 },
    { id: 'weapon_5',        name: 'Ultimate Tool',     desc: 'Reach max weapon level',             reward: { coins: 2000, gems: 50 }, icon: '🗡️',  check: p => (p.upgrades?.weapon || 0) >= 5 },
    { id: 'case_1',          name: 'Rack Up',           desc: 'Upgrade case to level 1',            reward: { coins: 200, gems: 0 },   icon: '📦',  check: p => (p.upgrades?.case || 0) >= 1 },
    { id: 'case_3',          name: 'Heavy Rack',        desc: 'Upgrade case to level 3',            reward: { coins: 500, gems: 10 },  icon: '🏰',  check: p => (p.upgrades?.case || 0) >= 3 },
    { id: 'case_5',          name: 'Rack Legend',       desc: 'Reach max case level',               reward: { coins: 2000, gems: 50 }, icon: '💎',  check: p => (p.upgrades?.case || 0) >= 5 },
    { id: 'outfit_1',        name: 'Glove Up',          desc: 'Upgrade outfit to level 1',          reward: { coins: 200, gems: 0 },   icon: '🧤',  check: p => (p.upgrades?.outfit || 0) >= 1 },
    { id: 'outfit_3',        name: 'Fashion Sort',      desc: 'Upgrade outfit to level 3',          reward: { coins: 500, gems: 10 },  icon: '👗',  check: p => (p.upgrades?.outfit || 0) >= 3 },
    { id: 'outfit_5',        name: 'Fashion Legend',    desc: 'Reach max outfit level',             reward: { coins: 2000, gems: 50 }, icon: '👘',  check: p => (p.upgrades?.outfit || 0) >= 5 },
    { id: 'gems_100',        name: 'Gem Collector',     desc: 'Earn 100 total gems',                reward: { coins: 500, gems: 20 },  icon: '💎',  check: p => p.totalGems >= 100 },
    { id: 'gems_500',        name: 'Gem Hoarder',       desc: 'Earn 500 total gems',                reward: { coins: 1000, gems: 50 }, icon: '💠',  check: p => p.totalGems >= 500 },
    { id: 'all_achievements',name: 'Completionist',     desc: 'Unlock all other achievements',      reward: { coins: 10000, gems: 200 }, icon: '🏅', check: p => false },
  ];

  function defaultState() {
    return {
      coins: 100, gems: 0, totalGems: 0, xp: 0, level: 1,
      bestScore: 0, bestMoves: 999, bestTime: 999, levelsCompleted: 0, totalPlays: 0, bestStreak: 0,
      upgrades: { weapon: 0, case: 0, outfit: 0 },
      ownedThemes: ['default'], ownedPieceStyles: ['classic'],
      activeTheme: 'default', activePieceStyle: 'classic',
      powerups: { hint: 3, undo: 3 },
      activeBoosters: {}, inventory: {}, achievements: {}, lastSaveDate: null,
      adFree: false, subscriptions: {},
    };
  }

  let state = null;
  function save() { state.lastSaveDate = new Date().toISOString(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e) {} }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        state = { ...defaultState(), ...JSON.parse(raw) };
        if (!state.upgrades) state.upgrades = { weapon: 0, case: 0, outfit: 0 };
        if (!state.gems && state.gems !== 0) state.gems = 0;
        if (!state.totalGems) state.totalGems = 0;
        if (!state.inventory) state.inventory = {};
        if (!state.subscriptions) state.subscriptions = {};
        if (!state.adFree) state.adFree = false;
    return state;
  }
    } catch(e) {}
    reset(); return false;
  }
  function reset() { state = defaultState(); save(); }
  function xpForLevel(lvl) { return Math.floor(100 * Math.pow(1.2, lvl - 1)); }
  function addXp(amount) { if (!state) return; state.xp += amount; let leveled = false; while (state.xp >= xpForLevel(state.level)) { state.xp -= xpForLevel(state.level); state.level++; leveled = true; } save(); return leveled; }
  function addCoins(amount) { if (!state) return 0; state.coins += amount; save(); return state.coins; }
  function spendCoins(amount) { if (!state || state.coins < amount) return false; state.coins -= amount; save(); return true; }
  function addGems(amount) { if (!state) return 0; state.gems += amount; state.totalGems += amount; save(); return state.gems; }
  function spendGems(amount) { if (!state || state.gems < amount) return false; state.gems -= amount; save(); return true; }
  function getUpgradeCost(category, currentLevel) {
    const tier = UPGRADE_TIERS[category]; if (!tier) return null;
    const nextLevel = currentLevel + 1; const levelData = tier.levels.find(l => l.level === nextLevel);
    if (!levelData) return null; return { coins: levelData.coinsReq, gems: levelData.gemReq };
  }
  function upgradeItem(category, useGems = false) {
    if (!state) return { success: false, reason: 'no_state' };
    const tier = UPGRADE_TIERS[category]; if (!tier) return { success: false, reason: 'invalid_category' };
    const current = state.upgrades[category] || 0; if (current >= tier.maxLevel) return { success: false, reason: 'max_level' };
    const costs = getUpgradeCost(category, current); if (!costs) return { success: false, reason: 'no_level_data' };
    if (useGems) { if (state.gems < costs.gems) return { success: false, reason: 'not_enough_gems' }; spendGems(costs.gems); }
    else { if (state.coins < costs.coins) return { success: false, reason: 'not_enough_coins' }; spendCoins(costs.coins); }
    state.upgrades[category]++; save(); return { success: true, newLevel: state.upgrades[category] };
  }
  function getActiveBonuses() {
    if (!state) return { scoreMult: 1, undoBonus: 0, extraTube: 0, tubeBonus: 0, hintCount: 0, undoCount: 0 };
    const bonuses = { scoreMult: 1, undoBonus: 0, extraTube: 0, tubeBonus: 0, hintCount: 0, undoCount: 0 };
    const wLevel = state.upgrades.weapon || 0; const wData = UPGRADE_TIERS.weapon.levels[wLevel];
    if (wData) { bonuses.scoreMult += (wData.bonus.scoreMult - 1); bonuses.undoBonus += wData.bonus.undoBonus; }
    const cLevel = state.upgrades.case || 0; const cData = UPGRADE_TIERS.case.levels[cLevel];
    if (cData) { bonuses.extraTube += cData.bonus.extraTube; bonuses.tubeBonus += cData.bonus.tubeBonus; }
    const oLevel = state.upgrades.outfit || 0; const oData = UPGRADE_TIERS.outfit.levels[oLevel];
    if (oData) { bonuses.hintCount += oData.bonus.hintCount; bonuses.undoCount += oData.bonus.undoCount; }
    return bonuses;
  }
  function ownsPremiumItem(itemId) { return state && state.inventory && state.inventory[itemId] === true; }
  function purchasePremiumItem(itemId) {
    if (!state) return false; state.inventory[itemId] = true;
        if (itemId === 'remove_ads') {
      state.adFree = true;
      if (window.AdsManager) AdsManager.onAdsRemoved();
    }
    const bundleGems = { bundle_starter: 200, bundle_mega: 500, bundle_ultimate: 2000 };
    if (bundleGems[itemId]) addGems(bundleGems[itemId]); save(); return true;
  }
  function checkAchievements() {
    if (!state) return []; const unlocked = [];
    for (const ach of ACHIEVEMENTS) { if (state.achievements[ach.id]) continue; if (ach.check(state)) { state.achievements[ach.id] = true; addCoins(ach.reward.coins); if (ach.reward.gems) addGems(ach.reward.gems); unlocked.push(ach); } }
    if (unlocked.length > 0) save(); return unlocked;
  }
  function claimDailyBonus() {
    if (!state) return null; const now = new Date(); const today = now.toDateString();
    try {
      const lastClaim = localStorage.getItem(DAILY_KEY); if (lastClaim === today) return null;
      const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      let streak = 0; if (lastClaim === yesterdayStr) streak = (state.dailyStreak || 0) + 1; else streak = 1;
      state.dailyStreak = streak; if (streak > state.bestStreak) state.bestStreak = streak;
      const coins = Math.min(100 + (streak - 1) * 20, 1000);
      const gems = streak >= 7 ? 5 : streak >= 3 ? 2 : 0;
      addCoins(coins); if (gems) addGems(gems);
      localStorage.setItem(DAILY_KEY, today); save(); return { streak, coins, gems };
    } catch(e) { return null; }
  }
  function endOfGame(result) {
    if (!state) return; state.totalPlays++;
    if (result.score > state.bestScore) state.bestScore = result.score;
    if (result.moves < state.bestMoves) state.bestMoves = result.moves;
    if (result.time < state.bestTime) state.bestTime = result.time;
    if (result.levelCompleted) state.levelsCompleted++;
    const xpGain = Math.floor(result.score / 10) + 20;
    addXp(xpGain); const coinGain = Math.floor(result.score / 20) + 5;
    addCoins(coinGain); save();
  }
  function getState() { return state; }
  function getUpgradeTiers() { return UPGRADE_TIERS; }
  function getPremiumItems() { return PREMIUM_ITEMS; }
  function getGemPacks() { return GEM_PACKS; }
  function getCatalog() { return CATALOG; }
  function getAchievements() { return ACHIEVEMENTS; }
  function getCoinBalance() { return state ? state.coins : 0; }
  function getGemBalance() { return state ? state.gems : 0; }

  window.ProgressionSystem = {
    load, save, reset, addCoins, spendCoins, getCoinBalance, addGems, spendGems, getGemBalance,
    addXp, xpForLevel, upgradeItem, getUpgradeCost, getActiveBonuses, getUpgradeTiers, UPGRADE_TIERS,
    getPremiumItems, PREMIUM_ITEMS, getGemPacks, GEM_PACKS, ownsPremiumItem, purchasePremiumItem,
    getCatalog, CATALOG, getAchievements, ACHIEVEMENTS, checkAchievements, endOfGame, claimDailyBonus,
    getState, defaultState,
  };
})();
