# EsquadriAPI - Sistema Completo para Gestão de Esquadrias de Alumínio

**Versão:** 1.0.0  
**Data:** 19/04/2026  
**Modelo:** SaaS (Assinatura Mensal)  
**Público:** Micro, Pequenas e Médias empresas do setor de esquadrias

---

## 1. VISÃO DO PRODUTO

Sistema ERP completo e moderno para a indústria de esquadrias de alumínio, que une cálculo técnico, gestão comercial, produção e financeiro em uma única plataforma cloud-first. Diferencial: interface ultra-moderna, experiência mobile nativa, IA embarcada para otimização e automation, e onboarding em tempo recorde.

**Promessa:** "Do primeiro clique ao primeiro orçamento em 5 minutos."

---

## 2. STACK TECNOLÓGICO

### Frontend
- **Web:** React 18 + Vite + TypeScript + shadcn/ui + TailwindCSS
- **Mobile:** React Native (Expo) - App nativo iOS/Android
- **State:** Zustand (global) + React Query (server state)
- **Charts:** Recharts

### Backend
- **API:** Node.js + Express + TypeScript
- **Database:** PostgreSQL 16 (via Docker)
- **ORM:** Prisma
- **Auth:** JWT + Refresh Tokens
- **Validation:** Zod

### Infraestrutura
- **Cloud:** Docker (VPS) + Nginx
- **SSL:** Certbot/Let's Encrypt
- **CI/CD:** GitHub Actions

---

## 3. MÓDULOS DO SISTEMA

### 3.1 MÓDULO: CÁLCULO TÉCNICO (CORE)

**Nome Comercial:** **CalcPRO**

#### Funcionalidades:
- Cadastro de tipologias (janelas, portas, fachadas, portas de giro, maxim-air, correr, vidro fixo)
- Biblioteca de perfis de alumínio (integradores: Alumisoft MOF, Cadan, Alcoa, Ipê)
- Cadastro de vidros (espessuras, tipos: float, temperado, laminado, low-E)
- Acessórios (fechos, roldanas, escovas, trincos)
- Cálculo automático de medidas
- Otimizador de corte de barras (reduce waste)
- Geração de lista de corte (para CNC/marcenaria)
- Geração de plano de corte (layout de vidro)
- Ficha técnica do produto

#### Diferencial:
- IA que sugere otimização de material baseado em histórico
- Integração com banco de dados de preços de matéria-prima

---

### 3.2 MÓDULO: ORÇAMENTOS PREMIUM

**Nome Comercial:** **OrçaPRO**

#### Funcionalidades:
- Criação de orçamentos com visual 3D das esquadrias
- Editor visual drag-and-drop
- Galeria de tipologias pré-configuradas
- Precificação automática baseada no cálculo
- Margem de lucro por item/produto
- Desconto por cliente/volume
- Envio de orçamento por WhatsApp/E-mail
- Portal do cliente (cliente vê orçamento online)
- Aprovação digital (cliente aprova online)
- Histórico de versões do orçamento
- Conversão automática em Pedido

#### Diferencial:
- Editor visual que parece profissional de verdade
- Compartilhamento via link único com analytics (sabe quando cliente viu)
- Integração com WhatsApp Business API

---

### 3.3 MÓDULO: CRM & COMERCIAL

**Nome Comercial:** **ClientPRO**

#### Funcionalidades:
- Cadastro completo de clientes (PF/PJ)
- Histórico de interações
- Pipeline de vendas (Kanban)
- Tarefas e lembretes automáticos
- Campanhas de marketing (E-mail/WhatsApp)
- Análise de leads (qualificação hot/warm/cold)
- Previsão de vendas (forecast)
- Documentos por cliente (contratos, CPFs, CNPJs)

#### Diferencial:
- IA que scoreia leads automaticamente
- Automação de follow-up

---

### 3.4 MÓDULO: PRODUÇÃO & PCP

**Nome Comercial:** **ProduPRO**

#### Funcionalidades:
- Gestão de pedidos
- Ordem de produção
- Controle de etapas (corte, montagem, instalação)
- Alocação de recursos (funcionários, máquinas)
- Gantt de produção
- Controle de apontamento (início/fim de etapa)
- Integração com CNC (G-code export)
- Rastreabilidade de cada peça
- Entregas e cronograma

