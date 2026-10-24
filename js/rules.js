// Motor de regras: rolagens, talentos e todos os valores calculados da ficha.
import { STATS } from './data/glossary.js';

// ---------- Dados ----------

export function die(sides) {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return (buf[0] % sides) + 1;
}

export function roll(count, sides) {
  let total = 0;
  for (let i = 0; i < count; i++) total += die(sides);
  return total;
}

export function rollDice(spec) {
  const [n, s] = spec.split('d').map(Number);
  return roll(n || 1, s);
}

export const pickOne = (list) => list[die(list.length) - 1];

export function modifier(score) {
  if (score <= 3) return -4;
  if (score >= 18) return 4;
  return Math.floor((score - 10) / 2);
}

export const fmtMod = (n) => (n >= 0 ? `+${n}` : `${n}`);

export function fmtMoney(pc) {
  const po = Math.floor(pc / 100);
  const pp = Math.floor((pc % 100) / 10);
  const c = pc % 10;
  const parts = [];
  if (po) parts.push(`${po} PO`);
  if (pp) parts.push(`${pp} PP`);
  if (c) parts.push(`${c} PC`);
  return parts.join(' ') || '0 PO';
}

// ---------- Moedas ----------
// Guardadas separadas por tipo. Personagens antigos tinham só o total em PC (c.gold).

export const COINS = [
  { id: 'po', name: 'Ouro', short: 'PO', value: 100 },
  { id: 'pp', name: 'Prata', short: 'PP', value: 10 },
  { id: 'pc', name: 'Cobre', short: 'PC', value: 1 },
];

export function splitMoney(pc = 0) {
  return { po: Math.floor(pc / 100), pp: Math.floor((pc % 100) / 10), pc: pc % 10 };
}

export const coinsOf = (c) => c.coins || splitMoney(c.gold || 0);
export const coinCount = (coins) => (coins.po || 0) + (coins.pp || 0) + (coins.pc || 0);
export const coinValue = (coins) => (coins.po || 0) * 100 + (coins.pp || 0) * 10 + (coins.pc || 0);
// As 100 primeiras moedas não ocupam espaço; depois, 1 espaço a cada 100.
export const coinSlots = (coins) => Math.max(0, Math.ceil((coinCount(coins) - 100) / 100));

export function fmtCoins(coins) {
  const parts = COINS.filter((k) => coins[k.id]).map((k) => `${coins[k.id]} ${k.short}`);
  return parts.join(' ') || '0 PO';
}

// ---------- Personagem ----------

export function newCharacter(books) {
  return {
    id: `pc-${Date.now().toString(36)}-${die(1e6).toString(36)}`,
    version: 2,
    books: [...books],
    level: null,
    xp: 0,
    hpCurrent: null, // null = PV cheio
    levels: {},
    stats: null,
    statRerolls: 0,
    ancestry: null,
    ancestryChoice: {},
    classId: null,
    classChoices: {},
    background: null,
    alignment: null,
    deity: null,
    patron: null,
    languages: {},
    talents: {},
    spells: [],
    hp: null,
    gold: null,
    coins: null,
    equipMode: null,
    inventory: [],
    name: '',
    player: '',
    appearance: '',
    traits: '',
    bio: '',
    group: '',
    createdAt: new Date().toISOString(),
  };
}

export const getAncestry = (rules, c) => rules.ancestries.find((a) => a.id === c.ancestry) || null;
export const getClass = (rules, c) => (c.level >= 1 ? rules.classes.find((k) => k.id === c.classId) || null : null);

// ---------- Níveis ----------

export const MAX_LEVEL = 10;

// PV atual: começa cheio e nunca passa do máximo nem fica abaixo de 0.
export function currentHp(c, maxHp) {
  if (maxHp == null) return null;
  if (c.hpCurrent == null) return maxHp;
  return Math.max(0, Math.min(maxHp, c.hpCurrent));
}
export const TALENT_LEVELS = [1, 3, 5, 7, 9];
// XP para passar do nível atual (nível 0 sobe para o 1 ao sobreviver, mas mostramos a mesma meta de 10).
export const xpNeeded = (level) => Math.max(1, level || 0) * 10;

