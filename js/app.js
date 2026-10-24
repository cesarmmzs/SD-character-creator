// Aplicativo: navegação, tela inicial, modo mestre e tratamento de eventos.
import { loadRules, DEFAULT_BOOKS, BOOKS } from './data/index.js';
import {
  newCharacter, rollStats, rollDice, roll, getClass, findItem, itemOf, addItem, removeItem, buyQty, applyQuickPack, applyKit,
  splitMoney, coinsOf, COINS, xpNeeded, nextLevel, levelUpError, talentSlots, hpSteps, spellStatus, computeSheet, titleFor,
  MAX_LEVEL, fmtMod, currentHp, stowItem,
} from './rules.js';
import * as R from './random.js';
import { STEPS, visibleSteps, renderTalentSlot, renderSpellPicker, bookToggle, bookLocked } from './wizard.js';
import { renderSheet, summaryLine } from './sheet.js';
import * as store from './storage.js';
import { esc, help, openHelp, closeSheet, askConfirm, takeConfirm, toast, getAt, setAt, diceInput } from './ui.js';

const app = document.getElementById('app');
const rulesCache = new Map();
function rulesFor(books) {
  const key = [...books].sort().join(',');
  if (!rulesCache.has(key)) rulesCache.set(key, loadRules(books));
  return rulesCache.get(key);
}

const prefs = store.loadPrefs();
const state = {
  char: null,
  levelUp: null, // { id, spells } quando a tela "Subir de nível" está aberta
  addOpen: null, // ficha com o painel "Adicionar item" aberto

  stepId: 'inicio',
  error: null,
  gm: { count: 4, level: 0, classPool: [], group: '', books: prefs.books || DEFAULT_BOOKS, results: [] },
};

// ---------- Rotas ----------

function route() {
  const [, view, id] = (location.hash || '#/').split('/');
  return { view: view || 'inicio', id };
}

function go(hash) {
  if (location.hash === hash) render(); else location.hash = hash;
}

window.addEventListener('hashchange', () => { state.addOpen = null; render(); window.scrollTo(0, 0); });

// ---------- Telas ----------

function viewHome() {
  const chars = store.listCharacters();
  const draft = store.loadDraft();
  const groups = new Map();
  for (const c of chars) {
    const g = c.group || '';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(c);
  }
  const list = chars.length
    ? [...groups.entries()].map(([g, items]) => `${g ? `<h3 class="group">${esc(g)}</h3>` : ''}<ul class="char-list">${items.map((c) => {
      const rules = rulesFor(c.books || DEFAULT_BOOKS);
      return `<li><a href="#/ficha/${esc(c.id)}"><strong>${esc(c.name || 'Sem nome')}</strong><span class="muted small">${esc(summaryLine(rules, c))}</span></a></li>`;
    }).join('')}</ul>`).join('')
    : '<p class="muted">Nenhum personagem salvo ainda.</p>';
  return `<section class="hero">
      <h1>Crie seu personagem de Shadowdark</h1>
      <p>Um passo a passo que explica cada escolha e faz as contas por você. Funciona no celular e guarda seus personagens neste aparelho.</p>
      <div class="actions">
        <button type="button" class="btn primary" data-act="newChar">Novo personagem</button>
        ${draft ? `<button type="button" class="btn" data-act="continueDraft">Continuar ${esc(draft.name || 'rascunho')}</button>` : ''}
        <a class="btn ghost" href="#/mestre">Modo mestre ${help('mestre')}</a>
      </div>
    </section>
    <section>
      <h2>Meus personagens</h2>
      ${list}
      <div class="actions">
        ${chars.length ? '<button type="button" class="btn ghost" data-act="exportAll">Exportar todos (.json)</button>' : ''}
        <label class="btn ghost file">Importar .json<input type="file" accept="application/json,.json" data-act="importFile" hidden></label>
      </div>
      <p class="muted small">Os personagens ficam salvos só neste navegador. Exporte um arquivo para ter backup ou passar para outro aparelho.</p>
    </section>`;
}

