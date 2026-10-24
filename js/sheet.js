// Ficha de personagem pronta para jogar (tela e impressão).
import { STATS, STAT_NAMES } from './data/glossary.js';
import {
  computeSheet, fmtMod, fmtMoney, fmtCoins, findItem, itemOf, rangeName, getClass, COINS, coinSlots, xpNeeded, MAX_LEVEL,
} from './rules.js';
import { alignName } from './wizard.js';
import { esc, help, helpText } from './ui.js';
import { icon } from './icons.js';

export function backgroundOf(rules, c) {
  const bg = c.background;
  if (!bg) return null;
  if (bg.custom) return { name: bg.name, desc: bg.desc || '' };
  const table = rules.backgroundTables.find((t) => t.id === bg.table);
  const entry = table?.entries[bg.index];
  return entry ? { name: entry[0], desc: entry[1] } : null;
}

export function summaryLine(rules, c) {
  const s = computeSheet(rules, c);
  const who = [s.anc?.name, s.cls ? s.cls.name : 'Nível 0'].filter(Boolean).join(' ');
  return `${who}${s.cls ? ` ${c.level}` : ''} · ${alignName(c.alignment)}`;
}

const dmgText = (a) => (a.damage === '–' ? 'especial' : `${a.damage}${a.dmg ? fmtMod(a.dmg) : ''}`);

// Espaços que um item da mochila ocupa.
function invSlots(item, inv) {
  if (item.cat === 'custom') return item.slots * inv.qty;
  if (item.cat === 'gear') return Math.ceil(Math.max(0, inv.qty - (item.freeFirst || 0)) / item.perSlot);
  return (item.slots ?? 1) * inv.qty;
}

const catalogLabel = (item, cat) => `${item.name}${cat === 'gear' && item.buy > 1 ? ` (${item.buy})` : ''} · ${fmtMoney(item.cost)}`;

function renderXp(c) {
  const need = xpNeeded(c.level);
  const xp = c.xp || 0;
  const ready = xp >= need && c.level < MAX_LEVEL;
  return `<section class="panel level-panel no-print"><h3>Experiência ${help('xp')}</h3>
    <div class="xp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${need}" aria-valuenow="${Math.min(xp, need)}"><span style="width:${Math.min(100, Math.round((xp / need) * 100))}%"></span></div>
    <p class="small">${xp} de ${need} XP para o nível ${c.level + 1}${ready ? ' · <strong>pronto para subir!</strong>' : ''}</p>
    <div class="inline-form">
      <input type="number" inputmode="numeric" id="xp-amount" min="1" placeholder="XP" aria-label="Quantidade de XP">
      <button type="button" class="btn small" data-act="xpAdd" data-value="${esc(c.id)}">+ XP</button>
      <button type="button" class="btn small ghost" data-act="xpSub" data-value="${esc(c.id)}">− XP</button>
    </div>
    ${c.level < MAX_LEVEL
    ? `<button type="button" class="btn ${ready ? 'primary' : ''}" data-act="levelUp" data-value="${esc(c.id)}">⬆ Subir para o nível ${c.level + 1}</button> ${help(c.level === 0 ? 'nivelZeroUm' : 'subirNivel')}
       ${ready ? '' : '<p class="muted small">Pode subir agora mesmo se o mestre permitir; o XP volta a zero.</p>'}`
    : '<p class="muted small">Nível máximo.</p>'}
  </section>`;
}

