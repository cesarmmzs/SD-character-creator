// Ficha de personagem pronta para jogar (tela e impressão).
import { STATS, STAT_NAMES } from './data/glossary.js';
import { computeSheet, fmtMod, fmtMoney, findItem, rangeName, getClass } from './rules.js';
import { alignName } from './wizard.js';
import { esc, help, helpText } from './ui.js';

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
  return `${who}${s.cls ? ' 1' : ''} · ${alignName(c.alignment)}`;
}

const dmgText = (a) => (a.damage === '–' ? 'especial' : `${a.damage}${a.dmg ? fmtMod(a.dmg) : ''}`);

export function renderSheet(rules, c, { compact = false } = {}) {
  const s = computeSheet(rules, c);
  const bg = backgroundOf(rules, c);
  const deity = rules.deities.find((d) => d.id === c.deity);
  const patron = rules.patrons.find((p) => p.id === c.patron);
  const cls = getClass(rules, c);

  const stats = STATS.map((k) => `<div class="stat"><span class="stat-name">${k}</span><span class="stat-mod">${fmtMod(s.mods[k])}</span><span class="stat-val">${s.stats[k]}</span></div>`).join('');

  const attacks = s.attacks.length
    ? `<table class="attacks"><thead><tr><th>Arma</th><th>Ataque</th><th>Dano</th><th>Alcance</th></tr></thead><tbody>
        ${s.attacks.map((a) => `<tr${a.allowed ? '' : ' class="warn"'}><td>${esc(a.name)}<br><span class="small muted">${esc(a.mode)}${a.allowed ? '' : ' · fora da sua classe'}</span></td><td>${fmtMod(a.atk)}</td><td>${esc(dmgText(a))}</td><td>${esc(rangeName(a.range))}</td></tr>`).join('')}
      </tbody></table>`
    : '<p class="muted">Sem armas.</p>';

  const inventory = c.inventory.map((inv) => {
    const item = findItem(rules, inv.id);
    return item ? `<li>${esc(item.name)}${inv.qty > 1 ? ` × ${inv.qty}` : ''}</li>` : '';
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
        <ul class="spells">${s.spells.map((sp) => `<li><strong>${esc(sp.name)}</strong> <span class="muted small">grau ${sp.tier}</span>${compact ? '' : `<br><span class="small">${esc(sp.desc)}</span>`}</li>`).join('')}</ul></section>`
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
      <div><span class="v-label">Nível</span><span class="v-num">${c.level}</span><span class="small muted">XP 0 / 10</span></div>
    </div>
    <div class="stats-grid">${stats}</div>
    <section><h3>Ataques ${help('ataques')}</h3>${attacks}</section>
    ${spells}
    <section><h3>Habilidades</h3><ul class="features">${features}${choices.length ? `<li>${choices.map(esc).join(' · ')}</li>` : ''}</ul>
      ${talents ? `<h4>Talentos ${help('talentos')}</h4><ul class="features">${talents}</ul>` : ''}</section>
    <section class="two-col">
      <div><h3>Equipamento ${help('espacos')}</h3><p class="small muted">${s.used} de ${s.capacity} espaços · ${fmtMoney(c.gold || 0)}</p><ul class="inv">${inventory}</ul></div>
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