export function titleFor(cls, c) {
  if (!cls || !c.alignment) return null;
  return cls.titles[c.alignment][Math.min(4, Math.floor((Math.max(1, c.level) - 1) / 2))];
}

export function rollStats() {
  const stats = {};
  for (const s of STATS) stats[s] = roll(3, 6);
  return stats;
}

export const canRerollStats = (stats) => !!stats && Object.values(stats).every((v) => v < 14);

// ---------- Subir de nível ----------

// Cópia do personagem já no nível seguinte, com o XP zerado (Livro de Regras, pág. 39).
export function nextLevel(c) {
  const n = structuredClone(c);
  n.level = (c.level || 0) + 1;
  n.xp = 0;
  n.levels = n.levels || {};
  if (n.level >= 2) n.levels[n.level] = { hpRolls: [] };
  return n;
}

// O que ainda falta escolher para concluir o nível atual (só para nível 2 em diante).
export function levelUpError(rules, c) {
  const n = c.level;
  const cls = getClass(rules, c);
  const step = hpSteps(rules, c)[n - 1];
  for (let i = step.maxed; i < step.count; i++) {
    const r = step.rolls[i];
    if (!(r >= 1 && r <= cls.hitDie)) return `Role o dado de vida (1 a ${cls.hitDie}).`;
  }
  const slot = talentSlots(rules, c).find((s) => s.key === `lvl${n}`);
  if (slot && !slotComplete(rules, c, c.talents[slot.key], slot.table)) return 'Complete o talento do novo nível.';
  return spellsError(rules, c);
}

// ---------- Armas e armaduras permitidas ----------

export function weaponAllowed(rules, c, weapon, extraProf = []) {
  const cls = getClass(rules, c);
  if (!cls) return true; // nível 0 usa tudo
  if (extraProf.includes(weapon.id)) return true;
  if (cls.weapons === 'all') return true;
  if (cls.weapons === 'melee+besta') return weapon.type.includes('C') || weapon.id === 'besta';
  return cls.weapons.includes(weapon.id);
}

export function armorAllowed(rules, c, armor) {
  const cls = getClass(rules, c);
  if (!cls) return true;
  if (cls.armor === 'all') return true;
  return cls.armor.includes(armor.id) || (armor.shield && cls.armor.includes('escudo') && armor.id === 'escudo-redondo');
}

export function findItem(rules, id) {
  for (const [cat, list] of [['weapon', rules.weapons], ['armor', rules.armor], ['gear', rules.gear]]) {
    const item = list.find((x) => x.id === id);
    if (item) return { ...item, cat };
  }
  return null;
}

// ---------- Talentos ----------

// Quais rolagens de talento o personagem precisa fazer.
export function talentSlots(rules, c) {
  const cls = getClass(rules, c);
  if (!cls) return [];
  const anc = getAncestry(rules, c);
  const slots = [{ key: 'class0', level: 1, table: `class:${cls.id}`, label: `Talento de ${cls.name}` }];
  if (anc?.extraTalentAtLevel1) slots.push({ key: 'class1', level: 1, table: `class:${cls.id}`, label: `Talento extra (${anc.feature.name})` });
  if (cls.lotusAtLevel1) slots.push({ key: 'lotus0', level: 1, table: 'lotus', label: 'Talento da Lótus Negra' });
  if (cls.patronBoonAtLevel1 && c.patron) slots.push({ key: 'patron0', level: 1, table: `patron:${c.patron}`, label: 'Dádiva Patronal' });
  for (const n of TALENT_LEVELS) {
    if (n === 1 || n > c.level) continue;
    // O Profanador pode rolar na tabela do patrono em vez da tabela da classe.
    const patron = cls.patronBoonAtLevel1 && c.patron && c.levels?.[n]?.talentTable === 'patron';
    slots.push({ key: `lvl${n}`, level: n, table: patron ? `patron:${c.patron}` : `class:${cls.id}`, label: `Talento do nível ${n}` });
  }
  return slots;
}

