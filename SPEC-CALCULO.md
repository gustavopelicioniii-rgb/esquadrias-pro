# SPEC - MÓDULO CALCPRO
## Sistema de Cálculo Técnico para Esquadrias de Alumínio

**Versão:** 1.0  
**Data:** 19/04/2026  
**Prioridade:** CRÍTICA (CORE do sistema)

---

## 1. CONCEITOS FUNDAMENTAIS

### 1.1 Tipologias de Esquadrias

Cada tipologia tem **fórmulas de cálculo específicas** e composição de perfis diferente.

| Código | Tipologia | Descrição | Fórmula Base |
|--------|-----------|------------|--------------|
| JC | Janela Correr | 2, 3 ou 4 folhas deslizantes | Perímetro + divisórias |
| JA | Janela AntibACTERIA | Basculante | Perímetro + articulação |
| JM | Janela Maxim-air | Abertura para fora | Perímetro + bras |
| MA | Maxim-air | Janela de peito | Perímetro + bras |
| PG | Porta de Giro | 1 ou 2 folhas com dobradiças | Perímetro + batente |
| PP | Porta Pivotante | Pivot no centro | Perímetro x2 |
| PC | Porta Camarão | 2 folhas sobrepostas | Perímetro +重叠 |
| PF | Porta Fachada | Múltiplas folhas | Perímetro + modulação |
| FC | Fachada Cortina | Estrutura continua | M² + modulação |
| DV | Divisória | Box/separação | Perímetro + vidro |

### 1.2 Componentes do Cálculo

**PERFIL (barras de alumínio):**
- Medida padrão: 6 metros (6000mm) por barra comercial
- Cada tipologia usa perfis específicos em quantidades diferentes
- Exemplo: Janela de correr 1200x1200 usa ~8 metros de perfil

**VIDRO (m²):**
- Cálculo: (Largura x Altura) / 1.000.000 = m²
- Cada tipologia tem número diferente de vidros
- Exemplo: Janela de correr 2 folhas = 2 vidros

**ACESSÓRIOS (unidades):**
- Fechos, roldanas, escovas, trincos, dobradiças
- Quantidade varia por tipologia e dimensões

---

## 2. ESTRUTURA DE DADOS

### 2.1 Linha de Produto (ProductLine)
```typescript
{
  id: string;
  name: string;           // "Suprema Classic", "Gold"
  supplier: string;        // "Alumasa", "Cadan"
  profiles: Profile[];
  accessories: Accessory[];
  glasses: Glass[];
}
```

### 2.2 Tipologia (Typology)
```typescript
{
  id: string;
  code: string;           // "JC-2F" (Janela Correr 2 Folhas)
  name: string;           // "Janela Correr 2 Folhas"
  type: TypologyType;     // JC, JA, JM, PG, PP, PC, PF, FC, DV
  
  // Composição (quantidade de cada perfil por m² ou por unidade)
  composition: {
    profileType: string;  // "trilho_inferior", "trilho_superior", "vertical", "horizontal"
    quantityPerUnit: number; // metros lineares por unidade
    formula: string;      // "height * 2 + width * 2" ou "width * 1.5"
  }[];
  
  // Vidros
  glassAreas: {
    quantity: number;
    formula: string;      // "(width * height) / 1000000"
  }[];
  
  // Acessórios
  accessories: {
    accessoryId: string;
    quantityFormula: string; // "quantityPerPane * 2"
  }[];
  
  // Imagem/Ícone
  imageUrl: string;
  svgPath: string;        // caminho SVG para renderização
}
```

### 2.3 Exemplo: Janela Correr 2 Folhas (JC-2F)

**Fórmula de cálculo:**
```
Largura: 1200mm, Altura: 1200mm

PERFIS (em metros):
- Trilho inferior: 1200mm (1.2m)
- Trilho superior: 1200mm (1.2m)
- Vertical esquerdo: 1200mm (1.2m)
- Vertical direito: 1200mm (1.2m)
- Intermediário: 1200mm (1.2m)  [divisória entre folhas]
- Lastro inferior: 1200mm (1.2m)
- Lastro superior: 1200mm (1.2m)

Total perfis: 1.2 * 7 = 8.4 metros lineares

VIDROS (em m²):
- Folha esquerda: (600mm - espessura) x (1200mm - espessura) / 1.000.000
- Folha direita: idem
- Total: ~1.4 m²

ACESSÓRIOS:
- Roldana: 4 un (2 por folha)
- Fecho: 2 un (1 por folha)
- Escova: 4m (perímetro das folhas)
- Trinco: 2 un
```