function viewWizard() {
  const c = state.char;
  if (!c) return viewHome();
  const rules = rulesFor(c.books);
  const steps = visibleSteps(c, rules);
  let idx = steps.findIndex((s) => s.id === state.stepId);
  if (idx < 0) { idx = 0; state.stepId = steps[0].id; }
  const step = steps[idx];
  const last = idx === steps.length - 1;
  const progress = steps.map((s, i) => `<button type="button" class="dot${i === idx ? ' on' : ''}${i < idx ? ' done' : ''}" data-act="goStep" data-value="${s.id}" ${i > idx ? 'disabled' : ''} title="${esc(s.title)}" aria-label="Etapa ${i + 1}: ${esc(s.title)}"></button>`).join('');
  return `<div class="wizard">
    <div class="progress"><span class="muted small">Etapa ${idx + 1} de ${steps.length}: ${esc(step.title)}</span><div class="dots">${progress}</div></div>
    <section class="step">${step.render(c, rules)}</section>
    ${state.error ? `<p class="error" role="alert">${esc(state.error)}</p>` : ''}
    <nav class="step-nav">
      <button type="button" class="btn" data-act="back">${idx === 0 ? 'Sair' : 'Voltar'}</button>
      <button type="button" class="btn primary" data-act="${last ? 'save' : 'next'}">${last ? 'Salvar personagem' : 'Próximo'}</button>
    </nav>
  </div>`;
}

function viewSheet(id) {
  const c = store.getCharacter(id);
  if (!c) return '<p>Personagem não encontrado.</p><a class="btn" href="#/">Voltar</a>';
  const rules = rulesFor(c.books || DEFAULT_BOOKS);
  return `<div class="sheet-actions no-print">
      <a class="btn ghost" href="#/">← Início</a>
      <button type="button" class="btn" data-act="edit" data-value="${esc(id)}">Editar</button>
      <button type="button" class="btn" data-act="print">Imprimir</button>
      <button type="button" class="btn" data-act="exportOne" data-value="${esc(id)}">Exportar</button>
      <button type="button" class="btn" data-act="duplicate" data-value="${esc(id)}">Duplicar</button>
      <button type="button" class="btn danger" data-act="delete" data-value="${esc(id)}">Excluir</button>
    </div>${renderSheet(rules, c, { interactive: true, addOpen: state.addOpen === id })}`;
}

function viewLevelUp(id) {
  const c = state.char;
  if (!c || state.levelUp?.id !== id) { go(`#/ficha/${id}`); return ''; }
  const rules = rulesFor(c.books);
  const cls = getClass(rules, c);
  const n = c.level;
  const before = store.getCharacter(id);
  const sheetBefore = computeSheet(rules, before);
  const sheet = computeSheet(rules, c);
  const dwarf = sheet.anc?.id === 'anao';
  const step = hpSteps(rules, c)[n - 1];
  const hpRows = Array.from({ length: step.count }, (_, i) => (i < step.maxed
    ? `<p>Um talento faz este dado valer o máximo: <strong>${cls.hitDie}</strong>.</p>`
    : diceInput('rollHp', `levels.${n}.hpRolls.${i}`, { label: 'Dado de vida', dice: `1d${cls.hitDie}${dwarf ? ' com Vantagem' : ''}`, value: step.rolls[i] }))).join('');
  const slot = talentSlots(rules, c).find((s) => s.key === `lvl${n}`);
  const st = spellStatus(rules, c);
  const stBefore = spellStatus(rules, before);
  const newSpells = st.total > stBefore.total;
  const newTitle = titleFor(cls, c);
  const oldTitle = titleFor(cls, before);
  const err = state.error;
  return `<div class="wizard level-up">
    <section class="step">
      <h2>Subir para o nível ${n} ${help('subirNivel')}</h2>
      <p class="intro">${esc(c.name)} · ${esc(cls.name)}. Só aparece aqui o que muda neste nível.</p>
      ${newTitle !== oldTitle ? `<p class="callout">Novo título: <strong>${esc(newTitle)}</strong> ${help('titulo')} <span class="muted small">(antes: ${esc(oldTitle)})</span></p>` : ''}
      <div class="slot"><h3>Pontos de vida ${help('pv')}</h3>
        <p>Role o dado de vida de ${esc(cls.name)} e some ao seu máximo.${dwarf ? ' Anões rolam com Vantagem.' : ''} A Constituição não entra de novo.</p>
        ${hpRows}
        <p>PV máximo: <strong>${sheetBefore.hp ?? '–'}</strong> → <strong>${sheet.hp ?? '?'}</strong></p>
      </div>
      ${slot ? `<h3>Novo talento ${help('talentos')}</h3>${renderTalentSlot(rules, c, slot)}` : `<p class="muted">Sem rolagem de talento neste nível (só nos níveis 3, 5, 7 e 9).</p>`}
      ${newSpells ? `<h3>Novas magias ${help('magias')}</h3><p class="intro">Você passa a conhecer ${st.total} magias. Teste de conjuração: 1d20 ${fmtMod(sheet.casting.bonus)}.</p>${renderSpellPicker(rules, c, state.levelUp.spells)}` : ''}
    </section>
    ${err ? `<p class="error" role="alert">${esc(err)}</p>` : ''}
    <nav class="step-nav">
      <button type="button" class="btn" data-act="levelCancel">Cancelar</button>
      <button type="button" class="btn ghost" data-act="levelRandom">🎲 Rolar tudo</button>
      <button type="button" class="btn primary" data-act="levelConfirm">Confirmar nível ${n}</button>
    </nav>
  </div>`;
}