export function entryFor(table, value) {
  return table?.entries.find((e) => value >= e.min && value <= e.max) || null;
}

// Mostra o que um efeito precisa que o jogador escolha. Devolve null se não precisa de nada.
export function effectNeeds(effect) {
  switch (effect.kind) {
    case 'stat': return effect.options.length > 1 ? 'stat' : null;
    case 'stat2': case 'atkOne': case 'acArmor': case 'mastery': case 'or': case 'pick': case 'roll': return effect.kind;
    case 'prof': return effect.weapon ? null : 'prof';
    case 'note': return effect.ask ? 'text' : null;
    default: return null;
  }
}

// Verifica se o efeito (com a escolha feita) está completo.
export function effectComplete(rules, c, effect, choice, tableId) {
  switch (effect.kind) {
    case 'stat': return effect.options.length === 1 || effect.options.includes(choice);
    case 'stat2': return !!choice && !!choice[0] && !!choice[1] && choice[0] !== choice[1];
    case 'atkOne': return choice === 'melee' || choice === 'ranged';
    case 'acArmor': case 'mastery': return !!choice;
    case 'prof': return !!effect.weapon || !!choice;
    case 'note': return true;
    case 'or': return !!choice && choice.opt != null && effectComplete(rules, c, effect.options[choice.opt].effect, choice.sub, tableId);
    case 'pick': {
      if (!choice) return false;
      if (choice.mode === 'points') return !!choice.a && !!choice.b;
      const entry = rules.tables[tableId]?.entries[choice.idx];
      return !!entry && effectComplete(rules, c, entry.effect, choice.sub, tableId);
    }
    case 'roll': return rollSubSlots(rules, c, effect, choice).every((s) => slotComplete(rules, c, s.slot, s.table));
    default: return true;
  }
}

// Sub-rolagens de efeitos do tipo "role na tabela X".
export function rollSubSlots(rules, c, effect, choice = {}) {
  const slots = (choice && choice.slots) || [];
  if (effect.table === 'lotus') {
    const n = effect.count || 1;
    return Array.from({ length: n }, (_, i) => ({ table: 'lotus', slot: slots[i] || {}, i }));
  }
  if (effect.table === 'patronAny') {
    if (!choice?.patron) return [{ table: null, slot: {}, i: 0, needsPatron: true }];
    return [{ table: `patron:${choice.patron}`, slot: slots[0] || {}, i: 0 }];
  }
  if (effect.table === 'patron2') {
    const table = `patron:${c.patron}`;
    return [0, 1].map((i) => ({ table, slot: slots[i] || {}, i, candidate: true }));
  }
  return [];
}

export function slotComplete(rules, c, slot, tableId) {
  if (!tableId || !slot || slot.roll == null) return false;
  const entry = entryFor(rules.tables[tableId], slot.roll);
  if (!entry) return false;
  if (entry.effect.kind === 'roll' && entry.effect.table === 'patron2') {
    const subs = rollSubSlots(rules, c, entry.effect, slot.choice);
    return slot.choice?.keep != null && subs.every((s) => slotComplete(rules, c, s.slot, s.table));
  }
  return effectComplete(rules, c, entry.effect, slot.choice, tableId);
}

