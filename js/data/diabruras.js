// Cursed Scroll 1: Diabruras. Textos resumidos com palavras próprias.

const pick = { min: 12, max: 12, text: 'Escolha um talento desta tabela ou distribua +2 pontos de atributo', effect: { kind: 'pick' } };

const witchCasting = { list: 'bruxa', stat: 'CAR' };

export default {
  id: 'diabruras',
  name: 'Cursed Scroll 1: Diabruras',
  short: 'Diabruras',

  classes: [
    {
      id: 'bruxa', name: 'Bruxa', page: 10, hitDie: 4,
      desc: 'Conjuradora de maldições e presságios, sempre acompanhada de um familiar.',
      weaponsText: 'Adaga, cajado', weapons: ['adaga', 'cajado'],
      armorText: 'Armadura de couro', armor: ['couro'],
      languages: ['Diabólico', 'Primordial', 'Silvestre'],
      features: [
        { name: 'Familiar', desc: 'Um animal pequeno e leal (corvo, rato, sapo...) que fala Comum. Suas magias podem partir dele. Se morrer, você o traz de volta sacrificando 1d4 PV máximos.' },
        { name: 'Conjuração', desc: 'Conjura magias de bruxa com 1d20 + modificador de Carisma, CD 10 + grau. Se falhar, não pode repetir a magia até descansar. Um 1 natural rola na tabela de Falhas Diabólicas. Conhece 3 magias de grau 1.' },
      ],
      choices: [{ id: 'familiar', label: 'Seu familiar (animal e nome)', type: 'text', optional: true, placeholder: 'Ex.: corvo chamado Fuligem' }],
      spellcasting: { ...witchCasting, known: 3 },
      talents: 'bruxa',
      titles: {
        lawful: ['Vidente', 'Adivinha', 'Profeta', 'A Sábia', 'Baba'],
        chaotic: ['Sussurradora', 'Praguejante', 'Megera/Ancião', 'Velha/Tio', 'Baba'],
        neutral: ['Xamã', 'Conjuradora', 'Clarividente', 'Médium', 'Baba'],
      },
    },
    {
      id: 'ydris', name: 'Cavaleiro de São Ydris', page: 12, hitDie: 6,
      desc: 'Cavaleiro amaldiçoado que usa a escuridão e a feitiçaria para combater o mal.',
      weaponsText: 'Todas as armas corpo a corpo, besta', weapons: 'melee+besta',
      armorText: 'Todas as armaduras e escudos', armor: 'all',
      languages: ['Diabólico'],
      features: [
        { name: 'Possessão Demoníaca', desc: '3 vezes por dia, +1 no dano por 3 rodadas, mais metade do seu nível.' },
        { name: 'Conjuração', desc: 'Usa magias de bruxa com Carisma, mas só aprende a primeira no nível 3.' },
      ],
      spellcasting: { ...witchCasting, known: 0 },
      talents: 'ydris',
      titles: {
        lawful: ['Árbitro', 'Executor', 'Cavaleiro Marechal', 'Juiz', 'Justiceiro'],
        chaotic: ['Traidor', 'Caído', 'Perjuro', 'Renegado', 'Lorde Demônio'],
        neutral: ['Irmão/Irmã', 'Exorcista', 'Cavaleiro Reverendo', 'Inquisidor', 'Grande Inquisidor'],
      },
    },
    {
      id: 'profanador', name: 'Profanador', page: 14, hitDie: 6,
      desc: 'Servo de um patrono sobrenatural que lhe concede dons estranhos.',
      weaponsText: 'Adaga, besta, clava, espada longa, maça', weapons: ['adaga', 'besta', 'clava', 'espada-longa', 'maca'],
      armorText: 'Armadura de couro, cota de malha, escudos', armor: ['couro', 'cota', 'cota-mitral', 'escudo'],
      languageChoices: [{ count: 1, from: ['Celestial', 'Diabólico', 'Dracônico', 'Primordial', 'Silvestre'], label: 'Idioma do patrono' }],
      features: [
        { name: 'Patrono', desc: 'Você serve a um ser sobrenatural, que pode dar ou retirar seus dons a qualquer momento.' },
        { name: 'Dádiva Patronal', desc: 'No nível 1, rola uma Dádiva na tabela do seu patrono. Em toda nova rolagem de talento, pode usar a tabela do patrono no lugar da tabela da classe.' },
      ],
      requiresPatron: true,
      patronBoonAtLevel1: true,
      talents: 'profanador',
      titles: {
        lawful: ['Favorecido', 'Arauto', 'Eminente', 'Exaltado', 'Encarnação'],
        chaotic: ['Marcado', 'Fanático', 'Ocultista', 'Campeão', 'Precursor'],
        neutral: ['Escolhido', 'Canalizador', 'Profetizado', 'Transcendente', 'Avatar'],
      },
    },
  ],

  patrons: [
    { id: 'almazzat', name: 'Almazzat', desc: 'Arquidemônio com cabeça de lobo, seis olhos e seis chifres. Quer as Areias das Eras de seu pai.' },
    { id: 'kytheros', name: 'Kytheros', desc: 'O Lorde do Tempo, que vê todos os futuros e quer que cada destino se cumpra.' },
    { id: 'mugdulblub', name: 'Mugdulblub', desc: 'A Gosma Anciã entre as estrelas, que deseja dissolver toda forma física.' },
    { id: 'homem-salgueiro', name: 'O Homem-Salgueiro', desc: 'Figura fantasmagórica das florestas enevoadas, que se alimenta do medo.' },
    { id: 'shune', name: 'Shune, a Maléfica', desc: 'A Mãe Bruxa, que busca segredos ocultos e lendas perdidas.' },
    { id: 'titania', name: 'Titânia', desc: 'A volúvel Rainha das Fadas, que busca travessuras, beleza e arte.' },
  ],

  tables: {
    'class:bruxa': { dice: '2d6', entries: [
      { min: 2, max: 2, text: '1 vez por dia, teleporte-se até seu familiar usando o movimento', effect: { kind: 'note' } },
      { min: 3, max: 7, text: '+2 em Carisma ou +1 nos testes de conjuração de bruxa', effect: { kind: 'or', options: [
        { label: '+2 em Carisma', effect: { kind: 'stat', options: ['CAR'], amount: 2 } },
        { label: '+1 nos testes de conjuração', effect: { kind: 'cast', amount: 1 } },
      ] } },
      { min: 8, max: 9, text: 'Vantagem ao conjurar uma magia que você conhece', effect: { kind: 'note', ask: 'Qual magia?' } },
      { min: 10, max: 11, text: 'Aprenda mais uma magia de bruxa', effect: { kind: 'spell' } },
      pick,
    ] },
    'class:ydris': { dice: '2d6', entries: [
      { min: 2, max: 2, text: 'O bônus da Possessão Demoníaca aumenta em 1', effect: { kind: 'note' } },
      { min: 3, max: 6, text: '+1 em ataques corpo a corpo ou à distância', effect: { kind: 'atkOne', amount: 1 } },
      { min: 7, max: 9, text: '+2 em Força, Destreza ou Constituição', effect: { kind: 'stat', options: ['FOR', 'DES', 'CON'], amount: 2 } },
      { min: 10, max: 11, text: '+2 em Carisma ou +1 nos testes de conjuração de bruxa', effect: { kind: 'or', options: [
        { label: '+2 em Carisma', effect: { kind: 'stat', options: ['CAR'], amount: 2 } },
        { label: '+1 nos testes de conjuração', effect: { kind: 'cast', amount: 1 } },
      ] } },
      pick,
    ] },
    'class:profanador': { dice: '2d6', entries: [
      { min: 2, max: 2, text: 'Role uma Dádiva Patronal de qualquer patrono', effect: { kind: 'roll', table: 'patronAny' } },
      { min: 3, max: 6, text: '+1 em dois atributos diferentes', effect: { kind: 'stat2' } },
      { min: 7, max: 9, text: '+1 em ataques corpo a corpo ou à distância', effect: { kind: 'atkOne', amount: 1 } },
      { min: 10, max: 11, text: 'Role duas Dádivas Patronais e fique com uma', effect: { kind: 'roll', table: 'patron2' } },
      pick,
    ] },
    'patron:almazzat': { dice: '2d6', entries: [
      { min: 2, max: 2, text: '1 vez por dia, Vantagem em ataques corpo a corpo por 3 rodadas', effect: { kind: 'note' } },
      { min: 3, max: 7, text: 'Aprenda a usar 1 arma corpo a corpo ou +1 em ataques corpo a corpo', effect: { kind: 'or', options: [
        { label: 'Aprender uma arma corpo a corpo', effect: { kind: 'prof', melee: true } },
        { label: '+1 em ataques corpo a corpo', effect: { kind: 'atk', melee: 1 } },
      ] } },
      { min: 8, max: 9, text: '+2 em Força ou Constituição, ou +1 no dano corpo a corpo', effect: { kind: 'or', options: [
        { label: '+2 em Força ou Constituição', effect: { kind: 'stat', options: ['FOR', 'CON'], amount: 2 } },
        { label: '+1 no dano corpo a corpo', effect: { kind: 'dmg', melee: 1 } },
      ] } },
      { min: 10, max: 11, text: 'Vantagem nas rolagens de iniciativa', effect: { kind: 'note' } },
      pick,
    ] },
    'patron:kytheros': { dice: '2d6', entries: [
      { min: 2, max: 2, text: '1 vez por dia, obrigue o MJ a rolar de novo um dado', effect: { kind: 'note' } },
      { min: 3, max: 7, text: '+1 na CA por pressentimento sobrenatural', effect: { kind: 'ac', amount: 1 } },
      { min: 8, max: 9, text: '+2 em Força, Destreza ou Sabedoria', effect: { kind: 'stat', options: ['FOR', 'DES', 'SAB'], amount: 2 } },
      { min: 10, max: 11, text: '3 vezes por dia, some seu bônus de Sabedoria a uma rolagem', effect: { kind: 'note' } },
      pick,
    ] },
    'patron:mugdulblub': { dice: '2d6', entries: [
      { min: 2, max: 2, text: '1 vez por dia, vire uma poça de gosma por 3 rodadas', effect: { kind: 'note' } },
      { min: 3, max: 7, text: 'Use o valor máximo em 2 rolagens de pontos de vida', effect: { kind: 'maxHp', count: 2 } },
      { min: 8, max: 9, text: '+2 em Destreza ou Constituição', effect: { kind: 'stat', options: ['DES', 'CON'], amount: 2 } },
      { min: 10, max: 11, text: 'Imunidade a ácido, frio ou veneno', effect: { kind: 'note', ask: 'Qual imunidade?' } },
      pick,
    ] },
    'patron:homem-salgueiro': { dice: '2d6', entries: [
      { min: 2, max: 2, text: '1 vez por dia, teleporte-se até um local visível Longe', effect: { kind: 'note' } },
      { min: 3, max: 7, text: '+1 em ataques corpo a corpo ou à distância', effect: { kind: 'atkOne', amount: 1 } },
      { min: 8, max: 9, text: '+2 em Força ou Destreza', effect: { kind: 'stat', options: ['FOR', 'DES'], amount: 2 } },
      { min: 10, max: 11, text: '1 vez por dia, obrigue um ser Adjacente a testar moral', effect: { kind: 'note' } },
      pick,
    ] },
    'patron:shune': { dice: '2d6', entries: [
      { min: 2, max: 2, text: '1 vez por dia, leia a mente de quem tocar por 3 rodadas', effect: { kind: 'note' } },
      { min: 3, max: 7, text: 'Aprenda 1 magia de mago (grau até metade do seu nível), conjurada com Inteligência', effect: { kind: 'note', ask: 'Qual magia?' } },
      { min: 8, max: 9, text: '+2 em Destreza ou Inteligência', effect: { kind: 'stat', options: ['DES', 'INT'], amount: 2 } },
      { min: 10, max: 11, text: '+1 XP cada vez que descobrir um segredo valioso', effect: { kind: 'note' } },
      pick,
    ] },
    'patron:titania': { dice: '2d6', entries: [
      { min: 2, max: 2, text: '1 vez por dia, hipnotize uma criatura de nível 5 ou menor por 3 rodadas', effect: { kind: 'note' } },
      { min: 3, max: 7, text: 'Aprenda a usar arco longo ou +1 em ataques à distância', effect: { kind: 'or', options: [
        { label: 'Aprender arco longo', effect: { kind: 'prof', weapon: 'arco-longo' } },
        { label: '+1 em ataques à distância', effect: { kind: 'atk', ranged: 1 } },
      ] } },
      { min: 8, max: 9, text: '+2 em Destreza ou Carisma', effect: { kind: 'stat', options: ['DES', 'CAR'], amount: 2 } },
      { min: 10, max: 11, text: 'Magias hostis contra você são sempre difíceis de conjurar', effect: { kind: 'note' } },
      pick,
    ] },
  },

  backgroundTables: [
    { id: 'diabolico', name: 'Antecedentes diabólicos', page: 20, entries: [
      ['Eremita', 'Os ermos e suas criaturas são sua família.'],
      ['Exilado', 'Foi expulso por crimes, reais ou não.'],
      ['Nascido da Madeira', 'Foi encontrado no oco de um carvalho.'],
      ['Amnésico', 'Seu passado é um borrão, mas memórias voltam aos poucos.'],
      ['Assombrado', 'Um espírito inquieto quer algo de você.'],
      ['Fugitivo', 'Alguém anônimo ajudou você a sumir.'],
      ['Tocado Pelo Feérico', 'Fez amizade com uma fada quando criança.'],
      ['Nascido da Bruxa', 'Queimaram sua mãe, mas pouparam você.'],
      ['Coletor', 'Sabe o que é comestível e o que é mortal.'],
      ['Redentor', 'Precisa limpar o nome do seu povo.'],
      ['Marcado', 'Carrega uma marca sobrenatural. Maldição ou dom?'],
      ['Sacrifício', 'Ia ser sacrificado num ritual, mas escapou.'],
      ['Abandonado', 'Foi deixado para trás e se recusou a morrer.'],
      ['Caído', 'Caiu em desgraça. Vai aceitar ou se redimir?'],
      ['Atraído', 'Ouve um sussurro chamando e o segue.'],
      ['Asceta', 'As pessoas temem você, mas pedem seus conselhos.'],
      ['Criança-lobo', 'Chegou à cidade ainda criança, vestido de peles.'],
      ['Curador', 'Entende como vida e morte se ligam.'],
      ['Escolhido', 'Uma entidade sobrenatural o escolheu para um propósito.'],
      ['Nascido do Demônio', 'Um de seus ancestrais é um demônio poderoso.'],
    ] },
  ],

  spells: {
    bruxa: [
      { id: 'caldeirao', name: 'Caldeirão', tier: 1, desc: 'Um caldeirão fervente aparece: conserta um item quebrado, solta um sapo que obedece por 3 rodadas, ou guarda até 3 espaços de itens para a próxima conjuração.' },
      { id: 'carvalho-freixo-espinheiro', name: 'Carvalho, Freixo e Espinheiro', tier: 1, desc: 'Enquanto se concentra, fadas, diabos e demônios não podem atacar, possuir ou encantar você.' },
      { id: 'danca-sombras', name: 'Dança das Sombras', tier: 1, desc: 'Cria uma ilusão do tamanho de uma pessoa, com som, por 3 rodadas. Tocá-la revela a farsa.' },
      { id: 'encantar-pessoa', name: 'Encantar Pessoa', tier: 1, desc: 'Um humanoide de nível 2 ou menor passa a ver você como amigo por 1d8 dias, até perceber que foi enganado.' },
      { id: 'fantoche', name: 'Fantoche', tier: 1, desc: 'Um humanoide de nível 2 ou menor que você toca imita seus movimentos enquanto você se concentra.' },
      { id: 'hipnotizar', name: 'Hipnotizar', tier: 1, desc: 'Uma criatura de nível 3 ou menor que veja você fica atônita enquanto você se concentra.' },
      { id: 'homem-salgueiro', name: 'Homem-Salgueiro', tier: 1, desc: 'Uma criatura de nível 2 ou menor faz um teste de moral na hora, mesmo que normalmente seja imune.' },
      { id: 'luz-bruxa', name: 'Luz de Bruxa', tier: 1, desc: 'Um fogo-fátuo flutuante ilumina ao redor dele e se move sob seu comando enquanto você se concentra.' },
      { id: 'mau-olhado', name: 'Mau Olhado', tier: 1, desc: 'O alvo sofre 1d4 de dano e não consegue ver você até o fim do próximo turno dele.' },
      { id: 'nevoa', name: 'Névoa', tier: 1, desc: 'Uma névoa densa envolve você e se move junto; ataques contra quem está nela têm Desvantagem.' },
    ],
  },
};
