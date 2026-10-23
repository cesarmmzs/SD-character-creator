// Aplicativo: navegação, tela inicial, modo mestre e tratamento de eventos.
import { loadRules, DEFAULT_BOOKS, BOOKS } from './data/index.js';
import {
  newCharacter, rollStats, rollDice, roll, getClass, findItem, addItem, removeItem, buyQty, applyQuickPack, applyKit,
} from './rules.js';
import * as R from './random.js';
import { STEPS, visibleSteps } from './wizard.js';
import { renderSheet, summaryLine } from './sheet.js';
import * as store from './storage.js';
import { esc, help, openHelp, closeSheet, toast, getAt, setAt } from './ui.js';

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

window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

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
    </div>${renderSheet(rules, c)}`;
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
          <label class="field">Nível <select data-gm="level"><option value="0" ${gm.level === 0 ? 'selected' : ''}>Nível 0</option><option value="1" ${gm.level === 1 ? 'selected' : ''}>Nível 1</option></select></label>
        </div>
        <label class="field">Nome do grupo (opcional) <input type="text" data-gm="group" value="${esc(gm.group)}" placeholder="Ex.: Mesa de sexta, Provação da Ana"></label>
        <fieldset><legend>Livros</legend>${BOOKS.map((b) => `<label class="toggle"><input type="checkbox" data-act="gmBook" value="${b.id}" ${gm.books.includes(b.id) ? 'checked' : ''} ${b.required ? 'disabled' : ''}> ${esc(b.name)}</label>`).join('')}</fieldset>
        ${gm.level === 1 ? `<details><summary>Limitar classes (${gm.classPool.length ? gm.classPool.length : 'todas'})</summary><div class="checks">${classes}</div></details>` : ''}
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
  const html = view === 'criar' ? viewWizard() : view === 'ficha' ? viewSheet(id) : view === 'mestre' ? viewGM() : viewHome();
  app.innerHTML = html;
  document.querySelectorAll('.top-nav a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === `#/${view === 'inicio' ? '' : view}`));
}

// ---------- Mudanças no personagem ----------

function persist() {
  if (state.char) { state.char.stepId = state.stepId; store.saveDraft(state.char); }
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
    if (value >= 2 && value <= 12) { c.goldRoll = value * 500; c.gold = c.goldRoll; }
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
    else { c.inventory = []; c.gold = null; c.goldRoll = null; c.equipMode = 'shop'; }
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
  rollGold() { const r = roll(2, 6); state.char.goldRoll = r * 500; state.char.gold = state.char.goldRoll; toast(`2d6 = ${r}: ${r * 5} PO`); },
  resetShop() { const c = state.char; c.inventory = []; c.gold = c.goldRoll; },
  buy(el) {
    const c = state.char;
    const item = findItem(rulesFor(c.books), el.dataset.value);
    if (!item || c.gold < item.cost) return;
    c.gold -= item.cost;
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
  },
  buyKit() {
    const c = state.char;
    const rules = rulesFor(c.books);
    if (c.gold < rules.kit.cost) return;
    c.gold -= rules.kit.cost;
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
    if (!store.saveCharacter(c)) { toast('Não foi possível salvar neste navegador.'); return; }
    store.clearDraft();
    state.char = null;
    toast('Personagem salvo!');
    go(`#/ficha/${c.id}`);
  },

  edit(el) {
    state.char = structuredClone(store.getCharacter(el.dataset.value));
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
    const c = store.getCharacter(el.dataset.value);
    if (!confirm(`Excluir ${c?.name || 'este personagem'}? Não dá para desfazer.`)) return;
    store.deleteCharacter(el.dataset.value);
    go('#/');
  },
  print() { window.print(); },
  exportOne(el) {
    const c = store.getCharacter(el.dataset.value);
    store.downloadJSON(`${(c.name || 'personagem').replace(/[^\w-]+/g, '_')}.json`, c);
  },
  exportAll() { store.downloadJSON('personagens-shadowdark.json', { app: 'sd-character-creator', characters: store.listCharacters() }); },

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

// Ações disparadas por caixas de seleção (evento "change").
const changeActions = {
  toggleBook(el) {
    const c = state.char;
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
