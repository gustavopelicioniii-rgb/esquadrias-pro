"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// EsquadriAPI - Backend Completo
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const calculation_1 = __importDefault(require("./routes/calculation"));
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3003;
const JWT_SECRET = process.env.JWT_SECRET || 'esquadrias-secret-key-2026';
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const limiter = (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);
// ============================================
// UTILIDADES
// ============================================
function generateCode(prefix) {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}-${year}-${timestamp}`;
}
// Middleware de autenticação
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token)
            return res.status(401).json({ error: 'Token não fornecido' });
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { organization: true }
        });
        if (!user)
            return res.status(401).json({ error: 'Usuário não encontrado' });
        req.user = user;
        req.orgId = user.organizationId;
        next();
    }
    catch {
        res.status(401).json({ error: 'Token inválido' });
    }
};
// ============================================
// ROTAS: AUTENTICAÇÃO
// ============================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, organizationName } = req.body;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing)
            return res.status(400).json({ error: 'Email já cadastrado' });
        const organization = await prisma.organization.create({
            data: { name: organizationName }
        });
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email, password: hashedPassword, name, role: 'OWNER',
                organizationId: organization.id
            }
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, orgId: organization.id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            organization: { id: organization.id, name: organization.name }
        });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { email },
            include: { organization: true }
        });
        if (!user)
            return res.status(401).json({ error: 'Credenciais inválidas' });
        const validPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!validPassword)
            return res.status(401).json({ error: 'Credenciais inválidas' });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, orgId: user.organizationId }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            organization: { id: user.organization.id, name: user.organization.name, plan: user.organization.plan }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro interno' });
    }
});
app.get('/api/auth/me', authenticate, (req, res) => {
    const user = req.user;
    res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        organization: { id: user.organization.id, name: user.organization.name, plan: user.organization.plan }
    });
});
// ============================================
// ROTAS: CLIENTES
// ============================================
app.get('/api/clients', authenticate, async (req, res) => {
    try {
        const clients = await prisma.client.findMany({
            where: { organizationId: req.orgId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(clients);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
});
app.post('/api/clients', authenticate, async (req, res) => {
    try {
        const client = await prisma.client.create({
            data: { ...req.body, organizationId: req.orgId }
        });
        res.status(201).json(client);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar cliente' });
    }
});
// ============================================
// ROTAS: DASHBOARD
// ============================================
app.get('/api/dashboard', authenticate, async (req, res) => {
    try {
        const [clients, budgets, orders, transactions] = await Promise.all([
            prisma.client.count({ where: { organizationId: req.orgId } }),
            prisma.budget.findMany({ where: { organizationId: req.orgId }, select: { total: true, status: true } }),
            prisma.order.findMany({ where: { organizationId: req.orgId }, select: { totalValue: true } }),
            prisma.transaction.findMany({ where: { organizationId: req.orgId } })
        ]);
        const totalBudgetsValue = budgets.reduce((s, b) => s + Number(b.total), 0);
        const approvedBudgets = budgets.filter(b => b.status === 'APPROVED').length;
        const totalOrdersValue = orders.reduce((s, o) => s + Number(o.totalValue), 0);
        const income = transactions.filter(t => t.type === 'INCOME' && t.status === 'PAID').reduce((s, t) => s + Number(t.amount), 0);
        const expenses = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PAID').reduce((s, t) => s + Number(t.amount), 0);
        const pendingReceivable = transactions.filter(t => t.type === 'INCOME' && t.status !== 'PAID').reduce((s, t) => s + Number(t.amount), 0);
        res.json({
            clients,
            budgets: { total: budgets.length, approved: approvedBudgets, value: totalBudgetsValue },
            orders: { total: orders.length, value: totalOrdersValue },
            financial: { income, expenses, profit: income - expenses, pendingReceivable }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dashboard' });
    }
});
// ============================================
// ROTAS: ORÇAMENTOS
// ============================================
app.get('/api/budgets', authenticate, async (req, res) => {
    try {
        const budgets = await prisma.budget.findMany({
            where: { organizationId: req.orgId },
            include: { client: true, createdBy: { select: { name: true } },
                orderBy: { createdAt: 'desc' }
            }
        });
        res.json(budgets);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar orçamentos' });
    }
});
app.post('/api/budgets', authenticate, async (req, res) => {
    try {
        const { clientId, items, notes, validityDays } = req.body;
        let subtotal = 0;
        items?.forEach((item) => {
            subtotal += item.quantity * item.unitPrice;
        });
        const budget = await prisma.budget.create({
            data: {
                number: generateCode('ORC'),
                clientId,
                subtotal,
                total: subtotal,
                notes,
                validityDays: validityDays || 30,
                validUntil: new Date(Date.now() + (validityDays || 30) * 24 * 60 * 60 * 1000),
                organizationId: req.orgId,
                createdById: req.user.id,
                items: items ? {
                    create: items.map((item) => ({
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
        res.status(201).json(budget);
    }
    catch (error) {
        console.error('Create budget error:', error);
        res.status(500).json({ error: 'Erro ao criar orçamento' });
    }
});
// ============================================
// ROTAS: PEDIDOS
// ============================================
app.get('/api/orders', authenticate, async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { organizationId: req.orgId },
            include: { client: true, createdBy: { select: { name: true } },
                orderBy: { createdAt: 'desc' }
            }
        });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar pedidos' });
    }
});
app.post('/api/orders', authenticate, async (req, res) => {
    try {
        const { clientId, totalValue, deliveryDate, items } = req.body;
        const order = await prisma.order.create({
            data: {
                number: generateCode('PED'),
                clientId,
                totalValue,
                deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
                organizationId: req.orgId,
                createdById: req.user.id,
                items: items ? {
                    create: items.map((item) => ({
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
        res.status(201).json(order);
    }
    catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Erro ao criar pedido' });
    }
});
// ============================================
// ROTAS: FINANCEIRO
// ============================================
app.get('/api/transactions', authenticate, async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            where: { organizationId: req.orgId },
            include: { client: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(transactions);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar transações' });
    }
});
app.post('/api/transactions', authenticate, async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar transação' });
    }
});
// ============================================
// ROTAS: ESTOQUE
// ============================================
app.get('/api/inventory', authenticate, async (req, res) => {
    try {
        const items = await prisma.inventoryItem.findMany({
            where: { organizationId: req.orgId },
            orderBy: { name: 'asc' }
        });
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar estoque' });
    }
});
app.post('/api/inventory', authenticate, async (req, res) => {
    try {
        const item = await prisma.inventoryItem.create({
            data: { ...req.body, organizationId: req.orgId }
        });
        res.status(201).json(item);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar item' });
    }
});
// ============================================
// CÁLCULO TÉCNICO
// ============================================
app.use('/api/calculate', calculation_1.default);
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
//# sourceMappingURL=index.js.map