// Acumula os bônus de um efeito resolvido.
function applyEffect(rules, c, effect, choice, tableId, acc, text) {
  switch (effect.kind) {
    case 'stat': {
      const stat = effect.options.length === 1 ? effect.options[0] : choice;
      if (stat) acc.stat[stat] += effect.amount;
      break;
    }
    case 'stat2': if (choice) for (const s of [choice[0], choice[1]]) if (s) acc.stat[s] += 1; break;
    case 'atk': acc.atkMelee += effect.melee || 0; acc.atkRanged += effect.ranged || 0; break;
    case 'atkOne': if (choice === 'melee') acc.atkMelee += effect.amount; if (choice === 'ranged') acc.atkRanged += effect.amount; break;
    case 'dmg': acc.dmgMelee += effect.melee || 0; acc.dmgRanged += effect.ranged || 0; break;
    case 'cast': acc.cast += effect.amount; break;
    case 'ac': acc.ac += effect.amount; break;
    case 'acArmor': if (choice) acc.acArmor.push(choice); break;
    case 'mastery': if (choice) acc.mastery.push(choice); break;
    case 'prof': { const w = effect.weapon || choice; if (w) acc.prof.push(w); break; }
    case 'spell': acc.extraSpells += 1; break;
    case 'maxHp': acc.maxHp += effect.count; break;
    case 'extraHpDie': acc.extraHpDice += 1; break;
    case 'or': if (choice?.opt != null) applyEffect(rules, c, effect.options[choice.opt].effect, choice.sub, tableId, acc, null); break;
    case 'pick': {
      if (choice?.mode === 'points') { if (choice.a) acc.stat[choice.a] += 1; if (choice.b) acc.stat[choice.b] += 1; }
      else if (choice?.idx != null) {
        const entry = rules.tables[tableId].entries[choice.idx];
        applyEffect(rules, c, entry.effect, choice.sub, tableId, acc, null);
      }
      break;
    }
    case 'roll': {
      const subs = rollSubSlots(rules, c, effect, choice);
      subs.forEach((s) => {
        if (effect.table === 'patron2' && choice?.keep !== s.i) return;
        applySlot(rules, c, s.slot, s.table, acc);
      });
      break;
    }
    default: break;
  }
  if (text) acc.texts.push(text);
}

export function applySlot(rules, c, slot, tableId, acc) {
  if (!tableId || slot?.roll == null) return;
  const entry = entryFor(rules.tables[tableId], slot.roll);
  if (!entry) return;
  acc.texts.push(describeSlot(rules, c, slot, tableId));
  applyEffect(rules, c, entry.effect, slot.choice, tableId, acc, null);
}

// Texto legível de um talento resolvido, incluindo as escolhas.
export function describeSlot(rules, c, slot, tableId) {
  const table = rules.tables[tableId];
  const entry = entryFor(table, slot.roll);
  if (!entry) return '';
  return describeEffect(rules, c, entry, entry.effect, slot.choice, tableId);
}

function describeEffect(rules, c, entry, effect, choice, tableId) {
  const name = (id) => findItem(rules, id)?.name || id;
  switch (effect.kind) {
    case 'stat': return effect.options.length > 1 && choice ? `+${effect.amount} em ${choice}` : entry.text;
    case 'stat2': return choice?.[0] && choice?.[1] ? `+1 em ${choice[0]} e ${choice[1]}` : entry.text;
    case 'atkOne': return choice ? `+${effect.amount} em ataques ${choice === 'melee' ? 'corpo a corpo' : 'à distância'}` : entry.text;
    case 'acArmor': return choice ? `+1 na CA usando ${name(choice)}` : entry.text;
    case 'mastery': return choice ? `Maestria em Armas: ${name(choice)}` : entry.text;
    case 'prof': return `Treinado com ${name(effect.weapon || choice)}`;
    case 'note': return choice && effect.ask ? `${entry.text} (${choice})` : entry.text;
    case 'or': return choice?.opt != null ? describeEffect(rules, c, { text: effect.options[choice.opt].label }, effect.options[choice.opt].effect, choice.sub, tableId) : entry.text;
    case 'pick': {
      if (choice?.mode === 'points') return choice.a === choice.b ? `+2 em ${choice.a}` : `+1 em ${choice.a} e +1 em ${choice.b}`;
      if (choice?.idx != null) {
        const e = rules.tables[tableId].entries[choice.idx];
        return describeEffect(rules, c, e, e.effect, choice.sub, tableId);
      }
      return entry.text;
    }
    case 'roll': {
      const subs = rollSubSlots(rules, c, effect, choice);
      const parts = subs.filter((s) => !(effect.table === 'patron2' && choice?.keep !== s.i))
        .map((s) => (s.table && s.slot.roll != null ? describeSlot(rules, c, s.slot, s.table) : null)).filter(Boolean);
      return parts.length ? `${entry.text}: ${parts.join('; ')}` : entry.text;
    }
    default: return entry.text;
  }
}

