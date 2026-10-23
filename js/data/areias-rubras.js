// Cursed Scroll 2: Areias Rubras. Textos resumidos com palavras próprias.

const pick = { min: 12, max: 12, text: 'Escolha um talento desta tabela ou distribua +2 pontos de atributo', effect: { kind: 'pick' } };

const strDexOrMelee = { kind: 'or', options: [
  { label: '+2 em Força ou Destreza', effect: { kind: 'stat', options: ['FOR', 'DES'], amount: 2 } },
  { label: '+1 em ataques corpo a corpo', effect: { kind: 'atk', melee: 1 } },
] };

export default {
  id: 'areias-rubras',
  name: 'Cursed Scroll 2: Areias Rubras',
  short: 'Areias Rubras',

  classes: [
    {
      id: 'cavaleiro-deserto', name: 'Cavaleiro do Deserto', page: 10, hitDie: 8,
      desc: 'Cavaleiro das areias, inseparável da sua montaria e mortal numa investida.',
      weaponsText: 'Adaga, arco curto, azagaia, chicote, cimitarra, clava, espada longa, lança, pique',
      weapons: ['adaga', 'arco-curto', 'azagaia', 'chicote', 'cimitarra', 'clava', 'espada-longa', 'lanca', 'pique'],
      armorText: 'Armadura de couro, escudos', armor: ['couro', 'escudo', 'escudo-redondo'],
      features: [
        { name: 'Montaria', desc: 'Você tem um cavalo ou camelo fiel, que atende ao seu chamado e nunca se assusta. Montados, vocês ganham CA igual à metade do seu nível.' },
        { name: 'Investida', desc: '3 vezes por dia, se mover pelo menos até Perto antes de atacar, seus ataques corpo a corpo causam dano dobrado nessa rodada.' },
      ],
      choices: [{ id: 'mount', label: 'Sua montaria', options: [{ id: 'cavalo', name: 'Cavalo' }, { id: 'camelo', name: 'Camelo' }] }],
      talents: 'cavaleiro-deserto',
      titles: {
        lawful: ['Batedor', 'Corredor das Areias', 'Pioneiro', 'Vento Veloz', 'Corredor da Tempestade'],
        chaotic: ['Bandido', 'Bandoleiro', 'Invasor', 'Praga', 'Rei/Rainha dos Bandidos'],
        neutral: ['Rato', 'Raposa', 'Lobo', 'Tigre', 'Dragão'],
      },
    },
    {
      id: 'lutador-arena', name: 'Lutador de Arena', page: 12, hitDie: 8,
      desc: 'Brigão de arena, difícil de derrubar e que se recupera no meio da luta.',
      weaponsText: 'Todas as armas', weapons: 'all',
      armorText: 'Armadura de couro, escudos', armor: ['couro', 'escudo', 'escudo-redondo'],
      features: [
        { name: 'Floreio', desc: '3 vezes por dia, recupere 1d6 PV ao acertar um inimigo corpo a corpo.' },
        { name: 'Implacável', desc: 'Vantagem em testes de Constituição contra ferimentos, venenos e ambientes extremos.' },
        { name: 'Última Resistência', desc: 'Ao morrer, se rolar 18 a 20 num d20, você volta com 1 PV.' },
        { name: 'Incansável', desc: '3 vezes por dia, ao cair a 0 PV, um teste de Constituição CD 18 deixa você com 1 PV.' },
      ],
      talents: 'lutador-arena',
      titles: {
        lawful: ['Novato', 'Gladiador', 'Herói', 'Campeão', 'Lenda'],
        chaotic: ['Arruaceiro', 'Valentão', 'Canalha', 'Vilão', 'Lenda'],
        neutral: ['Azarão', 'Revelação', 'Coringa', 'Vencedor', 'Lenda'],
      },
    },
    {
      id: 'ras-godai', name: 'Ras-Godai', page: 14, hitDie: 6,
      desc: 'Assassino de um mosteiro oculto, com poderes da lendária lótus negra.',
      weaponsText: 'Adaga, boleadeira, chicote de lâminas, cimitarra, lança, shuriken, zarabatana',
      weapons: ['adaga', 'boleadeira', 'chicote-laminas', 'cimitarra', 'lanca', 'shuriken', 'zarabatana'],
      armorText: 'Armadura de couro', armor: ['couro'],
      languages: ['Diabólico'],
      features: [
        { name: 'Assassino', desc: 'Vantagem para se esgueirar e esconder. Dano dobrado contra quem não sabe que você está ali.' },
        { name: 'Passo de Fumaça', desc: '3 vezes por dia, teleporte-se até um ponto visível Perto, sem gastar sua ação.' },
        { name: 'Lótus Negra', desc: 'Você comeu uma pétala da lótus negra e sobreviveu: role um talento na tabela da Lótus Negra.' },
      ],
      lotusAtLevel1: true,
      talents: 'ras-godai',
      titles: {
        lawful: ['Acólito', 'Caminho do Espelho', 'Monge', 'Mestre', 'Lótus Branca'],
        chaotic: ['Acólito', 'Caminho da Sombra', 'Monge', 'Assassino', 'Lótus Negra'],
        neutral: ['Acólito', 'Caminho do Fogo', 'Monge', 'Lâmina Demoníaca', 'Lótus Vermelha'],
      },
    },
  ],

  tables: {
    'class:cavaleiro-deserto': { dice: '2d6', entries: [
      { min: 2, max: 2, text: 'Pode usar qualquer criatura adequada como montaria', effect: { kind: 'note' } },
      { min: 3, max: 6, text: '+1 em ataques ou +1 em dano', effect: { kind: 'or', options: [
        { label: '+1 em ataques', effect: { kind: 'atk', melee: 1, ranged: 1 } },
        { label: '+1 em dano', effect: { kind: 'dmg', melee: 1, ranged: 1 } },
      ] } },
      { min: 7, max: 9, text: '+2 em Força ou Destreza, ou +1 em ataques corpo a corpo', effect: strDexOrMelee },
      { min: 10, max: 11, text: 'Mais um uso diário de Investida', effect: { kind: 'note' } },
      pick,
    ] },
    'class:lutador-arena': { dice: '2d6', entries: [
      { min: 2, max: 2, text: '1 vez por dia, ignore todo o dano e efeitos de um ataque', effect: { kind: 'note' } },
      { min: 3, max: 6, text: '+1 no dano com armas corpo a corpo', effect: { kind: 'dmg', melee: 1 } },
      { min: 7, max: 9, text: '+2 em Força ou Constituição, ou +1 em ataques corpo a corpo', effect: { kind: 'or', options: [
        { label: '+2 em Força ou Constituição', effect: { kind: 'stat', options: ['FOR', 'CON'], amount: 2 } },
        { label: '+1 em ataques corpo a corpo', effect: { kind: 'atk', melee: 1 } },
      ] } },
      { min: 10, max: 11, text: 'Floreio cura +1d6', effect: { kind: 'note' } },
      pick,
    ] },
    'class:ras-godai': { dice: '2d6', entries: [
      { min: 2, max: 2, text: 'Treinado no uso de venenos', effect: { kind: 'note' } },
      { min: 3, max: 6, text: 'Role mais um talento da Lótus Negra', effect: { kind: 'roll', table: 'lotus' } },
      { min: 7, max: 9, text: '+2 em Força ou Destreza, ou +1 em ataques corpo a corpo', effect: strDexOrMelee },
      { min: 10, max: 11, text: 'Mais um uso diário de Passo de Fumaça', effect: { kind: 'note' } },
      pick,
    ] },
    lotus: { dice: '1d12', name: 'Talentos da Lótus Negra', entries: [
      { min: 1, max: 1, text: 'Ganhe dois talentos da Lótus Negra', effect: { kind: 'roll', table: 'lotus', count: 2 } },
      { min: 2, max: 2, text: '1 vez por dia, paralise por 1d4 rodadas um alvo de nível 9 ou menor que você ferir', effect: { kind: 'note' } },
      { min: 3, max: 3, text: 'Vantagem em testes de Destreza para evitar armadilhas e ferimentos', effect: { kind: 'note' } },
      { min: 4, max: 4, text: '+1 na CA ao empunhar uma arma corpo a corpo em cada mão', effect: { kind: 'note' } },
      { min: 5, max: 5, text: 'Ganhe um dado de pontos de vida extra', effect: { kind: 'extraHpDie' } },
      { min: 6, max: 6, text: 'O talento Assassino causa dano triplo', effect: { kind: 'note' } },
      { min: 7, max: 7, text: 'Inimigos que veem você testam moral com CD 18', effect: { kind: 'note' } },
      { min: 8, max: 8, text: '1 vez por dia, ande sobre a água por 1d4 rodadas', effect: { kind: 'note' } },
      { min: 9, max: 9, text: '1 vez por dia, faça uma criatura de nível 5 ou menor dormir (Constituição CD 15 resiste)', effect: { kind: 'note' } },
      { min: 10, max: 10, text: '1 vez por dia, ande em paredes por 1d4 rodadas', effect: { kind: 'note' } },
      { min: 11, max: 11, text: '+1 no dano com armas corpo a corpo', effect: { kind: 'dmg', melee: 1 } },
      { min: 12, max: 12, text: '1 vez por dia, fique invisível e inaudível para uma criatura de nível 9 ou menor (Sabedoria CD 15 resiste)', effect: { kind: 'note' } },
    ] },
  },

  weapons: [
    { id: 'boleadeira', name: 'Boleadeira', cost: 200, type: 'D', range: 'P', damage: '–', props: ['Enreda'] },
    { id: 'chicote', name: 'Chicote', cost: 1000, type: 'CD', range: 'A/P', damage: '1d4', props: ['Ac', 'Ch'] },
    { id: 'chicote-laminas', name: 'Chicote de lâminas', cost: 1200, type: 'CD', range: 'A/P', damage: '1d6', props: ['Ac', 'Ch'] },
    { id: 'cimitarra', name: 'Cimitarra', cost: 800, type: 'C', range: 'A', damage: '1d6', props: ['Ac'] },
    { id: 'funda', name: 'Funda', cost: 50, type: 'D', range: 'L', damage: '1d4', props: [] },
    { id: 'maca-estrela', name: 'Maça estrela', cost: 500, type: 'C', range: 'A', damage: '1d6/1d8', props: ['V'] },
    { id: 'pique', name: 'Pique', cost: 1000, type: 'C', range: '2×A', damage: '1d10', props: ['2M'], slots: 2 },
    { id: 'shuriken', name: 'Shuriken', cost: 100, type: 'D', range: 'P', damage: '1d4', props: [] },
    { id: 'zarabatana', name: 'Zarabatana', cost: 500, type: 'D', range: 'P', damage: '1', props: ['Silenciosa'] },
  ],
};
