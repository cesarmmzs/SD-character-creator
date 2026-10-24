// Livro de Regras base. Textos resumidos com palavras próprias; consulte a página indicada para a regra completa.
// Custos em peças de cobre (PC): 1 PO = 100 PC, 1 PP = 10 PC.
import { MAGO_SUPERIORES, SACERDOTE_SUPERIORES } from './magias-base.js';

// Magias conhecidas por grau, do nível 1 ao 10, conforme a tabela de cada classe.
export const WIZARD_SPELLS = [[3], [4], [4, 1], [4, 2], [4, 2, 1], [4, 3, 2], [4, 3, 2, 1], [4, 4, 2, 2], [4, 4, 3, 2, 1], [4, 4, 4, 2, 2]];
const PRIEST_SPELLS = [[2], [3], [3, 1], [3, 2], [3, 2, 1], [3, 2, 2], [3, 3, 2, 1], [3, 3, 2, 2], [3, 3, 2, 2, 1], [3, 3, 3, 2, 2]];

export default {
  id: 'base',
  name: 'Livro de Regras',
  short: 'Base',
  cover: 'img/livro_base_cover.jpg',
  required: true,

  ancestries: [
    {
      id: 'anao', name: 'Anão', page: 16, roll: [7, 8],
      desc: 'Povo robusto das montanhas, tão resistente quanto a pedra que escava.',
      languages: ['Comum', 'Anão'],
      feature: { name: 'Robusto', desc: 'Começa com +2 PV e rola os pontos de vida de cada nível com Vantagem (rola dois dados e fica com o maior).' },
    },
    {
      id: 'elfo', name: 'Elfo', page: 16, roll: [5, 6],
      desc: 'Povo gracioso e longevo, que valoriza o saber e a beleza e enxerga longe.',
      languages: ['Comum', 'Élfico', 'Silvestre'],
      feature: { name: 'Visão Aguçada', desc: 'Escolha um: +1 nos ataques com armas à distância, ou +1 nos testes de conjuração.' },
      choice: { id: 'elfBonus', label: 'Bônus da Visão Aguçada', options: [{ id: 'ranged', name: '+1 em ataques à distância' }, { id: 'cast', name: '+1 em testes de conjuração' }] },
    },
    {
      id: 'goblin', name: 'Goblin', page: 16, roll: [12, 12],
      desc: 'Pequenos, espertos e ferozes, à vontade em lugares escuros e apertados.',
      languages: ['Comum', 'Goblin'],
      feature: { name: 'Sentidos Apurados', desc: 'Você nunca é pego de surpresa.' },
    },
    {
      id: 'halfling', name: 'Halfling', page: 16, roll: [9, 10],
      desc: 'Gente pequena e alegre do campo, travessa e apegada aos prazeres simples.',
      languages: ['Comum'],
      feature: { name: 'Furtivo', desc: 'Uma vez por dia, pode ficar invisível por 3 rodadas.' },
    },
    {
      id: 'humano', name: 'Humano', page: 17, roll: [1, 4],
      desc: 'Povo diverso e adaptável, que aprende rápido e vai longe.',
      languages: ['Comum'],
      languageChoices: [{ count: 1, from: 'common', label: 'Idioma comum adicional' }],
      feature: { name: 'Ambicioso', desc: 'Ganha uma rolagem de talento extra no nível 1.' },
      extraTalentAtLevel1: true,
    },
    {
      id: 'meio-orc', name: 'Meio-orc', page: 17, roll: [11, 11],
      desc: 'Guerreiros imponentes, com a força dos orcs e a ousadia dos humanos.',
      languages: ['Comum', 'Orc'],
      feature: { name: 'Poderoso', desc: '+1 nas jogadas de ataque e de dano com armas corpo a corpo.' },
      bonus: { atkMelee: 1, dmgMelee: 1 },
    },
  ],

  classes: [
    {
      id: 'guerreiro', name: 'Guerreiro', page: 18, hitDie: 8,
      desc: 'Combatente de linha de frente, treinado com qualquer arma e armadura.',
      weaponsText: 'Todas as armas', weapons: 'all',
      armorText: 'Todas as armaduras e escudos', armor: 'all',
      features: [
        { name: 'Carregador', desc: 'Some seu modificador de Constituição (se positivo) aos espaços de equipamento.' },
        { name: 'Maestria em Armas', desc: 'Escolha um tipo de arma: +1 em ataque e dano com ela, mais metade do seu nível (arredondado para baixo).' },
        { name: 'Bravura', desc: 'Escolha Força ou Destreza: você tem Vantagem nos testes desse atributo para vencer uma força oposta (arrombar uma porta, escapar de correntes).' },
      ],
      choices: [
        { id: 'mastery', label: 'Arma da Maestria', type: 'weapon', help: 'masteryHelp' },
        { id: 'grit', label: 'Bravura', options: [{ id: 'FOR', name: 'Força' }, { id: 'DES', name: 'Destreza' }] },
      ],
      carrier: true,
      talents: 'guerreiro',
      titles: {
        lawful: ['Escudeiro', 'Ginete', 'Cavaleiro', 'Barão', 'Lorde/Dama'],
        chaotic: ['Valete', 'Bandido', 'Matador', 'Saqueador', 'Senhor da Guerra'],
        neutral: ['Guerreiro', 'Bárbaro', 'Berserk', 'Chefe de Guerra', 'Líder'],
      },
    },
    {
      id: 'ladrao', name: 'Ladrão', page: 20, hitDie: 4,
      desc: 'Especialista em furtividade, armadilhas e golpes pelas costas.',
      weaponsText: 'Adaga, arco curto, besta, clava, espada curta',
      weapons: ['adaga', 'arco-curto', 'besta', 'clava', 'espada-curta'],
      armorText: 'Armadura de couro, cota de malha de mitral',
      armor: ['couro', 'cota-mitral'],
      features: [
        { name: 'Apunhalada Pelas Costas', desc: 'Ao acertar quem não percebeu seu ataque, cause um dado de dano extra da arma, mais um dado para cada 2 níveis.' },
        { name: 'Ladroagem', desc: 'Vantagem para escalar, se esgueirar e esconder, usar disfarces, achar e desarmar armadilhas, bater carteiras e abrir fechaduras. Suas ferramentas não ocupam espaço.' },
      ],
      talents: 'ladrao',
      titles: {
        lawful: ['Malandro', 'Assaltante', 'Trapaceiro', 'Subchefe', 'Chefe'],
        chaotic: ['Rufião', 'Degolador', 'Sombra', 'Assassino', 'Fantasma'],
        neutral: ['Bandoleiro', 'Fora da Lei', 'Ladino', 'Renegado', 'Rei/Rainha dos Bandidos'],
      },
    },
    {
      id: 'mago', name: 'Mago', page: 22, hitDie: 4,
      desc: 'Estudioso da magia arcana, frágil no corpo e poderoso na mente.',
      weaponsText: 'Adaga, cajado', weapons: ['adaga', 'cajado'],
      armorText: 'Nenhuma', armor: [],
      languageChoices: [
        { count: 2, from: 'common', label: 'Dois idiomas comuns adicionais' },
        { count: 2, from: 'rare', label: 'Dois idiomas raros' },
      ],
      features: [
        { name: 'Conjuração', desc: 'Conjura magias de mago com teste de 1d20 + modificador de Inteligência. Conhece 3 magias de grau 1.' },
        { name: 'Aprender Magias', desc: 'Pode aprender uma magia de um pergaminho estudando um dia e passando num teste de Inteligência CD 15. O pergaminho é gasto.' },
      ],
      spellcasting: { list: 'mago', stat: 'INT', known: 3, byLevel: WIZARD_SPELLS },
      talents: 'mago',
      titles: {
        lawful: ['Aprendiz', 'Conjurador', 'Arcanista', 'Magista', 'Arquimago'],
        chaotic: ['Adepto', 'Canalizador', 'Bruxo', 'Diabolista', 'Feiticeiro'],
        neutral: ['Xamã', 'Vidente', 'Guardião', 'Sábio', 'Druida'],
      },
    },
    {
      id: 'sacerdote', name: 'Sacerdote', page: 24, hitDie: 6,
      desc: 'Guerreiro da fé que canaliza os milagres do seu deus.',
      weaponsText: 'Adaga, besta, cajado, clava, espada longa, maça, martelo de guerra',
      weapons: ['adaga', 'besta', 'cajado', 'clava', 'espada-longa', 'maca', 'martelo-guerra'],
      armorText: 'Todas as armaduras e escudos', armor: 'all',
      languageChoices: [{ count: 1, from: ['Celestial', 'Diabólico', 'Primordial'], label: 'Idioma sagrado' }],
      features: [
        { name: 'Divindade', desc: 'Serve a um deus do mesmo alinhamento e carrega o símbolo sagrado dele (não ocupa espaço). Atos blasfemos podem custar seus poderes.' },
        { name: 'Conjuração', desc: 'Conjura magias de sacerdote com teste de 1d20 + modificador de Sabedoria. Conhece 2 magias de grau 1.' },
        { name: 'Expulsar Mortos-vivos', desc: 'Conhece essa magia de graça, sem contar no limite de magias.' },
      ],
      requiresDeity: 'sameAlignment',
      spellcasting: { list: 'sacerdote', stat: 'SAB', known: 2, byLevel: PRIEST_SPELLS, bonusSpells: ['expulsar-mortos-vivos'] },
      talents: 'sacerdote',
      titles: {
        lawful: ['Acólito', 'Cruzado', 'Templário', 'Campeão', 'Paladino'],
        chaotic: ['Iniciado', 'Fanático', 'Cultista', 'Carrasco', 'Cavaleiro do Caos'],
        neutral: ['Rastreador', 'Invocador', 'Arúspice', 'Místico', 'Oráculo'],
      },
    },
  ],

  tables: {
    'class:guerreiro': { dice: '2d6', entries: [
      { min: 2, max: 2, text: 'Maestria em Armas em mais um tipo de arma', effect: { kind: 'mastery' } },
      { min: 3, max: 6, text: '+1 em ataques corpo a corpo e à distância', effect: { kind: 'atk', melee: 1, ranged: 1 } },
      { min: 7, max: 9, text: '+2 em Força, Destreza ou Constituição', effect: { kind: 'stat', options: ['FOR', 'DES', 'CON'], amount: 2 } },
      { min: 10, max: 11, text: '+1 na CA ao usar um tipo de armadura escolhido', effect: { kind: 'acArmor' } },
      { min: 12, max: 12, text: 'Escolha um talento desta tabela ou distribua +2 pontos de atributo', effect: { kind: 'pick' } },
    ] },
    'class:ladrao': { dice: '2d6', entries: [
      { min: 2, max: 2, text: 'Vantagem nas rolagens de iniciativa', effect: { kind: 'note' } },
      { min: 3, max: 5, text: 'Apunhalada Pelas Costas causa +1 dado de dano', effect: { kind: 'note' } },
      { min: 6, max: 9, text: '+2 em Força, Destreza ou Carisma', effect: { kind: 'stat', options: ['FOR', 'DES', 'CAR'], amount: 2 } },
      { min: 10, max: 11, text: '+1 em ataques corpo a corpo e à distância', effect: { kind: 'atk', melee: 1, ranged: 1 } },
      { min: 12, max: 12, text: 'Escolha um talento desta tabela ou distribua +2 pontos de atributo', effect: { kind: 'pick' } },
    ] },
    'class:mago': { dice: '2d6', entries: [
      { min: 2, max: 2, text: 'Crie um item mágico aleatório do tipo que escolher', effect: { kind: 'note' } },
      { min: 3, max: 7, text: '+2 em Inteligência ou +1 nos testes de conjuração de mago', effect: { kind: 'or', options: [
        { label: '+2 em Inteligência', effect: { kind: 'stat', options: ['INT'], amount: 2 } },
        { label: '+1 nos testes de conjuração', effect: { kind: 'cast', amount: 1 } },
      ] } },
      { min: 8, max: 9, text: 'Vantagem ao conjurar uma magia que você conhece', effect: { kind: 'note', ask: 'Qual magia?' } },
      { min: 10, max: 11, text: 'Aprenda mais uma magia de mago', effect: { kind: 'spell' } },
      { min: 12, max: 12, text: 'Escolha um talento desta tabela ou distribua +2 pontos de atributo', effect: { kind: 'pick' } },
    ] },
    'class:sacerdote': { dice: '2d6', entries: [
      { min: 2, max: 2, text: 'Vantagem ao conjurar uma magia que você conhece', effect: { kind: 'note', ask: 'Qual magia?' } },
      { min: 3, max: 6, text: '+1 em ataques corpo a corpo ou à distância', effect: { kind: 'atkOne', amount: 1 } },
      { min: 7, max: 9, text: '+1 nos testes de conjuração de sacerdote', effect: { kind: 'cast', amount: 1 } },
      { min: 10, max: 11, text: '+2 em Força ou Sabedoria', effect: { kind: 'stat', options: ['FOR', 'SAB'], amount: 2 } },
      { min: 12, max: 12, text: 'Escolha um talento desta tabela ou distribua +2 pontos de atributo', effect: { kind: 'pick' } },
    ] },
  },

  backgroundTables: [
    { id: 'base', name: 'Antecedentes (livro base)', page: 26, entries: [
      ['Garoto de Rua', 'Cresceu nas ruas duras de uma cidade grande.'],
      ['Procurado', 'Há uma recompensa pela sua cabeça, mas você tem aliados.'],
      ['Iniciado do Culto', 'Conhece segredos e rituais proibidos.'],
      ['Guilda dos Ladrões', 'Tem contatos, conexões e dívidas no submundo.'],
      ['Banido', 'Seu povo o expulsou por crimes que dizem que você cometeu.'],
      ['Órfão', 'Foi criado por um guardião fora do comum.'],
      ['Aprendiz de Mago', 'Tem jeito natural para a magia.'],
      ['Joalheiro', 'Avalia valor e autenticidade de objetos com facilidade.'],
      ['Herbalista', 'Conhece plantas, remédios e venenos.'],
      ['Bárbaro', 'Deixou a horda, mas a horda não saiu de você.'],
      ['Mercenário', 'Lutou por dinheiro, ao lado de amigos e inimigos.'],
      ['Marinheiro', 'Pirata, corsário ou mercador: o mar é sua casa.'],
      ['Acólito', 'Foi treinado em ritos e doutrinas religiosas.'],
      ['Soldado', 'Serviu num exército organizado.'],
      ['Guardião', 'As florestas e os ermos são seu verdadeiro lar.'],
      ['Batedor', 'Sobreviveu por ser furtivo, atento e rápido.'],
      ['Menestrel', 'Viajou longe com charme e talento artístico.'],
      ['Estudioso', 'Sabe muito de história antiga e lendas.'],
      ['Nobre', 'Seu sobrenome famoso abre muitas portas.'],
      ['Cirurgião', 'Entende de anatomia, cirurgia e primeiros socorros.'],
    ] },
  ],

  deities: [
    { id: 'terragnis', name: 'Santa Terragnis', alignment: 'lawful', page: 28, desc: 'Cavaleira lendária que virou deusa; padroeira da justiça e da integridade.' },
    { id: 'gede', name: 'Gede', alignment: 'neutral', page: 28, desc: 'Deusa dos banquetes, da alegria e da natureza selvagem; querida por elfos e halflings.' },
    { id: 'madeera', name: 'Madeera, a Pactuadora', alignment: 'lawful', page: 28, desc: 'Primeira manifestação da Ordem; as leis da realidade estão escritas em sua pele.' },
    { id: 'ord', name: 'Ord', alignment: 'neutral', page: 28, desc: 'O Inflexível, deus da magia, do conhecimento, dos segredos e do equilíbrio.' },
    { id: 'memnon', name: 'Memnon', alignment: 'chaotic', page: 29, desc: 'Primeira manifestação do Caos, gêmeo de Madeera, que quer rasgar as leis do Pacto.' },
    { id: 'shune', name: 'Shune, a Maléfica', alignment: 'chaotic', page: 29, desc: 'Sussurra segredos arcanos a bruxas e feiticeiros; quer tomar o lugar de Ord.' },
    { id: 'ramlaat', name: 'Ramlaat', alignment: 'chaotic', page: 29, desc: 'O Saqueador, a Horda; venerado por muitos orcs que creem que só os fortes sobrevivem.' },
  ],

  weapons: [
    { id: 'adaga', name: 'Adaga', cost: 100, type: 'CD', range: 'A/P', damage: '1d4', props: ['Ac', 'Ar'] },
    { id: 'arco-curto', name: 'Arco curto', cost: 600, type: 'D', range: 'L', damage: '1d4', props: ['2M'], ammo: 'flechas' },
    { id: 'arco-longo', name: 'Arco longo', cost: 800, type: 'D', range: 'L', damage: '1d8', props: ['2M'], ammo: 'flechas' },
    { id: 'azagaia', name: 'Azagaia', cost: 50, type: 'CD', range: 'A/L', damage: '1d4', props: ['Ar'] },
    { id: 'besta', name: 'Besta', cost: 800, type: 'D', range: 'L', damage: '1d6', props: ['2M', 'R'], ammo: 'virotes' },
    { id: 'cajado', name: 'Cajado', cost: 50, type: 'C', range: 'A', damage: '1d4', props: ['2M'] },
    { id: 'clava', name: 'Clava', cost: 5, type: 'C', range: 'A', damage: '1d4', props: [] },
    { id: 'espada-curta', name: 'Espada curta', cost: 700, type: 'C', range: 'A', damage: '1d6', props: [] },
    { id: 'espada-bastarda', name: 'Espada bastarda', cost: 1000, type: 'C', range: 'A', damage: '1d8/1d10', props: ['V'], slots: 2 },
    { id: 'espada-grande', name: 'Espada grande', cost: 1200, type: 'C', range: 'A', damage: '1d12', props: ['2M'], slots: 2 },
    { id: 'espada-longa', name: 'Espada longa', cost: 900, type: 'C', range: 'A', damage: '1d8', props: [] },
    { id: 'lanca', name: 'Lança', cost: 50, type: 'CD', range: 'A/P', damage: '1d6', props: ['Ar'] },
    { id: 'maca', name: 'Maça', cost: 500, type: 'C', range: 'A', damage: '1d6', props: [] },
    { id: 'machado-grande', name: 'Machado grande', cost: 1000, type: 'C', range: 'A', damage: '1d8/1d10', props: ['V'], slots: 2 },
    { id: 'martelo-guerra', name: 'Martelo de guerra', cost: 1000, type: 'C', range: 'A', damage: '1d10', props: ['2M'] },
  ],

  armor: [
    { id: 'couro', name: 'Armadura de couro', cost: 1000, slots: 1, ac: 11, dex: true, page: 36 },
    { id: 'cota', name: 'Cota de malha', cost: 6000, slots: 2, ac: 13, dex: true, notes: 'Desvantagem em furtividade e natação' },
    { id: 'placas', name: 'Armadura de placas', cost: 13000, slots: 3, ac: 15, dex: false, notes: 'Desvantagem em furtividade, não pode nadar' },
    { id: 'cota-mitral', name: 'Cota de malha de mitral', cost: 24000, slots: 1, ac: 13, dex: true, base: 'cota', notes: 'Sem penalidades' },
    { id: 'placas-mitral', name: 'Armadura de placas de mitral', cost: 52000, slots: 2, ac: 15, dex: false, base: 'placas', notes: 'Sem penalidades' },
    { id: 'escudo', name: 'Escudo', cost: 1000, slots: 1, shield: 2, notes: 'Ocupa uma mão' },
  ],

  // unit = como a quantidade é contada; buy = unidades por compra; perSlot = unidades por espaço
  gear: [
    { id: 'arpeu', name: 'Arpéu', cost: 100, buy: 1, perSlot: 1, desc: 'Gancho de três pontas para prender numa corda.' },
    { id: 'corda', name: 'Corda (18 m)', cost: 100, buy: 1, perSlot: 1, desc: 'Corda de cânhamo.' },
    { id: 'cravos', name: 'Cravos de ferro', cost: 100, buy: 10, perSlot: 10, desc: 'Cravos com furo para corda; vendidos em 10.' },
    { id: 'espelho', name: 'Espelho', cost: 1000, buy: 1, perSlot: 1, desc: 'Espelho pequeno e polido.' },
    { id: 'estrepes', name: 'Estrepes (saco)', cost: 50, buy: 1, perSlot: 1, desc: 'Quem pisa sofre 1 de dano e anda com metade da velocidade por 10 rodadas.' },
    { id: 'flechas', name: 'Flechas', cost: 100, buy: 20, perSlot: 20, desc: 'Munição de arcos; vendidas em 20.' },
    { id: 'frasco', name: 'Frasco ou garrafa', cost: 30, buy: 1, perSlot: 1, desc: 'Recipiente de vidro.' },
    { id: 'lampiao', name: 'Lampião', cost: 500, buy: 1, perSlot: 1, desc: 'Ilumina o dobro da distância Perto; gasta óleo.' },
    { id: 'mochila', name: 'Mochila', cost: 200, buy: 1, perSlot: 1, freeFirst: 1, desc: 'Guarda seu equipamento. A primeira não ocupa espaço.' },
    { id: 'oleo', name: 'Óleo (frasco)', cost: 50, buy: 1, perSlot: 1, desc: 'Abastece um lampião por 1 hora, ou queima no chão causando 1d4 por rodada.' },
    { id: 'pe-de-cabra', name: 'Pé de cabra', cost: 50, buy: 1, perSlot: 1, desc: 'Vantagem para forçar coisas emperradas.' },
    { id: 'pederneira', name: 'Pederneira', cost: 50, buy: 1, perSlot: 1, desc: 'Acende fogo sem precisar de teste.' },
    { id: 'racoes', name: 'Rações', cost: 50, buy: 3, perSlot: 3, desc: 'Comida e água para um dia; vendidas em 3.' },
    { id: 'tocha', name: 'Tocha', cost: 50, buy: 1, perSlot: 1, desc: 'Ilumina até Perto por 1 hora de tempo real.' },
    { id: 'vara', name: 'Vara (3 m)', cost: 50, buy: 1, perSlot: 1, desc: 'Vara de madeira para cutucar o que não se quer tocar.' },
    { id: 'virotes', name: 'Virotes de besta', cost: 100, buy: 20, perSlot: 20, desc: 'Munição de bestas; vendidos em 20.' },
  ],

  kit: { name: 'Kit de exploração', cost: 700, items: [['mochila', 1], ['pederneira', 1], ['tocha', 2], ['racoes', 3], ['cravos', 10], ['arpeu', 1], ['corda', 1]] },

  // d12, personagens de nível 0 (pág. 33)
  level0Gear: [
    [['tocha', 1]], [['adaga', 1]], [['vara', 1]], [['arco-curto', 1], ['flechas', 5]], [['corda', 1]], [['oleo', 1]],
    [['pe-de-cabra', 1]], [['cravos', 10]], [['pederneira', 1]], [['arpeu', 1]], [['clava', 1]], [['estrepes', 1]],
  ],

  languages: {
    common: [
      ['Anão', 'Anões'], ['Comum', 'A maioria dos humanoides'], ['Élfico', 'Elfos'], ['Gigante', 'Gigantes, ogros, trolls'],
      ['Goblin', 'Goblins, bugbears, hobgoblins'], ['Merrano', 'Sereianos, sahuagins'], ['Orc', 'Orcs'],
      ['Reptiliano', 'Homens-lagarto, viperianos'], ['Silvestre', 'Centauros, dríades, fadas'], ['Thaniano', 'Homens-fera, minotauros'],
    ],
    rare: [['Celestial', 'Anjos'], ['Diabólico', 'Demônios e diabos'], ['Dracônico', 'Dragões'], ['Primordial', 'Elementais e seres antigos']],
  },

  spells: {
    mago: [
      { id: 'alarme', name: 'Alarme', tier: 1, desc: 'Marca um objeto tocado (como uma porta); se alguém não autorizado tocá-lo ou passar, um sino soa na sua mente. Dura 1 dia.' },
      { id: 'armadura-arcana', name: 'Armadura Arcana', tier: 1, desc: 'Sua CA vira 14 (18 num sucesso crítico) por 10 rodadas.' },
      { id: 'detectar-magia', name: 'Detectar Magia', tier: 1, desc: 'Sente magia por perto enquanto se concentra; com 2 rodadas, identifica o tipo geral.' },
      { id: 'disco-flutuante', name: 'Disco Flutuante', tier: 1, desc: 'Um disco de força que carrega 20 espaços de equipamento e segue você por 10 rodadas.' },
      { id: 'encantar-pessoa', name: 'Encantar Pessoa', tier: 1, desc: 'Um humanoide de nível 2 ou menor passa a ver você como amigo por 1d8 dias, até perceber que foi enganado.' },
      { id: 'luz', name: 'Luz', tier: 1, desc: 'Um objeto tocado brilha até a distância Perto por 1 hora de tempo real.' },
      { id: 'maos-flamejantes', name: 'Mãos Flamejantes', tier: 1, desc: 'Um círculo de fogo ao seu redor causa 1d6 de dano a quem estiver Adjacente.' },
      { id: 'missil-magico', name: 'Míssil Mágico', tier: 1, desc: 'Um raio de força causa 1d4 de dano a um alvo Longe. Você tem Vantagem para conjurá-la.' },
      { id: 'obstruir-porta', name: 'Obstruir Porta', tier: 1, desc: 'Mantém uma passagem fechada por 10 rodadas; quem quiser abrir precisa vencer seu teste com Força.' },
      { id: 'protecao-mal', name: 'Proteção Contra o Mal', tier: 1, desc: 'Seres caóticos têm Desvantagem para atacar o alvo e não podem possuí-lo ou encantá-lo, enquanto você se concentra.' },
      { id: 'queda-suave', name: 'Queda Suave', tier: 1, desc: 'Conjurada enquanto cai: você desce devagar e pousa em segurança.' },
      { id: 'sono', name: 'Sono', tier: 1, desc: 'Criaturas vivas de nível 2 ou menor numa área Perto caem num sono profundo.' },
      ...MAGO_SUPERIORES,
    ],
    sacerdote: [
      { id: 'arma-sagrada', name: 'Arma Sagrada', tier: 1, desc: 'Uma arma tocada fica mágica, com +1 em ataque e dano por 5 rodadas.' },
      { id: 'curar-ferimentos', name: 'Curar Ferimentos', tier: 1, desc: 'Um alvo tocado recupera 1d6 PV (mais 1d6 a cada 2 níveis).' },
      { id: 'escudo-fe', name: 'Escudo da Fé', tier: 1, desc: '+2 na sua CA por 5 rodadas.' },
      { id: 'expulsar-mortos-vivos', name: 'Expulsar Mortos-vivos', tier: 1, desc: 'Mortos-vivos por perto testam Carisma contra sua conjuração: fogem, ou são destruídos se falharem por muito.', free: true },
      { id: 'luz', name: 'Luz', tier: 1, desc: 'Um objeto tocado brilha até a distância Perto por 1 hora de tempo real.' },
      { id: 'protecao-mal', name: 'Proteção Contra o Mal', tier: 1, desc: 'Seres caóticos têm Desvantagem para atacar o alvo e não podem possuí-lo ou encantá-lo, enquanto você se concentra.' },
      ...SACERDOTE_SUPERIORES,
    ],
  },

  names: {
    anao: ['Hilde', 'Torbin', 'Marga', 'Bruno', 'Karina', 'Naugrim', 'Brenna', 'Darvin', 'Elga', 'Alric', 'Isolde', 'Gendry', 'Bruga', 'Junnor', 'Vidrid', 'Torson', 'Brielle', 'Ulfgar', 'Sarna', 'Grimm'],
    elfo: ['Eliara', 'Ryarn', 'Sariel', 'Tirolas', 'Galira', 'Varos', 'Daeniel', 'Axidor', 'Hiralia', 'Cyrwin', 'Lothiel', 'Zaphiel', 'Nayra', 'Ithior', 'Amriel', 'Elyon', 'Jirwyn', 'Natinel', 'Fiora', 'Ruhiel'],
    goblin: ['Iggs', 'Tark', 'Nix', 'Lenk', 'Roke', 'Fitz', 'Tila', 'Riggs', 'Prim', 'Zeb', 'Finn', 'Borg', 'Yark', 'Deeg', 'Nibs', 'Brak', 'Fink', 'Rizzo', 'Squib', 'Grix'],
    halfling: ['Willow', 'Benny', 'Annie', 'Tucker', 'Marie', 'Hobb', 'Cora', 'Gordie', 'Rose', 'Ardo', 'Alma', 'Norbert', 'Jennie', 'Barvin', 'Tilly', 'Pike', 'Lydia', 'Marlow', 'Astrid', 'Jasper'],
    humano: ['Zali', 'Bram', 'Clara', 'Nattias', 'Rina', 'Denton', 'Mirena', 'Aran', 'Morgan', 'Giralt', 'Tamra', 'Oscar', 'Ishana', 'Rogar', 'Jasmin', 'Tarin', 'Yuri', 'Malchor', 'Lienna', 'Godfrey'],
    'meio-orc': ['Vara', 'Gralk', 'Ranna', 'Korv', 'Zasha', 'Hrogar', 'Klara', 'Tragan', 'Brolga', 'Drago', 'Yelena', 'Krull', 'Ulara', 'Tulk', 'Shiraal', 'Wulf', 'Ivara', 'Hirok', 'Aja', 'Zoraan'],
  },
};