// ---------- Ficha calculada ----------

export function emptyBonuses() {
  return {
    stat: Object.fromEntries(STATS.map((s) => [s, 0])),
    atkMelee: 0, atkRanged: 0, dmgMelee: 0, dmgRanged: 0, cast: 0, ac: 0,
    acArmor: [], mastery: [], prof: [], extraSpells: 0, maxHp: 0, extraHpDice: 0, texts: [],
  };
}

// Bônus dos talentos; "upTo" limita aos talentos ganhos até aquele nível.
export function talentBonuses(rules, c, upTo = Infinity) {
  const acc = emptyBonuses();
  for (const s of talentSlots(rules, c)) if (s.level <= upTo) applySlot(rules, c, c.talents[s.key], s.table, acc);
  return acc;
}

// ---------- Magias ----------

// Quantas magias de cada grau a classe conhece no nível atual ([grau 1, grau 2, ...]).
export function spellTiers(cls, level) {
  const sc = cls?.spellcasting;
  if (!sc) return [];
  if (sc.byLevel) return sc.byLevel[Math.min(MAX_LEVEL, Math.max(1, level)) - 1];
  return sc.known ? [sc.known] : [];
}

// Cota de magias: por grau, mais as magias extras de talentos (de qualquer grau que já conheça).
export function spellQuota(rules, c, bonus = talentBonuses(rules, c)) {
  const cls = getClass(rules, c);
  const tiers = spellTiers(cls, c.level);
  const base = tiers.reduce((a, b) => a + b, 0);
  const extra = base > 0 ? bonus.extraSpells : 0;
  return { tiers, extra, total: base + extra, maxTier: tiers.length };
}

export function spellsAllowed(rules, c, bonus = talentBonuses(rules, c)) {
  return spellQuota(rules, c, bonus).total;
}

const spellList = (rules, cls) => rules.spells[cls.spellcasting.list] || [];

export function spellOptions(rules, c, tier = null) {
  const cls = getClass(rules, c);
  if (!cls?.spellcasting) return [];
  const max = spellQuota(rules, c).maxTier;
  return spellList(rules, cls).filter((sp) => !sp.free && sp.tier <= max && (tier == null || sp.tier === tier));
}

// Situação das magias escolhidas: quantas por grau e quantas extras foram usadas.
export function spellStatus(rules, c, bonus = talentBonuses(rules, c)) {
  const cls = getClass(rules, c);
  const q = spellQuota(rules, c, bonus);
  const counts = q.tiers.map(() => 0);
  if (cls?.spellcasting) {
    const list = spellList(rules, cls);
    for (const id of c.spells) {
      const sp = list.find((x) => x.id === id);
      if (sp && sp.tier <= q.maxTier) counts[sp.tier - 1] += 1;
    }
  }
  const extraUsed = counts.reduce((a, n, i) => a + Math.max(0, n - q.tiers[i]), 0);
  return { ...q, counts, extraUsed };
}

// Pode marcar mais uma magia deste grau?
export function canAddSpell(status, tier) {
  return status.counts[tier - 1] < status.tiers[tier - 1] || status.extraUsed < status.extra;
}

export function spellsError(rules, c) {
  const st = spellStatus(rules, c);
  for (let i = 0; i < st.tiers.length; i++) {
    const missing = st.tiers[i] - st.counts[i];
    if (missing > 0) return `Escolha mais ${missing} magia${missing > 1 ? 's' : ''} de grau ${i + 1}.`;
  }
  const extra = st.extra - st.extraUsed;
  if (extra > 0) return `Escolha mais ${extra} magia${extra > 1 ? 's' : ''} extra${extra > 1 ? 's' : ''} (de qualquer grau que você conheça).`;
  return null;
}

