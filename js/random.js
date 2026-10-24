// Geração aleatória: usada pelo botão "Sortear" de cada etapa e pelo modo mestre.
import { STATS } from './data/glossary.js';
import {
  die, rollDice, pickOne, rollStats, canRerollStats, newCharacter, getClass, getAncestry,
  entryFor, rollSubSlots, talentSlots, languageGroups, spellOptions, spellsAllowed, computeSheet,
  weaponAllowed, quickWeapon, applyQuickPack, rollLevel0Gear, fixedLanguages,
  spellStatus, canAddSpell, hpSteps, nextLevel, MAX_LEVEL,
} from './rules.js';

export function randomStats(c) {
  c.stats = rollStats();
  c.statRerolls = 0;
  if (canRerollStats(c.stats)) { c.stats = rollStats(); c.statRerolls = 1; }
}

export function randomAncestry(rules, c) {
  const r = die(12);
  const anc = rules.ancestries.find((a) => a.roll && r >= a.roll[0] && r <= a.roll[1]) || pickOne(rules.ancestries);
  c.ancestry = anc.id;
  c.ancestryChoice = {};
  if (anc.choice) {
    const cls = getClass(rules, c);
    c.ancestryChoice[anc.choice.id] = cls?.spellcasting?.known ? 'cast' : 'ranged';
  }
}

export function randomClass(rules, c, pool) {
  const options = pool?.length ? rules.classes.filter((k) => pool.includes(k.id)) : rules.classes;
  c.classId = pickOne(options).id;
  c.classChoices = {};
  c.talents = {};
  c.spells = [];
  c.languages = {};
  c.hp = null;
}

export function randomClassChoices(rules, c) {
  const cls = getClass(rules, c);
  if (!cls?.choices) return;
  const mods = computeSheet(rules, c).mods;
  for (const ch of cls.choices) {
    if (ch.type === 'weapon') c.classChoices[ch.id] = quickWeapon(rules, c, mods)?.id || null;
    else if (ch.id === 'grit') c.classChoices.grit = mods.DES > mods.FOR ? 'DES' : 'FOR';
    else if (ch.options) c.classChoices[ch.id] = pickOne(ch.options).id;
  }
}

// Tabela de antecedentes sugerida: a do livro da classe, ou a do livro base.
export function defaultBackgroundTable(rules, c) {
  const cls = getClass(rules, c);
  const own = cls && rules.backgroundTables.find((t) => t.book === cls.book);
  return own || rules.backgroundTables.find((t) => t.id === 'base');
}

// Rola 1d20 na tabela escolhida pelo jogador (ou na sugerida, se nenhuma foi escolhida).
export function randomBackground(rules, c, tableId = null) {
  const table = rules.backgroundTables.find((t) => t.id === tableId) || defaultBackgroundTable(rules, c);
  const index = die(20) - 1;
  c.background = { table: table.id, index };
}

export function randomAlignment(c) {
  const r = die(6);
  c.alignment = r <= 3 ? 'lawful' : r <= 5 ? 'neutral' : 'chaotic';
}

export function randomDeity(rules, c) {
  const cls = getClass(rules, c);
  const pool = cls?.requiresDeity ? rules.deities.filter((d) => d.alignment === c.alignment) : rules.deities;
  c.deity = pool.length ? pickOne(pool).id : null;
  if (cls?.requiresPatron) c.patron = pickOne(rules.patrons).id;
}

export function randomLanguages(rules, c) {
  const known = new Set(fixedLanguages(rules, c));
  c.languages = {};
  for (const g of languageGroups(rules, c)) {
    const pool = g.options.filter((l) => !known.has(l));
    const chosen = [];
    while (chosen.length < g.count && pool.length) {
      const l = pool.splice(die(pool.length) - 1, 1)[0];
      chosen.push(l);
      known.add(l);
    }
    c.languages[g.key] = chosen;
  }
}

// Escolha automática "sensata" para um efeito de talento.
function bestStat(c, options) {
  return [...options].sort((a, b) => (c.stats?.[b] || 0) - (c.stats?.[a] || 0))[0];
}

