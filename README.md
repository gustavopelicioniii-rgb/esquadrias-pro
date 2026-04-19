# EsquadriAPI 🚀

> Sistema completo para gestão de esquadrias de alumínio - SaaS B2B

## 📋 Descrição

Sistema ERP cloud-native para a indústria de esquadrias de alumínio, reunindo cálculo técnico, gestão comercial, produção e financeiro em uma única plataforma.

## ✨ Diferenciais

- **CalcPRO** - Cálculo técnico com otimizador de corte
- **OrçaPRO** - Editor visual premium + 3D
- **ClientPRO** - CRM + Pipeline Kanban
- **ProduPRO** - PCP + Integração CNC
- **FinancePRO** - Fluxo de caixa + NF-e
- **EstoquePRO** - Controle + Curva ABC
- **DocPRO** - Contratos + Assinatura digital
- **InsightsPRO** - BI + Dashboards

## 🛠️ Stack

- **Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Frontend:** React 18 + Vite + TypeScript + TailwindCSS
- **Database:** PostgreSQL 16

## 🚀 Quick Start

### 1. Clone o repositório
```bash
git clone https://github.com/gustavopelicioniii-rgb/esquadrias-pro.git
cd esquadrias-pro
```

### 2. Suba o banco de dados
```bash
docker compose up -d postgres
```

### 3. Backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📁 Estrutura

```
esquadrias-pro/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma    # Schema do banco
│   ├── src/
│   │   └── index.ts        # API Routes
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── lib/api.ts      # Cliente API
│   │   ├── pages/          # Páginas
│   │   └── App.tsx         # Componente principal
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── SPEC.md                 # Especificação do projeto
└── README.md
```

## 🔐 Variáveis de Ambiente

### Backend (.env)
```
DATABASE_URL="postgresql://esquadrias:Esq2026!Secure@localhost:5436/esquadrias"
JWT_SECRET="seu-secret-aqui"
PORT=3003
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3003/api
```

## 📡 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|------------|
| POST | /api/auth/register | Cadastro |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Usuário atual |
| GET/POST | /api/clients | Clientes |
| GET/POST | /api/products | Produtos |
| GET/POST | /api/budgets | Orçamentos |
| GET/POST | /api/orders | Pedidos |
| GET/POST | /api/transactions | Transações |
| GET | /api/dashboard | Dashboard |
| GET/POST | /api/profiles | Perfis de alumínio |
| GET/POST | /api/glasses | Vidros |
| GET/POST | /api/accessories | Acessórios |
| GET/POST | /api/inventory | Estoque |

## 💰 Planos

| Plano | Preço | Usuários |
|-------|-------|----------|
| Starter | R$ 197/mês | 1 |
| Business | R$ 497/mês | até 5 |
| Professional | R$ 997/mês | até 15 |
| Enterprise | Sob consulta | Ilimitado |

## 🎯 Roadmap

- [x] MVP Backend (Auth, Clients, Products, Budgets)
- [x] MVP Frontend (Login, Dashboard, CRUDs)
- [ ] Módulo de Cálculo Técnico
- [ ] Editor Visual de Orçamento
- [ ] CRM e Pipeline
- [ ] Gestão de Produção (PCP)
- [ ] Financeiro completo
- [ ] Controle de Estoque
- [ ] App Mobile (React Native)

## 📄 Licença

MIT
