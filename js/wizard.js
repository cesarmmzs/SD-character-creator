// Etapas do assistente de criação.
import { STATS, STAT_NAMES, ALIGNMENTS, GLOSSARY } from './data/glossary.js';
import { BOOKS } from './data/index.js';
import {
  modifier, fmtMod, fmtMoney, canRerollStats, getClass, getAncestry, entryFor, effectNeeds, rollSubSlots,
  talentSlots, slotComplete, spellOptions, spellStatus, canAddSpell, spellsError, languageGroups, fixedLanguages,
  computeSheet, weaponAllowed, armorAllowed, itemOf, hpSteps, hpRollsNeeded, buyQty, rangeName,
} from './rules.js';
import * as R from './random.js';
import { icon } from './icons.js';
import { esc, help, helpText, select, diceInput, getAt } from './ui.js';

const ALIGN_DESC = {
  lawful: 'Justiça, ordem e virtude: "pelo bem da maioria".',
  neutral: 'Equilíbrio entre Ordem e Caos: "a natureza deve seguir seu curso".',
  chaotic: 'Ambição, destruição e perdição: "os mais fortes sobrevivem".',
};
const ALIGN_NAME = Object.fromEntries(ALIGNMENTS.map((a) => [a.id, a.name]));
export const alignName = (id) => ALIGN_NAME[id] || '';

function card({ act = 'set', path, value, selected, title, body, badge = '', extra = '', iconId = null }) {
  return `<button type="button" class="card${selected ? ' selected' : ''}" data-act="${act}" data-path="${esc(path)}" data-value="${esc(value)}" aria-pressed="${selected ? 'true' : 'false'}" ${extra}>
    <span class="card-title">${iconId ? icon(iconId, 'card-icon') : ''}<span>${esc(title)}${badge ? ` <span class="badge">${esc(badge)}</span>` : ''}</span></span>
    ${body}
  </button>`;
}

// Opção de livro com a capa ao fundo (primeira etapa e modo mestre).
export function bookToggle(b, checked, act) {
  return `<label class="book${checked ? ' on' : ''}"><span class="book-img" style="background-image:url('${esc(b.cover)}')"></span>
    <span class="book-label"><input type="checkbox" data-act="${act}" value="${b.id}" ${checked ? 'checked' : ''} ${b.required ? 'disabled' : ''}> ${esc(b.name)}</span></label>`;
}

const bookBadge = (item) => (item.book && item.book !== 'base' ? BOOKS.find((b) => b.id === item.book).short : '');

function stepHeader(title, key, intro) {
  return `<h2>${esc(title)} ${key ? help(key) : ''}</h2>${intro ? `<p class="intro">${intro}</p>` : ''}`;
}

const randomBtn = (label = 'Sortear para mim') => `<button type="button" class="btn ghost" data-act="randomStep">🎲 ${esc(label)}</button>`;

// ---------- Talentos (renderização recursiva) ----------

function weaponOptions(rules, c, filter) {
  return rules.weapons.filter(filter).map((w) => ({ id: w.id, name: w.name }));
}

