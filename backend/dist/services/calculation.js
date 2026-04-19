"use strict";
// Calculation Engine para Esquadrias de Alumínio
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculationEngine = exports.CalculationEngine = void 0;
// ============================================
// ENGINE DE CÁLCULO
// ============================================
class CalculationEngine {
    // Avalia fórmula matemática simples
    evaluateFormula(formula, vars) {
        let expr = formula
            .replace(/width/gi, vars.width.toString())
            .replace(/height/gi, vars.height.toString())
            .replace(/quantity/gi, vars.quantity.toString());
        // Substituir operadores em português
        expr = expr.replace(/×/g, '*').replace(/÷/g, '/');
        try {
            // Avaliar expressão matemática segura
            const result = Function('"use strict"; return (' + expr + ')')();
            return Math.max(0, result);
        }
        catch {
            return 0;
        }
    }
    // Calcula metros lineares totais
    calculateProfileMeters(typologyProfiles, width, height, quantity) {
        const vars = { width, height, quantity };
        return typologyProfiles.map(tp => ({
            profileId: tp.profile.id,
            profileName: tp.profile.name,
            category: tp.profile.category,
            meters: this.evaluateFormula(tp.formula, vars) + (tp.cutMargin * quantity / 1000), // converter mm para m
            pricePerKg: Number(tp.profile.pricePerKg)
        }));
    }
    // Calcula área de vidro
    calculateGlassArea(width, height, type = 'FLOAT') {
        // Fórmula genérica: (largura - 40mm) * (altura - 60mm) para corte
        const netWidth = Math.max(100, width - 40);
        const netHeight = Math.max(100, height - 60);
        return (netWidth * netHeight) / 1000000; // converter mm² para m²
    }
    // Calcula quantidade de acessórios
    calculateAccessoryQty(formula, width, height, minQty = 1) {
        const vars = { width, height, quantity: 1 };
        const qty = this.evaluateFormula(formula, vars);
        return Math.max(minQty, Math.round(qty));
    }
    // Otimização de corte First Fit Decreasing
    optimizeCut(requiredLengths, // em mm
    barLength = 6000 // 6 metros padrão
    ) {
        // Converter para metros para apresentação
        const toMeters = (mm) => mm / 1000;
        // Agrupar tamanhos iguais
        const counts = {};
        for (const len of requiredLengths) {
            const normalized = Math.round(len / 10) * 10; // agrupar de 10mm
            counts[normalized] = (counts[normalized] || 0) + 1;
        }
        // Ordenar tamanhos decrescentes
        const sorted = Object.entries(counts)
            .map(([size, qty]) => ({ size: Number(size), qty }))
            .sort((a, b) => b.size - a.size);
        // Algoritmo First Fit Decreasing
        const bars = [];
        for (const item of sorted) {
            let remaining = item.size;
            let qty = item.qty;
            while (qty > 0) {
                // Procurar barra com espaço
                const bar = bars.find(b => b.remaining >= remaining);
                if (bar) {
                    // Adicionar nesta barra
                    const existing = bar.cuts.find(c => c.size === item.size);
                    if (existing) {
                        existing.quantity++;
                    }
                    else {
                        bar.cuts.push({ size: item.size, quantity: 1 });
                    }
                    bar.remaining -= remaining;
                    qty--;
                }
                else {
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
        const totalMetersNeeded = requiredLengths.reduce((s, l) => s + toMeters(l), 0);
        const totalBarMeters = totalBarsNeeded * toMeters(barLength);
        const totalWasteMeters = bars.reduce((s, b) => s + toMeters(b.remaining), 0);
        const wastePercentage = totalBarMeters > 0 ? (totalWasteMeters / totalBarMeters) * 100 : 0;
        return {
            totalMetersNeeded,
            totalBarsNeeded,
            totalWasteMeters,
            wastePercentage: Math.round(wastePercentage * 10) / 10,
            cutList: bars.map((bar, i) => ({
                barNumber: i + 1,
                cuts: bar.cuts,
                remaining: bar.remaining
            }))
        };
    }
    // Cálculo principal
    async calculate(input, dbData) {
        const { width, height, quantity, options } = input;
        // 1. Calcular perfis
        const profileResults = this.calculateProfileMeters(dbData.profiles, width, height, quantity);
        // Agrupar por perfil (mesmo perfil pode aparecer múltiplas vezes na tipologia)
        const profileMap = new Map();
        for (const p of profileResults) {
            const totalMeters = p.meters;
            const barsNeeded = Math.ceil((totalMeters * 1000) / 6000); // converter para mm
            const barWaste = ((barsNeeded * 6000) - (totalMeters * 1000)) / 1000;
            const weight = totalMeters * 0.8; // kg médio假设
            const price = totalMeters * weight * Number(p.pricePerKg);
            if (profileMap.has(p.profileId)) {
                const existing = profileMap.get(p.profileId);
                existing.totalMeters += totalMeters;
                existing.barsNeeded += barsNeeded;
                existing.barWaste += barWaste;
                existing.totalPrice += price;
            }
            else {
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
        const glassPricePerM2 = Number(dbData.glasses[0]?.pricePerM2 || 180);
        const glassResults = [{
                glassId: dbData.glasses[0]?.id || 'default',
                glassName: dbData.glasses[0]?.name || 'Vidro',
                glassType: options?.glassType || 'FLOAT',
                thickness: Number(dbData.glasses[0]?.thickness || 4),
                areaPerUnit: Math.round(glassArea * 100) / 100,
                totalArea: Math.round(glassArea * quantity * 100) / 100,
                pricePerM2: glassPricePerM2,
                totalPrice: glassArea * quantity * glassPricePerM2
            }];
        // 3. Calcular acessórios
        const accessoryResults = dbData.accessories.map(acc => ({
            accessoryId: acc.accessory.id,
            accessoryName: acc.accessory.name,
            category: acc.accessory.category,
            quantity: this.calculateAccessoryQty(acc.formula, width, height, acc.minQty) * quantity,
            unitPrice: Number(acc.accessory.pricePerUnit),
            totalPrice: this.calculateAccessoryQty(acc.formula, width, height, acc.minQty) * quantity * Number(acc.accessory.pricePerUnit)
        }));
        // 4. Calcular totais
        const profilesCost = Array.from(profileMap.values()).reduce((s, p) => s + p.totalPrice, 0);
        const glassesCost = glassResults.reduce((s, g) => s + g.totalPrice, 0);
        const accessoriesCost = accessoryResults.reduce((s, a) => s + a.totalPrice, 0);
        const laborCost = quantity * 50; // R$ 50 por unidade
        const totalCost = profilesCost + glassesCost + accessoriesCost + laborCost;
        const salePrice = totalCost * 1.45; // 45% margem
        const profitMargin = ((salePrice - totalCost) / salePrice) * 100;
        // 5. Otimização de corte
        const requiredLengths = Array.from(profileMap.values()).flatMap(p => {
            // Gerar lista de cortes (simplificado - cada barra precisa de cortes específicos)
            const cuts = [];
            for (let i = 0; i < Math.ceil(p.totalMeters * 1000 / 6000); i++) {
                cuts.push(Math.min(6000, (p.totalMeters * 1000) % 6000 || 6000));
            }
            return cuts;
        });
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
exports.CalculationEngine = CalculationEngine;
exports.calculationEngine = new CalculationEngine();
//# sourceMappingURL=calculation.js.map