---

## 3. MÓDULO DE CÁLCULO

### 3.1 Engine de Cálculo

```typescript
interface CalculationInput {
  typologyId: string;
  width: number;        // mm
  height: number;        // mm
  quantity: number;       // unidades
  productLineId: string;
  options?: {
    hasScreen?: boolean;
    hasSecurityBar?: boolean;
    glassType?: string;
  };
}

interface CalculationOutput {
  // Dados de entrada
  input: CalculationInput;
  
  // Resultados por perfil
  profiles: {
    profileId: string;
    profileName: string;
    totalMeters: number;
    barsNeeded: number;    // barras de 6m
    barWaste: number;      // desperdício em metros
    unitPrice: number;
    totalPrice: number;
  }[];
  
  // Resultados por vidro
  glasses: {
    glassId: string;
    glassName: string;
    areaPerUnit: number;  // m²
    totalArea: number;     // m² total
    pricePerm2: number;
    totalPrice: number;
  }[];
  
  // Resultados por acessório
  accessories: {
    accessoryId: string;
    accessoryName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  
  // Totais
  totals: {
    profilesCost: number;
    glassesCost: number;
    accessoriesCost: number;
    laborCost: number;
    totalCost: number;      // custo total
    salePrice: number;      // preço de venda (com margem)
    profitMargin: number;    // % margem
  };
  
  // Otimização de corte
  cutOptimization: {
    totalMetersNeeded: number;
    totalBarsNeeded: number;
    totalWasteMeters: number;
    wastePercentage: number;
    cutList: {
      barNumber: number;
      cuts: { size: number; quantity: number }[];
      waste: number;
    }[];
  };
}
```

### 3.2 Algoritmo de Otimização de Corte

**Problema:** Como cortar barras de 6000mm com mínimo desperdício?

**Abordagem:** First Fit Decreasing (FFDB - First Fit Decreasing Best)

```typescript
function optimizeCut(requiredLengths: number[], barLength: number = 6000): CutResult {
  // 1. Ordenar tamanhos decrescentes
  const sorted = [...requiredLengths].sort((a, b) => b - a);
  
  // 2. Para cada tamanho, buscar barra com espaço
  const bars: Bar[] = [{ remaining: barLength, cuts: [] }];
  
  for (const length of sorted) {
    // Encontrar primeira barra com espaço suficiente
    const bar = bars.find(b => b.remaining >= length);
    if (bar) {
      bar.cuts.push(length);
      bar.remaining -= length;
    } else {
      // Criar nova barra
      bars.push({ remaining: barLength - length, cuts: [length] });
    }
  }
  
  // 3. Calcular desperdício total
  const totalWaste = bars.reduce((sum, b) => sum + b.remaining, 0);
  const wastePercentage = (totalWaste / (bars.length * barLength)) * 100;
  
  return { bars, totalWaste, wastePercentage };
}
```

---

## 4. ESTRUTURA DO BANCO (Prisma)