export function languageGroups(rules, c) {
  const anc = getAncestry(rules, c);
  const cls = getClass(rules, c);
  const groups = [];
  (anc?.languageChoices || []).forEach((g, i) => groups.push({ ...g, key: `anc${i}` }));
  (cls?.languageChoices || []).forEach((g, i) => groups.push({ ...g, key: `cls${i}` }));
  return groups.map((g) => ({
    ...g,
    options: Array.isArray(g.from) ? g.from : rules.languages[g.from].map(([n]) => n),
  }));
}

export function knownLanguages(rules, c) {
  const anc = getAncestry(rules, c);
  const cls = getClass(rules, c);
  const set = new Set([...(anc?.languages || []), ...(cls?.languages || [])]);
  for (const g of languageGroups(rules, c)) for (const l of c.languages[g.key] || []) set.add(l);
  return [...set];
}

export function fixedLanguages(rules, c) {
  return [...new Set([...(getAncestry(rules, c)?.languages || []), ...(getClass(rules, c)?.languages || [])])];
}

export function carryCapacity(rules, c, stats, mods) {
  const cls = getClass(rules, c);
  return Math.max(stats.FOR, 10) + (cls?.carrier && mods.CON > 0 ? mods.CON : 0);
}

// Item do inventário: do catálogo dos livros ou criado pelo jogador.
export function itemOf(rules, inv) {
  if (inv.custom) return { id: inv.id, name: inv.name, cat: 'custom', slots: inv.slots ?? 1, desc: inv.note || '' };
  return findItem(rules, inv.id);
}

export function slotsUsed(rules, c) {
  let used = coinSlots(coinsOf(c));
  for (const inv of c.inventory) {
    const item = itemOf(rules, inv);
    if (!item) continue;
    if (item.cat === 'custom') {
      used += item.slots * inv.qty;
    } else if (item.cat === 'gear') {
      const qty = Math.max(0, inv.qty - (item.freeFirst || 0));
      used += Math.ceil(qty / item.perSlot);
    } else {
      used += (item.slots ?? 1) * inv.qty;
    }
  }
  return used;
}

// Dados de vida de cada nível: quantos rolar e quantos valem o máximo por causa de talentos.
// No nível 1 são guardados em c.hp.rolls; nos seguintes, em c.levels[n].hpRolls.
export function hpSteps(rules, c) {
  const steps = [];
  let prev = emptyBonuses();
  let maxLeft = 0;
  for (let n = 1; n <= (c.level || 0); n++) {
    const b = talentBonuses(rules, c, n);
    maxLeft += b.maxHp - prev.maxHp;
    const count = 1 + b.extraHpDice - prev.extraHpDice;
    const maxed = Math.min(maxLeft, count);
    maxLeft -= maxed;
    steps.push({ level: n, count, maxed, rolls: (n === 1 ? c.hp?.rolls : c.levels?.[n]?.hpRolls) || [] });
    prev = b;
  }
  return steps;
}

export function hpRollsNeeded(rules, c) {
  return c.level >= 1 ? hpSteps(rules, c)[0].count : 0;
}

function sumStep(step, hitDie) {
  let total = 0;
  for (let i = 0; i < step.count; i++) {
    if (i < step.maxed) { total += hitDie; continue; }
    const r = step.rolls[i];
    if (r == null) return null;
    total += r;
  }
  return total;
}

export function computeHP(rules, c, mods) {
  const anc = getAncestry(rules, c);
  const dwarf = anc?.id === 'anao' ? 2 : 0;
  if (c.level === 0) return Math.max(1, mods.CON) + dwarf;
  const cls = getClass(rules, c);
  if (!cls) return null;
  const steps = hpSteps(rules, c);
  const first = sumStep(steps[0], cls.hitDie);
  if (first == null) return null;
  // A Constituição só entra no nível 1; nos seguintes, soma-se apenas o dado.
  let total = Math.max(1, first + mods.CON) + dwarf;
  for (const st of steps.slice(1)) {
    const v = sumStep(st, cls.hitDie);
    if (v == null) return null;
    total += v;
  }
  return total;
}