function renderChoice(rules, c, effect, path, tableId) {
  const value = getAt(c, path);
  const need = effectNeeds(effect);
  const statOpts = (list) => list.map((s) => ({ id: s, name: STAT_NAMES[s] }));
  switch (need) {
    case 'stat':
      return `<label class="field">Qual atributo? ${select(path, statOpts(effect.options), value)}</label>`;
    case 'stat2':
      return `<div class="field-row"><label class="field">Primeiro +1 ${select(`${path}.0`, statOpts(STATS), value?.[0])}</label>
        <label class="field">Segundo +1 ${select(`${path}.1`, statOpts(STATS.filter((s) => s !== value?.[0])), value?.[1])}</label></div>`;
    case 'atkOne':
      return `<label class="field">Em qual tipo de ataque? ${select(path, [{ id: 'melee', name: 'Corpo a corpo' }, { id: 'ranged', name: 'À distância' }], value)}</label>`;
    case 'acArmor': {
      const opts = rules.armor.filter((a) => armorAllowed(rules, c, a)).map((a) => ({ id: a.id, name: a.name }));
      return `<label class="field">Qual armadura? ${select(path, opts, value)}</label>`;
    }
    case 'mastery':
      return `<label class="field">Qual arma? ${help('masteryHelp')} ${select(path, weaponOptions(rules, c, (w) => weaponAllowed(rules, c, w)), value)}</label>`;
    case 'prof':
      return `<label class="field">Qual arma corpo a corpo? ${select(path, weaponOptions(rules, c, (w) => w.type.includes('C') && !weaponAllowed(rules, c, w)), value)}</label>`;
    case 'text':
      return `<label class="field">${esc(effect.ask)} <input type="text" data-bind="${esc(path)}" value="${esc(value || '')}"></label>`;
    case 'or': {
      const opts = effect.options.map((o, i) => ({ id: i, name: o.label }));
      const chosen = value?.opt != null ? effect.options[value.opt] : null;
      return `<label class="field">Escolha um ${select(`${path}.opt`, opts, value?.opt, { reset: true })}</label>
        ${chosen ? renderChoice(rules, c, chosen.effect, `${path}.sub`, tableId) : ''}`;
    }
    case 'pick': {
      const entries = rules.tables[tableId].entries;
      const opts = entries.map((e, i) => ({ id: i, name: `${e.min === e.max ? e.min : `${e.min}–${e.max}`}: ${e.text}` }))
        .filter((o, i) => entries[i].effect.kind !== 'pick');
      opts.push({ id: 'points', name: 'Distribuir +2 pontos de atributo' });
      const sel = value?.mode === 'points' ? 'points' : value?.idx;
      let sub = '';
      if (value?.mode === 'points') {
        sub = `<div class="field-row"><label class="field">+1 em ${select(`${path}.a`, statOpts(STATS), value.a)}</label>
          <label class="field">+1 em ${select(`${path}.b`, statOpts(STATS), value.b)}</label></div><p class="muted small">Pode escolher o mesmo atributo duas vezes para +2.</p>`;
      } else if (value?.idx != null) {
        sub = renderChoice(rules, c, entries[value.idx].effect, `${path}.sub`, tableId);
      }
      return `<label class="field">Sua escolha ${select(`${path}.pick`, opts, sel, { reset: true })}</label>${sub}`;
    }
    case 'roll': {
      let html = '';
      if (effect.table === 'patronAny') {
        html += `<label class="field">De qual patrono? ${help('patrono')} ${select(`${path}.patron`, rules.patrons, value?.patron, { reset: true })}</label>`;
      }
      const subs = rollSubSlots(rules, c, effect, value);
      for (const s of subs) {
        if (!s.table) continue;
        const label = rules.tables[s.table].name || (s.table.startsWith('patron:') ? `Dádiva de ${rules.patrons.find((p) => `patron:${p.id}` === s.table)?.name}` : 'Rolagem extra');
        html += renderSlot(rules, c, `${path}.slots.${s.i}`, s.table, `${label}${subs.length > 1 ? ` (${s.i + 1})` : ''}`, true);
      }
      if (effect.table === 'patron2') {
        const ready = subs.every((s) => s.slot.roll != null);
        if (ready) {
          const opts = subs.map((s) => ({ id: s.i, name: `${s.i + 1}ª: ${entryFor(rules.tables[s.table], s.slot.roll).text}` }));
          html += `<label class="field">Com qual você fica? ${select(`${path}.keep`, opts, value?.keep)}</label>`;
        }
      }
      return html;
    }
    default:
      return '';
  }
}

export function renderSlot(rules, c, path, tableId, label, nested = false) {
  const table = rules.tables[tableId];
  if (!table) return '';
  const slot = getAt(c, path) || {};
  const entry = slot.roll != null ? entryFor(table, slot.roll) : null;
  const done = slotComplete(rules, c, slot, tableId);
  return `<div class="slot${nested ? ' nested' : ''}${done ? ' done' : ''}">
    <div class="slot-head"><strong>${esc(label)}</strong> <span class="muted">(${esc(table.dice)})</span>
      ${helpText('Tabela de talentos', table.entries.map((e) => `${e.min === e.max ? e.min : `${e.min}–${e.max}`}: ${e.text}`).join(' · '))}</div>
    ${entry
      ? `<div class="slot-result"><span class="roll-badge">${slot.roll}</span> ${esc(entry.text)}
          <button type="button" class="link" data-act="clearSlot" data-path="${esc(path)}">rolar de novo</button></div>
         ${renderChoice(rules, c, entry.effect, `${path}.choice`, tableId)}`
      : diceInput('rollSlot', `${path}.roll`, { label, dice: table.dice, value: slot.roll, extra: `data-table="${esc(tableId)}"` })}
  </div>`;
}

// Talento de um nível; o Profanador escolhe antes entre a tabela da classe e a do patrono.
export function renderTalentSlot(rules, c, s) {
  const cls = getClass(rules, c);
  let chooser = '';
  if (s.key.startsWith('lvl') && cls?.patronBoonAtLevel1 && c.patron) {
    const n = s.level;
    const usePatron = c.levels?.[n]?.talentTable === 'patron';
    const rolled = c.talents[s.key]?.roll != null;
    chooser = `<div class="chips">${[['class', `Tabela de ${cls.name}`], ['patron', 'Dádiva do patrono']].map(([v, l]) => `<button type="button" class="chip${(v === 'patron') === usePatron ? ' on' : ''}" data-act="talentTable" data-level="${n}" data-value="${v}" ${rolled ? 'disabled' : ''}>${esc(l)}</button>`).join('')}</div>
      ${rolled ? '' : '<p class="muted small">Como Profanador, você pode rolar na tabela do seu patrono em vez da tabela da classe.</p>'}`;
  }
  return chooser + renderSlot(rules, c, `talents.${s.key}`, s.table, s.label);
}

