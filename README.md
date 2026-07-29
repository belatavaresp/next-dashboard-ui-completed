# TLE-Lab

Plataforma de atividades de robótica da The Life Education. Next.js 15 (App Router),
React 19, Tailwind CSS 3 e MongoDB via Mongoose. A API vive no próprio projeto, em
Route Handlers sob `src/app/api`.

## Requisitos

- Node.js 20.9 ou superior (o projeto fixa a versão 22 em `.nvmrc`)
- Uma string de conexão do MongoDB Atlas

## Configuração

```bash
nvm use
npm install
cp .env.example .env.local   # preencha MONGODB_URI e JWT_SECRET
npm run dev
```

Variáveis de ambiente:

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `MONGODB_URI` | sim | Conexão com o cluster do MongoDB |
| `MONGODB_DB` | não | Banco usado pela aplicação (padrão `tle_v2`) |
| `JWT_SECRET` | sim | Segredo que assina o cookie de sessão |
| `LEGACY_MONGODB_DB` | não | Banco legado, usado apenas pela migração |
| `LEGACY_API_URL` | não | API legada, alternativa para a migração |

## Deploy na Vercel

1. Importe o repositório na Vercel. O preset Next.js já cobre build e output; não é
   necessário `vercel.json`.
2. Configure `MONGODB_URI`, `MONGODB_DB` e `JWT_SECRET` em Settings → Environment
   Variables, para Production, Preview e Development. Sem `JWT_SECRET` o build passa,
   mas todo login falha em runtime.
3. Libere o acesso no Atlas em Network Access. As funções da Vercel não têm IP fixo,
   então é preciso permitir `0.0.0.0/0` (o acesso continua protegido por usuário e
   senha do banco) ou usar um endereço estático via integração.
4. Use um `JWT_SECRET` diferente do local:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O banco é o mesmo cluster do deploy legado, e a migração já foi feita: não é preciso
rodar os scripts de migração na Vercel.

## Migração dos dados

O aplicativo grava em um banco novo (`tle_v2`) no mesmo cluster, deixando o banco
legado intacto para que o deploy antigo continue funcionando como referência.

```bash
npm run migrate:users      # usuários legados + turmas por (instituição, ano)
npm run seed:activities    # as 58 atividades de src/lib/activitiesData.ts
```

Rode `migrate:users` primeiro: as atividades são vinculadas às turmas criadas por
ele. Os hashes bcrypt são copiados sem alteração, então as senhas atuais continuam
valendo. Os dois scripts podem ser executados novamente sem duplicar registros.

## Papéis e páginas

| Papel | Acesso |
| --- | --- |
| Aluno | a própria turma (`/class/{id}`) e as atividades dela |
| Professor | `/teacher`, suas turmas, apoio ao professor e lista de alunos |
| Admin | `/admin` (usuários e turmas), além de todas as turmas e atividades |

Usuários e turmas inativos não entram no sistema e não aparecem para alunos e
professores, respectivamente.

## Compatibilidade de URLs

- `/student-6` e similares redirecionam para `/class/{id}`. Como a turma é
  específica de cada instituição, o destino depende do usuário logado e é
  resolvido em `src/middleware.ts`.
- `/activities/51` (ids inteiros antigos) redireciona para o id atual da
  atividade, resolvido pelo campo `legacyId`.

## Verificação

`npm run verify` sobe um MongoDB temporário em memória, popula usuários e turmas de
teste e exercita a aplicação por HTTP: login de cada papel, bloqueio de usuário e
turma inativos, isolamento entre turmas, conteúdo de apoio ao professor e os
redirecionamentos das URLs antigas. Requer um build atual (`npm run build`).

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run verify
npm run gen:images   # atualiza as sugestões de capa após mexer em public/
```

Capas hospedadas no Google Drive são reescritas para `/api/drive-image/<id>`, que busca
a imagem no servidor. O Drive redireciona miniaturas para `lh3.googleusercontent.com`,
que responde 429 a requisições feitas direto pelo navegador, então o proxy é o que faz
essas capas carregarem de forma confiável. O arquivo ainda precisa estar compartilhado
com "Qualquer pessoa com o link".

O campo "Capa" do formulário de atividades sugere as imagens de `public/` a partir de
`src/lib/publicImages.ts`, um arquivo gerado. O `prebuild` regenera esse arquivo, mas
depois de adicionar imagens em `public/` rode `npm run gen:images` para vê-las em `dev`.