function renderBackpack(rules, c, s, addOpen) {
  const coins = s.coins;
  const coinTiles = COINS.map((k) => `<div class="coin coin-${k.id}"><span class="coin-num">${coins[k.id] || 0}</span><span class="small">${k.short}</span></div>`).join('');
  const rows = c.inventory.map((inv, i) => {
    const item = itemOf(rules, inv);
    if (!item) return '';
    const usable = item.cat === 'gear' || item.cat === 'custom';
    return `<li class="inv-row">
      <div class="inv-name"><strong>${esc(item.name)}</strong>${item.cat === 'custom' ? ' <span class="badge">próprio</span>' : ''}
        <input type="text" class="inv-note" data-inv-note="${i}" data-char="${esc(c.id)}" value="${esc(inv.note || '')}" placeholder="anotação" aria-label="Anotação sobre ${esc(item.name)}"></div>
      <span class="stepper"><button type="button" data-act="invMinus" data-value="${i}" data-char="${esc(c.id)}" aria-label="Menos ${esc(item.name)}">−</button><span>${inv.qty}</span><button type="button" data-act="invPlus" data-value="${i}" data-char="${esc(c.id)}" aria-label="Mais ${esc(item.name)}">+</button></span>
      <span class="inv-slots small muted">${invSlots(item, inv)} esp.</span>
      <span class="inv-acts">${usable ? `<button type="button" class="btn small" data-act="invUse" data-value="${i}" data-char="${esc(c.id)}">usar</button>` : ''}<button type="button" class="btn small ghost danger" data-act="invRemove" data-value="${i}" data-char="${esc(c.id)}" aria-label="Tirar ${esc(item.name)}">×</button></span>
    </li>`;
  }).join('');
  const group = (label, list, cat) => `<optgroup label="${label}">${list.map((x) => `<option value="${esc(x.id)}">${esc(catalogLabel(x, cat))}</option>`).join('')}</optgroup>`;
  const cslots = coinSlots(coins);
  return `<section class="backpack">
    <h3>Mochila ${help('mochila')}</h3>
    <div class="carry ${s.used > s.capacity ? 'over' : ''}">Espaços: <strong>${s.used} / ${s.capacity}</strong> ${help('espacos')}${cslots ? ` <span class="small">(moedas: ${cslots})</span>` : ''}</div>
    <h4>Moedas ${help('moedas')}</h4>
    <div class="coins">${coinTiles}</div>
    <div class="inline-form no-print">
      <input type="number" inputmode="numeric" id="coin-amount" min="1" placeholder="Qtd." aria-label="Quantidade de moedas">
      <select id="coin-type" aria-label="Tipo de moeda">${COINS.map((k) => `<option value="${k.id}">${k.name} (${k.short})</option>`).join('')}</select>
      <button type="button" class="btn small" data-act="coinAdd" data-value="${esc(c.id)}">Adicionar</button>
      <button type="button" class="btn small ghost" data-act="coinSub" data-value="${esc(c.id)}">Remover</button>
    </div>
    <h4>Itens</h4>
    ${rows ? `<ul class="inv-table">${rows}</ul>` : '<p class="muted">Mochila vazia.</p>'}
    <details class="panel no-print add-item"${addOpen ? ' open' : ''}><summary><strong>+ Adicionar item</strong></summary>
      <h4>Dos livros</h4>
      <label class="field">Item <select id="add-cat">${group('Armas', rules.weapons, 'weapon')}${group('Armaduras e escudos', rules.armor, 'armor')}${group('Equipamentos', rules.gear, 'gear')}</select></label>
      <div class="inline-form"><label class="small">Quantidade <input type="number" inputmode="numeric" id="add-cat-qty" min="1" value="1"></label>
        <button type="button" class="btn small" data-act="invAdd" data-value="${esc(c.id)}">Adicionar</button></div>
      <p class="muted small">O preço aparece só como referência. Se for uma compra, remova as moedas acima.</p>
      <h4>Item próprio</h4>
      <label class="field">Nome <input type="text" id="add-name" placeholder="Ex.: Ídolo de jade, Chave de ferro"></label>
      <div class="field-row">
        <label class="field">Quantidade <input type="number" inputmode="numeric" id="add-qty" min="1" value="1"></label>
        <label class="field">Espaços (cada) <input type="number" inputmode="numeric" id="add-slots" min="0" value="1"></label>
      </div>
      <label class="field">Anotação <input type="text" id="add-note" placeholder="Opcional"></label>
      <button type="button" class="btn small" data-act="invAddCustom" data-value="${esc(c.id)}">Adicionar item próprio</button>
    </details>
  </section>`;
}

