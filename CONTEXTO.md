# Contexto: Criador de Personagens Shadowdark

Documento para usar como ponto de partida de um novo projeto (por exemplo, um programa para deixar as sessões de Shadowdark mais dinâmicas). Ele resume o que o criador de personagens já faz, como está construído e quais decisões de mesa já foram tomadas, para que nada disso precise ser redescoberto.

- Repositório: https://github.com/cesarmmzs/SD-character-creator (público)
- Site no ar: https://cesarmmzs.github.io/SD-character-creator/
- Estado em 18/11/2026: fases 1 a 7 entregues e mergeadas (PRs #1 a #9), 19 testes passando.
- Idioma: tudo em português do Brasil (interface, código comentado, commits).

---

## 1. Objetivo

Permitir que um jogador novo crie um personagem de Shadowdark RPG de forma fácil e intuitiva, no celular, usando o Livro de Regras base e os suplementos Cursed Scroll 1, 2 e 3 como referência. O app faz todas as contas e explica cada campo com um botão **?** que cita a página do livro.

Além da criação, o app já virou uma ficha de jogo: sobe de nível, controla PV atual, XP, moedas e mochila. Também tem um **modo mestre** para gerar vários personagens aleatórios de uma vez.

## 2. Restrição importante: direitos dos livros

Os PDFs (livro base e os três suplementos, em PT-BR) são cópias compradas, com os dados do comprador impressos nas páginas.

- **Nunca copiar texto dos livros** para o repositório (que é público).
- Toda regra, magia, talento ou descrição é **resumida com palavras próprias**, com o número da página para consulta (`page: 16` nos dados, "pág. 13" nos textos).
- O app se apresenta como ferramenta de fã, não oficial. Shadowdark RPG é da The Arcane Library.
- Ilustração de fundo, logo e capas em `img/` são usadas como referência visual de fã, com crédito no README.

Onde estão as regras nos livros: criação de personagem no livro base págs. 12 a 42; classes novas nos suplementos págs. 9 a 22 de cada um. Os suplementos trazem 8 classes novas e nenhuma ancestralidade nova.

## 3. Arquitetura

- **Site estático, HTML + CSS + JavaScript puro (módulos ES), sem build, sem dependências, sem framework.**
- Hospedado no **GitHub Pages** (pasta raiz do repositório; há `.nojekyll`). Observação: o Pages foi configurado inicialmente na branch `fase-1-criador`; o recomendado é apontar para `main`.
- **Mobile-first**: alvos de toque de 44 px, coluna única de no máximo 760 px.
- **PWA offline**: `manifest.webmanifest` + `sw.js` (estratégia rede primeiro, cache se offline). Ao adicionar ou renomear arquivos, atualizar a lista `FILES` e subir a versão `CACHE` (hoje `sdcc-v9`).
- **Dados no próprio aparelho** (`localStorage`), com exportar/importar em `.json`. Não há servidor nem contas.
- Navegação por hash: `#/` (início), `#/criar`, `#/ficha/<id>`, `#/nivel/<id>`, `#/mestre` (ver `route()` em `js/app.js`).
- Renderização por template strings: cada tela é uma função que devolve HTML; eventos são delegados por atributos `data-act` (ação) e `data-value`, e os campos usam ligação por caminho (`data-bind`/`path`, com `getAt`/`setAt` de `js/ui.js`). Depois de cada ação, `persist()` + `render()`.

Rodar localmente:

```sh
python3 -m http.server 8000   # abrir http://localhost:8000
node --test tests/*.test.mjs  # testes
```

## 4. Estrutura de arquivos

| Arquivo | Papel |
| --- | --- |
| `index.html` | Casca da página; carrega `js/app.js` como módulo |
| `css/style.css` | Tema inteiro (variáveis em `:root`) |
| `js/app.js` | Rotas, telas (início, ficha, subir de nível, modo mestre), tratamento de eventos |
| `js/wizard.js` | Etapas do assistente de criação (`STEPS`) |
| `js/sheet.js` | Ficha final: PV, XP, moedas, mochila, ataques, magias |
| `js/rules.js` | **Motor de regras** puro (sem DOM): rolagens, modificadores, talentos, PV, CA, ataques, espaços, níveis, mochila |
| `js/random.js` | Geração aleatória (botões "Sortear" e modo mestre) |
| `js/storage.js` | `localStorage` e exportar/importar JSON |
| `js/ui.js` | Utilitários de interface: `esc`, botão de ajuda, painel inferior, `askConfirm`, `toast` |
| `js/icons.js` | Ícones SVG de game-icons.net (CC BY 3.0) |
| `js/data/index.js` | Lista de livros e `loadRules(bookIds)`, que junta os livros ligados num só conjunto de regras |
| `js/data/base.js` | Livro base: ancestralidades, classes, tabelas de talento, antecedentes, divindades, armas, armaduras, equipamento, kit, idiomas, magias de grau 1, nomes |
| `js/data/diabruras.js`, `areias-rubras.js`, `sol-da-meia-noite.js` | Um arquivo por suplemento, mesmo formato |
| `js/data/magias-base.js`, `magias-suplementos.js` | Magias de grau 2 a 5 |
| `js/data/glossary.js` | Textos do botão **?**, nomes dos atributos (`STATS`) e alinhamentos |
| `tests/*.test.mjs` | Testes com `node:test` |
| `img/` | Fundo, logo e capas dos livros |

### Formato dos dados por livro

Cada livro exporta um objeto com `id`, `name`, `short`, `cover` e listas. Todo item tem `id` em kebab-case e, quando útil, `page`. Valores monetários em **peças de cobre** (1 PO = 100 PC, 1 PP = 10 PC).

```js
// ancestralidade
{ id: 'anao', name: 'Anão', page: 16, roll: [7, 8], desc, languages: ['Comum', 'Anão'],
  feature: { name, desc }, choice?: { id, label, options } }

// classe
{ id: 'guerreiro', name: 'Guerreiro', page: 18, hitDie: 8, desc,
  weapons: 'all' | ['adaga', ...], armor: 'all' | ['couro', ...], weaponsText, armorText,
  features: [{ name, desc }], choices: [{ id, label, type?, options? }],
  carrier?: true, talents: 'guerreiro',             // chave da tabela 'class:guerreiro'
  spellcasting?: { stat, list, known, byLevel },     // magias conhecidas por grau e nível
  titles: { lawful: [5 títulos], chaotic: [...], neutral: [...] } }

// tabela de talentos (em tables)
'class:guerreiro': { dice: '2d6', entries: [{ min, max, text, effect: { kind: 'atk', melee: 1, ranged: 1 } }] }

// arma / armadura / equipamento
{ id: 'adaga', name: 'Adaga', cost: 100, type: 'CD', range: 'A/P', damage: '1d4', props: ['Ac', 'Ar'] }
{ id: 'couro', name: 'Armadura de couro', cost: 1000, slots: 1, ac: 11, dex: true }
{ id: 'cravos', name: 'Cravos de ferro', cost: 100, buy: 10, perSlot: 10, freeFirst?, desc }

// magia
{ id: 'alarme', name: 'Alarme', tier: 1, dur?, alc?, desc }
```

Efeitos de talento (`effect.kind`) já suportados pelo motor: `stat`, `stat2`, `atk`, `atkOne`, `dmg`, `cast`, `ac`, `acArmor`, `mastery`, `prof`, `spell`, `maxHp`, `extraHpDie`, `note`, `or`, `pick` (resultado 12: escolher talento ou +2 pontos) e `roll` (rolar em outra tabela, como Dádivas Patronais). `talentBonuses()` soma tudo num objeto de bônus usado pela ficha.

Para adicionar um suplemento: criar o arquivo em `js/data/`, registrar em `BOOKS` de `js/data/index.js` e incluir no `sw.js`.

## 5. Modelo do personagem salvo

Chaves do `localStorage`: `sdcc.characters` (lista de personagens), `sdcc.draft` (rascunho do assistente), `sdcc.prefs` (preferências, como livros ligados).

Criado por `newCharacter(books)` em `js/rules.js`:

```js
{
  id: 'pc-<base36>-<base36>', version: 2,
  books: ['base', 'diabruras', ...],   // livros ligados para este personagem
  level: 0..10, xp: 0,
  hpCurrent: null,       // PV atual; null = cheio (limitado entre 0 e o máximo)
  hp: { rolls: [..] },   // dados de vida do nível 1
  levels: { 2: { hpRolls: [..] }, ... },   // dados de vida e escolhas de cada nível seguinte
  stats: { FOR, DES, CON, INT, SAB, CAR },  // valores base 3d6; bônus de talentos são somados na ficha
  statRerolls: 0,
  ancestry: 'anao', ancestryChoice: {},
  classId: 'guerreiro', classChoices: { mastery, grit, ... },
  background: { table, index } | { custom: true, name, desc },
  alignment: 'lawful' | 'neutral' | 'chaotic',
  deity: 'id' | null, patron: 'id' | null,
  languages: {}, talents: { lvl1: <escolha>, lvl3: ... }, spells: ['alarme', ...],
  gold: null, goldRoll: null,      // ouro inicial rolado nas compras, em PC
  coins: { po, pp, pc } | null,    // moedas separadas (formato atual)
  equipMode: 'quick' | 'shop' | 'level0' | null,   // pacote rápido, compras, itens de nível 0
  inventory: [
    { id: 'tocha', qty: 2 },
    { id: 'tocha', qty: 1, stored: true },                              // guardado na cidade
    { id: 'item-<base36>', custom: true, name, qty, slots, note }        // item criado pelo jogador
  ],
  name, player, appearance, traits, bio,
  group: '',            // nome do grupo (modo mestre)
  createdAt, updatedAt
}
```

Tudo o que é derivado (atributos finais, modificadores, PV máximo, CA, ataques, espaços, título, magias, idiomas) **não é salvo**: sai de `computeSheet(rules, c)`, que é a função central para qualquer projeto que queira ler um personagem.

O arquivo de exportação completa tem o formato `{ app: 'sd-character-creator', characters: [...] }`; `parseImport` também aceita um personagem solto ou uma lista. É o caminho natural para um novo programa receber os personagens.

## 6. Regras implementadas

- Atributos 3d6 em ordem, com nova rolagem permitida se nenhum valor for 14 ou mais; modificadores pela tabela do livro.
- Nível 0 (gente comum, A Provação) e nível 1 a 10, com XP para subir = nível × 10, XP zera ao subir.
- Personagem de nível 0 vira nível 1 escolhendo a classe e mantendo os itens.
- Talentos nos níveis 1, 3, 5, 7 e 9, aplicados automaticamente, incluindo escolhas (resultado 12, Dádivas Patronais, Lótus Negra).
- Magias por grau conforme a tabela de cada classe conjuradora; teste de conjuração com o atributo da classe.
- Títulos por classe e alinhamento, mudando a cada dois níveis.
- CA pela melhor armadura permitida + escudo + bônus; ataques por arma com maestria, acuidade e bônus de talentos.
- Espaços de equipamento = maior entre FOR e 10 (+ mod. CON positivo para quem tem "Carregador"); as 100 primeiras moedas não ocupam espaço, depois 1 espaço a cada 100.
- Equipamento por pacote rápido (kit de exploração), por compras com o ouro rolado, ou equipamento aleatório de nível 0.
- Antecedentes por livro (a rolagem respeita a aba escolhida) ou antecedente próprio.
- Livros podem ser ligados e desligados; o que é de um livro desligado some das opções. O livro da classe não pode ser desmarcado depois do nível 1.
- Modo mestre: gera de 1 a 30 personagens, do nível 0 ao 10, com filtro de classes, e salva todos com nome de grupo.

## 7. Decisões de mesa do Cesar (diferem ou detalham o livro)

- **PV do nível 1 = dado de vida + max(1, mod. CON)** (+2 se anão). A Constituição vale no mínimo +1, então um 1 no dado com CON negativa dá 2 PV. Nos níveis seguintes soma-se só o dado. Nível 0: max(1, mod. CON) (+2 anão).
- **Item guardado fica na cidade** durante a expedição: não ocupa espaço e não conta para ataques nem CA. "Guardar" separa uma unidade numa linha com `stored: true`; "pegar" devolve.
- **Mochila cheia bloqueia**: adicionar, "+", pegar da cidade e comprar avisam "Sua mochila está cheia!" e não colocam o item. Ao editar um personagem já salvo, excesso de carga vira aviso em vez de bloquear (edição sem travas).
- **Cores da barra de PV**: verde de 70% para cima, amarelo abaixo de 70%, laranja abaixo de 50%, vermelho abaixo de 20% (`hpLevel` em `js/sheet.js`).
- **Confirmação na tela** (não `alert`) para usar item, remover item, tirar a última unidade e excluir personagem (`askConfirm` em `js/ui.js`).
- Divindade e patrono aparecem logo abaixo do nome na ficha.
- Classes dos 3 suplementos disponíveis desde o início.
- O app é para o jogador, com o modo mestre como extra.

## 8. Visual

- Tema só em **preto, branco e cinza**, sobre a ilustração de fundo com camada preta de 55%; o conteúdo fica numa coluna preta a 80%.
- **Exceções de cor, todas pedidas pelo Cesar**: verde (`#43a047`) marca item guardado; barra de PV colorida (verde `#43a047`, amarelo `#fdd835`, laranja `#fb8c00`, vermelho `#e53935`); borda vermelha na caixa de espaços quando a mochila enche.
- Títulos na fonte gótica UnifrakturMaguntia; texto em fonte do sistema.
- Logo branco no topo, capas dos livros nas opções de livro.
- Ícones de game-icons.net (Lorc, Delapouite e colaboradores), licença **CC BY 3.0**, embutidos como SVG em `js/icons.js` (atributos, classes, ancestralidades, alinhamentos). Manter o crédito no README.
- **Legibilidade: todo texto com contraste de pelo menos 4,5:1** contra a parte mais clara da ilustração. Sombra preta no texto sobre o fundo; campos com fundo sólido.

## 9. Testes

`node --test tests/*.test.mjs` (19 testes, sem dependências). Cobrem: tabela de modificadores; tabelas de talento completas; títulos; personagens aleatórios completos do nível 0 ao 10; PV (regra da mesa, anão, PV atual entre 0 e máximo); talento de PV máximo; espaços de moedas e itens próprios; guardar (sem espaço, ataque ou CA); mochila cheia; cores do PV; livros desligados; antecedente por tabela.

Testes visuais e de contraste foram feitos com Playwright fora do repositório. Screenshots devem ser gerados fora da pasta do repo para não serem commitados por engano.

## 10. Forma de trabalho

- Cada fase numa branch (`fase-N-...`) com PR para `main`; o Cesar revisa e faz o merge.
- Commits e PRs em português, descrevendo a mudança do ponto de vista do jogador.
- Ao responder ao Cesar, mandar links como URL completa em texto (links markdown às vezes não aparecem clicáveis no app dele).

## 11. O que reaproveitar num novo projeto de sessão

- `js/rules.js` e `js/data/` funcionam sem interface: dá para importar `loadRules` e `computeSheet` para mostrar PV, CA, ataques, magias e carga de cada personagem numa tela de mesa.
- Os personagens chegam pelo JSON exportado (botão "Exportar todos").
- `rollDice('2d6')`, `roll`, `die` e `entryFor(table, valor)` servem para qualquer tabela rolável.
- O tema, os ícones e o padrão de botão **?** com página do livro mantêm a mesma cara e a mesma regra de não copiar texto dos livros.
- Pontos de atenção: os dados ficam no aparelho de cada jogador (sem sincronização); se o novo programa precisar compartilhar estado entre mestre e jogadores em tempo real, vai precisar de algum serviço além do GitHub Pages.
