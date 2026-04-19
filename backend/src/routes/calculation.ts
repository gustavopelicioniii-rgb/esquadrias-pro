// Rotas de Cálculo para Esquadrias
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculationEngine } from '../services/calculation';

const router = Router();
const prisma = new PrismaClient();

// Middleware de autenticação (simplificado)
const authenticate = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  // Em produção, validar JWT aqui
  next();
};

// GET /api/typologies - Lista tipologias
router.get('/typologies', async (req, res) => {
  try {
    const { productLineId } = req.query;
    
    const where = productLineId ? { productLineId: productLineId as string } : {};
    
    const typologies = await prisma.typology.findMany({
      where,
      include: {
        productLine: true,
        profiles: { include: { profile: true } },
        accessories: { include: { accessory: true } }
      }
    });
    
    res.json(typologies);
  } catch (error) {
    console.error('Typologies error:', error);
    res.status(500).json({ error: 'Erro ao buscar tipologias' });
  }
});

// GET /api/product-lines - Lista linhas de produto
router.get('/product-lines', async (req, res) => {
  try {
    const productLines = await prisma.productLine.findMany({
      where: { isActive: true },
      include: {
        profiles: true,
        glasses: true,
        accessories: true,
        typologies: true
      }
    });
    
    res.json(productLines);
  } catch (error) {
    console.error('Product lines error:', error);
    res.status(500).json({ error: 'Erro ao buscar linhas de produto' });
  }
});

// GET /api/profiles - Lista perfis
router.get('/profiles', async (req, res) => {
  try {
    const { productLineId } = req.query;
    const where = productLineId ? { productLineId: productLineId as string } : {};
    
    const profiles = await prisma.profile.findMany({
      where,
      include: { productLine: true }
    });
    
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar perfis' });
  }
});

// POST /api/calculate - Calcula custo de uma esquadria
router.post('/calculate', async (req, res) => {
  try {
    const { typologyId, productLineId, width, height, quantity, options } = req.body;
    
    if (!typologyId || !productLineId || !width || !height || !quantity) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios faltando' });
    }
    
    // Buscar dados do banco
    const typology = await prisma.typology.findUnique({
      where: { id: typologyId },
      include: {
        profiles: { include: { profile: true } },
        accessories: { include: { accessory: true } },
        productLine: { include: { glasses: true } }
      }
    });
    
    if (!typology) {
      return res.status(404).json({ error: 'Tipologia não encontrada' });
    }
    
    // Buscar acessório padrão se não houver configurado
    let glasses = typology.productLine.glasses;
    if (glasses.length === 0) {
      // Buscar qualquer vidro da linha ou criar mock
      glasses = await prisma.glass.findMany({
        where: { productLineId },
        take: 1
      });
    }
    
    // Calcular
    const result = await calculationEngine.calculate(
      { typologyId, productLineId, width, height, quantity, options },
      {
        typology,
        profiles: typology.profiles,
        accessories: typology.accessories,
        glasses
      }
    );
    
    // Salvar cálculo
    const calculation = await prisma.calculation.create({
      data: {
        typologyId,
        width,
        height,
        quantity,
        options: options ? JSON.stringify(options) : null,
        resultJson: result as any,
        totalCost: result.totals.totalCost,
        salePrice: result.totals.salePrice
      }
    });
    
    res.json({ ...result, calculationId: calculation.id });
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ error: 'Erro ao calcular' });
  }
});

// POST /api/calculate/optimize - Retorna otimização de corte
router.post('/calculate/optimize', async (req, res) => {
  try {
    const { cuts } = req.body; // Array de { length: number, quantity: number }
    
    if (!cuts || !Array.isArray(cuts)) {
      return res.status(400).json({ error: 'Cuts array required' });
    }
    
    // Expandir cuts em lista de tamanhos
    const requiredLengths: number[] = [];
    for (const cut of cuts) {
      for (let i = 0; i < cut.quantity; i++) {
        requiredLengths.push(cut.length);
      }
    }
    
    const result = calculationEngine.optimizeCut(requiredLengths);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao otimizar corte' });
  }
});