```prisma
model ProductLine {
  id          String   @id @default(uuid())
  name        String   // "Suprema Classic"
  supplier    String   // "Alumasa"
  isActive    Boolean  @default(true)
  
  profiles    Profile[]
  accessories Accessory[]
  glasses     Glass[]
  typologies  Typology[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("product_lines")
}

model Profile {
  id            String   @id @default(uuid())
  code          String   // "TRL-INF", "VER-EXT"
  name          String   // "Trilho Inferior 38mm"
  category      ProfileCategory // TRACK_LOWER, TRACK_UPPER, VERTICAL, HORIZONTAL, etc.
  
  weightPerMeter Decimal  @db.Decimal(8,3)  // kg/m
  length        Decimal  @default(6000)     // mm (barra comercial)
  pricePerKg    Decimal  @db.Decimal(10,2)
  
  productLineId String
  productLine  ProductLine @relation(fields: [productLineId], references: [id])
  
  typologies   TypologyProfile[]
  
  @@map("profiles")
}

enum ProfileCategory {
  TRACK_LOWER      // Trilho inferior
  TRACK_UPPER      // Trilho superior
  VERTICAL         // Vertical
  HORIZONTAL       // Horizontal
  INTERMEDIATE     // Intermediário
  LASTER           // Lastro
  FRAME            // Batente
  STILE            // Montante
  RAIL             // Travessa
}

model Glass {
  id            String   @id @default(uuid())
  code          String   // "VIC-4", "TEM-6"
  name          String   // "Vidro Incolor 4mm"
  type          GlassType // FLOAT, TEMPERED, LAMINATED, LOW_E
  thickness     Decimal  @db.Decimal(5,2)  // mm
  pricePerM2    Decimal  @db.Decimal(10,2)
  
  productLineId String
  productLine   ProductLine @relation(fields: [productLineId], references: [id])
  
  @@map("glasses")
}

model Accessory {
  id            String   @id @default(uuid())
  code          String   // "ROL-01", "FEC-02"
  name          String   // "Roldana 25mm Dupla"
  category      AccessoryCategory // ROLLER, LOCK, HINGE, BRUSH, HANDLE
  unit          String   @default("un") // un, m, kg
  pricePerUnit  Decimal  @db.Decimal(10,2)
  
  productLineId String
  productLine   ProductLine @relation(fields: [productLineId], references: [id])
  
  @@map("accessories")
}

model Typology {
  id            String   @id @default(uuid())
  code          String   // "JC-2F", "PG-1F"
  name          String   // "Janela Correr 2 Folhas"
  type          String   // JC, JA, JM, PG, PP, PC, PF, FC, DV
  icon          String   // SVG path ou emoji
  
  productLineId String
  productLine   ProductLine @relation(fields: [productLineId], references: [id])
  
  profiles      TypologyProfile[]
  accessories  TypologyAccessory[]
  
  @@map("typologies")
}

model TypologyProfile {
  id            String   @id @default(uuid())
  
  typologyId    String
  typology      Typology @relation(fields: [typologyId], references: [id])
  
  profileId     String
  profile       Profile @relation(fields: [profileId], references: [id])
  
  // Fórmula de cálculo (em JavaScript)
  formula       String   // "height * 2 + width * 2" ou "width * 1.5"
  
  // Corte adicional (margem para corte)
  cutMargin     Decimal  @default(0) // mm a adicionar ao cálculo
  
  @@map("typology_profiles")
}

model TypologyAccessory {
  id            String   @id @default(uuid())
  
  typologyId    String
  typology      Typology @relation(fields: [typologyId], references: [id])
  
  accessoryId   String
  accessory     Accessory @relation(fields: [accessoryId], references: [id])
  
  // Fórmula: pode variar conforme dimensões
  formula       String   // "2" (fixo) ou "(width / 600)" (por 600mm)
  
  @@map("typology_accessories")
}

// Resultado de cálculo (para orçamento)
model CalculationResult {
  id            String   @id @default(uuid())
  
  // Dimensões
  width         Int
  height        Int
  quantity      Int
  
  // Resultado JSON
  resultJson    Json     // CalculationOutput completo
  
  // Custos
  totalCost     Decimal  @db.Decimal(12,2)
  salePrice     Decimal  @db.Decimal(12,2)
  
  createdAt     DateTime @default(now())
  
  @@map("calculation_results")
}
```

---

## 5. API ENDPOINTS

### 5.1 Cadastros

| Método | Endpoint | Descrição |
|--------|----------|------------|
| GET | /api/product-lines | Lista linhas de produto |
| POST | /api/product-lines | Cria linha de produto |
| GET | /api/profiles | Lista perfis |
| POST | /api/profiles | Cria perfil |
| GET | /api/glasses | Lista vidros |
| POST | /api/glasses | Cria vidro |
| GET | /api/accessories | Lista acessórios |
| POST | /api/accessories | Cria acessório |
| GET | /api/typologies | Lista tipologias |
| POST | /api/typologies | Cria tipologia |

### 5.2 Cálculo

| Método | Endpoint | Descrição |
|--------|----------|------------|
| POST | /api/calculate | Calcula custo de uma esquadria |
| POST | /api/calculate/batch | Calcula múltiplas esquadrias |
| GET | /api/calculate/optimize | Retorna otimização de corte |
| POST | /api/calculate/quote | Gera orçamento completo |

### 5.3 Exemplo: POST /api/calculate

**Request:**
```json
{
  "typologyId": "uuid-da-tipologia",
  "productLineId": "uuid-da-linha",
  "width": 1200,
  "height": 1200,
  "quantity": 2,
  "options": {
    "glassType": "TEMPERED",
    "hasScreen": true
  }
}
```