// Escolha de magias por grau. "locked" são magias que o personagem já conhecia (não podem ser desmarcadas).
export function renderSpellPicker(rules, c, locked = []) {
  const cls = getClass(rules, c);
  const st = spellStatus(rules, c);
  const free = (cls.spellcasting.bonusSpells || []).map((id) => rules.spells[cls.spellcasting.list].find((x) => x.id === id)).filter(Boolean);
  const tiers = st.tiers.map((need, i) => {
    const tier = i + 1;
    const left = need - st.counts[i];
    const open = left > 0 || st.extraUsed < st.extra;
    return `<details class="panel spell-tier"${open ? ' open' : ''}><summary><strong>Grau ${tier}</strong> · ${st.counts[i]} de ${need}${left > 0 ? ` <span class="badge">falta${left > 1 ? 'm' : ''} ${left}</span>` : ' ✓'}</summary>
      <div class="spell-list">${spellOptions(rules, c, tier).map((sp) => {
        const on = c.spells.includes(sp.id);
        const isLocked = on && locked.includes(sp.id);
        const blocked = !on && !canAddSpell(st, tier);
        return `<label class="check spell${blocked ? ' off' : ''}"><input type="checkbox" data-act="toggleSpell" value="${sp.id}" data-max="${st.total}" ${on ? 'checked' : ''} ${blocked || isLocked ? 'disabled' : ''}>
          <span><strong>${esc(sp.name)}</strong>${isLocked ? ' <span class="muted small">(já conhecida)</span>' : ''}${sp.dur ? ` <span class="muted small">${esc(sp.dur)} · ${esc(rangeName(sp.alc))}</span>` : ''}<br><span class="small">${esc(sp.desc)}</span></span></label>`;
      }).join('')}</div></details>`;
  }).join('');
  return `${free.length ? `<p>Você também conhece, de graça: <strong>${free.map((x) => esc(x.name)).join(', ')}</strong> ${helpText(free[0].name, free[0].desc)}</p>` : ''}
    ${st.extra ? `<p class="callout">Um talento lhe dá <strong>${st.extra}</strong> magia${st.extra > 1 ? 's' : ''} a mais, de qualquer grau que você já conheça (${st.extraUsed} usada${st.extraUsed === 1 ? '' : 's'}).</p>` : ''}
    ${tiers}`;
}

// ---------- Etapas ----------

