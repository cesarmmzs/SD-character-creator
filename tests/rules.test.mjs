// Testes do motor de regras: node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRules } from '../js/data/index.js';
import { modifier, computeSheet, talentSlots, slotComplete, spellsAllowed, newCharacter, entryFor } from '../js/rules.js';
import { randomCharacter } from '../js/random.js';

const rules = loadRules();

test('modificadores seguem a tabela do livro', () => {
  const expected = { 3: -4, 4: -3, 5: -3, 6: -2, 7: -2, 8: -1, 9: -1, 10: 0, 11: 0, 12: 1, 13: 1, 14: 2, 15: 2, 16: 3, 17: 3, 18: 4, 20: 4 };
  for (const [score, mod] of Object.entries(expected)) assert.equal(modifier(Number(score)), mod, `valor ${score}`);
});

test('todas as tabelas de talento cobrem todos os resultados', () => {
  for (const [id, table] of Object.entries(rules.tables)) {
    const [n, s] = table.dice.split('d').map(Number);
    for (let v = n; v <= n * s; v++) assert.ok(entryFor(table, v), `${id} sem entrada para ${v}`);
  }
});

test('toda classe tem tabela de talentos e títulos completos', () => {
  for (const cls of rules.classes) {
    assert.ok(rules.tables[`class:${cls.id}`], cls.id);
    for (const al of ['lawful', 'neutral', 'chaotic']) assert.equal(cls.titles[al].length, 5, `${cls.id} ${al}`);
    if (Array.isArray(cls.weapons)) for (const w of cls.weapons) assert.ok(rules.weapons.find((x) => x.id === w), `${cls.id}: arma ${w}`);
  }
});

test('personagens aleatórios saem completos e coerentes', () => {
  for (let i = 0; i < 3000; i++) {
    const level = i % 3 === 0 ? 0 : 1;
    const c = randomCharacter(rules, { level });
    const sheet = computeSheet(rules, c);
    assert.ok(Number.isInteger(sheet.hp) && sheet.hp >= 1, `PV inválido: ${sheet.hp}`);
    assert.ok(Number.isInteger(sheet.ac.ac));
    assert.ok(sheet.ac.ac >= 6 && sheet.ac.ac <= 22, `CA ${sheet.ac.ac}`);
    assert.ok(c.name);
    assert.ok(c.inventory.length > 0);
    for (const s of talentSlots(rules, c)) assert.ok(slotComplete(rules, c, c.talents[s.key], s.table), `${c.classId} ${s.key} incompleto: ${JSON.stringify(c.talents[s.key])}`);
    if (level === 1) {
      assert.ok(sheet.title, 'sem título');
      assert.equal(c.spells.length, Math.min(spellsAllowed(rules, c), c.spells.length));
      if (sheet.cls.requiresDeity) assert.equal(rules.deities.find((d) => d.id === c.deity).alignment, c.alignment);
      assert.ok(sheet.attacks.length > 0, `${c.classId} sem ataque`);
      for (const a of sheet.attacks) assert.ok(Number.isFinite(a.atk) && Number.isFinite(a.dmg));
    }
  }
});

test('anão de nível 0 com CON 10 tem 3 PV; guerreiro carrega mais com CON alta', () => {
  const c = newCharacter(rules.books);
  Object.assign(c, { level: 0, ancestry: 'anao', stats: { FOR: 10, DES: 10, CON: 10, INT: 10, SAB: 10, CAR: 10 } });
  assert.equal(computeSheet(rules, c).hp, 3);
  Object.assign(c, { level: 1, classId: 'guerreiro', ancestry: 'humano', stats: { ...c.stats, FOR: 8, CON: 16 }, hp: { rolls: [5] } });
  const sheet = computeSheet(rules, c);
  assert.equal(sheet.capacity, 13);
  assert.equal(sheet.hp, 8);
});

test('livros desligados somem das opções', () => {
  const onlyBase = loadRules(['base']);
  assert.equal(onlyBase.classes.length, 4);
  assert.equal(loadRules().classes.length, 12);
});
