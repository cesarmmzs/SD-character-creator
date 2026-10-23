import base from './base.js';
import diabruras from './diabruras.js';
import areiasRubras from './areias-rubras.js';
import solDaMeiaNoite from './sol-da-meia-noite.js';

export const BOOKS = [base, diabruras, areiasRubras, solDaMeiaNoite];
export const DEFAULT_BOOKS = BOOKS.map((b) => b.id);

// Junta os livros ligados num único conjunto de regras.
export function loadRules(bookIds = DEFAULT_BOOKS) {
  const ids = new Set(['base', ...bookIds]);
  const books = BOOKS.filter((b) => ids.has(b.id));
  const rules = {
    books: books.map((b) => b.id),
    ancestries: [], classes: [], backgroundTables: [], deities: [], patrons: [],
    weapons: [], armor: [], gear: [], tables: {}, spells: {},
    kit: base.kit, level0Gear: base.level0Gear, languages: base.languages,
    names: base.names, nordicNames: null,
  };
  for (const b of books) {
    for (const key of ['ancestries', 'classes', 'backgroundTables', 'deities', 'patrons', 'weapons', 'armor', 'gear']) {
      for (const item of b[key] || []) rules[key].push({ ...item, book: b.id });
    }
    Object.assign(rules.tables, b.tables || {});
    for (const [list, spells] of Object.entries(b.spells || {})) {
      rules.spells[list] = [...(rules.spells[list] || []), ...spells];
    }
    if (b.nordicNames) rules.nordicNames = b.nordicNames;
  }
  return rules;
}

export function bookName(id) {
  return BOOKS.find((b) => b.id === id)?.short || id;
}