export function renderSheet(rules, c, { compact = false, interactive = false, addOpen = false } = {}) {
  const s = computeSheet(rules, c);
  const bg = backgroundOf(rules, c);
  const deity = rules.deities.find((d) => d.id === c.deity);
  const patron = rules.patrons.find((p) => p.id === c.patron);
  const cls = getClass(rules, c);

  const stats = STATS.map((k) => `<div class="stat"><span class="stat-name">${icon(k, 'stat-icon')} ${k}</span><span class="stat-mod">${fmtMod(s.mods[k])}</span><span class="stat-val">${s.stats[k]}</span></div>`).join('');

  const attacks = s.attacks.length
    ? `<table class="attacks"><thead><tr><th>Arma</th><th>Ataque</th><th>Dano</th><th>Alcance</th></tr></thead><tbody>
        ${s.attacks.map((a) => `<tr${a.allowed ? '' : ' class="warn"'}><td>${esc(a.name)}<br><span class="small muted">${esc(a.mode)}${a.allowed ? '' : ' · fora da sua classe'}</span></td><td>${fmtMod(a.atk)}</td><td>${esc(dmgText(a))}</td><td>${esc(rangeName(a.range))}</td></tr>`).join('')}
      </tbody></table>`
    : '<p class="muted">Sem armas.</p>';

  const inventory = c.inventory.map((inv) => {
    const item = itemOf(rules, inv);
    return item ? `<li>${esc(item.name)}${inv.qty > 1 ? ` × ${inv.qty}` : ''}${inv.note ? ` <span class="muted small">(${esc(inv.note)})</span>` : ''}</li>` : '';
  }).join('');

  const features = s.features.map((f) => `<li><strong>${esc(f.name)}</strong> <span class="muted small">(${esc(f.source)})</span>${compact ? '' : `<br><span class="small">${esc(f.desc)}</span>`}</li>`).join('');
  const talents = s.talents.map((t) => `<li>${esc(t)}</li>`).join('');
  const choices = [];
  if (c.classChoices?.mastery && cls?.id === 'guerreiro') choices.push(`Maestria: ${findItem(rules, c.classChoices.mastery)?.name}`);
  if (c.classChoices?.grit) choices.push(`Bravura: ${STAT_NAMES[c.classChoices.grit]}`);
  if (c.classChoices?.mount) choices.push(`Montaria: ${c.classChoices.mount === 'camelo' ? 'camelo' : 'cavalo'}`);
  if (c.classChoices?.familiar) choices.push(`Familiar: ${c.classChoices.familiar}`);
  if (s.anc?.choice && c.ancestryChoice?.[s.anc.choice.id]) choices.push(s.anc.choice.options.find((o) => o.id === c.ancestryChoice[s.anc.choice.id])?.name);

  const spells = s.spells.length
    ? `<section><h3>Magias ${help('magias')}</h3><p>Teste de conjuração: <strong>1d20 ${fmtMod(s.casting.bonus)}</strong> (${STAT_NAMES[s.casting.stat]}), CD 10 + grau ${help('conjuracao')}</p>
        <ul class="spells">${s.spells.map((sp) => `<li><strong>${esc(sp.name)}</strong> <span class="muted small">grau ${sp.tier}${sp.dur ? ` · ${esc(sp.dur)} · ${esc(rangeName(sp.alc))}` : ''}</span>${compact ? '' : `<br><span class="small">${esc(sp.desc)}</span>`}</li>`).join('')}</ul></section>`
    : '';

  const roleplay = ['appearance', 'traits', 'bio'].filter((k) => c[k]?.trim());
  const labels = { appearance: 'Aparência', traits: 'Traços', bio: 'Biografia' };

  return `<article class="sheet-card${compact ? ' compact' : ''}">
    <header class="sheet-head">
      <h2>${esc(c.name || 'Sem nome')}</h2>
      <p>${esc(summaryLine(rules, c))}${s.title ? ` · <em>${esc(s.title)}</em> ${help('titulo')}` : ''}</p>
      ${c.player ? `<p class="muted small">Jogador: ${esc(c.player)}</p>` : ''}
    </header>
    <div class="vitals">
      <div><span class="v-label">PV ${help('pv')}</span><span class="v-num">${s.hp ?? '–'}</span></div>
      <div><span class="v-label">CA ${help('ca')}</span><span class="v-num">${s.ac.ac}</span><span class="small muted">${esc(s.ac.desc)}</span></div>
      <div><span class="v-label">Nível</span><span class="v-num">${c.level}</span><span class="small muted">XP ${c.xp || 0} / ${xpNeeded(c.level)}</span></div>
    </div>
    ${interactive ? renderXp(c) : ''}
    <div class="stats-grid">${stats}</div>
    <section><h3>Ataques ${help('ataques')}</h3>${attacks}</section>
    ${spells}
    <section><h3>Habilidades</h3><ul class="features">${features}${choices.length ? `<li>${choices.map(esc).join(' · ')}</li>` : ''}</ul>
      ${talents ? `<h4>Talentos ${help('talentos')}</h4><ul class="features">${talents}</ul>` : ''}</section>
    ${interactive ? renderBackpack(rules, c, s, addOpen) : ''}
    <section class="two-col">
      ${interactive ? '' : `<div><h3>Equipamento ${help('espacos')}</h3><p class="small muted">${s.used} de ${s.capacity} espaços · ${fmtCoins(s.coins)}</p><ul class="inv">${inventory}</ul></div>`}
      <div><h3>Origem</h3><ul class="plain">
        ${bg ? `<li><strong>Antecedente:</strong> ${esc(bg.name)} ${helpText(bg.name, bg.desc)}</li>` : ''}
        <li><strong>Idiomas:</strong> ${esc(s.languages.join(', '))}</li>
        ${deity ? `<li><strong>Divindade:</strong> ${esc(deity.name)}</li>` : ''}
        ${patron ? `<li><strong>Patrono:</strong> ${esc(patron.name)}</li>` : ''}
        ${c.group ? `<li><strong>Grupo:</strong> ${esc(c.group)}</li>` : ''}
      </ul></div>
    </section>
    ${roleplay.length && !compact ? `<section>${roleplay.map((k) => `<h3>${labels[k]}</h3><p class="prose">${esc(c[k])}</p>`).join('')}</section>` : ''}
  </article>`;
}
