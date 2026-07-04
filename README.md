# HU Frontend

Frontend do prontuário do Hospital Universitário (login + tela de consulta). Vite + React + TypeScript + Tailwind v4 + shadcn. Ver o contexto completo em [`../specs/`](../specs/).

## Requisitos

- Node 20+
- O Keycloak subindo em paralelo (ver [`../keycloak/README.md`](../keycloak/README.md)) — o login é sempre real, nunca mockado.

## Rodar

```bash
npm install
cp .env.example .env
npm run dev
```

Acesse `http://localhost:5173`. Com `VITE_USE_MOCKS=true` (padrão do `.env.example`), todas as chamadas a `/api/*` são respondidas pelo MSW seguindo o contrato em [`../specs/contracts/api-gateway.md`](../specs/contracts/api-gateway.md) — não é necessário ter a API Gateway rodando para testar a tela de consulta.

## Testar com os 3 perfis

Com o Keycloak rodando (`docker compose up` em `keycloak/`), faça login em `/login` com cada um dos usuários de exemplo:

| Usuário | Senha | Role | O que ver na tela de consulta |
|---|---|---|---|
| `med.cardoso` | `pspd123` | MEDICO | Lista de pacientes com dados completos (nome, CPF, CNS); abas Resumo/Histórico/Exames/Medicamentos. |
| `est.silva` | `pspd123` | ESTAGIARIO | Mesma estrutura de telas, mas pacientes aparecem com iniciais e sem CPF/CNS/endereço completo. |
| `pesq.souza` | `pspd123` | PESQUISADOR | Sem lista de pacientes: seletor de coorte (Diabetes/Hipertensão) com estatísticas agregadas e exames pseudonimizados, mais lista de projetos de pesquisa. |

Cenários de erro para validar manualmente:
- Senha errada em `/login` → mensagem de erro inline, sem reload da página.
- Acessar `http://localhost:5173/consulta` sem login → redirect automático para `/login`.
- Logout (botão no header) → volta para `/login` e limpa a sessão (`sessionStorage`).

## Build

```bash
npm run build
```

Roda `tsc -b` (checagem de tipos) seguido de `vite build`. A saída fica em `dist/`.

## Variáveis de ambiente

Ver [`.env.example`](.env.example). Resumo:

- `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, `VITE_KEYCLOAK_CLIENT_ID`: endpoint de token do Keycloak.
- `VITE_API_URL`: URL da API Gateway (ignorado enquanto mocks estiverem ativos).
- `VITE_USE_MOCKS`: liga/desliga o MSW. Ver [`../specs/frontend/plan.md`](../specs/frontend/plan.md) para a estratégia de mock e o que muda quando a API Gateway real existir.

## Estrutura

```
src/
├── index.css              # design system (tokens, cores, fontes)
├── main.tsx / App.tsx      # bootstrap, providers, rotas
├── routes/                 # Login, Consulta
├── components/
│   ├── ui/                 # componentes shadcn (button, card, table, ...)
│   ├── layout/              # Header, AppShell
│   └── consulta/            # PatientList, ClinicalSummary, CohortStats, ...
├── features/auth/           # AuthProvider, useAuth, ProtectedRoute, cliente Keycloak
├── lib/                     # api.ts (fetch com Bearer), fhir.ts (tipos FHIR), utils.ts
└── mocks/                   # MSW: handlers + fixtures FHIR por perfil
```

## O que falta / está fora do escopo desta fase

Ver [`../specs/frontend/tasks.md`](../specs/frontend/tasks.md) — inclui integração com a API Gateway real, métricas Prometheus, Dockerfile e manifests K8s.