export const STEPS = [
  {
    id: 'inicio',
    title: 'Começo',
    render(c) {
      const fixedLevel = c.level >= 2 || c.promoted;
      return `${stepHeader('Vamos começar', null, 'Responda duas perguntas rápidas. Tudo o que der para calcular, o app calcula para você.')}
        <h3>Nível ${help('nivel')}</h3>
        ${fixedLevel ? `<p class="callout">Personagem de nível ${c.level}. Para mudar de nível, use o botão "Subir de nível" na ficha.</p>` : `<div class="cards two">
          ${card({ path: 'level', value: 0, selected: c.level === 0, title: 'Nível 0', body: '<span>Gente comum tentando sobreviver à primeira aventura. Sem classe, poucos PV. Comum em "A Provação".</span>' })}
          ${card({ path: 'level', value: 1, selected: c.level === 1, title: 'Nível 1', body: '<span>Aventureiro pronto, com classe, talentos e mais vida.</span>' })}
        </div>`}
        <h3>Livros da sua mesa ${help('livros')}</h3>
        <div class="books">
          ${BOOKS.map((b) => bookToggle(b, c.books.includes(b.id), 'toggleBook')).join('')}
        </div>
        <div class="callout">
          <p><strong>Com pressa?</strong> Gere um personagem inteiro de uma vez e ajuste depois, se quiser.</p>
          <button type="button" class="btn" data-act="randomAll" ${c.level == null || fixedLevel ? 'disabled' : ''}>🎲 Sortear personagem completo</button>
        </div>`;
    },
    validate: (c) => (c.level == null ? 'Escolha o nível inicial.' : null),
  },
  {
    id: 'atributos',
    title: 'Atributos',
    random: (rules, c) => R.randomStats(c),
    render(c) {
      const rows = STATS.map((s) => {
        const v = c.stats?.[s];
        return `<tr><th><span class="stat-label">${icon(s, 'stat-icon')} ${esc(STAT_NAMES[s])}</span> ${help(s)}</th>
          <td><input type="number" inputmode="numeric" min="3" max="18" data-bind="stats.${s}" data-type="num" value="${v ?? ''}" aria-label="${esc(STAT_NAMES[s])}"></td>
          <td class="mod">${v ? fmtMod(modifier(v)) : '–'}</td></tr>`;
      }).join('');
      return `${stepHeader('Atributos', 'atributos', 'Role 3d6 para cada atributo, na ordem. Pode deixar o app rolar ou digitar o que saiu nos seus dados.')}
        <button type="button" class="btn" data-act="rollStats">🎲 Rolar 3d6 em ordem</button>
        <table class="stats"><thead><tr><th>Atributo</th><th>Valor</th><th>Mod. ${help('modificador')}</th></tr></thead><tbody>${rows}</tbody></table>
        ${canRerollStats(c.stats) ? `<div class="callout"><p>Nenhum atributo chegou a 14. A regra permite rolar todos de novo.</p><button type="button" class="btn" data-act="rollStats">🎲 Rolar novo conjunto</button></div>` : ''}`;
    },
    validate(c) {
      if (!c.stats) return 'Role ou digite seus atributos.';
      for (const s of STATS) if (!(c.stats[s] >= 3 && c.stats[s] <= 18)) return `${STAT_NAMES[s]} precisa ser um número de 3 a 18.`;
      return null;
    },
  },
  {
    id: 'classe',
    title: 'Classe',
    visible: (c) => c.level >= 1,
    random: (rules, c) => { R.randomClass(rules, c); R.randomClassChoices(rules, c); },
    render(c, rules) {
      const cls = getClass(rules, c);
      // Depois do nível 1 a classe fica fixa: trocar desfaria talentos, magias e PV de todos os níveis.
      const locked = c.level >= 2;
      const cards = rules.classes.filter((k) => !locked || k.id === c.classId).map((k) => card({
        path: 'classId', value: k.id, selected: c.classId === k.id, title: k.name, badge: bookBadge(k), iconId: k.id,
        body: `<span>${esc(k.desc)}</span><span class="facts">Vida: d${k.hitDie} · Armas: ${esc(k.weaponsText)} · Armaduras: ${esc(k.armorText)}</span>`,
      })).join('');
      let choices = '';
      if (cls) {
        choices = `<div class="panel"><h3>${esc(cls.name)} ${helpText(cls.name, `${cls.desc} Dado de vida d${cls.hitDie}.`, cls.book === 'base' ? cls.page : null)}</h3>
          <ul class="features">${cls.features.map((f) => `<li><strong>${esc(f.name)}.</strong> ${esc(f.desc)}</li>`).join('')}</ul>
          ${(cls.choices || []).map((ch) => {
            const path = `classChoices.${ch.id}`;
            const value = c.classChoices?.[ch.id];
            if (ch.type === 'weapon') return `<label class="field">${esc(ch.label)} ${help(ch.help)} ${select(path, weaponOptions(rules, c, (w) => weaponAllowed(rules, c, w)), value)}</label>`;
            if (ch.type === 'text') return `<label class="field">${esc(ch.label)} <input type="text" data-bind="${path}" value="${esc(value || '')}" placeholder="${esc(ch.placeholder || '')}"></label>`;
            return `<label class="field">${esc(ch.label)} ${select(path, ch.options, value)}</label>`;
          }).join('')}</div>`;
      }
      return `${stepHeader('Classe', 'classe', 'Sua classe é seu papel no grupo. Toque numa opção para ver os detalhes.')}
        ${locked ? `<p class="callout">No nível ${c.level} a classe não pode mais ser trocada.</p>` : randomBtn()}<div class="cards">${cards}</div>${choices}`;
    },
    validate(c, rules) {
      const cls = getClass(rules, c);
      if (!cls) return 'Escolha uma classe.';
      for (const ch of cls.choices || []) if (!ch.optional && !c.classChoices?.[ch.id]) return `Escolha: ${ch.label}.`;
      return null;
    },
  },
  {
    id: 'ancestralidade',
    title: 'Ancestralidade',
    random: (rules, c) => R.randomAncestry(rules, c),
    render(c, rules) {
      const anc = getAncestry(rules, c);
      const cards = rules.ancestries.map((a) => card({
        path: 'ancestry', value: a.id, selected: c.ancestry === a.id, title: a.name, iconId: a.id,
        body: `<span>${esc(a.desc)}</span><span class="facts">Idiomas: ${esc(a.languages.join(', '))}${a.languageChoices ? ' + 1 à escolha' : ''}</span><span class="facts"><strong>${esc(a.feature.name)}:</strong> ${esc(a.feature.desc)}</span>`,
      })).join('');
      const choice = anc?.choice ? `<div class="panel"><label class="field">${esc(anc.choice.label)} ${select(`ancestryChoice.${anc.choice.id}`, anc.choice.options, c.ancestryChoice?.[anc.choice.id])}</label></div>` : '';
      return `${stepHeader('Ancestralidade', 'ancestralidade', 'De que povo você vem?')}${randomBtn('Rolar 1d12')}<div class="cards">${cards}</div>${choice}`;
    },
    validate(c, rules) {
      const anc = getAncestry(rules, c);
      if (!anc) return 'Escolha uma ancestralidade.';
      if (anc.choice && !c.ancestryChoice?.[anc.choice.id]) return `Escolha: ${anc.choice.label}.`;
      return null;
    },
  },
  {
    id: 'antecedente',
    title: 'Antecedente',
    random: (rules, c) => R.randomBackground(rules, c),
    render(c, rules) {
      const tables = rules.backgroundTables;
      const bg = c.background || {};
      const tableId = bg.custom ? null : bg.table || tables[0].id;
      const table = tables.find((t) => t.id === tableId);
      const tabs = `<div class="chips">${tables.map((t) => `<button type="button" class="chip${t.id === tableId ? ' on' : ''}" data-act="bgTable" data-value="${t.id}">${esc(t.name)}</button>`).join('')}<button type="button" class="chip${bg.custom ? ' on' : ''}" data-act="bgCustom">Escrever o meu</button></div>`;
      let body;
      if (bg.custom) {
        body = `<label class="field">Nome do antecedente <input type="text" data-bind="background.name" value="${esc(bg.name || '')}" placeholder="Ex.: Coveiro"></label>
          <label class="field">O que isso significa <input type="text" data-bind="background.desc" value="${esc(bg.desc || '')}" placeholder="Ex.: Conhece cemitérios e não teme mortos"></label>`;
      } else {
        body = `<button type="button" class="btn ghost" data-act="randomStep">🎲 Rolar 1d20</button>
          <ol class="pick-list">${table.entries.map(([name, desc], i) => `<li><button type="button" class="pick${bg.table === tableId && bg.index === i ? ' selected' : ''}" data-act="bgPick" data-table="${tableId}" data-value="${i}"><span class="num">${i + 1}</span><span><strong>${esc(name)}.</strong> ${esc(desc)}</span></button></li>`).join('')}</ol>`;
      }
      return `${stepHeader('Antecedente', 'antecedente', 'O que você fazia antes de virar aventureiro?')}${tabs}${body}`;
    },
    validate(c) {
      const bg = c.background;
      if (!bg) return 'Escolha ou role um antecedente.';
      if (bg.custom && !bg.name) return 'Dê um nome ao seu antecedente.';
      return null;
    },
  },
  {
    id: 'alinhamento',
    title: 'Alinhamento',
    random: (rules, c) => R.randomAlignment(c),
    render(c) {
      return `${stepHeader('Alinhamento', 'alinhamento', 'De que lado você está?')}${randomBtn('Rolar 1d6')}
        <div class="cards">${ALIGNMENTS.map((a) => card({ path: 'alignment', value: a.id, selected: c.alignment === a.id, title: a.name, iconId: a.id, body: `<span>${esc(ALIGN_DESC[a.id])}</span>` })).join('')}</div>`;
    },
    validate: (c) => (c.alignment ? null : 'Escolha um alinhamento.'),
  },
  {
    id: 'divindade',
    title: 'Divindade',
    random: (rules, c) => R.randomDeity(rules, c),
    render(c, rules) {
      const cls = getClass(rules, c);
      const required = cls?.requiresDeity;
      const pool = required ? rules.deities.filter((d) => d.alignment === c.alignment) : rules.deities;
      const deityCards = pool.map((d) => card({ path: 'deity', value: d.id, selected: c.deity === d.id, title: d.name, badge: bookBadge(d), body: `<span>${esc(d.desc)}</span><span class="facts">${esc(alignName(d.alignment))}</span>` })).join('');
      const none = required ? '' : card({ path: 'deity', value: '', selected: c.deity === '' || c.deity == null, title: 'Nenhuma', body: '<span>Você não segue nenhum deus em especial.</span>' });
      const patrons = cls?.requiresPatron ? `<h3>Seu patrono ${help('patrono')}</h3><div class="cards">${rules.patrons.map((p) => card({ path: 'patron', value: p.id, selected: c.patron === p.id, title: p.name, body: `<span>${esc(p.desc)}</span>` })).join('')}</div>` : '';
      return `${stepHeader('Divindade', 'divindade', required ? `Como ${esc(cls.name)}, você precisa servir a um deus ${esc(alignName(c.alignment).toLowerCase())}.` : 'Opcional: escolha um deus para venerar, ou nenhum.')}
        ${randomBtn()}${patrons}${cls?.requiresPatron ? '<h3>Divindade (opcional)</h3>' : ''}<div class="cards">${none}${deityCards}</div>`;
    },
    validate(c, rules) {
      const cls = getClass(rules, c);
      if (cls?.requiresDeity) {
        const d = rules.deities.find((x) => x.id === c.deity);
        if (!d) return 'Sacerdotes precisam escolher uma divindade.';
        if (d.alignment !== c.alignment) return 'A divindade precisa ter o mesmo alinhamento que você.';
      }
      if (cls?.requiresPatron && !c.patron) return 'Escolha seu patrono.';
      return null;
    },
  },
  {
    id: 'idiomas',
    title: 'Idiomas',
    visible: (c, rules) => languageGroups(rules, c).length > 0,
    random: (rules, c) => R.randomLanguages(rules, c),
    render(c, rules) {
      const fixed = fixedLanguages(rules, c);
      const groups = languageGroups(rules, c);
      const taken = new Set(fixed);
      groups.forEach((g) => (c.languages[g.key] || []).forEach((l) => taken.add(l)));
      const desc = Object.fromEntries([...rules.languages.common, ...rules.languages.rare]);
      return `${stepHeader('Idiomas', 'idiomas', `Você já fala: <strong>${esc(fixed.join(', '))}</strong>.`)}${randomBtn()}
        ${groups.map((g) => {
          const mine = c.languages[g.key] || [];
          return `<fieldset class="panel"><legend>${esc(g.label)}: escolha ${g.count}</legend>
            ${g.options.filter((l) => !fixed.includes(l)).map((l) => {
              const on = mine.includes(l);
              const blocked = !on && (taken.has(l) || mine.length >= g.count);
              return `<label class="check${blocked ? ' off' : ''}"><input type="checkbox" data-act="toggleLang" data-group="${g.key}" data-count="${g.count}" value="${esc(l)}" ${on ? 'checked' : ''} ${blocked ? 'disabled' : ''}> ${esc(l)} <span class="muted small">${esc(desc[l] || '')}</span></label>`;
            }).join('')}</fieldset>`;
        }).join('')}`;
    },
    validate(c, rules) {
      for (const g of languageGroups(rules, c)) if ((c.languages[g.key] || []).length < g.count) return `Escolha ${g.count} em "${g.label}".`;
      return null;
    },
  },
  {
    id: 'talentos',
    title: 'Talentos',
    visible: (c) => c.level >= 1,
    random: (rules, c) => R.randomTalents(rules, c),
    render(c, rules) {
      const slots = talentSlots(rules, c);
      return `${stepHeader('Talentos', 'talentos', 'Role na tabela da sua classe. Quando o resultado pedir uma escolha, ela aparece logo abaixo.')}${randomBtn('Rolar tudo para mim')}
        ${slots.map((s) => renderTalentSlot(rules, c, s)).join('')}
        ${slots.some((s) => s.key === 'patron0') || !getClass(rules, c)?.patronBoonAtLevel1 ? '' : '<p class="callout">Escolha seu patrono na etapa Divindade para rolar a Dádiva Patronal.</p>'}`;
    },
    validate(c, rules) {
      const cls = getClass(rules, c);
      if (cls?.patronBoonAtLevel1 && !c.patron) return 'Volte à etapa Divindade e escolha seu patrono.';
      for (const s of talentSlots(rules, c)) if (!slotComplete(rules, c, c.talents[s.key], s.table)) return `Complete: ${s.label}.`;
      return null;
    },
  },
  {
    id: 'magias',
    title: 'Magias',
    visible: (c, rules) => !!getClass(rules, c)?.spellcasting,
    random: (rules, c) => R.randomSpells(rules, c),
    render(c, rules) {
      const cls = getClass(rules, c);
      const st = spellStatus(rules, c);
      if (st.total === 0) {
        return `${stepHeader('Magias', 'magias')}<p class="callout">${esc(cls.name)} só aprende a primeira magia no nível 3. Nada para escolher agora.</p>`;
      }
      const sheet = computeSheet(rules, c);
      const intro = st.maxTier === 1
        ? `Escolha <strong>${st.total}</strong> magia${st.total > 1 ? 's' : ''} de grau 1.`
        : `No nível ${c.level}, você conhece <strong>${st.total}</strong> magias, separadas por grau.`;
      return `${stepHeader('Magias', 'magias', `${intro} Seu teste de conjuração é 1d20 ${fmtMod(sheet.casting.bonus)} ${help('conjuracao')}.`)}
        ${randomBtn()}
        ${renderSpellPicker(rules, c)}
        <p class="muted small">${c.spells.length} de ${st.total} escolhidas.</p>`;
    },
    validate: (c, rules) => spellsError(rules, c),
  },
  {
    id: 'vida',
    title: 'Pontos de vida',
    random: (rules, c) => R.randomHp(rules, c, hpRollsNeeded(rules, c)),
    render(c, rules) {
      const sheet = computeSheet(rules, c);
      const dwarf = sheet.anc?.id === 'anao';
      if (c.level === 0) {
        return `${stepHeader('Pontos de vida', 'pv')}
          <div class="big-number">${sheet.hp} PV</div>
          <p>No nível 0, seus PV são o modificador de Constituição (${fmtMod(sheet.mods.CON)}), com mínimo de 1${dwarf ? ', mais 2 por ser anão' : ''}. Nada para rolar.</p>`;
      }
      const cls = sheet.cls;
      const step = hpSteps(rules, c)[0];
      const n = step.count;
      const rolls = c.hp?.rolls || [];
      const rows = Array.from({ length: n }, (_, i) => {
        const maxed = i < step.maxed;
        return `<div class="slot"><strong>${i === 0 ? 'Dado de vida' : 'Dado extra (Lótus Negra)'}: d${cls.hitDie}</strong>
          ${maxed ? `<p>Um talento faz este dado valer o máximo: <strong>${cls.hitDie}</strong>.</p>` : diceInput('rollHp', `hp.rolls.${i}`, { label: 'Dado de vida', dice: `1d${cls.hitDie}${dwarf ? ' com Vantagem' : ''}`, value: rolls[i] })}</div>`;
      }).join('');
      return `${stepHeader('Pontos de vida', 'pv', `Role o dado de vida de ${esc(cls.name)} e some sua Constituição (${fmtMod(sheet.mods.CON)}). Mínimo de 1.${dwarf ? ' Anões rolam com Vantagem e ganham +2.' : ''}`)}
        ${rows}
        ${c.level >= 2 ? `<p class="muted small">Os dados de vida dos níveis 2 a ${c.level} já estão guardados e entram no total.</p>` : ''}
        ${sheet.hp != null ? `<div class="big-number">${sheet.hp} PV</div>` : ''}`;
    },
    validate(c, rules) {
      if (c.level === 0) return null;
      const cls = getClass(rules, c);
      const step = hpSteps(rules, c)[0];
      const n = step.count;
      for (let i = step.maxed; i < n; i++) {
        const r = c.hp?.rolls?.[i];
        if (!(r >= 1 && r <= cls.hitDie)) return `Role o dado de vida (1 a ${cls.hitDie}).`;
      }
      return null;
    },
  },
  {
    id: 'equipamento',
    title: 'Equipamento',
    random: (rules, c) => R.randomEquipment(rules, c),
    render(c, rules) {
      const sheet = computeSheet(rules, c);
      const bar = `<div class="carry ${sheet.used > sheet.capacity ? 'over' : ''}">Espaços: <strong>${sheet.used} / ${sheet.capacity}</strong> ${help('espacos')}${c.level >= 1 && c.gold != null && c.equipMode !== 'level0' ? ` · Dinheiro: <strong>${fmtMoney(c.gold)}</strong>` : ''} · CA ${sheet.ac.ac} ${help('ca')}</div>`;
      const inv = renderInventory(rules, c);
      if (c.level === 0) {
        return `${stepHeader('Equipamento', 'equipNivel0', 'Role 1d4 para saber quantos itens você tem, e 1d12 para cada um.')}
          <button type="button" class="btn" data-act="randomStep">🎲 Rolar meus itens</button>
          ${c.level0Rolls ? `<p class="muted small">Rolagens: ${c.level0Rolls.join(', ')}</p>` : ''}${bar}${inv}`;
      }
      const modes = `<div class="cards two">
        ${card({ act: 'equipMode', path: 'equipMode', value: 'quick', selected: c.equipMode === 'quick', title: 'Pacote rápido', body: '<span>Kit de exploração, uma arma da sua classe, armadura de couro (se puder) e 5 PO.</span>' })}
        ${card({ act: 'equipMode', path: 'equipMode', value: 'shop', selected: c.equipMode === 'shop', title: 'Fazer compras', body: '<span>Role 2d6 × 5 PO e compre o que quiser.</span>' })}
      </div>`;
      let body = '';
      if (c.equipMode === 'level0') {
        body = '<p class="callout">Você mantém os itens que já tinha no nível 0. Se preferir, troque pelo pacote rápido ou faça compras (isso substitui os itens atuais).</p>';
      } else if (c.equipMode === 'quick') {
        body = `<p class="muted small">${help('pacote')} Você pode trocar por compras a qualquer momento.</p>`;
      } else if (c.equipMode === 'shop') {
        body = c.goldRoll == null
          ? `<div class="slot"><strong>Ouro inicial: 2d6 × 5 PO</strong> ${help('ouro')}${diceInput('rollGold', 'goldDice', { label: 'Ouro (2d6)', dice: '2d6', value: null })}</div>`
          : `<p>Você rolou ${c.goldRoll / 500} × 5 = <strong>${fmtMoney(c.goldRoll)}</strong>. <button type="button" class="link" data-act="resetShop">recomeçar compras</button></p>${renderShop(rules, c)}`;
      }
      return `${stepHeader('Equipamento', null, 'Escolha como montar seu equipamento.')}${modes}${bar}${body}${inv}`;
    },
    validate(c, rules) {
      if (c.level === 0) return c.equipMode === 'level0' ? null : 'Role seus itens.';
      if (!c.equipMode) return 'Escolha o pacote rápido ou faça compras.';
      if (c.equipMode === 'shop' && c.goldRoll == null) return 'Role seu ouro inicial.';
      const sheet = computeSheet(rules, c);
      if (sheet.used > sheet.capacity) return 'Você está carregando mais do que aguenta. Tire alguns itens.';
      return null;
    },
  },
  {
    id: 'detalhes',
    title: 'Detalhes',
    render(c) {
      const area = (path, key, ph) => `<label class="field">${esc(GLOSSARY[key].title)} ${help(key)}<textarea data-bind="${path}" rows="3" placeholder="${esc(ph)}">${esc(c[path] || '')}</textarea></label>`;
      return `${stepHeader('Quem é você?', null, 'Esta parte é toda sua. Só o nome é obrigatório.')}
        <label class="field">Nome ${help('nome')}<span class="input-btn"><input type="text" data-bind="name" value="${esc(c.name)}" placeholder="Nome do personagem"><button type="button" class="btn ghost" data-act="suggestName">🎲 Sugerir</button></span></label>
        <label class="field">Jogador <input type="text" data-bind="player" value="${esc(c.player)}" placeholder="Seu nome (opcional)"></label>
        ${area('appearance', 'aparencia', 'Ex.: alta, cicatriz no queixo, manto remendado')}
        ${area('traits', 'tracos', 'Ex.: desconfiada, leal aos amigos, adora apostas')}
        ${area('bio', 'biografia', 'De onde veio e por que se arrisca nas trevas?')}`;
    },
    validate: (c) => (c.name?.trim() ? null : 'Dê um nome ao personagem.'),
  },
];