// POST /api/calculate/quote - Gera orçamento
router.post('/calculate/quote', async (req, res) => {
  try {
    const { clientId, items, notes, validityDays, discount } = req.body;
    
    // items: Array de { typologyId, productLineId, width, height, quantity, options }
    
    const calculations = [];
    let subtotal = 0;
    
    for (const item of items) {
      // Calcular cada item
      const typology = await prisma.typology.findUnique({
        where: { id: item.typologyId },
        include: {
          profiles: { include: { profile: true } },
          accessories: { include: { accessory: true } },
          productLine: { include: { glasses: true } }
        }
      });
      
      if (!typology) continue;
      
      const glasses = typology.productLine.glasses;
      const result = await calculationEngine.calculate(
        { ...item, typologyId: item.typologyId },
        { typology, profiles: typology.profiles, accessories: typology.accessories, glasses }
      );
      
      calculations.push({
        ...result,
        width: item.width,
        height: item.height,
        quantity: item.quantity
      });
      
      subtotal += result.totals.salePrice;
    }
    
    const discountAmount = discount || 0;
    const total = subtotal - discountAmount;
    
    res.json({
      calculations,
      summary: {
        itemsCount: items.length,
        subtotal: Math.round(subtotal * 100) / 100,
        discount: discountAmount,
        total: Math.round(total * 100) / 100
      }
    });
  } catch (error) {
    console.error('Quote error:', error);
    res.status(500).json({ error: 'Erro ao gerar orçamento' });
  }
});