**Response:**
```json
{
  "input": {
    "typology": "Janela Correr 2 Folhas",
    "width": 1200,
    "height": 1200,
    "quantity": 2
  },
  "profiles": [
    { "name": "Trilho Inferior 38mm", "totalMeters": 2.4, "barsNeeded": 1, "price": 45.60 },
    { "name": "Trilho Superior 38mm", "totalMeters": 2.4, "barsNeeded": 1, "price": 45.60 },
    // ... mais perfis
  ],
  "glasses": [
    { "name": "Vidro Temperado 4mm", "areaPerUnit": 1.38, "totalArea": 2.76, "price": 82.80 }
  ],
  "accessories": [
    { "name": "Roldana 25mm Dupla", "quantity": 8, "price": 120.00 },
    { "name": "Fecho Inferior", "quantity": 4, "price": 60.00 }
  ],
  "totals": {
    "profilesCost": 380.00,
    "glassesCost": 82.80,
    "accessoriesCost": 280.00,
    "laborCost": 150.00,
    "totalCost": 892.80,
    "salePrice": 1299.00,
    "profitMargin": 31.3
  },
  "cutOptimization": {
    "totalMeters": 18.5,
    "totalBarsNeeded": 4,
    "totalWasteMeters": 5.5,
    "wastePercentage": 22.9,
    "cutList": [
      { "barNumber": 1, "cuts": [{ "size": 1200, "qty": 2 }, { "size": 1180, "qty": 2 }], "waste": 240 },
      // ... mais barras
    ]
  }
}
```

---

## 6. PRÓXIMOS PASSOS

### Fase 1: Backend (Core de Cálculo)
- [ ] Criar models Prisma para ProductLine, Profile, Glass, Accessory, Typology
- [ ] Criar rotas de cadastro
- [ ] Implementar engine de cálculo
- [ ] Implementar algoritmo de otimização de corte

### Fase 2: Frontend (UI de Cálculo)
- [ ] Tela de cálculo com seletor de tipologia
- [ ] Inputs de dimensões com validação
- [ ] Visualização do resultado (perfis, vidros, acessórios)
- [ ] Tabela de otimização de corte

### Fase 3: Cadastros de Referência
- [ ] Seed com linhas de produto reais (Suprema, Gold, etc)
- [ ] Tipologias pré-configuradas
- [ ] Perfis por linha
- [ ] Preços de referência

---

## 7. FÓRMULAS DE CÁLCULO

### 7.1 Fórmulas por Tipologia

**JC - Janela Correr 2 Folhas:**
```
Perfis: (altura * 2) + (largura * 3) + 5% desperdício
Vidros: ((largura/2 - 20) * (altura - 40)) / 1.000.000 * 2
```

**JC - Janela Correr 4 Folhas:**
```
Perfis: (altura * 4) + (largura * 5) + 5%
Vidros: ((largura/4 - 20) * (altura - 40)) / 1.000.000 * 4
```

**PG - Porta de Giro 1 Folha:**
```
Perfis: (altura * 2) + (largura * 2) + batente
Vidros: ((largura - 60) * (altura - 100)) / 1.000.000
```

**PF - Porta Fachada:**
```
Perfis: modular (baseado em modulação de 600mm ou 800mm)
Vidros: (módulo_largura * módulo_altura) / 1.000.000 * quantidade
```

---

## 8. DADOS DE REFERÊNCIA (Seed)

### 8.1 Linha: Suprema Classic (Alumasa)

**Perfis:**
| Código | Nome | kg/m | Preço/kg |
|--------|------|------|----------|
| TRL-INF | Trilho Inferior | 0.850 | R$ 32,00 |
| TRL-SUP | Trilho Superior | 0.780 | R$ 32,00 |
| VER-EXT | Vertical Externo | 0.620 | R$ 32,00 |
| VER-INT | Vertical Interno | 0.550 | R$ 32,00 |
| INT | Intermediário | 0.500 | R$ 32,00 |
| LAS-INF | Lastro Inferior | 0.450 | R$ 32,00 |
| LAS-SUP | Lastro Superior | 0.420 | R$ 32,00 |

**Vidros:**
| Código | Nome | Espessura | Preço/m² |
|--------|------|-----------|----------|
| VIC-4 | Incolor 4mm | 4mm | R$ 180,00 |
| VIC-6 | Incolor 6mm | 6mm | R$ 220,00 |
| VTC-4 | Temperado 4mm | 4mm | R$ 280,00 |
| VTC-6 | Temperado 6mm | 6mm | R$ 340,00 |
| VLM-4 | Laminado 4+4 | 8mm | R$ 420,00 |

**Acessórios (kit por folha):**
| Código | Nome | Preço |
|--------|------|--------|
| KIT-COR-2F | Kit Correr 2 Folhas | R$ 85,00 |
| KIT-COR-4F | Kit Correr 4 Folhas | R$ 150,00 |
| FEC-01 | Fecho 90cm | R$ 35,00 |
| TRC-01 | Trinco | R$ 18,00 |

---

*Documento em evolução - atualizar conforme desenvolvimento*
