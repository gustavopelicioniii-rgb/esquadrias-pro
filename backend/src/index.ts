// EsquadriAPI - Backend
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// ============================================
// SETUP
// ============================================

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3003;
const JWT_SECRET = process.env.JWT_SECRET || 'esquadrias-secret-key-2026';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// ============================================
// UTILIDADES
// ============================================

function generateCode(prefix: string, num: number): string {
  const year = new Date().getFullYear();
  const numStr = num.toString().padStart(5, '0');
  return `${prefix}-${year}-${numStr}`;
}

async function getNextNumber(prefix: string): Promise<number> {
  const last = await prisma.auditLog.findFirst({
    where: { entity: prefix },
    orderBy: { createdAt: 'desc' }
  });
  // Simples - retorna timestamp-based
  return Math.floor(Date.now() / 1000) % 100000;
}

// ============================================
// SCHEMAS ZOD
// ============================================

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  organizationName: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// ============================================
// ROTAS: AUTENTICAÇÃO
// ============================================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    
    // Verificar se email já existe
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    // Criar organização
    const organization = await prisma.organization.create({
      data: { name: data.organizationName }
    });
    
    // Criar usuário owner
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'OWNER',
        organizationId: organization.id
      }
    });
    
    // Gerar token
    const token = jwt.sign({ userId: user.id, orgId: organization.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      organization: { id: organization.id, name: organization.name }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { organization: true }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const token = jwt.sign({ userId: user.id, orgId: user.organizationId }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      organization: { id: user.organization.id, name: user.organization.name, plan: user.organization.plan }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/auth/me - Middleware de auth
const authenticate = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; orgId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { organization: true }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    
    req.user = user;
    req.orgId = user.organizationId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

app.get('/api/auth/me', authenticate, (req: any, res) => {
  const user = req.user as any;
  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    organization: { 
      id: user.organization.id, 
      name: user.organization.name, 
      plan: user.organization.plan 
    }
  });
});

// ============================================
// ROTAS: CLIENTS
// ============================================

// GET /api/clients
app.get('/api/clients', authenticate, async (req: any, res) => {
  try {
    const clients = await prisma.client.findMany({
      where: { organizationId: req.orgId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(clients);
  } catch (error) {
    console.error('Clients error:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

// POST /api/clients
app.post('/api/clients', authenticate, async (req: any, res) => {
  try {
    const { name, email, phone, document, documentType, type, street, number, complement, neighborhood, city, state, zipCode } = req.body;
    
    const client = await prisma.client.create({
      data: {
        name, email, phone, document, documentType, type: type || 'PF',
        street, number, complement, neighborhood, city, state, zipCode,
        organizationId: req.orgId
      }
    });
    
    res.status(201).json(client);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

// ============================================
// ROTAS: PRODUCTS (TIPOLOGIAS)
// ============================================

// GET /api/products
app.get('/api/products', authenticate, async (req: any, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { organizationId: req.orgId, isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(products);
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// POST /api/products
app.post('/api/products', authenticate, async (req: any, res) => {
  try {
    const { code, name, description, type, basePrice } = req.body;
    
    const product = await prisma.product.create({
      data: {
        code, name, description, type, basePrice,
        organizationId: req.orgId
      }
    });
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// ============================================
// ROTAS: BUDGETS
// ============================================

// GET /api/budgets
app.get('/api/budgets', authenticate, async (req: any, res) => {
  try {
    const budgets = await prisma.budget.findMany({
      where: { organizationId: req.orgId },
      include: { client: true, createdBy: { select: { name: true } }, items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(budgets);
  } catch (error) {
    console.error('Budgets error:', error);
    res.status(500).json({ error: 'Erro ao buscar orçamentos' });
  }
});

// POST /api/budgets
app.post('/api/budgets', authenticate, async (req: any, res) => {
  try {
    const { clientId, items, notes, validityDays } = req.body;
    
    const num = await getNextNumber('BUDGET');
    const number = generateCode('ORC', num);
    
    // Calcular totais
    let subtotal = 0;
    items?.forEach((item: any) => {
      subtotal += item.quantity * item.unitPrice;
    });
    
    const budget = await prisma.budget.create({
      data: {
        number,
        clientId,
        subtotal,
        total: subtotal,
        notes,
        validityDays: validityDays || 30,
        validUntil: new Date(Date.now() + (validityDays || 30) * 24 * 60 * 60 * 1000),
        organizationId: req.orgId,
        createdById: req.user.id,
        items: items ? {
          create: items.map((item: any) => ({
            productId: item.productId,
            tipologyId: item.tipologyId,
            description: item.description,
            quantity: item.quantity,
            width: item.width,
            height: item.height,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice
          }))
        } : undefined
      },
      include: { items: true, client: true }
    });
    
    // Log
    await prisma.auditLog.create({
      data: { action: 'CREATE', entity: 'BUDGET', entityId: budget.id, organizationId: req.orgId }
    });
    
    res.status(201).json(budget);
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: 'Erro ao criar orçamento' });
  }
});

// ============================================
// ROTAS: ORDERS
// ============================================

// GET /api/orders
app.get('/api/orders', authenticate, async (req: any, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { organizationId: req.orgId },
      include: { client: true, createdBy: { select: { name: true } }, items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error('Orders error:', error);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// POST /api/orders
app.post('/api/orders', authenticate, async (req: any, res) => {
  try {
    const { clientId, budgetId, items, totalValue, deliveryDate } = req.body;
    
    const num = await getNextNumber('ORDER');
    const number = generateCode('PED', num);
    
    const order = await prisma.order.create({
      data: {
        number,
        clientId,
        budgetId,
        totalValue,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        organizationId: req.orgId,
        createdById: req.user.id,
        items: items ? {
          create: items.map((item: any) => ({
            productId: item.productId,
            tipologyId: item.tipologyId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice
          }))
        } : undefined
      },
      include: { items: true, client: true }
    });
    
    // Log
    await prisma.auditLog.create({
      data: { action: 'CREATE', entity: 'ORDER', entityId: order.id, organizationId: req.orgId }
    });
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// ============================================
// ROTAS: FINANCEIRO
// ============================================

// GET /api/transactions
app.get('/api/transactions', authenticate, async (req: any, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { organizationId: req.orgId },
      include: { client: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

// POST /api/transactions
app.post('/api/transactions', authenticate, async (req: any, res) => {
  try {
    const { type, category, description, amount, dueDate, clientId } = req.body;
    
    const transaction = await prisma.transaction.create({
      data: {
        type, category, description, amount,
        dueDate: dueDate ? new Date(dueDate) : null,
        clientId,
        organizationId: req.orgId
      }
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

// GET /api/dashboard
app.get('/api/dashboard', authenticate, async (req: any, res) => {
  try {
    const [clients, budgets, orders, transactions] = await Promise.all([
      prisma.client.count({ where: { organizationId: req.orgId } }),
      prisma.budget.findMany({ where: { organizationId: req.orgId }, select: { total: true, status: true } }),
      prisma.order.findMany({ where: { organizationId: req.orgId }, select: { totalValue: true, status: true } }),
      prisma.transaction.findMany({ where: { organizationId: req.orgId } })
    ]);
    
    const totalBudgetsValue = budgets.reduce((sum, b) => sum + Number(b.total), 0);
    const approvedBudgets = budgets.filter(b => b.status === 'APPROVED').length;
    const totalOrdersValue = orders.reduce((sum, o) => sum + Number(o.totalValue), 0);
    
    const income = transactions.filter(t => t.type === 'INCOME' && t.status === 'PAID').reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PAID').reduce((sum, t) => sum + Number(t.amount), 0);
    const pendingReceivable = transactions.filter(t => t.type === 'INCOME' && t.status !== 'PAID').reduce((sum, t) => sum + Number(t.amount), 0);
    
    res.json({
      clients,
      budgets: { total: budgets.length, approved: approvedBudgets, value: totalBudgetsValue },
      orders: { total: orders.length, value: totalOrdersValue },
      financial: { income, expenses, profit: income - expenses, pendingReceivable }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
});

// ============================================
// ROTAS: CADASTROS
// ============================================

// Profiles
app.get('/api/profiles', authenticate, async (req: any, res) => {
  try {
    const profiles = await prisma.profile.findMany({
      where: { organizationId: req.orgId, isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar perfis' });
  }
});

app.post('/api/profiles', authenticate, async (req: any, res) => {
  try {
    const profile = await prisma.profile.create({
      data: { ...req.body, organizationId: req.orgId }
    });
    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar perfil' });
  }
});

// Glasses
app.get('/api/glasses', authenticate, async (req: any, res) => {
  try {
    const glasses = await prisma.glass.findMany({
      where: { organizationId: req.orgId, isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(glasses);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar vidros' });
  }
});

app.post('/api/glasses', authenticate, async (req: any, res) => {
  try {
    const glass = await prisma.glass.create({
      data: { ...req.body, organizationId: req.orgId }
    });
    res.status(201).json(glass);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar vidro' });
  }
});

// Accessories
app.get('/api/accessories', authenticate, async (req: any, res) => {
  try {
    const accessories = await prisma.accessory.findMany({
      where: { organizationId: req.orgId, isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(accessories);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar acessórios' });
  }
});

app.post('/api/accessories', authenticate, async (req: any, res) => {
  try {
    const accessory = await prisma.accessory.create({
      data: { ...req.body, organizationId: req.orgId }
    });
    res.status(201).json(accessory);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar acessório' });
  }
});

// Inventory
app.get('/api/inventory', authenticate, async (req: any, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      where: { organizationId: req.orgId },
      orderBy: { name: 'asc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estoque' });
  }
});

app.post('/api/inventory', authenticate, async (req: any, res) => {
  try {
    const item = await prisma.inventoryItem.create({
      data: { ...req.body, organizationId: req.orgId }
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar item de estoque' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'EsquadriAPI' });
});

// ============================================
// START
// ============================================

app.listen(PORT, () => {
  console.log(`🚀 EsquadriAPI rodando na porta ${PORT}`);
});
