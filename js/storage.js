// Salvamento local (no próprio navegador) e exportação/importação em arquivo .json.
const KEY = 'sdcc.characters';
const DRAFT = 'sdcc.draft';
const PREFS = 'sdcc.prefs';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const listCharacters = () => read(KEY, []);
export const getCharacter = (id) => listCharacters().find((c) => c.id === id) || null;

export function saveCharacter(c) {
  const all = listCharacters();
  c.updatedAt = new Date().toISOString();
  const i = all.findIndex((x) => x.id === c.id);
  if (i >= 0) all[i] = c; else all.unshift(c);
  return write(KEY, all);
}

export function saveMany(list) {
  const all = listCharacters();
  const now = new Date().toISOString();
  for (const c of list) {
    c.updatedAt = now;
    const i = all.findIndex((x) => x.id === c.id);
    if (i >= 0) all[i] = c; else all.unshift(c);
  }
  return write(KEY, all);
}

export function deleteCharacter(id) {
  return write(KEY, listCharacters().filter((c) => c.id !== id));
}

export const loadDraft = () => read(DRAFT, null);
export const saveDraft = (d) => write(DRAFT, d);
export const clearDraft = () => { try { localStorage.removeItem(DRAFT); } catch { /* sem armazenamento */ } };

export const loadPrefs = () => read(PREFS, {});
export const savePrefs = (p) => write(PREFS, { ...loadPrefs(), ...p });

export function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Aceita um personagem, uma lista, ou o arquivo de backup completo.
export function parseImport(text) {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : Array.isArray(data.characters) ? data.characters : [data];
  const valid = list.filter((c) => c && typeof c === 'object' && c.id && 'level' in c);
  if (!valid.length) throw new Error('Nenhum personagem encontrado no arquivo.');
  return valid;
}
