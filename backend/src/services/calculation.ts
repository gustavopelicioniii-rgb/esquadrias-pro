// Calculation Engine para Esquadrias de Alumínio

// ============================================
// TIPOS
// ============================================

export interface CalculationInput {
  typologyId: string;
  productLineId: string;
  width: number;        // mm
  height: number;       // mm
  quantity: number;
  options?: {
    glassType?: string;
    hasScreen?: boolean;
    hasSecurityBar?: boolean;
  };
}

export interface ProfileResult {
  profileId: string;
  profileName: string;
  category: string;
  totalMeters: number;
  barsNeeded: number;
  barWaste: number;
  pricePerKg: number;
  totalPrice: number;
}

export interface GlassResult {
  glassId: string;
  glassName: string;
  glassType: string;
  thickness: number;
  areaPerUnit: number;  // m²
  totalArea: number;    // m² total
  pricePerM2: number;
  totalPrice: number;
}

export interface AccessoryResult {
  accessoryId: string;
  accessoryName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CutOptimization {
  totalMetersNeeded: number;
  totalBarsNeeded: number;
  totalWasteMeters: number;
  wastePercentage: number;
  cutList: {
    barNumber: number;
    cuts: { size: number; quantity: number }[];
    remaining: number;
  }[];
}

export interface CalculationOutput {
  input: {
    typology: string;
    typologyCode: string;
    width: number;
    height: number;
    quantity: number;
    productLine: string;
    options?: any;
  };
  profiles: ProfileResult[];
  glasses: GlassResult[];
  accessories: AccessoryResult[];
  totals: {
    profilesCost: number;
    glassesCost: number;
    accessoriesCost: number;
    laborCost: number;
    totalCost: number;
    salePrice: number;
    profitMargin: number;
  };
  cutOptimization: CutOptimization;
}

// ============================================
// ENGINE DE CÁLCULO
// ============================================

export class CalculationEngine {
  
  // Avalia fórmula matemática simples
  // As fórmulas são escritas em metros (ex: "height / 1000 * 2")
  private evaluateFormula(formula: string, vars: Record<string, number>): number {
    let expr = formula
      .replace(/width/gi, vars.width.toString())
      .replace(/height/gi, vars.height.toString())
      .replace(/quantity/gi, vars.quantity.toString());
    
    // Substituir operadores em português
    expr = expr.replace(/×/g, '*').replace(/÷/g, '/');
    
    try {
      const result = Function('"use strict"; return (' + expr + ')')();
      return Math.max(0, result);
    } catch {
      return 0;
    }
  }

  // Calcula metros lineares totais
  calculateProfileMeters(
    typologyProfiles: Array<{ formula: string; cutMargin: number; profile: any }>,
    width: number,
    height: number,
    quantity: number
  ): Array<{ profileId: string; profileName: string; category: string; meters: number; pricePerKg: number }> {
    // Variáveis em METROS para as fórmulas
    const vars = { 
      width: width / 1000,  // converter mm para metros
      height: height / 1000, 
      quantity 
    };
    
    return typologyProfiles.map(tp => ({
      profileId: tp.profile.id,
      profileName: tp.profile.name,
      category: tp.profile.category,
      meters: this.evaluateFormula(tp.formula, vars), // resultado já em metros
      pricePerKg: Number(tp.profile.pricePerKg)
    }));
  }

  // Calcula área de vidro
  calculateGlassArea(
    width: number,
    height: number,
    type: string = 'FLOAT'
  ): number {
    // Fórmula genérica: (largura - 40mm) * (altura - 60mm) para corte
    // Depois converter para m²
    const netWidth = Math.max(100, width - 40);
    const netHeight = Math.max(100, height - 60);
    return (netWidth * netHeight) / 1000000; // converter mm² para m²
  }

  // Calcula quantidade de acessórios
  // As fórmulas usam variáveis em METROS (como os perfis)
  calculateAccessoryQty(
    formula: string,
    width: number,
    height: number,
    minQty: number = 1
  ): number {
    const vars = { 
      width: width / 1000,  // converter mm para metros
      height: height / 1000, 
      quantity: 1 
    };
    const qty = this.evaluateFormula(formula, vars);
    return Math.max(minQty, Math.round(qty));
  }