#### Diferencial:
- Dashboard de OEE (Overall Equipment Effectiveness)
- Alertas de atraso em tempo real

---

### 3.5 MÓDULO: FINANCEIRO

**Nome Comercial:** **FinancePRO**

#### Funcionalidades:
- Contas a pagar (fornecedores, salários, água, luz)
- Contas a receber (boletos, cartão, pix, split)
- Fluxo de caixa (today/30/60/90)
- DRE simplificado
- Conciliação bancária automática
- Faturamento (emissão de NF-e, NFS-e)
- Boletos e carnês
- Split de pagamentos (parcelas)
- Centro de custos (por obra/cliente/produto)
- Relatórios: balanço, lucratividade, DRE

#### Diferencial:
- IA que prevê fluxo de caixa (cash flow prediction)
- Alertas de inadimplência

---

### 3.6 MÓDULO: ESTOQUE

**Nome Comercial:** **EstoquePRO**

#### Funcionalidades:
- Cadastro de produtos/materiais
- Controle de lotes
- Estoque mínimo e máximo (alertas)
- Localização no armazém (prateleira, posição)
- Movimentações (entrada/saída)
- Inventário
- Requisições internas
- Cotação com fornecedores
- Curva ABC

#### Diferencial:
- Predição de necessidades de compra (IA)
- Código de barras/QR code

---

### 3.7 MÓDULO: DOCUMENTOS & CONTRATOS

**Nome Comercial:** **DocPRO**

#### Funcionalidades:
- Modelos de contrato (obra, fornecimento, instalação)
- Editor de contratos (assinatura digital)
- Templates de documentos (recibo, orçamento, laudo)
- Biblioteca de documentos (organizada por cliente/obra)
- Versionamento de documentos
- Validade de documentos (CND, alvará)
- Assinatura digital (assinaturas em lote)

#### Diferencial:
- Assinatura eletrônica com validez jurídica

---

### 3.8 MÓDULO: RELATÓRIOS & BI

**Nome Comercial:** **InsightsPRO**

#### Funcionalidades:
- Dashboard executivo (vendas, financeiro, produção)
- KPIs customizáveis
- Relatórios agendados (E-mail)
- Comparativos (mês/mês, ano/ano)
- Drill-down (detalhar números)
- Data studio / Power BI integration

---

## 4. ARQUITETURA DE DADOS

### Entidades Principais

```
Organization (empresa do cliente)
├── Users (usuários)
├── Clients (clientes finais)
├── Products (tipologias/catálogo)
├── Profiles (perfis de alumínio)
├── Glasses (vidros)
├── Accessories (acessórios)
├── Budgets (orçamentos)
├── Orders (pedidos)
├── Productions (ordens de produção)
├── Financial (contas a pagar/receber)
├── Inventory (estoque)
├── Documents (documentos)
└── Contracts (contratos)
```

### Diagrama ER Simplificado

```
Organization 1───N User
Organization 1───N Client
Organization 1───N Product (tipologia)
Organization 1───N Profile
Organization 1───N Glass
Organization 1───N Accessory
Organization 1───N Budget
Budget 1───N BudgetItem
Organization 1───N Order
Order 1───N OrderItem
Order 1───N Production
Organization 1───N FinancialTransaction
Organization 1───N InventoryItem
Organization 1───N Document
Organization 1───N Contract
```

---

## 5. SEGURANÇA & PERMISSÕES

### Papéis (Roles)
- **Owner** - Dono da conta (acesso total)
- **Admin** - Administrador (acesso total exceto exclusão de org)
- **Manager** - Gerente (módulos específicos)
- **Sales** - Vendedor (CRM + Orçamentos)
- **Production** - Produção (PCP + Estoque)
- **Finance** - Financeiro (Financeiro + Relatórios)
- **Viewer** - Leitura apenas

### Permissões Granulares
- CRUD por módulo
- Campos visíveis por role
- Dados sensíveis (salário, margem) só para roles específicas

---

## 6. MODELO DE NEGÓCIO

### Planos

| Plano | Preço | Usuários | Funcionalidades |
|-------|-------|----------|-----------------|
| **Starter** | R$ 197/mês | 1 usuário | Cálculo + Orçamento + 50 clientes |
| **Business** | R$ 497/mês | até 5 | Tudo + CRM + PCP |
| **Professional** | R$ 997/mês | até 15 | Tudo + Financeiro + Estoque |
| **Enterprise** | Sob consulta | Ilimitado | Tudo + SLA + Suporte dedicado |

