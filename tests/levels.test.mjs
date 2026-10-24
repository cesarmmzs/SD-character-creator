// Testes de subir de nível, magias por grau, moedas e mochila: node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRules } from '../js/data/index.js';
import {
  computeSheet, talentSlots, slotComplete, spellStatus, spellsError, levelUpError, nextLevel, hpSteps,
  coinSlots, coinsOf, slotsUsed, titleFor, getClass, MAX_LEVEL,
} from '../js/rules.js';
import { randomCharacter, randomLevelChoices } from '../js/random.js';

const rules = loadRules();

test('listas de magias não têm ids repetidos e cobrem as tabelas por nível', () => {
  for (const [list, spells] of Object.entries(rules.spells)) {
    const ids = spells.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length, `${list}: id repetido`);
  }
  for (const cls of rules.classes.filter((k) => k.spellcasting?.byLevel)) {
    const list = rules.spells[cls.spellcasting.list];
    assert.equal(cls.spellcasting.byLevel.length, 10, cls.id);
    cls.spellcasting.byLevel.forEach((tiers, lv) => tiers.forEach((n, i) => {
      const available = list.filter((s) => s.tier === i + 1 && !s.free).length;
      assert.ok(available >= n, `${cls.id} nível ${lv + 1}: grau ${i + 1} pede ${n}, há ${available}`);
    }));
  }
});

test('personagens de nível 2 a 10 saem completos', () => {
  for (let i = 0; i < 600; i++) {
    const level = 2 + (i % 9);
    const c = randomCharacter(rules, { level });
    assert.equal(c.level, level);
    const s = computeSheet(rules, c);
    assert.ok(Number.isInteger(s.hp) && s.hp >= level, `${c.classId} nível ${level}: PV ${s.hp}`);
    for (const slot of talentSlots(rules, c)) assert.ok(slotComplete(rules, c, c.talents[slot.key], slot.table), `${c.classId} ${slot.key}`);
    assert.equal(talentSlots(rules, c).filter((x) => x.key.startsWith('lvl')).length, Math.floor((level - 1) / 2));
    assert.equal(spellsError(rules, c), null, `${c.classId} nível ${level}: ${spellsError(rules, c)}`);
    assert.equal(s.title, getClass(rules, c).titles[c.alignment][Math.floor((level - 1) / 2)]);
    assert.equal(c.xp, 0);
  }
});

test('subir de nível soma só o dado de vida, sem Constituição', () => {
  const c = randomCharacter(rules, { level: 1, classPool: ['guerreiro'] });
  c.stats.CON = 16;
  const before = computeSheet(rules, c).hp;
  const n = nextLevel(c);
  assert.equal(n.level, 2);
  assert.equal(computeSheet(rules, n).hp, null, 'sem rolar ainda');
  assert.match(levelUpError(rules, n), /dado de vida/);
  n.levels[2].hpRolls = [7];
  assert.equal(computeSheet(rules, n).hp, before + 7);
  assert.equal(levelUpError(rules, n), null);
  assert.equal(c.level, 1, 'original não muda');
});

test('nível 3 pede talento e magias de grau 2 para o mago', () => {
  let c = randomCharacter(rules, { level: 2, classPool: ['mago'] });
  c = nextLevel(c);
  randomLevelChoices(rules, c);
  const st = spellStatus(rules, c);
  assert.deepEqual(st.tiers, [4, 1]);
  assert.ok(st.counts[1] >= 1);
  assert.ok(talentSlots(rules, c).some((s) => s.key === 'lvl3'));
  assert.equal(levelUpError(rules, c), null);
});

test('Cavaleiro de São Ydris aprende a primeira magia no nível 3', () => {
  const c = randomCharacter(rules, { level: 2, classPool: ['ydris'] });
  assert.equal(spellStatus(rules, c).total, 0);
  const n = nextLevel(c);
  assert.equal(spellStatus(rules, n).total, 1);
  assert.match(spellsError(rules, n), /grau 1/);
});

test('talento de PV máximo vale para as próximas rolagens de vida', () => {
  let c = randomCharacter(rules, { level: 1, classPool: ['profanador'] });
  c.patron = 'mugdulblub';
  c.talents = { patron0: { roll: 5, choice: null } }; // só a Dádiva de valor máximo em 2 rolagens de PV
  c.hp = { rolls: [1] };
  const d = getClass(rules, c).hitDie;
  const mods = computeSheet(rules, c).mods;
  const dwarf = c.ancestry === 'anao' ? 2 : 0;
  assert.equal(computeSheet(rules, c).hp, Math.max(1, d + mods.CON) + dwarf);
  c = nextLevel(c);
  assert.equal(hpSteps(rules, c)[1].maxed, 1, 'segunda rolagem também no máximo');
  assert.equal(levelUpError(rules, c), null);
  assert.equal(computeSheet(rules, c).hp, Math.max(1, d + mods.CON) + dwarf + d);
  c = nextLevel(c);
  assert.equal(hpSteps(rules, c)[2].maxed, 0, 'só duas rolagens');
});

test('moedas: as 100 primeiras não ocupam espaço, depois 1 a cada 100', () => {
  assert.equal(coinSlots({ po: 100, pp: 0, pc: 0 }), 0);
  assert.equal(coinSlots({ po: 60, pp: 30, pc: 11 }), 1);
  assert.equal(coinSlots({ po: 250, pp: 0, pc: 0 }), 2);
  assert.deepEqual(coinsOf({ gold: 1234 }), { po: 12, pp: 3, pc: 4 });
});

test('itens próprios contam espaços', () => {
  const c = randomCharacter(rules, { level: 1 });
  const base = slotsUsed(rules, c);
  c.inventory.push({ id: 'item-x', custom: true, name: 'Ídolo', qty: 2, slots: 1 });
  c.inventory.push({ id: 'item-y', custom: true, name: 'Anel', qty: 3, slots: 0 });
  assert.equal(slotsUsed(rules, c), base + 2);
  c.coins = { po: 150, pp: 0, pc: 0 };
  assert.equal(slotsUsed(rules, c), base + 3);
});

test('títulos mudam a cada dois níveis', () => {
  const cls = rules.classes.find((k) => k.id === 'ladrao');
  const t = (level) => titleFor(cls, { level, alignment: 'lawful' });
  assert.equal(t(1), t(2));
  assert.notEqual(t(2), t(3));
  assert.equal(t(MAX_LEVEL), cls.titles.lawful[4]);
});