  // Otimização de corte First Fit Decreasing
  optimizeCut(
    requiredLengths: number[], // em mm
    barLength: number = 6000  // 6 metros padrão
  ): CutOptimization {
    if (requiredLengths.length === 0) {
      return {
        totalMetersNeeded: 0,
        totalBarsNeeded: 0,
        totalWasteMeters: 0,
        wastePercentage: 0,
        cutList: []
      };
    }
    
    // Agrupar tamanhos iguais (arredondar para 10mm)
    const counts: Record<number, number> = {};
    for (const len of requiredLengths) {
      const normalized = Math.round(len / 10) * 10;
      if (normalized > 0) {
        counts[normalized] = (counts[normalized] || 0) + 1;
      }
    }
    
    // Ordenar tamanhos decrescentes
    const sorted = Object.entries(counts)
      .map(([size, qty]) => ({ size: Number(size), qty }))
      .sort((a, b) => b.size - a.size);
    
    // Algoritmo First Fit Decreasing
    const bars: { cuts: { size: number; quantity: number }[]; remaining: number }[] = [];
    
    for (const item of sorted) {
      let qty = item.qty;
      
      while (qty > 0) {
        // Procurar barra com espaço suficiente
        const barIndex = bars.findIndex(b => b.remaining >= item.size);
        
        if (barIndex >= 0) {
          // Adicionar nesta barra
          const bar = bars[barIndex];
          const existing = bar.cuts.find(c => c.size === item.size);
          if (existing) {
            existing.quantity++;
          } else {
            bar.cuts.push({ size: item.size, quantity: 1 });
          }
          bar.remaining -= item.size;
          qty--;
        } else {
          // Criar nova barra
          bars.push({
            cuts: [{ size: item.size, quantity: 1 }],
            remaining: barLength - item.size
          });
          qty--;
        }
      }
    }
    
    // Calcular totais
    const totalBarsNeeded = bars.length;
    const totalMetersNeeded = requiredLengths.reduce((s, l) => s + (l / 1000), 0);
    const totalBarMeters = totalBarsNeeded * (barLength / 1000);
    const totalWasteMeters = bars.reduce((s, b) => s + (b.remaining / 1000), 0);
    const wastePercentage = totalBarMeters > 0 ? (totalWasteMeters / totalBarMeters) * 100 : 0;
    
    return {
      totalMetersNeeded: Math.round(totalMetersNeeded * 100) / 100,
      totalBarsNeeded,
      totalWasteMeters: Math.round(totalWasteMeters * 100) / 100,
      wastePercentage: Math.round(wastePercentage * 10) / 10,
      cutList: bars.map((bar, i) => ({
        barNumber: i + 1,
        cuts: bar.cuts,
        remaining: bar.remaining
      }))
    };
  }