function viewGM() {
  const gm = state.gm;
  const rules = rulesFor(gm.books);
  const classes = rules.classes.map((k) => `<label class="check"><input type="checkbox" data-act="gmClass" value="${k.id}" ${gm.classPool.includes(k.id) ? 'checked' : ''}> ${esc(k.name)}</label>`).join('');
  const results = gm.results.map((c, i) => `<div class="gm-card">${renderSheet(rules, c, { compact: true })}
      <div class="actions no-print"><button type="button" class="btn small" data-act="gmReroll" data-value="${i}">🎲 Trocar</button>
      <button type="button" class="btn small ghost" data-act="gmDiscard" data-value="${i}">Descartar</button></div></div>`).join('');
  return `<section class="no-print">
      <h1>Modo mestre ${help('mestre')}</h1>
      <p class="intro">Gere vários personagens prontos de uma vez, seguindo as tabelas de personagem aleatório do livro. Depois salve todos com o nome do grupo.</p>
      <div class="panel">
        <div class="field-row">
          <label class="field">Quantos? <input type="number" min="1" max="30" inputmode="numeric" data-gm="count" value="${gm.count}"></label>
          <label class="field">Nível <select data-gm="level">${Array.from({ length: MAX_LEVEL + 1 }, (_, i) => `<option value="${i}" ${gm.level === i ? 'selected' : ''}>Nível ${i}</option>`).join('')}</select></label>
        </div>
        <label class="field">Nome do grupo (opcional) <input type="text" data-gm="group" value="${esc(gm.group)}" placeholder="Ex.: Mesa de sexta, Provação da Ana"></label>
        <fieldset><legend>Livros</legend><div class="books">${BOOKS.map((b) => bookToggle(b, gm.books.includes(b.id), 'gmBook')).join('')}</div></fieldset>
        ${gm.level >= 1 ? `<details><summary>Limitar classes (${gm.classPool.length ? gm.classPool.length : 'todas'})</summary><div class="checks">${classes}</div></details>` : ''}
        <button type="button" class="btn primary" data-act="gmGenerate">🎲 Gerar personagens</button>
      </div>
    </section>
    ${gm.results.length ? `<div class="actions no-print"><button type="button" class="btn primary" data-act="gmSaveAll">Salvar todos (${gm.results.length})</button><button type="button" class="btn" data-act="print">Imprimir</button></div>
      <div class="gm-grid">${results}</div>` : ''}`;
}

