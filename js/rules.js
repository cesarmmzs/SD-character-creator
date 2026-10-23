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

// ---------- Personagem ----------

export function newCharacter(books) {
  return {
    id: `pc-${Date.now().toString(36)}-${die(1e6).toString(36)}`,
    version: 1,
    books: [...books],
    level: null,
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
export const getClass = (rules, c) => (c.level === 1 ? rules.classes.find((k) => k.id === c.classId) || null : null);

export function rollStats() {
  const stats = {};
  for (const s of STATS) stats[s] = roll(3, 6);
  return stats;
}

export const canRerollStats = (stats) => !!stats && Object.values(stats).every((v) => v < 14);

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
  const slots = [{ key: 'class0', table: `class:${cls.id}`, label: `Talento de ${cls.name}` }];
  if (anc?.extraTalentAtLevel1) slots.push({ key: 'class1', table: `class:${cls.id}`, label: `Talento extra (${anc.feature.name})` });
  if (cls.lotusAtLevel1) slots.push({ key: 'lotus0', table: 'lotus', label: 'Talento da Lótus Negra' });
  if (cls.patronBoonAtLevel1 && c.patron) slots.push({ key: 'patron0', table: `patron:${c.patron}`, label: 'Dádiva Patronal' });
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

export function talentBonuses(rules, c) {
  const acc = emptyBonuses();
  for (const s of talentSlots(rules, c)) applySlot(rules, c, c.talents[s.key], s.table, acc);
  return acc;
}

export function spellsAllowed(rules, c, bonus = talentBonuses(rules, c)) {
  const cls = getClass(rules, c);
  if (!cls?.spellcasting) return 0;
  return cls.spellcasting.known + (cls.spellcasting.known > 0 || bonus.extraSpells ? bonus.extraSpells : 0);
}

export function spellOptions(rules, c) {
  const cls = getClass(rules, c);
  if (!cls?.spellcasting) return [];
  return (rules.spells[cls.spellcasting.list] || []).filter((sp) => sp.tier === 1 && !sp.free);
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

export function slotsUsed(rules, c) {
  let used = 0;
  for (const inv of c.inventory) {
    const item = findItem(rules, inv.id);
    if (!item) continue;
    if (item.cat === 'gear') {
      const qty = Math.max(0, inv.qty - (item.freeFirst || 0));
      used += Math.ceil(qty / item.perSlot);
    } else {
      used += (item.slots ?? 1) * inv.qty;
    }
  }
  return used;
}

export function hpRollsNeeded(rules, c, bonus = talentBonuses(rules, c)) {
  if (c.level !== 1) return 0;
  return 1 + bonus.extraHpDice;
}

export function computeHP(rules, c, mods, bonus) {
  const anc = getAncestry(rules, c);
  const dwarf = anc?.id === 'anao' ? 2 : 0;
  if (c.level === 0) return Math.max(1, mods.CON) + dwarf;
  const cls = getClass(rules, c);
  if (!cls || !c.hp?.rolls) return null;
  const n = hpRollsNeeded(rules, c, bonus);
  let total = 0;
  for (let i = 0; i < n; i++) {
    const r = c.hp.rolls[i];
    if (r == null) return null;
    total += i < bonus.maxHp ? cls.hitDie : r;
  }
  return Math.max(1, total + mods.CON) + dwarf;
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
  const hp = c.stats ? computeHP(rules, c, mods, bonus) : null;
  const ac = computeAC(rules, c, mods, bonus);
  const capacity = carryCapacity(rules, c, stats, mods);
  const used = slotsUsed(rules, c);
  const attacks = computeAttacks(rules, c, mods, bonus);
  let casting = null;
  if (cls?.spellcasting) {
    const elfCast = anc?.id === 'elfo' && c.ancestryChoice?.elfBonus === 'cast' ? 1 : 0;
    casting = { stat: cls.spellcasting.stat, bonus: mods[cls.spellcasting.stat] + bonus.cast + elfCast };
  }
  const title = cls && c.alignment ? cls.titles[c.alignment][0] : null;
  const spells = [];
  if (cls?.spellcasting) {
    const list = rules.spells[cls.spellcasting.list] || [];
    for (const id of [...(cls.spellcasting.bonusSpells || []), ...c.spells]) {
      const sp = list.find((x) => x.id === id);
      if (sp) spells.push(sp);
    }
  }
  const features = [];
  if (anc) features.push({ ...anc.feature, source: anc.name });
  if (cls) for (const f of cls.features) features.push({ ...f, source: cls.name });
  return {
    stats, mods, hp, ac, capacity, used, attacks, casting, title, spells, features,
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
  c.equipMode = 'level0';
  c.level0Rolls = rolls;
}