  // Cálculo principal
  async calculate(
    input: CalculationInput,
    dbData: {
      typology: any;
      profiles: any[];
      accessories: any[];
      glasses: any[];
    }
  ): Promise<CalculationOutput> {
    const { width, height, quantity, options } = input;
    
    // 1. Calcular perfis
    const profileResults = this.calculateProfileMeters(
      dbData.profiles,
      width,
      height,
      quantity
    );
    
    // Agrupar por perfil
    const profileMap = new Map<string, ProfileResult>();
    
    for (const p of profileResults) {
      const totalMeters = p.meters * quantity; // multiplicar pela quantidade
      const barLength = 6; // metros
      const barsNeeded = Math.ceil(totalMeters / barLength);
      const totalBarLength = barsNeeded * barLength;
      const barWaste = totalBarLength - totalMeters;
      // Calcular peso: metros * peso por metro (do perfil)
      const weight = totalMeters * 0.8; // ~0.8kg/m médio para perfis de janela
      const price = weight * p.pricePerKg;
      
      if (profileMap.has(p.profileId)) {
        const existing = profileMap.get(p.profileId)!;
        existing.totalMeters += totalMeters;
        existing.barsNeeded += barsNeeded;
        existing.barWaste += barWaste;
        existing.totalPrice += price;
      } else {
        profileMap.set(p.profileId, {
          profileId: p.profileId,
          profileName: p.profileName,
          category: p.category,
          totalMeters,
          barsNeeded,
          barWaste,
          pricePerKg: p.pricePerKg,
          totalPrice: price
        });
      }
    }
    
    // 2. Calcular vidro
    const glassArea = this.calculateGlassArea(width, height, options?.glassType);
    const glass = dbData.glasses[0];
    const glassPricePerM2 = glass ? Number(glass.pricePerM2) : 180;
    const glassName = glass?.name || 'Vidro Incolor 4mm';
    const glassThickness = glass ? Number(glass.thickness) : 4;
    
    const glassResults: GlassResult[] = [{
      glassId: glass?.id || 'default',
      glassName,
      glassType: options?.glassType || 'FLOAT',
      thickness: glassThickness,
      areaPerUnit: Math.round(glassArea * 100) / 100,
      totalArea: Math.round(glassArea * quantity * 100) / 100,
      pricePerM2: glassPricePerM2,
      totalPrice: Math.round(glassArea * quantity * glassPricePerM2 * 100) / 100
    }];
    
    // 3. Calcular acessórios
    const accessoryResults: AccessoryResult[] = dbData.accessories.map(acc => {
      const qtyPerUnit = this.calculateAccessoryQty(acc.formula, width, height, acc.minQty);
      const totalQty = qtyPerUnit * quantity;
      const totalPrice = totalQty * Number(acc.accessory.pricePerUnit);
      
      return {
        accessoryId: acc.accessory.id,
        accessoryName: acc.accessory.name,
        category: acc.accessory.category,
        quantity: totalQty,
        unitPrice: Number(acc.accessory.pricePerUnit),
        totalPrice
      };
    });
    
    // 4. Calcular totais
    const profilesCost = Array.from(profileMap.values()).reduce((s, p) => s + p.totalPrice, 0);
    const glassesCost = glassResults.reduce((s, g) => s + g.totalPrice, 0);
    const accessoriesCost = accessoryResults.reduce((s, a) => s + a.totalPrice, 0);
    const laborCost = quantity * 50; // R$ 50 por unidade
    
    const totalCost = profilesCost + glassesCost + accessoriesCost + laborCost;
    const salePrice = totalCost * 1.45; // 45% margem
    const profitMargin = ((salePrice - totalCost) / salePrice) * 100;
    
    // 5. Otimização de corte
    const requiredLengths: number[] = [];
    for (const p of Array.from(profileMap.values())) {
      // Gerar lista de cortes - cada barra tem 6000mm
      // Simplified: calculate how many bars and distribute cuts
      const cutsPerBar = Math.floor(6000 / (p.totalMeters * 1000 / p.barsNeeded)) || 1;
      for (let i = 0; i < p.barsNeeded; i++) {
        requiredLengths.push(Math.round((p.totalMeters * 1000) / p.barsNeeded));
      }
    }
    
    const cutOptimization = this.optimizeCut(requiredLengths);
    
    return {
      input: {
        typology: dbData.typology.name,
        typologyCode: dbData.typology.code,
        width,
        height,
        quantity,
        productLine: input.productLineId,
        options
      },
      profiles: Array.from(profileMap.values()),
      glasses: glassResults,
      accessories: accessoryResults,
      totals: {
        profilesCost: Math.round(profilesCost * 100) / 100,
        glassesCost: Math.round(glassesCost * 100) / 100,
        accessoriesCost: Math.round(accessoriesCost * 100) / 100,
        laborCost,
        totalCost: Math.round(totalCost * 100) / 100,
        salePrice: Math.round(salePrice * 100) / 100,
        profitMargin: Math.round(profitMargin * 10) / 10
      },
      cutOptimization
    };
  }
}

export const calculationEngine = new CalculationEngine();