// POST /api/seed - Seed de dados de exemplo
router.post('/seed', async (req, res) => {
  try {
    // Verificar se já existe
    const existing = await prisma.productLine.findFirst();
    if (existing) {
      return res.json({ message: 'Dados já existem', productLineId: existing.id });
    }
    
    // Criar linha de produto
    const productLine = await prisma.productLine.create({
      data: {
        name: 'Suprema Classic',
        supplier: 'Alumasa',
        organizationId: req.body.organizationId || 'default'
      }
    });
    
    // Criar perfis
    const profiles = await Promise.all([
      prisma.profile.create({
        data: { code: 'TRL-INF', name: 'Trilho Inferior 38mm', category: 'TRACK_LOWER', weightPerMeter: 0.850, pricePerKg: 32.00, productLineId: productLine.id }
      }),
      prisma.profile.create({
        data: { code: 'TRL-SUP', name: 'Trilho Superior 38mm', category: 'TRACK_UPPER', weightPerMeter: 0.780, pricePerKg: 32.00, productLineId: productLine.id }
      }),
      prisma.profile.create({
        data: { code: 'VER-EXT', name: 'Vertical Externo', category: 'VERTICAL', weightPerMeter: 0.620, pricePerKg: 32.00, productLineId: productLine.id }
      }),
      prisma.profile.create({
        data: { code: 'VER-INT', name: 'Vertical Interno', category: 'VERTICAL', weightPerMeter: 0.550, pricePerKg: 32.00, productLineId: productLine.id }
      }),
      prisma.profile.create({
        data: { code: 'INT', name: 'Intermediário', category: 'INTERMEDIATE', weightPerMeter: 0.500, pricePerKg: 32.00, productLineId: productLine.id }
      }),
      prisma.profile.create({
        data: { code: 'LAS-INF', name: 'Lastro Inferior', category: 'LASTER', weightPerMeter: 0.450, pricePerKg: 32.00, productLineId: productLine.id }
      }),
      prisma.profile.create({
        data: { code: 'LAS-SUP', name: 'Lastro Superior', category: 'LASTER', weightPerMeter: 0.420, pricePerKg: 32.00, productLineId: productLine.id }
      })
    ]);
    
    // Criar vidros
    const glasses = await Promise.all([
      prisma.glass.create({
        data: { code: 'VIC-4', name: 'Vidro Incolor 4mm', type: 'FLOAT', thickness: 4, pricePerM2: 180.00, productLineId: productLine.id }
      }),
      prisma.glass.create({
        data: { code: 'VIC-6', name: 'Vidro Incolor 6mm', type: 'FLOAT', thickness: 6, pricePerM2: 220.00, productLineId: productLine.id }
      }),
      prisma.glass.create({
        data: { code: 'VTC-4', name: 'Vidro Temperado 4mm', type: 'TEMPERED', thickness: 4, pricePerM2: 280.00, productLineId: productLine.id }
      }),
      prisma.glass.create({
        data: { code: 'VTC-6', name: 'Vidro Temperado 6mm', type: 'TEMPERED', thickness: 6, pricePerM2: 340.00, productLineId: productLine.id }
      })
    ]);
    
    // Criar acessórios
    const accessories = await Promise.all([
      prisma.accessory.create({
        data: { code: 'ROL-01', name: 'Roldana 25mm Dupla', category: 'ROLLER', unit: 'un', pricePerUnit: 15.00, productLineId: productLine.id }
      }),
      prisma.accessory.create({
        data: { code: 'FEC-01', name: 'Fecho 90cm', category: 'LOCK', unit: 'un', pricePerUnit: 35.00, productLineId: productLine.id }
      }),
      prisma.accessory.create({
        data: { code: 'TRC-01', name: 'Trinco', category: 'LOCK', unit: 'un', pricePerUnit: 18.00, productLineId: productLine.id }
      }),
      prisma.accessory.create({
        data: { code: 'ESC-01', name: 'Escova Perimetral (m)', category: 'BRUSH', unit: 'm', pricePerUnit: 8.00, productLineId: productLine.id }
      })
    ]);
    
    // Criar tipologia: Janela Correr 2 Folhas
    const jc2f = await prisma.typology.create({
      data: {
        code: 'JC-2F',
        name: 'Janela Correr 2 Folhas',
        type: 'JC',
        icon: '🪟',
        productLineId: productLine.id
      }
    });
    
    // Associar perfis à tipologia (fórmulas em METROS)
    // Ex: para 1200x1200mm -> width=1.2, height=1.2 metros
    // JC-2F precisa de: 2 trilhos (largura) + 2 verts (altura) + 1 int (altura) + 2 lastros (largura)
    await Promise.all([
      prisma.typologyProfile.create({
        data: { typologyId: jc2f.id, profileId: profiles[0].id, formula: 'width * 1', cutMargin: 0 } // Trilho inferior = largura
      }),
      prisma.typologyProfile.create({
        data: { typologyId: jc2f.id, profileId: profiles[1].id, formula: 'width * 1', cutMargin: 0 } // Trilho superior = largura
      }),
      prisma.typologyProfile.create({
        data: { typologyId: jc2f.id, profileId: profiles[2].id, formula: 'height * 2', cutMargin: 0 } // 2 Verticais externos = altura * 2
      }),
      prisma.typologyProfile.create({
        data: { typologyId: jc2f.id, profileId: profiles[4].id, formula: 'height * 1', cutMargin: 0 } // 1 Intermediário = altura
      }),
      prisma.typologyProfile.create({
        data: { typologyId: jc2f.id, profileId: profiles[5].id, formula: 'width * 1', cutMargin: 0 } // Lastro inferior = largura
      }),
      prisma.typologyProfile.create({
        data: { typologyId: jc2f.id, profileId: profiles[6].id, formula: 'width * 1', cutMargin: 0 } // Lastro superior = largura
      })
    ]);
    
    // Associar acessórios
    // Fórmula agora usa variáveis em METROS (width/height são convertidos)
    await Promise.all([
      prisma.typologyAccessory.create({
        data: { typologyId: jc2f.id, accessoryId: accessories[0].id, formula: '4', minQty: 4 } // 4 roldanas
      }),
      prisma.typologyAccessory.create({
        data: { typologyId: jc2f.id, accessoryId: accessories[1].id, formula: '1', minQty: 1 } // 1 fecho
      }),
      prisma.typologyAccessory.create({
        data: { typologyId: jc2f.id, accessoryId: accessories[2].id, formula: '1', minQty: 1 } // 1 trinco
      }),
      prisma.typologyAccessory.create({
        data: { typologyId: jc2f.id, accessoryId: accessories[3].id, formula: '(width + height) * 2', minQty: 1 } // Escova perimetral em metros
      })
    ]);
    
    // Criar tipologia: Porta de Giro 1 Folha
    const pg1f = await prisma.typology.create({
      data: {
        code: 'PG-1F',
        name: 'Porta de Giro 1 Folha',
        type: 'PG',
        icon: '🚪',
        productLineId: productLine.id
      }
    });
    
    await Promise.all([
      prisma.typologyProfile.create({
        data: { typologyId: pg1f.id, profileId: profiles[2].id, formula: 'height * 2', cutMargin: 20 } // 2 Verticais
      }),
      prisma.typologyProfile.create({
        data: { typologyId: pg1f.id, profileId: profiles[3].id, formula: 'width * 2', cutMargin: 20 } // 2 Horizontais
      })
    ]);
    
    res.json({
      message: 'Seed criado com sucesso',
      productLine,
      profiles: profiles.length,
      glasses: glasses.length,
      accessories: accessories.length,
      typologies: 2
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Erro ao criar seed' });
  }
});

export default router;