function render() {
  const { view, id } = route();
  if (view === 'criar' && !state.char) {
    const draft = store.loadDraft();
    if (draft) state.char = draft;
  }
  if (view !== 'nivel' && state.levelUp) { state.levelUp = null; state.char = null; }
  const html = view === 'criar' ? viewWizard() : view === 'ficha' ? viewSheet(id) : view === 'nivel' ? viewLevelUp(id) : view === 'mestre' ? viewGM() : viewHome();
  app.innerHTML = html;
  document.querySelectorAll('.top-nav a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === `#/${view === 'inicio' ? '' : view}`));
}

// ---------- Mudanças no personagem ----------

function persist() {
  if (state.char && !state.levelUp) { state.char.stepId = state.stepId; store.saveDraft(state.char); }
}

function resetFromClass(c) {
  c.classChoices = {};
  c.talents = {};
  c.spells = [];
  c.languages = {};
  c.hp = null;
  c.patron = null;
  if (c.equipMode !== 'level0') { c.inventory = []; c.gold = null; c.goldRoll = null; c.equipMode = null; }
}

function onSet(path, raw) {
  const c = state.char;
  const rules = rulesFor(c.books);
  let value = raw;
  if (path === 'level') value = Number(raw);
  if (path === 'deity' && raw === '') value = '';
  const before = getAt(c, path);
  setAt(c, path, value);
  if (before === value) return;
  if (path === 'level') {
    if (value === 0) c.classId = null;
    resetFromClass(c);
    c.inventory = []; c.gold = null; c.goldRoll = null; c.equipMode = null; c.level0Rolls = null;
  }
  if (path === 'classId') resetFromClass(c);
  if (path === 'ancestry') {
    c.ancestryChoice = {};
    c.languages = {};
    c.hp = null;
    delete c.talents.class1;
  }
  if (path === 'alignment') {
    const cls = getClass(rules, c);
    const d = rules.deities.find((x) => x.id === c.deity);
    if (cls?.requiresDeity && d && d.alignment !== value) c.deity = null;
  }
  if (path === 'patron') delete c.talents.patron0;
}

function parseBind(el) {
  const path = el.dataset.bind;
  let value = el.value;
  if (el.dataset.type === 'num') value = value === '' ? null : Number(value);
  return { path, value };
}

function applyBind(el) {
  const c = state.char;
  const { path, value } = parseBind(el);
  const parent = path.split('.').slice(0, -1).join('.');
  const last = path.split('.').pop();
  if (path === 'goldDice') {
    if (value >= 2 && value <= 12) { c.goldRoll = value * 500; c.gold = c.goldRoll; c.coins = null; }
    return;
  }
  if (last === 'pick') {
    setAt(c, parent, value === '' ? null : value === 'points' ? { mode: 'points' } : { mode: 'entry', idx: Number(value), sub: null });
  } else if (last === 'opt') {
    setAt(c, parent, value === '' ? null : { opt: Number(value), sub: null });
  } else if (last === 'patron' && el.dataset.reset) {
    setAt(c, parent, { patron: value || null, slots: {} });
  } else if (last === 'keep') {
    setAt(c, path, value === '' ? null : Number(value));
  } else if (last === 'roll' && path.startsWith('talents')) {
    setAt(c, parent, { roll: value, choice: null });
  } else if (['ancestry', 'classId', 'alignment', 'deity', 'patron', 'level'].includes(path)) {
    onSet(path, value);
  } else {
    setAt(c, path, value === '' ? null : value);
  }
}

// ---------- Ações ----------

const actions = {
  help: (el) => openHelp(el),
  closeSheet: () => closeSheet(),
  confirmYes() {
    const fn = takeConfirm();
    closeSheet();
    fn?.();
  },

  newChar() {
    state.char = newCharacter(prefs.books || DEFAULT_BOOKS);
    state.stepId = 'inicio';
    state.error = null;
    persist();
    go('#/criar');
  },
  continueDraft() {
    state.char = store.loadDraft();
    state.stepId = state.char?.stepId || 'inicio';
    go('#/criar');
  },

  set(el) { onSet(el.dataset.path, el.dataset.value); },
  equipMode(el) {
    const c = state.char;
    const rules = rulesFor(c.books);
    if (el.dataset.value === 'quick') applyQuickPack(rules, c);
    else { c.inventory = []; c.gold = null; c.goldRoll = null; c.coins = null; c.equipMode = 'shop'; }
  },
  randomAll() {
    const c = state.char;
    const rules = rulesFor(c.books);
    const r = R.randomCharacter(rules, { level: c.level });
    Object.assign(c, { ...r, id: c.id, createdAt: c.createdAt, player: c.player });
    state.stepId = 'detalhes';
    toast('Personagem sorteado! Revise as etapas se quiser mudar algo.');
  },
  randomStep() {
    const c = state.char;
    const rules = rulesFor(c.books);
    const step = STEPS.find((s) => s.id === state.stepId);
    step.random?.(rules, c);
  },
  rollStats() { state.char.stats = rollStats(); },
  rollSlot(el) {
    const rules = rulesFor(state.char.books);
    const table = rules.tables[el.dataset.table];
    const parent = el.dataset.path.replace(/\.roll$/, '');
    setAt(state.char, parent, { roll: rollDice(table.dice), choice: null });
  },
  clearSlot(el) { setAt(state.char, el.dataset.path, {}); },
  rollHp(el) {
    const rules = rulesFor(state.char.books);
    setAt(state.char, el.dataset.path, R.rollHpDie(rules, state.char));
  },
  rollGold() { const r = roll(2, 6); state.char.goldRoll = r * 500; state.char.gold = state.char.goldRoll; state.char.coins = null; toast(`2d6 = ${r}: ${r * 5} PO`); },
  resetShop() { const c = state.char; c.inventory = []; c.gold = c.goldRoll; c.coins = null; },
  buy(el) {
    const c = state.char;
    const item = findItem(rulesFor(c.books), el.dataset.value);
    if (!item || c.gold < item.cost) return;
    c.gold -= item.cost;
    c.coins = null;
    addItem(c, item.id, buyQty(item));
  },
  sell(el) {
    const c = state.char;
    const item = findItem(rulesFor(c.books), el.dataset.value);
    const inv = c.inventory.find((i) => i.id === item.id);
    if (!inv) return;
    const n = Math.min(buyQty(item), inv.qty);
    removeItem(c, item.id, n);
    c.gold += Math.round(item.cost * (n / buyQty(item)));
    c.coins = null;
  },
  buyKit() {
    const c = state.char;
    const rules = rulesFor(c.books);
    if (c.gold < rules.kit.cost) return;
    c.gold -= rules.kit.cost;
    c.coins = null;
    applyKit(rules, c);
  },
  dropItem(el) {
    const c = state.char;
    const inv = c.inventory.find((i) => i.id === el.dataset.value);
    if (inv) removeItem(c, inv.id, inv.qty);
  },
  bgTable(el) { state.char.background = { table: el.dataset.value }; },
  bgCustom() { state.char.background = { custom: true, name: '', desc: '' }; },
  bgPick(el) { state.char.background = { table: el.dataset.table, index: Number(el.dataset.value) }; },
  suggestName() { state.char.name = R.randomName(rulesFor(state.char.books), state.char); },

  goStep(el) { state.stepId = el.dataset.value; state.error = null; window.scrollTo(0, 0); },
  next() {
    const c = state.char;
    const rules = rulesFor(c.books);
    const steps = visibleSteps(c, rules);
    const idx = steps.findIndex((s) => s.id === state.stepId);
    const err = steps[idx].validate?.(c, rules);
    if (err) { state.error = err; return; }
    state.error = null;
    state.stepId = steps[Math.min(idx + 1, steps.length - 1)].id;
    window.scrollTo(0, 0);
  },
  back() {
    const c = state.char;
    const steps = visibleSteps(c, rulesFor(c.books));
    const idx = steps.findIndex((s) => s.id === state.stepId);
    state.error = null;
    if (idx <= 0) { go('#/'); return; }
    state.stepId = steps[idx - 1].id;
    window.scrollTo(0, 0);
  },
  save() {
    const c = state.char;
    const rules = rulesFor(c.books);
    for (const step of visibleSteps(c, rules)) {
      const err = step.validate?.(c, rules);
      if (err) { state.stepId = step.id; state.error = err; return; }
    }
    delete c.stepId;
    delete c.promoted;
    delete c.editing;
    // A bolsa nasce do dinheiro que sobrou das compras; depois disso é controlada na ficha.
    if (!c.coins) c.coins = splitMoney(c.gold || 0);
    if (!store.saveCharacter(c)) { toast('Não foi possível salvar neste navegador.'); return; }
    store.clearDraft();
    state.char = null;
    toast('Personagem salvo!');
    go(`#/ficha/${c.id}`);
  },

  edit(el) {
    state.char = structuredClone(store.getCharacter(el.dataset.value));
    state.char.editing = true;
    state.stepId = 'inicio';
    persist();
    go('#/criar');
  },
  duplicate(el) {
    const c = structuredClone(store.getCharacter(el.dataset.value));
    c.id = newCharacter([]).id;
    c.name = `${c.name} (cópia)`;
    store.saveCharacter(c);
    go(`#/ficha/${c.id}`);
  },
  delete(el) {
    const id = el.dataset.value;
    const c = store.getCharacter(id);
    askConfirm({ title: 'Excluir personagem', text: `Excluir ${c?.name || 'este personagem'}? Não dá para desfazer.`, ok: 'Excluir' }, () => {
      store.deleteCharacter(id);
      go('#/');
    });
  },
  print() { window.print(); },
  exportOne(el) {
    const c = store.getCharacter(el.dataset.value);
    store.downloadJSON(`${(c.name || 'personagem').replace(/[^\w-]+/g, '_')}.json`, c);
  },
  exportAll() { store.downloadJSON('personagens-shadowdark.json', { app: 'sd-character-creator', characters: store.listCharacters() }); },

  // ----- Ficha: XP, subir de nível, moedas e mochila -----
  hpDamage(el) { changeHp(el.dataset.value, -1); },
  hpHeal(el) { changeHp(el.dataset.value, 1); },
  hpRest(el) {
    updateChar(el.dataset.value, (c) => { c.hpCurrent = null; toast('Descansou: PV cheio.'); });
  },
  xpAdd(el) { changeXp(el.dataset.value, 1); },
  xpSub(el) { changeXp(el.dataset.value, -1); },
  levelUp(el) {
    const c = store.getCharacter(el.dataset.value);
    if (!c || c.level >= MAX_LEVEL) return;
    state.error = null;
    if (c.level === 0) {
      // Do nível 0 para o 1: volta ao assistente para escolher classe, talento, magias e PV.
      const next = nextLevel(c);
      next.promoted = true;
      next.hp = null;
      state.char = next;
      state.stepId = 'classe';
      persist();
      go('#/criar');
      return;
    }
    state.char = nextLevel(c);
    state.levelUp = { id: c.id, spells: [...c.spells] };
    go(`#/nivel/${c.id}`);
  },
  talentTable(el) {
    const c = state.char;
    const n = Number(el.dataset.level);
    c.levels[n] = { ...(c.levels[n] || {}), talentTable: el.dataset.value };
    c.talents[`lvl${n}`] = {};
  },
  levelRandom() {
    const c = state.char;
    const n = c.level;
    const rules = rulesFor(c.books);
    const keep = c.levels[n].talentTable;
    c.spells = [...state.levelUp.spells];
    R.randomLevelChoices(rules, c);
    if (keep) c.levels[n].talentTable = keep;
  },
  levelCancel() {
    const id = state.levelUp.id;
    state.levelUp = null;
    state.char = null;
    state.error = null;
    go(`#/ficha/${id}`);
  },
  levelConfirm() {
    const c = state.char;
    const err = levelUpError(rulesFor(c.books), c);
    if (err) { state.error = err; return; }
    state.error = null;
    state.levelUp = null;
    state.char = null;
    store.saveCharacter(c);
    toast(`${c.name} chegou ao nível ${c.level}!`);
    go(`#/ficha/${c.id}`);
  },
  coinAdd(el) { changeCoins(el.dataset.value, 1); },
  coinSub(el) { changeCoins(el.dataset.value, -1); },
  invPlus(el) { editInventory(el, (c, inv) => { inv.qty += 1; }); },
  invMinus(el) {
    const { inv, item } = invAt(el);
    if (!inv) return;
    const minus = () => editInventory(el, (c, row) => { row.qty -= 1; });
    if (inv.qty > 1) minus();
    else askConfirm({ title: 'Tirar item', text: `Esta é a última unidade de ${item.name}. Tirar da mochila?`, ok: 'Tirar' }, minus);
  },
  invUse(el) {
    const { inv, item } = invAt(el);
    if (!inv) return;
    askConfirm({ title: 'Usar item', text: `Usar 1 ${item.name}? ${inv.qty > 1 ? `Vão sobrar ${inv.qty - 1}.` : 'Era o último.'}`, ok: 'Usar' }, () => {
      editInventory(el, (c, row) => {
        row.qty -= 1;
        toast(row.qty > 0 ? `${item.name}: restam ${row.qty}.` : `${item.name}: acabou.`);
      });
    });
  },
  invRemove(el) {
    const { inv, item } = invAt(el);
    if (!inv) return;
    askConfirm({ title: 'Remover item', text: `Remover ${inv.qty > 1 ? `todas as ${inv.qty} unidades de ` : ''}${item.name}${inv.stored ? ' (guardado)' : ''} da mochila?`, ok: 'Remover' }, () => {
      editInventory(el, (c, row) => { row.qty = 0; });
    });
  },
  invStow(el) {
    editInventory(el, (c, inv, item) => {
      if (!stowItem(c, Number(el.dataset.value))) return false;
      toast(`1 ${item.name} guardado.`);
    });
  },
  invUnstow(el) {
    editInventory(el, (c, inv, item) => {
      if (!stowItem(c, Number(el.dataset.value), true)) return false;
      toast(`1 ${item.name} de volta à mão.`);
    });
  },
  invAdd(el) {
    state.addOpen = el.dataset.value;
    updateChar(el.dataset.value, (c, rules) => {
      const item = findItem(rules, document.getElementById('add-cat').value);
      const qty = readInt('add-cat-qty', 1);
      if (!item || qty < 1) return;
      addItem(c, item.id, qty);
      toast(`${item.name} adicionado.`);
    });
  },
  invAddCustom(el) {
    state.addOpen = el.dataset.value;
    updateChar(el.dataset.value, (c) => {
      const name = document.getElementById('add-name').value.trim();
      if (!name) { toast('Dê um nome ao item.'); return false; }
      const qty = Math.max(1, readInt('add-qty', 1));
      const slots = Math.max(0, readInt('add-slots', 1));
      const note = document.getElementById('add-note').value.trim();
      c.inventory.push({ id: `item-${Date.now().toString(36)}`, custom: true, name, qty, slots, note });
      toast(`${name} adicionado.`);
      return true;
    });
  },

  gmGenerate() {
    const gm = state.gm;
    const rules = rulesFor(gm.books);
    const n = Math.max(1, Math.min(30, gm.count || 1));
    gm.results = Array.from({ length: n }, () => R.randomCharacter(rules, { level: gm.level, classPool: gm.classPool, group: gm.group }));
  },
  gmReroll(el) {
    const gm = state.gm;
    gm.results[Number(el.dataset.value)] = R.randomCharacter(rulesFor(gm.books), { level: gm.level, classPool: gm.classPool, group: gm.group });
  },
  gmDiscard(el) { state.gm.results.splice(Number(el.dataset.value), 1); },
  gmSaveAll() {
    const gm = state.gm;
    gm.results.forEach((c) => { c.group = gm.group; });
    if (store.saveMany(gm.results)) toast(`${gm.results.length} personagens salvos.`);
    gm.results = [];
    go('#/');
  },
};

function readInt(id, fallback) {
  const v = Number(document.getElementById(id)?.value);
  return Number.isFinite(v) && v !== 0 ? Math.trunc(v) : fallback;
}

// Muda um personagem salvo direto da ficha. Se "fn" devolver false, nada é salvo.
function updateChar(id, fn) {
  const c = store.getCharacter(id);
  if (!c) return;
  if (fn(c, rulesFor(c.books || DEFAULT_BOOKS)) === false) return;
  c.inventory = c.inventory.filter((i) => i.qty > 0);
  if (!store.saveCharacter(c)) toast('Não foi possível salvar neste navegador.');
}

// Lê a linha do inventário sem mudar nada (para montar a confirmação).
function invAt(el) {
  const c = store.getCharacter(el.dataset.char);
  const inv = c?.inventory[Number(el.dataset.value)];
  return { inv, item: inv && itemOf(rulesFor(c.books || DEFAULT_BOOKS), inv) };
}

// Os dados do botão são copiados: depois da confirmação ele já pode ter saído da tela.
function editInventory(btn, fn) {
  const el = { dataset: { ...btn.dataset } };
  updateChar(el.dataset.char, (c, rules) => {
    const inv = c.inventory[Number(el.dataset.value)];
    if (!inv) return false;
    return fn(c, inv, itemOf(rules, inv));
  });
}

function changeHp(id, sign) {
  const amount = readInt('hp-amount', 0);
  if (amount <= 0) { toast('Digite quantos PV perder ou recuperar.'); return; }
  updateChar(id, (c, rules) => {
    const max = computeSheet(rules, c).hp;
    if (max == null) return false;
    const now = Math.max(0, Math.min(max, currentHp(c, max) + sign * amount));
    c.hpCurrent = now >= max ? null : now;
    toast(now === 0 ? 'PV chegou a 0: o personagem caiu!' : `${now} de ${max} PV.`);
    return true;
  });
}

function changeXp(id, sign) {
  const amount = readInt('xp-amount', 0);
  if (amount <= 0) { toast('Digite quanto XP ganhar ou perder.'); return; }
  updateChar(id, (c) => {
    c.xp = Math.max(0, (c.xp || 0) + sign * amount);
    const need = xpNeeded(c.level);
    toast(c.xp >= need && c.level < MAX_LEVEL ? `${c.xp} XP: já dá para subir de nível!` : `${c.xp} de ${need} XP.`);
  });
}

function changeCoins(id, sign) {
  const amount = readInt('coin-amount', 0);
  const type = document.getElementById('coin-type').value;
  const coin = COINS.find((k) => k.id === type);
  if (amount <= 0 || !coin) { toast('Digite a quantidade de moedas.'); return; }
  updateChar(id, (c) => {
    const coins = { ...coinsOf(c) };
    if (sign < 0 && (coins[type] || 0) < amount) {
      toast(`Você só tem ${coins[type] || 0} ${coin.short}.`);
      return false;
    }
    coins[type] = (coins[type] || 0) + sign * amount;
    c.coins = coins;
    toast(`${sign > 0 ? '+' : '−'}${amount} ${coin.short}`);
    return true;
  });
}

// Ações disparadas por caixas de seleção (evento "change").
const changeActions = {
  toggleBook(el) {
    const c = state.char;
    if (!el.checked && bookLocked(c, el.value)) return;
    c.books = el.checked ? [...new Set([...c.books, el.value])] : c.books.filter((b) => b !== el.value);
    const rules = rulesFor(c.books);
    if (c.classId && !rules.classes.some((k) => k.id === c.classId)) { c.classId = null; resetFromClass(c); }
    if (c.background && !c.background.custom && !rules.backgroundTables.some((t) => t.id === c.background.table)) c.background = null;
    if (c.deity && !rules.deities.some((d) => d.id === c.deity)) c.deity = null;
    store.savePrefs({ books: c.books });
  },
  toggleLang(el) {
    const c = state.char;
    const list = c.languages[el.dataset.group] || [];
    c.languages[el.dataset.group] = el.checked ? [...list, el.value].slice(0, Number(el.dataset.count)) : list.filter((l) => l !== el.value);
  },
  toggleSpell(el) {
    const c = state.char;
    c.spells = el.checked ? [...c.spells, el.value].slice(0, Number(el.dataset.max)) : c.spells.filter((s) => s !== el.value);
  },
  gmClass(el) {
    const gm = state.gm;
    gm.classPool = el.checked ? [...gm.classPool, el.value] : gm.classPool.filter((k) => k !== el.value);
  },
  gmBook(el) {
    const gm = state.gm;
    gm.books = el.checked ? [...new Set([...gm.books, el.value])] : gm.books.filter((b) => b !== el.value);
    const rules = rulesFor(gm.books);
    gm.classPool = gm.classPool.filter((k) => rules.classes.some((x) => x.id === k));
  },
  async importFile(el) {
    const file = el.files?.[0];
    if (!file) return;
    try {
      const list = store.parseImport(await file.text());
      store.saveMany(list);
      toast(`${list.length} personagem(ns) importado(s).`);
    } catch (err) {
      toast(`Não consegui ler o arquivo: ${err.message}`);
    }
    render();
  },
};

// Ao tocar num botão logo depois de digitar, o "change" do campo chega antes do clique.
// Nesse caso não redesenhamos no "change", senão o botão some antes do clique terminar.
let pressing = false;
document.addEventListener('pointerdown', (e) => { pressing = !!e.target.closest('button[data-act], a'); });

document.addEventListener('click', (e) => {
  pressing = false;
  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'INPUT') return;
  const fn = actions[el.dataset.act];
  if (!fn) return;
  e.preventDefault();
  fn(el, e);
  if (!['help', 'closeSheet', 'print', 'exportOne', 'exportAll'].includes(el.dataset.act)) { persist(); render(); }
});

document.addEventListener('change', async (e) => {
  const el = e.target;
  if (el.dataset.act && changeActions[el.dataset.act]) {
    await changeActions[el.dataset.act](el);
    persist();
    render();
    return;
  }
  if (el.dataset.gm) {
    const key = el.dataset.gm;
    state.gm[key] = key === 'group' ? el.value : Number(el.value);
    render();
    return;
  }
  if (el.dataset.invNote != null) {
    updateChar(el.dataset.char, (c) => {
      const inv = c.inventory[Number(el.dataset.invNote)];
      if (!inv) return false;
      inv.note = el.value.trim();
      return true;
    });
    return;
  }
  if (el.dataset.bind && state.char) {
    applyBind(el);
    persist();
    if (!pressing) render();
  }
});

// Campos de texto: guarda enquanto digita, sem redesenhar a tela.
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.bind && state.char && (el.tagName === 'TEXTAREA' || el.type === 'text')) {
    setAt(state.char, el.dataset.bind, el.value);
    persist();
  }
  if (el.dataset.gm === 'group') state.gm.group = el.value;
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSheet();
});

document.getElementById('sheet').addEventListener('click', (e) => {
  if (e.target.id === 'sheet' || e.target.closest('.sheet-close')) closeSheet();
});

render();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