export function randomChoice(rules, c, effect, tableId) {
  switch (effect.kind) {
    case 'stat': return effect.options.length > 1 ? bestStat(c, effect.options) : null;
    case 'stat2': {
      const [a, b] = [...STATS].sort((x, y) => (c.stats?.[y] || 0) - (c.stats?.[x] || 0));
      return { 0: a, 1: b };
    }
    case 'atkOne': return (c.stats?.FOR || 0) >= (c.stats?.DES || 0) ? 'melee' : 'ranged';
    case 'acArmor': {
      const cls = getClass(rules, c);
      const armor = rules.armor.filter((a) => !a.shield && (cls.armor === 'all' || cls.armor.includes(a.id)));
      return armor.find((a) => a.id === 'couro')?.id || armor[0]?.id || 'escudo';
    }
    case 'mastery': return quickWeapon(rules, c, computeSheet(rules, c).mods)?.id || 'adaga';
    case 'prof': {
      if (effect.weapon) return null;
      const list = rules.weapons.filter((w) => w.type.includes('C') && !weaponAllowed(rules, c, w));
      return (list.length ? pickOne(list) : rules.weapons[0]).id;
    }
    case 'note': return effect.ask ? '' : null;
    case 'or': {
      const opt = die(effect.options.length) - 1;
      return { opt, sub: randomChoice(rules, c, effect.options[opt].effect, tableId) };
    }
    case 'pick': {
      const entries = rules.tables[tableId].entries.map((e, idx) => ({ e, idx })).filter(({ e }) => e.effect.kind !== 'pick');
      const useful = entries.filter(({ e }) => e.effect.kind !== 'note');
      const { e, idx } = pickOne(useful.length ? useful : entries);
      return { mode: 'entry', idx, sub: randomChoice(rules, c, e.effect, tableId) };
    }
    case 'roll': {
      const choice = {};
      if (effect.table === 'patronAny') choice.patron = pickOne(rules.patrons).id;
      choice.slots = {};
      for (const s of rollSubSlots(rules, c, effect, choice)) choice.slots[s.i] = randomSlot(rules, c, s.table);
      if (effect.table === 'patron2') choice.keep = die(2) - 1;
      return choice;
    }
    default: return null;
  }
}

export function randomSlot(rules, c, tableId) {
  const table = rules.tables[tableId];
  const value = rollDice(table.dice);
  const entry = entryFor(table, value);
  return { roll: value, choice: randomChoice(rules, c, entry.effect, tableId) };
}

export function randomTalents(rules, c) {
  c.talents = {};
  for (const s of talentSlots(rules, c)) c.talents[s.key] = randomSlot(rules, c, s.table);
}

// Completa as magias que faltam, grau por grau, sem mexer nas já escolhidas.
export function fillSpells(rules, c) {
  for (let guard = 0; guard < 60; guard++) {
    const st = spellStatus(rules, c);
    let tier = st.tiers.findIndex((n, i) => st.counts[i] < n) + 1;
    if (!tier && st.extraUsed < st.extra) tier = die(st.maxTier);
    if (!tier) return;
    const pool = spellOptions(rules, c, tier).filter((sp) => !c.spells.includes(sp.id));
    if (!pool.length || !canAddSpell(st, tier)) return;
    c.spells.push(pickOne(pool).id);
  }
}

export function randomSpells(rules, c) {
  c.spells = [];
  fillSpells(rules, c);
}

export function rollHpDie(rules, c) {
  const cls = getClass(rules, c);
  const r = die(cls.hitDie);
  return getAncestry(rules, c)?.id === 'anao' ? Math.max(r, die(cls.hitDie)) : r;
}

export function randomHp(rules, c, count) {
  if (!(c.level >= 1)) { c.hp = null; return; }
  c.hp = { rolls: Array.from({ length: count }, () => rollHpDie(rules, c)) };
}

export function randomEquipment(rules, c) {
  if (c.level === 0) rollLevel0Gear(rules, c);
  else applyQuickPack(rules, c);
}

export function randomName(rules, c) {
  const cls = getClass(rules, c);
  if (rules.nordicNames && cls?.book === 'sol-da-meia-noite') {
    const n = rules.nordicNames;
    const first = pickOne(die(2) === 1 ? n.male : n.female);
    return die(2) === 1 ? `${first} ${pickOne(n.surname)}` : `${first}, ${pickOne(n.epithet)}`;
  }
  const list = rules.names[c.ancestry] || rules.names.humano;
  return pickOne(list);
}

// Escolhas de um novo nível (2 em diante), feitas ao acaso.
export function randomLevelChoices(rules, c) {
  const n = c.level;
  // O talento vem antes: alguns dão um dado de vida extra neste nível.
  const slot = talentSlots(rules, c).find((s) => s.key === `lvl${n}`);
  if (slot) c.talents[slot.key] = randomSlot(rules, c, slot.table);
  const step = hpSteps(rules, c)[n - 1];
  c.levels[n].hpRolls = Array.from({ length: step.count }, () => rollHpDie(rules, c));
  fillSpells(rules, c);
}

export function randomLevelUp(rules, c) {
  const next = nextLevel(c);
  randomLevelChoices(rules, next);
  return next;
}

// Personagem completo, pronto para jogar.
export function randomCharacter(rules, { level = 1, classPool = null, group = '' } = {}) {
  let c = newCharacter(rules.books);
  const target = Math.min(MAX_LEVEL, level);
  level = Math.min(1, target);
  c.level = level;
  c.group = group;
  randomStats(c);
  if (level === 1) randomClass(rules, c, classPool);
  randomAncestry(rules, c);
  randomAlignment(c);
  randomDeity(rules, c);
  randomBackground(rules, c);
  randomLanguages(rules, c);
  if (level === 1) {
    randomClassChoices(rules, c);
    randomTalents(rules, c);
    randomSpells(rules, c);
    const sheet = computeSheet(rules, c);
    randomHp(rules, c, 1 + sheet.bonus.extraHpDice);
  }
  randomEquipment(rules, c);
  c.name = randomName(rules, c);
  while (c.level < target) c = randomLevelUp(rules, c);
  return c;
}

