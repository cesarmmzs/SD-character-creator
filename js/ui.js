// Pequenos utilitários de interface.
import { GLOSSARY } from './data/glossary.js';

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

// Botão "?" que abre a explicação de um termo do glossário.
export function help(key, label = 'O que é isso?') {
  if (!GLOSSARY[key]) return '';
  return `<button type="button" class="help" data-act="help" data-key="${esc(key)}" aria-label="${esc(label)}: ${esc(GLOSSARY[key].title)}">?</button>`;
}

// "?" com texto próprio (opções de ancestralidade, classe, magia...).
export function helpText(title, text, page) {
  return `<button type="button" class="help" data-act="help" data-title="${esc(title)}" data-text="${esc(text)}"${page ? ` data-page="${esc(page)}"` : ''} aria-label="Explicação: ${esc(title)}">?</button>`;
}

export function labelWithHelp(text, key) {
  return `<span class="label">${esc(text)} ${help(key)}</span>`;
}

export function showSheet({ title, text, page, html }) {
  const box = document.getElementById('sheet');
  box.querySelector('.sheet-title').textContent = title || '';
  const body = box.querySelector('.sheet-body');
  body.innerHTML = html || `<p>${esc(text)}</p>${page ? `<p class="muted">Livro de Regras, pág. ${esc(page)}</p>` : ''}`;
  box.hidden = false;
  box.querySelector('.sheet-close').focus();
}

export function openHelp(el) {
  const g = GLOSSARY[el.dataset.key];
  if (g) showSheet(g);
  else showSheet({ title: el.dataset.title, text: el.dataset.text, page: el.dataset.page });
}

export function closeSheet() {
  document.getElementById('sheet').hidden = true;
}

let toastTimer;
export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

// Leitura e escrita por caminho, ex.: "talents.class0.choice.sub".
export function getAt(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function setAt(obj, path, value) {
  const keys = path.split('.');
  let o = obj;
  for (const k of keys.slice(0, -1)) {
    if (o[k] == null || typeof o[k] !== 'object') o[k] = {};
    o = o[k];
  }
  o[keys[keys.length - 1]] = value;
}

export function select(path, options, value, { placeholder = 'Escolha...', reset = false } = {}) {
  return `<select data-bind="${esc(path)}"${reset ? ' data-reset="1"' : ''}>
    <option value="">${esc(placeholder)}</option>
    ${options.map((o) => `<option value="${esc(o.id)}"${String(value) === String(o.id) ? ' selected' : ''}>${esc(o.name)}</option>`).join('')}
  </select>`;
}

export function diceInput(act, path, { label, dice, value, extra = '' }) {
  return `<div class="dice-row">
    <button type="button" class="btn" data-act="${esc(act)}" data-path="${esc(path)}" ${extra}>🎲 Rolar ${esc(dice)}</button>
    <label class="manual">ou digite: <input type="number" inputmode="numeric" data-bind="${esc(path)}" data-type="num" value="${value ?? ''}" aria-label="${esc(label)} (resultado digitado)"></label>
  </div>`;
}