### Estratégia de Monetização
- Assinatura mensal/trimestral/anual (desconto anual)
- Freemium: 14 dias grátis, sem cartão
- USP por plano (free trial estendido)
- Add-ons: usuários adicionais, armazenamento, NC-e

---

## 7. DIFERENCIAIS COMPETITIVOS (KILLER FEATURES)

1. **Onboarding Relâmpago**
   - "5 minutos do primeiro acesso ao primeiro orçamento"
   - Wizard de setup com dados pré-carregados
   - Importação de clientes via CSV/Excel

2. **Interface Uber-Moderna**
   - Design system com componentes Bell (shadcn/ui)
   - Dark mode nativo
   - Micro-interações e animações fluidas
   - 100% responsivo (mobile-first)

3. **App Mobile Nativo**
   - React Native (iOS + Android)
   - Funcionalidades offline (sincroniza depois)
   - Notificações push
   - Fotos de obra direto do app

4. **IA Embarcada**
   - Previsão de vendas
   - Predição de cash flow
   - Score de leads
   - Otimização de estoque
   - Sugestão de preço de venda

5. **Integração WhatsApp**
   - Envio de orçamentos via WhatsApp
   - Notificações automáticas
   - Chat com cliente no app

6. **Portal do Cliente**
   - Cliente acompanha status do pedido
   - Aprova orçamento online
   - Assina contratos digitalmente
   -可视化 histórico de serviços

7. **Integração CNC**
   - Export G-code
   - Parametrização de máquinas
   - Redução de desperdício

---

## 8. ROADMAP DE DESENVOLVIMENTO

### Fase 1: MVP (4-6 semanas)
- [ ] Backend: Auth + Organization + Users
- [ ] Backend: Clients + Products (tipologias)
- [ ] Backend: Profiles + Glasses + Accessories
- [ ] Backend: Budgets + BudgetItems
- [ ] Frontend: Login + Dashboard
- [ ] Frontend: Cadastro de Tipologias
- [ ] Frontend: Calculadora de Esquadrias
- [ ] Frontend: Criação de Orçamento

### Fase 2: Comercial (4 semanas)
- [ ] Backend: CRM + Leads + Tasks
- [ ] Frontend: Pipeline Kanban
- [ ] Frontend: Lista de Clientes
- [ ] Frontend: Editor de Orçamento Premium

### Fase 3: Produção (4 semanas)
- [ ] Backend: Orders + Productions
- [ ] Backend: Cut optimization
- [ ] Frontend: Gestão de Pedidos
- [ ] Frontend: Gantt de Produção

### Fase 4: Financeiro (4 semanas)
- [ ] Backend: Financial transactions
- [ ] Backend: AP/AR
- [ ] Frontend: Fluxo de Caixa
- [ ] Frontend: DRE

### Fase 5: Estoque + Docs (3 semanas)
- [ ] Backend: Inventory
- [ ] Backend: Documents + Contracts
- [ ] Frontend: Controle de Estoque
- [ ] Frontend: Biblioteca de Docs

### Fase 6: Mobile + IA (4 semanas)
- [ ] React Native app
- [ ] WhatsApp integration
- [ ] AI predictions

---

## 9. PRÓXIMOS PASSOS

1. ✅ SPEC.md criado (este documento)
2. ⏳ Setup do projeto (repo + docker + postgres)
3. ⏳ Backend: Schema Prisma + rotas base
4. ⏳ Frontend: Setup React + shadcn/ui
5. ⏳ Módulo de Cálculo (CORE)
6. ⏳ Módulo de Orçamento
7. ⏳ ... (seguindo roadmap)

---

## 10. EQUIPE SUGERIDA

Para entregar em tempo recorde:

- **1 Full-Stack Senior** (backend + frontend)
- **1 Frontend Specialist** (UI/UX + React)
- **1 Mobile Developer** (React Native) - pode começar depois
- **1 QA/Tester** - pode ser automação depois

**Ou:**

- **1 Full-Stack Senior** + **1 Frontend** (5 meses para MVP)

---

*Documento vivo - atualizar conforme evolução do projeto*
