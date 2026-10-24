// Testes de subir de nível, magias por grau, moedas e mochila: node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRules } from '../js/data/index.js';
import {
  computeSheet, talentSlots, slotComplete, spellStatus, spellsError, levelUpError, nextLevel, hpSteps,
  coinSlots, coinsOf, slotsUsed, titleFor, getClass, MAX_LEVEL, stowItem, addItem, newCharacter,
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

test('rolar antecedente usa a tabela escolhida', async () => {
  const { randomBackground } = await import('../js/random.js');
  const c = randomCharacter(rules, { level: 1, classPool: ['guerreiro'] });
  for (const t of rules.backgroundTables) {
    for (let i = 0; i < 20; i++) {
      randomBackground(rules, c, t.id);
      assert.equal(c.background.table, t.id);
      assert.ok(c.background.index >= 0 && c.background.index < 20);
    }
  }
});

test('PV do nível 1: dado + Constituição, mínimo 1; PV atual fica entre 0 e o máximo', async () => {
  const { currentHp } = await import('../js/rules.js');
  const c = randomCharacter(rules, { level: 1, classPool: ['ladrao'] });
  c.ancestry = 'humano';
  c.talents = {};
  c.stats.CON = 4; // modificador -3
  c.hp = { rolls: [1] };
  assert.equal(computeSheet(rules, c).hp, 1);
  c.hp = { rolls: { 0: 4 } }; // valor digitado fica guardado como objeto
  assert.equal(computeSheet(rules, c).hp, 1);
  c.stats.CON = 16; // +3
  assert.equal(computeSheet(rules, c).hp, 7);
  assert.equal(currentHp({ hpCurrent: null }, 7), 7);
  assert.equal(currentHp({ hpCurrent: 3 }, 7), 3);
  assert.equal(currentHp({ hpCurrent: 12 }, 7), 7);
  assert.equal(currentHp({ hpCurrent: -2 }, 7), 0);
});

test('guardar deixa uma unidade na cidade: sem espaço, ataque ou CA', () => {
  const c = newCharacter(['base']);
  c.classId = 'guerreiro'; c.level = 1;
  addItem(c, 'tocha', 3);
  const before = slotsUsed(rules, c);
  assert.ok(stowItem(c, 0));
  assert.deepEqual(c.inventory.map((i) => [i.id, i.qty, !!i.stored]), [['tocha', 2, false], ['tocha', 1, true]]);
  assert.equal(slotsUsed(rules, c), before - 1);
  assert.ok(stowItem(c, 0));
  assert.equal(c.inventory[1].qty, 2);
  assert.equal(stowItem(c, 1), false, 'item guardado não é guardado de novo');
  addItem(c, 'tocha', 1);
  assert.equal(c.inventory[0].qty, 2, 'novas unidades vão para a linha em uso');
  assert.ok(stowItem(c, 1, true));
  assert.equal(c.inventory[0].qty, 3);
  // Arma e armadura guardadas não contam.
  const weapon = rules.weapons[0].id;
  const armor = rules.armor.find((a) => !a.shield).id;
  addItem(c, weapon, 1); addItem(c, armor, 1);
  const armed = computeSheet(rules, c);
  stowItem(c, c.inventory.findIndex((x) => x.id === weapon));
  stowItem(c, c.inventory.findIndex((x) => x.id === armor && !x.stored));
  const s = computeSheet(rules, c);
  const wname = rules.weapons[0].name;
  assert.ok(armed.attacks.some((a) => a.name === wname));
  assert.ok(!s.attacks.some((a) => a.name === wname));
  assert.ok(s.ac.ac <= armed.ac.ac);
  assert.equal(s.ac.desc, 'Sem armadura');
});
