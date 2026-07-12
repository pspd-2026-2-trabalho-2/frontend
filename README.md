# HU Frontend

Frontend do prontuário eletrônico do Hospital Universitário: tela de login e tela de
consulta, com os dados exibidos de acordo com o perfil do usuário (médico, estagiário
ou pesquisador). Construído com Vite, React, TypeScript, Tailwind e shadcn.

A autenticação é feita contra o Keycloak do cluster kiriland (OAuth2/OpenID Connect,
realm `grupo03`), que emite o token JWT (RS256) usado em todas as chamadas à API. Todos
os dados de consulta vêm do API Gateway real — não há mais mocks.

## Requisitos

- Node 20+
- Acesso ao Keycloak em `https://kiriland.unb.br/keycloak` (realm `grupo03`) e ao
  [API Gateway](../gateway-authorization-service) rodando localmente em `http://localhost:8080`.

## Rodar

```bash
npm install
cp .env.example .env
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

## Testar com os 3 perfis

Faça login com cada usuário de teste do realm `grupo03` (senha padrão `PseudoPEP2026!`):

| Usuário | Perfil | Tela de consulta |
|---|---|---|
| `med.*` (ex.: `med.cardoso`) | Médico | Lista de pacientes com dados completos (nome, CPF, CNS); abas Resumo, Histórico, Exames e Medicamentos. |
| `est.*` (ex.: `est.ferreira`) | Estagiário | Mesmas telas, mas com pacientes anonimizados (iniciais, sem CPF/CNS/endereço). |
| `pes.*` (ex.: `pes.mendes`) | Pesquisador | Seletor de coorte com estatísticas agregadas e exames pseudonimizados, mais a lista de projetos de pesquisa. |

Casos de erro para conferir:

- Senha errada no login → mensagem de erro sem recarregar a página.
- Acessar `/consulta` sem estar logado → redireciona para `/login`.
- Logout no cabeçalho → volta para `/login` e limpa a sessão.

## Build

```bash
npm run build
```

Roda a checagem de tipos (`tsc -b`) e gera a versão de produção em `dist/`.

## Variáveis de ambiente

Todas em `.env.example`:

- `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, `VITE_KEYCLOAK_CLIENT_ID` — endpoint do Keycloak.
- `VITE_API_URL` — URL do API Gateway.

São embutidas em **build-time**, não runtime. `.env` (dev, com `.env` fora do
Docker build via `.dockerignore`) aponta para `localhost`; `.env.production`
(commitado, usado por `npm run build` e pela imagem Docker) aponta para o
subpath `/grupo3` do cluster kiriland.

## Deploy no cluster kiriland

O app é servido em `https://kiriland.unb.br/grupo3/`.

1. Push em `main` → o workflow [`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml)
   builda a imagem (usando `.env.production`, com `base: '/grupo3/'` no Vite)
   e publica em `ghcr.io/pspd-2026-2-trabalho-2/frontend:latest`.
2. O CI **não** faz deploy no cluster — é preciso reiniciar o pod manualmente
   para puxar a imagem nova:
   ```bash
   kubectl rollout restart deployment/<nome-do-deployment-frontend> -n <namespace>
   ```
   (verifique `imagePullPolicy: Always` no manifest; com `IfNotPresent` e tag
   `latest` o restart não baixa a imagem nova).

## Estrutura

```
src/
├── index.css               # design system (cores, fontes, tokens)
├── main.tsx / App.tsx       # bootstrap, providers e rotas
├── routes/                  # Login, Consulta
├── components/
│   ├── ui/                  # componentes de interface (button, card, table, ...)
│   ├── layout/              # Header, AppShell
│   └── consulta/            # PatientList, ClinicalSummary, CohortStats, ...
├── features/auth/           # login, sessão, rota protegida e cliente Keycloak
└── lib/                     # api (fetch com token), tipos FHIR, utilitários
```