function renderInventory(rules, c) {
  if (!c.inventory.length) return '';
  return `<h3>Seus itens</h3><ul class="inventory">${c.inventory.map((inv) => {
    const item = itemOf(rules, inv);
    if (!item) return '';
    const removable = c.equipMode === 'shop' || c.equipMode === 'level0' || item.cat === 'custom';
    return `<li><span>${esc(item.name)}${inv.qty > 1 ? ` × ${inv.qty}` : ''}</span>${removable ? `<button type="button" class="link" data-act="dropItem" data-value="${inv.id}">tirar</button>` : ''}</li>`;
  }).join('')}</ul>`;
}

function renderShop(rules, c) {
  const row = (item, kind) => {
    const qty = c.inventory.find((i) => i.id === item.id)?.qty || 0;
    const per = buyQty(item);
    const tooPoor = c.gold < item.cost;
    const info = kind === 'weapon'
      ? `${item.damage} · ${rangeName(item.range.split('/').pop())}${item.props.length ? ` · ${item.props.join(', ')}` : ''}`
      : kind === 'armor' ? (item.shield ? `CA +${item.shield}` : `CA ${item.ac}${item.dex ? ' + Des' : ''}`) + (item.notes ? ` · ${item.notes}` : '') : item.desc;
    return `<li class="shop-row"><span class="shop-name"><strong>${esc(item.name)}</strong>${per > 1 ? ` (${per})` : ''} <span class="muted small">${esc(info)}</span></span>
      <span class="shop-cost">${fmtMoney(item.cost)}</span>
      <span class="stepper"><button type="button" data-act="sell" data-value="${item.id}" ${qty ? '' : 'disabled'} aria-label="Devolver ${esc(item.name)}">−</button><span>${qty}</span><button type="button" data-act="buy" data-value="${item.id}" ${tooPoor ? 'disabled' : ''} aria-label="Comprar ${esc(item.name)}">+</button></span></li>`;
  };
  const weapons = rules.weapons.filter((w) => weaponAllowed(rules, c, w));
  const armor = rules.armor.filter((a) => armorAllowed(rules, c, a));
  return `<div class="shop">
    <div class="callout"><strong>${esc(rules.kit.name)}</strong> ${help('kit')} — ${fmtMoney(rules.kit.cost)}
      <button type="button" class="btn small" data-act="buyKit" ${c.gold < rules.kit.cost ? 'disabled' : ''}>Comprar kit</button></div>
    <details open><summary>Armas da sua classe</summary><ul>${weapons.map((w) => row({ ...w, cat: 'weapon' }, 'weapon')).join('')}</ul></details>
    ${armor.length ? `<details><summary>Armaduras</summary><ul>${armor.map((a) => row({ ...a, cat: 'armor' }, 'armor')).join('')}</ul></details>` : ''}
    <details><summary>Equipamentos</summary><ul>${rules.gear.map((g) => row({ ...g, cat: 'gear' }, 'gear')).join('')}</ul></details>
  </div>`;
}

export function visibleSteps(c, rules) {
  return STEPS.filter((s) => !s.visible || s.visible(c, rules));
}
