// Rotas Públicas para Portal do Cliente
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/public/budget/:token - Busca orçamento por token
router.get('/budget/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // O token é o ID do orçamento (simplificado)
    // Em produção, usar token único separado
    const budget = await prisma.budget.findUnique({
      where: { id: token },
      include: {
        client: true,
        organization: { select: { name: true } },
        items: true
      }
    });
    
    if (!budget) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }
    
    // Não expor dados sensíveis
    res.json({
      id: budget.id,
      number: budget.number,
      status: budget.status,
      items: budget.items,
      subtotal: budget.subtotal,
      discount: budget.discount,
      total: budget.total,
      validUntil: budget.validUntil,
      notes: budget.notes,
      createdAt: budget.createdAt,
      client: budget.client ? {
        name: budget.client.name,
        email: budget.client.email,
        phone: budget.client.phone
      } : null,
      organization: budget.organization
    });
  } catch (error) {
    console.error('Public budget error:', error);
    res.status(500).json({ error: 'Erro ao buscar orçamento' });
  }
});

// POST /api/public/budget/:token/accept - Aceita orçamento
router.post('/budget/:token/accept', async (req, res) => {
  try {
    const { token } = req.params;
    
    const budget = await prisma.budget.update({
      where: { id: token },
      data: { status: 'APPROVED' }
    });
    
    // Criar transação de accounts a receber
    await prisma.transaction.create({
      data: {
        type: 'INCOME',
        category: 'SALE',
        description: `Orçamento ${budget.number} aprovado`,
        amount: budget.total,
        dueDate: new Date(),
        status: 'PENDING',
        clientId: budget.clientId,
        organizationId: budget.organizationId
      }
    });
    
    res.json({ success: true, status: 'APPROVED' });
  } catch (error) {
    console.error('Accept budget error:', error);
    res.status(500).json({ error: 'Erro ao aceitar orçamento' });
  }
});

export default router;