export function computeAC(rules, c, mods, bonus) {
  let best = { ac: 10 + mods.DES, name: 'Sem armadura' };
  let shield = null;
  for (const inv of c.inventory) {
    const item = findItem(rules, inv.id);
    if (item?.cat !== 'armor' || !armorAllowed(rules, c, item)) continue;
    if (item.shield) { if (!shield || item.shield > shield.shield) shield = item; continue; }
    const extra = bonus.acArmor.filter((a) => a === item.id || a === item.base).length;
    const ac = item.ac + (item.dex ? mods.DES : 0) + extra;
    if (ac > best.ac) best = { ac, name: item.name };
  }
  const parts = [best.name];
  let ac = best.ac + bonus.ac;
  if (shield) {
    ac += shield.shield + bonus.acArmor.filter((a) => a === shield.id).length;
    parts.push(shield.name);
  }
  return { ac, desc: parts.join(' + ') };
}

export function computeAttacks(rules, c, mods, bonus) {
  const anc = getAncestry(rules, c);
  const ancBonus = anc?.bonus || {};
  const elfRanged = anc?.id === 'elfo' && c.ancestryChoice?.elfBonus === 'ranged' ? 1 : 0;
  const mastery = [...bonus.mastery];
  if (c.classChoices?.mastery && getClass(rules, c)?.id === 'guerreiro') mastery.push(c.classChoices.mastery);
  const level = c.level || 0;
  const seen = new Set();
  const out = [];
  for (const inv of c.inventory) {
    const w = rules.weapons.find((x) => x.id === inv.id);
    if (!w || seen.has(w.id)) continue;
    seen.add(w.id);
    const m = mastery.filter((x) => x === w.id).length;
    const mBonus = m ? m + Math.floor(level / 2) * m : 0;
    const finesse = w.props.includes('Ac');
    const allowed = weaponAllowed(rules, c, w, bonus.prof);
    if (w.type.includes('C')) {
      const stat = finesse ? Math.max(mods.FOR, mods.DES) : mods.FOR;
      const atk = stat + bonus.atkMelee + (ancBonus.atkMelee || 0) + mBonus;
      const dmg = bonus.dmgMelee + (ancBonus.dmgMelee || 0) + mBonus;
      out.push({ name: w.name, mode: 'Corpo a corpo', atk, damage: w.damage, dmg, range: w.range.split('/')[0], allowed, props: w.props });
    }
    if (w.type.includes('D')) {
      const thrown = w.props.includes('Ar');
      const stat = thrown || finesse ? Math.max(mods.FOR, mods.DES) : mods.DES;
      const atk = stat + bonus.atkRanged + elfRanged + mBonus;
      const dmg = bonus.dmgRanged + mBonus;
      const range = w.range.includes('/') ? w.range.split('/')[1] : w.range;
      out.push({ name: w.name, mode: thrown ? 'Arremesso' : 'À distância', atk, damage: w.damage, dmg, range, allowed, props: w.props });
    }
  }
  return out;
}

const RANGE_NAMES = { A: 'Adjacente', P: 'Perto', L: 'Longe', '2×A': 'Adjacente ×2' };
export const rangeName = (r) => RANGE_NAMES[r] || r;

