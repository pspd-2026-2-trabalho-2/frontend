# HU Frontend

Frontend do prontuário eletrônico do Hospital Universitário: tela de login e tela de
consulta, com os dados exibidos de acordo com o perfil do usuário (médico, estagiário
ou pesquisador). Construído com Vite, React, TypeScript, Tailwind e shadcn.

A autenticação é feita contra um servidor Keycloak (OAuth2/OpenID Connect), que emite
o token JWT usado em todas as chamadas à API.

## Requisitos

- Node 20+
- Keycloak rodando em `http://localhost:8080` com o realm `hu` (o login é sempre real,
  nunca simulado).

## Rodar

```bash
npm install
cp .env.example .env
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

Com `VITE_USE_MOCKS=true` (padrão do `.env.example`), as chamadas de dados clínicos são
respondidas localmente por um mock, então a tela de consulta funciona sem depender do
backend. Para consumir a API real, coloque a URL em `VITE_API_URL` e defina
`VITE_USE_MOCKS=false`.

## Testar com os 3 perfis

Com o Keycloak rodando, faça login com cada usuário de exemplo:

| Usuário | Senha | Perfil | Tela de consulta |
|---|---|---|---|
| `med.cardoso` | `pspd123` | Médico | Lista de pacientes com dados completos (nome, CPF, CNS); abas Resumo, Histórico, Exames e Medicamentos. |
| `est.silva` | `pspd123` | Estagiário | Mesmas telas, mas com pacientes anonimizados (iniciais, sem CPF/CNS/endereço). |
| `pesq.souza` | `pspd123` | Pesquisador | Seletor de coorte com estatísticas agregadas e exames pseudonimizados, mais a lista de projetos de pesquisa. |

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
- `VITE_API_URL` — URL da API (usada quando os mocks estão desligados).
- `VITE_USE_MOCKS` — liga/desliga o mock dos dados clínicos.

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
├── lib/                     # api (fetch com token), tipos FHIR, utilitários
└── mocks/                   # mock de dados clínicos por perfil
```
