/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InvestmentPlan } from './types';

import imgDetectorKit from './assets/images/detector_kit_1785752868739.jpg';
import imgHydraulicCrusher from './assets/images/hydraulic_crusher_1785752893683.jpg';
import imgCrucibleChiller from './assets/images/crucible_chiller_1785752905374.jpg';
import imgGoldIngotFilter from './assets/images/gold_ingot_filter_1785752917779.jpg';

export const DEFAULT_PLANS: InvestmentPlan[] = [
  {
    id: 'vip1_art1',
    name: "Pelle & Détecteur Aurifère (VIP 1 • 1/5)",
    price: 1820,
    dailyProfit: 0,
    durationDays: 30,
    totalProfit: 0,
    iconName: 'Sparkles',
    imageUrl: imgDetectorKit,
    colorScheme: {
      from: 'from-amber-950/40',
      to: 'to-amber-900/30',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/10'
    }
  },
  {
    id: 'vip1_art2',
    name: "Sonde Spectrométrique Lazer (VIP 1 • 2/5)",
    price: 2100,
    dailyProfit: 0,
    durationDays: 30,
    totalProfit: 0,
    iconName: 'Sparkles',
    imageUrl: imgDetectorKit,
    colorScheme: {
      from: 'from-amber-950/40',
      to: 'to-amber-900/30',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/10'
    }
  },
  {
    id: 'vip1_art3',
    name: "Broyeur Hydraulique Quartz 24K (VIP 1 • 3/5)",
    price: 6300,
    dailyProfit: 0,
    durationDays: 30,
    totalProfit: 0,
    iconName: 'Coins',
    imageUrl: imgHydraulicCrusher,
    colorScheme: {
      from: 'from-amber-950/40',
      to: 'to-amber-900/30',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/10'
    }
  },
  {
    id: 'vip1_art4',
    name: "Refroidisseur de Creusets (VIP 1 • 4/5)",
    price: 15500,
    dailyProfit: 0,
    durationDays: 30,
    totalProfit: 0,
    iconName: 'Vault',
    imageUrl: imgCrucibleChiller,
    colorScheme: {
      from: 'from-amber-950/40',
      to: 'to-amber-900/30',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/10'
    }
  },
  {
    id: 'vip1_art5',
    name: "Moule & Filtre Haute Pureté (VIP 1 • 5/5)",
    price: 30300,
    dailyProfit: 0,
    durationDays: 30,
    totalProfit: 500000,
    iconName: 'Crown',
    imageUrl: imgGoldIngotFilter,
    colorScheme: {
      from: 'from-amber-950/40',
      to: 'to-amber-900/30',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/10'
    }
  },
  {
    id: 'vip2_article1',
    name: "Station Industrielle d'Extraction (VIP 2 • 1/1)",
    price: 50000,
    dailyProfit: 0,
    durationDays: 30,
    totalProfit: 1000000,
    iconName: 'Crown',
    imageUrl: imgHydraulicCrusher,
    colorScheme: {
      from: 'from-emerald-950/40',
      to: 'to-emerald-900/30',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/10'
    }
  }
];