export function computeSheet(rules, c) {
  const bonus = talentBonuses(rules, c);
  const cls = getClass(rules, c);
  const anc = getAncestry(rules, c);
  const base = c.stats || Object.fromEntries(STATS.map((s) => [s, 10]));
  const stats = Object.fromEntries(STATS.map((s) => [s, base[s] + bonus.stat[s]]));
  const mods = Object.fromEntries(STATS.map((s) => [s, modifier(stats[s])]));
  const hp = c.stats ? computeHP(rules, c, mods) : null;
  const ac = computeAC(rules, c, mods, bonus);
  const capacity = carryCapacity(rules, c, stats, mods);
  const used = slotsUsed(rules, c);
  const coins = coinsOf(c);
  const attacks = computeAttacks(rules, c, mods, bonus);
  let casting = null;
  if (cls?.spellcasting) {
    const elfCast = anc?.id === 'elfo' && c.ancestryChoice?.elfBonus === 'cast' ? 1 : 0;
    casting = { stat: cls.spellcasting.stat, bonus: mods[cls.spellcasting.stat] + bonus.cast + elfCast };
  }
  const title = titleFor(cls, c);
  const spells = [];
  if (cls?.spellcasting) {
    const list = rules.spells[cls.spellcasting.list] || [];
    for (const id of [...(cls.spellcasting.bonusSpells || []), ...c.spells]) {
      const sp = list.find((x) => x.id === id);
      if (sp) spells.push(sp);
    }
    spells.sort((a, b) => a.tier - b.tier);
  }
  const features = [];
  if (anc) features.push({ ...anc.feature, source: anc.name });
  if (cls) for (const f of cls.features) features.push({ ...f, source: cls.name });
  return {
    stats, mods, hp, ac, capacity, used, coins, attacks, casting, title, spells, features,
    talents: bonus.texts, bonus, languages: knownLanguages(rules, c), cls, anc,
  };
}

// ---------- Equipamento ----------

export function addItem(c, id, qty = 1) {
  const inv = c.inventory.find((i) => i.id === id);
  if (inv) inv.qty += qty; else c.inventory.push({ id, qty });
}

export function removeItem(c, id, qty = 1) {
  const inv = c.inventory.find((i) => i.id === id);
  if (!inv) return;
  inv.qty -= qty;
  if (inv.qty <= 0) c.inventory = c.inventory.filter((i) => i !== inv);
}

export const buyQty = (item) => (item.cat === 'gear' ? item.buy : 1);

export function applyKit(rules, c) {
  for (const [id, qty] of rules.kit.items) addItem(c, id, qty);
}

// Arma preferida da classe para o pacote rápido.
export function quickWeapon(rules, c, mods) {
  const allowed = rules.weapons.filter((w) => weaponAllowed(rules, c, w) && w.damage !== '–');
  const dexy = mods.DES > mods.FOR;
  const score = (w) => {
    const max = Math.max(...w.damage.split('/').map((d) => Number(d.split('d')[1]) || 1));
    const usesDex = w.type === 'D' || w.props.includes('Ac');
    return max + (usesDex === dexy ? 3 : 0) - (w.slots === 2 ? 1 : 0) - (w.ammo ? 1 : 0);
  };
  return allowed.sort((a, b) => score(b) - score(a))[0] || null;
}

export function applyQuickPack(rules, c) {
  const mods = computeSheet(rules, c).mods;
  c.inventory = [];
  applyKit(rules, c);
  const mastered = c.classChoices?.mastery && rules.weapons.find((x) => x.id === c.classChoices.mastery);
  const w = mastered || quickWeapon(rules, c, mods);
  if (w) {
    addItem(c, w.id, 1);
    if (w.ammo) addItem(c, w.ammo, 20);
  }
  const leather = rules.armor.find((a) => a.id === 'couro');
  if (armorAllowed(rules, c, leather)) addItem(c, 'couro', 1);
  c.gold = 500;
  c.coins = null;
  c.equipMode = 'quick';
}

export function rollLevel0Gear(rules, c) {
  c.inventory = [];
  const n = die(4);
  const rolls = [];
  for (let i = 0; i < n; i++) {
    const r = die(12);
    rolls.push(r);
    for (const [id, qty] of rules.level0Gear[r - 1]) addItem(c, id, qty);
  }
  c.gold = 0;
  c.coins = null;
  c.equipMode = 'level0';
  c.level0Rolls = rolls;
}
