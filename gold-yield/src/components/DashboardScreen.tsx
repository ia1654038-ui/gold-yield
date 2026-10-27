/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  CreditCard,
  Sparkles,
  ChevronRight,
  Plus,
  AlertCircle,
  MessageSquare,
  Clock,
  HelpCircle,
  FileText,
  Copy,
  CheckCircle,
  Activity,
  ArrowRightLeft,
  User,
  ShieldCheck,
  LogOut,
  Smartphone,
  ExternalLink,
  Award,
  Layers,
  CheckSquare,
  Truck,
  Crown,
  Shield,
  Lock,
  Unlock,
  Play,
  Zap,
  ShoppingCart,
  Loader2,
  X,
  Download,
  Share,
  Palette,
  Database,
  UserCheck,
  Headphones
} from 'lucide-react';
import { InvestmentPlan, ActiveInvestment, Transaction, DailyTask } from '../types';
import { DEFAULT_PLANS } from '../data';
import { PlanIcon } from './PlanIcon';
import { ReceiptModal } from './ReceiptModal';
import { RefineryHeroBanner } from './RefineryHeroBanner';

import imgRefinery from '../assets/images/gold_refinery_1783873491748.jpg';
import imgMinePit from '../assets/images/gold_mine_pit_1783873507482.jpg';
import imgEngineers from '../assets/images/mining_engineers_1783873521791.jpg';

import imgDetectorKit from '../assets/images/detector_kit_1785752868739.jpg';
import imgSpectrometerProbe from '../assets/images/spectrometer_probe_1785752880502.jpg';
import imgHydraulicCrusher from '../assets/images/hydraulic_crusher_1785752893683.jpg';
import imgCrucibleChiller from '../assets/images/crucible_chiller_1785752905374.jpg';
import imgGoldIngotFilter from '../assets/images/gold_ingot_filter_1785752917779.jpg';

import imgGoldRefineryHero from '../assets/images/gold_refinery_hero_1788513421267.jpg';
import imgGoldVaultBars from '../assets/images/gold_vault_bars_1788513437955.jpg';
import imgGoldMiningRig from '../assets/images/gold_mining_rig_1788513458483.jpg';

export type DashboardTab = 'home' | 'plans' | 'tasks' | 'assets' | 'profile';

interface DashboardScreenProps {
  balance: number;
  activeInvestments: ActiveInvestment[];
  transactions: Transaction[];
  onSelectPlan: (plan: InvestmentPlan) => void;
  onOpenRecharge: () => void;
  onOpenWithdraw: () => void;
  onCollectGains: () => void;
  onCompleteTask?: (taskTitle: string, reward: number) => void;
  claimableSum: number;
  schemaCacheStale?: boolean;
  userPhone?: string;
  userName?: string;
  onLogout?: () => void;
  activeTab?: DashboardTab;
  onTabChange?: (tab: DashboardTab) => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  onOpenTutorial?: () => void;
  onOpenThemeSelector?: () => void;
  onOpenVideoAd?: () => void;
  currentTheme?: string;
}

const DAILY_TASKS: DailyTask[] = [
  {
    id: 'task_refinery_1',
    title: "Inspection du Raffinage Quotidien (VIP 1)",
    description: "Contrôlez et validez la pesée du lot d'or brut. Requis : Débloquer le VIP 1 (3 500 FCFA).",
    reward: 150,
    minPriceRequired: 3500,
    category: 'beginner',
    iconName: 'CheckCircle',
  },
  {
    id: 'task_audit_2',
    title: "Audit du Registre des Lingots (VIP 1)",
    description: "Vérifiez la numérotation des scellés de sécurité. Requis : Débloquer le VIP 1 (3 500 FCFA).",
    reward: 250,
    minPriceRequired: 3500,
    category: 'beginner',
    iconName: 'ShieldCheck',
  },
  {
    id: 'task_convoi_3',
    title: "Supervision du Convoi Aurifère (VIP 2)",
    description: "Escortez le chargement sécurisé des pépites. Nécessite d'avoir accompli et débloqué le VIP 1.",
    reward: 600,
    minPriceRequired: 3000,
    category: 'intermediate',
    iconName: 'Truck',
  },
  {
    id: 'task_vip_4',
    title: "Certification Qualité Lingots 24K (VIP 2)",
    description: "Validation spectrométrique de la pureté des lingots. Nécessite d'avoir accompli et débloqué le VIP 1.",
    reward: 2500,
    minPriceRequired: 10000,
    category: 'vip',
    iconName: 'Sparkles',
  },
  {
    id: 'task_elite_5',
    title: "Signature Contrat Société (VIP 3)",
    description: "Membre officiel de notre société. Salaire de 35 000 FCFA à 65 000 FCFA/jour. Nécessite VIP 1 et VIP 2.",
    reward: 10000,
    minPriceRequired: 50000,
    category: 'elite',
    iconName: 'Crown',
  },
];

export function DashboardScreen({
  balance,
  activeInvestments,
  transactions,
  onSelectPlan,
  onOpenRecharge,
  onOpenWithdraw,
  onCollectGains,
  onCompleteTask,
  claimableSum,
  schemaCacheStale,
  userPhone = '',
  userName = 'Investisseur Gold',
  onLogout,
  activeTab = 'home',
  onTabChange,
  showToast,
  onOpenTutorial,
  onOpenThemeSelector,
  onOpenVideoAd,
  currentTheme = 'royal'
}: DashboardScreenProps) {
  const [copied, setCopied] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Daily Tasks local completion state
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined' && userPhone) {
      const todayStr = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(`gy_${userPhone}_tasks_${todayStr}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [executingTask, setExecutingTask] = useState<DailyTask | null>(null);
  const [executingProgress, setExecutingProgress] = useState<number>(0);
  const [lockedTaskModal, setLockedTaskModal] = useState<DailyTask | null>(null);
  const [taskRewardSuccessModal, setTaskRewardSuccessModal] = useState<{ title: string; reward: number } | null>(null);

  // VIP Level Modal state
  const [vipLevelModal, setVipLevelModal] = useState<{
    level: string;
    price: string;
    title: string;
    subtitle?: string;
    isVip1?: boolean;
    isVip2?: boolean;
    isVip3?: boolean;
  } | null>(null);

  // Mentor Deposit Popup State: "Pour effectuer un dépôt, contactez votre mentor"
  const [mentorDepositPopup, setMentorDepositPopup] = useState<{
    show: boolean;
    vipLevel: string;
  } | null>(null);

  const handleTriggerMentorDepositPopup = (vipLevel: string = 'VIP') => {
    setVipLevelModal(null);
    setMentorDepositPopup({
      show: true,
      vipLevel
    });
    if (showToast) {
      showToast('Pour effectuer un dépôt, contactez votre mentor', 'info');
    }
  };

  // VIP 1 Completion state
  const [isVip1Finished, setIsVip1Finished] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && userPhone) {
      return localStorage.getItem(`gy_${userPhone}_vip1_finished`) === 'true';
    }
    return false;
  });

  // VIP 2 Completion state
  const [isVip2Finished, setIsVip2Finished] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && userPhone) {
      return localStorage.getItem(`gy_${userPhone}_vip2_finished`) === 'true';
    }
    return false;
  });

  // Keep VIP completion state in sync with localStorage and user phone
  React.useEffect(() => {
    if (userPhone) {
      const saved1 = localStorage.getItem(`gy_${userPhone}_vip1_finished`);
      if (saved1 === 'true') setIsVip1Finished(true);

      const saved2 = localStorage.getItem(`gy_${userPhone}_vip2_finished`);
      if (saved2 === 'true') setIsVip2Finished(true);
    }
  }, [userPhone]);

  // Saved VIP 1 Step ('article1' | 'article2' | 'article3' | 'article4' | 'article5')
  const [vip1SavedStep, setVip1SavedStep] = useState<'article1' | 'article2' | 'article3' | 'article4' | 'article5'>(() => {
    if (typeof window !== 'undefined' && userPhone) {
      const saved = localStorage.getItem(`gy_${userPhone}_vip1_step`);
      if (saved === 'article2' || saved === 'article3' || saved === 'article4' || saved === 'article5') return saved;
    }
    return 'article1';
  });

  // Saved VIP 2 Step ('article1')
  const [vip2SavedStep, setVip2SavedStep] = useState<'article1'>(() => {
    return 'article1';
  });

  // Supabase Database Connection Modal & Status
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{ connected: boolean; engine: string } | null>(null);

  React.useEffect(() => {
    fetch('/api/admin/supabase-status')
      .then(res => res.json())
      .then(data => setSupabaseStatus(data))
      .catch(() => setSupabaseStatus({ connected: false, engine: 'Local Resilient DB' }));
  }, []);

  const handleConnectSupabase = async () => {
    if (!supabaseUrlInput.trim() || !supabaseKeyInput.trim()) {
      if (showToast) showToast('Veuillez renseigner l\'URL et la Clé Supabase', 'error');
      return;
    }
    setSupabaseLoading(true);
    try {
      const res = await fetch('/api/admin/set-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: supabaseUrlInput, key: supabaseKeyInput })
      });
      const data = await res.json();
      if (data.connected) {
        setSupabaseStatus({ connected: true, engine: 'Supabase Cloud (Active)' });
        if (showToast) showToast('Base de données Supabase connectée avec succès !', 'success');
        setIsSupabaseModalOpen(false);
      } else {
        setSupabaseStatus({ connected: false, engine: 'Local Resilient DB' });
        if (showToast) showToast(data.message || 'Échec de la connexion Supabase', 'error');
      }
    } catch {
      if (showToast) showToast('Erreur de connexion au serveur', 'error');
    } finally {
      setSupabaseLoading(false);
    }
  };

  const handleDisconnectSupabase = async () => {
    try {
      await fetch('/api/admin/disconnect-supabase', { method: 'POST' });
      setSupabaseStatus({ connected: false, engine: 'Local Resilient DB' });
      setSupabaseUrlInput('');
      setSupabaseKeyInput('');
      if (showToast) showToast('Base de données Supabase déconnectée.', 'success');
    } catch {
      if (showToast) showToast('Erreur lors de la déconnexion', 'error');
    }
  };

  // Reset VIP completion & step handler
  const handleResetVipStatus = () => {
    setIsVip1Finished(false);
    setIsVip2Finished(false);
    setVip1SavedStep('article1');
    setVip2SavedStep('article1');
    if (typeof window !== 'undefined' && userPhone) {
      localStorage.removeItem(`gy_${userPhone}_vip1_finished`);
      localStorage.removeItem(`gy_${userPhone}_vip2_finished`);
      localStorage.removeItem(`gy_${userPhone}_vip1_step`);
      localStorage.removeItem(`gy_${userPhone}_vip2_step`);
    }
  };

  // Insufficient Balance Modal state
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

  const [insufficientBalanceModal, setInsufficientBalanceModal] = useState<{
    requiredPrice: number;
    missingAmount: number;
    articleName: string;
  } | null>(null);

  // VIP 1 Commander Flow state: 'none' | 'loading' | 'article1' | 'article2' | 'article3' | 'article4' | 'article5' | 'success'
  const [vip1CommanderStep, setVip1CommanderStep] = useState<'none' | 'loading' | 'article1' | 'article2' | 'article3' | 'article4' | 'article5' | 'success'>('none');
  const [vip1LoadingProgress, setVip1LoadingProgress] = useState<number>(0);

  // VIP 2 Commander Flow state: 'none' | 'loading' | 'article1' | 'success'
  const [vip2CommanderStep, setVip2CommanderStep] = useState<'none' | 'loading' | 'article1' | 'success'>('none');
  const [vip2LoadingProgress, setVip2LoadingProgress] = useState<number>(0);

  // Fast loading progress effect for Commander workflow (VIP 1)
  React.useEffect(() => {
    if (vip1CommanderStep === 'loading') {
      setVip1LoadingProgress(0);
      const interval = setInterval(() => {
        setVip1LoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setVip1CommanderStep('article1'), 150);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [vip1CommanderStep]);

  // Fast loading progress effect for Commander workflow (VIP 2)
  React.useEffect(() => {
    if (vip2CommanderStep === 'loading') {
      setVip2LoadingProgress(0);
      const interval = setInterval(() => {
        setVip2LoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setVip2CommanderStep('article1'), 150);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [vip2CommanderStep]);

  const handleStartVip1Commander = () => {
    if (isVip1Finished) {
      if (showToast) showToast("Le niveau VIP 1 est déjà terminé, validé et bloqué !", "info");
      return;
    }
    if (balance < 1820) {
      setVipLevelModal(null);
      setInsufficientBalanceModal({
        requiredPrice: 1820,
        missingAmount: 1820 - balance,
        articleName: "Accès Article 1/5 VIP 1 (Solde minimum requis : 1 820 FCFA)"
      });
      return;
    }
    setVipLevelModal(null);
    if (vip1SavedStep === 'article5') {
      setVip1CommanderStep('article5');
    } else if (vip1SavedStep === 'article4') {
      setVip1CommanderStep('article4');
    } else if (vip1SavedStep === 'article3') {
      setVip1CommanderStep('article3');
    } else if (vip1SavedStep === 'article2') {
      setVip1CommanderStep('article2');
    } else {
      setVip1CommanderStep('loading');
    }
  };

  const handleStartVip2Commander = () => {
    if (isVip2Finished) {
      if (showToast) showToast("Le niveau VIP 2 est déjà terminé, validé et bloqué !", "info");
      return;
    }
    if (balance < 50000) {
      setVipLevelModal(null);
      setInsufficientBalanceModal({
        requiredPrice: 50000,
        missingAmount: 50000 - balance,
        articleName: "Accès Article VIP 2 (Solde minimum requis : 50 000 FCFA)"
      });
      return;
    }
    setVipLevelModal(null);
    setVip2CommanderStep('loading');
  };

  // VIP 1 Article 1: 1 820 FCFA -> Gain +100 000 FCFA
  const handlePayArticle1 = () => {
    if (balance < 1820) {
      setInsufficientBalanceModal({
        requiredPrice: 1820,
        missingAmount: 1820 - balance,
        articleName: "Pelle & Détecteur Aurifère (VIP 1 • 1/5 • 1 820 FCFA)"
      });
      return;
    }
    if (onCompleteTask) {
      onCompleteTask("Achat Article de Mine VIP 1 - Lot #1 (1 820F)", -1820);
      setTimeout(() => {
        onCompleteTask("Gain VIP 1 (Étape 1/5 validée)", 100000);
      }, 200);
    }
    setVip1SavedStep('article2');
    if (userPhone) {
      localStorage.setItem(`gy_${userPhone}_vip1_step`, 'article2');
    }
    setVip1CommanderStep('article2');
  };

  // VIP 1 Article 2: 2 100 FCFA -> Gain +100 000 FCFA
  const handlePayArticle2 = () => {
    if (balance < 2100) {
      setInsufficientBalanceModal({
        requiredPrice: 2100,
        missingAmount: 2100 - balance,
        articleName: "Sonde Spectrométrique Lazer (VIP 1 • 2/5 • 2 100 FCFA)"
      });
      return;
    }
    if (onCompleteTask) {
      onCompleteTask("Achat Article de Mine VIP 1 - Lot #2 (2 100F)", -2100);
      setTimeout(() => {
        onCompleteTask("Gain VIP 1 (Étape 2/5 validée)", 100000);
      }, 200);
    }
    setVip1SavedStep('article3');
    if (userPhone) {
      localStorage.setItem(`gy_${userPhone}_vip1_step`, 'article3');
    }
    setVip1CommanderStep('article3');
  };

  // VIP 1 Article 3: 6 300 FCFA -> Gain +100 000 FCFA
  const handlePayArticle3 = () => {
    if (balance < 6300) {
      setInsufficientBalanceModal({
        requiredPrice: 6300,
        missingAmount: 6300 - balance,
        articleName: "Broyeur Hydraulique Quartz 24K (VIP 1 • 3/5 • 6 300 FCFA)"
      });
      return;
    }
    if (onCompleteTask) {
      onCompleteTask("Achat Article de Mine VIP 1 - Lot #3 (6 300F)", -6300);
      setTimeout(() => {
        onCompleteTask("Gain VIP 1 (Étape 3/5 validée)", 100000);
      }, 200);
    }
    setVip1SavedStep('article4');
    if (userPhone) {
      localStorage.setItem(`gy_${userPhone}_vip1_step`, 'article4');
    }
    setVip1CommanderStep('article4');
  };

  // VIP 1 Article 4: 15 500 FCFA -> Gain +100 000 FCFA
  const handlePayArticle4 = () => {
    if (balance < 15500) {
      setInsufficientBalanceModal({
        requiredPrice: 15500,
        missingAmount: 15500 - balance,
        articleName: "Refroidisseur & Thermorégulateur de Creusets (VIP 1 • 4/5 • 15 500 FCFA)"
      });
      return;
    }
    if (onCompleteTask) {
      onCompleteTask("Achat Article de Mine VIP 1 - Lot #4 (15 500F)", -15500);
      setTimeout(() => {
        onCompleteTask("Gain VIP 1 (Étape 4/5 validée)", 100000);
      }, 200);
    }
    setVip1SavedStep('article5');
    if (userPhone) {
      localStorage.setItem(`gy_${userPhone}_vip1_step`, 'article5');
    }
    setVip1CommanderStep('article5');
  };

  // VIP 1 Article 5: 30 300 FCFA -> Finish VIP 1 (+100 000 FCFA = 500 000 FCFA Total!)
  const handlePayArticle5 = () => {
    if (balance < 30300) {
      setInsufficientBalanceModal({
        requiredPrice: 30300,
        missingAmount: 30300 - balance,
        articleName: "Moule & Filtre Pureté Finale Lingots 24K (VIP 1 • 5/5 • 30 300 FCFA)"
      });
      return;
    }
    if (onCompleteTask) {
      onCompleteTask("Achat Article de Mine VIP 1 - Lot #5 (30 300F)", -30300);
    }
    setTimeout(() => {
      if (onCompleteTask) {
        onCompleteTask("Gain Final VIP 1 (Étape 5/5 validée)", 100000);
      }
      setIsVip1Finished(true);
      setVip1SavedStep('article1');
      if (userPhone) {
        localStorage.setItem(`gy_${userPhone}_vip1_finished`, 'true');
        localStorage.removeItem(`gy_${userPhone}_vip1_step`);
        fetch('/api/user/sync-tick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: userPhone,
            isVip1Finished: true
          }),
        }).catch(() => {});
      }
      setVip1CommanderStep('success');
    }, 250);
  };

  // VIP 2 Single Article 1/1: 50 000 FCFA -> Finish VIP 2 (+1 000 000 FCFA)
  const handlePayVip2Article1 = () => {
    if (balance < 50000) {
      setInsufficientBalanceModal({
        requiredPrice: 50000,
        missingAmount: 50000 - balance,
        articleName: "Station Industrielle d'Extraction Aurifère (VIP 2 • 1/1 • 50 000 FCFA)"
      });
      return;
    }
    if (onCompleteTask) {
      onCompleteTask("Achat Article de Mine VIP 2 (50 000F)", -50000);
    }
    setTimeout(() => {
      if (onCompleteTask) {
        onCompleteTask("Récompense Validation VIP 2", 1000000);
      }
      setIsVip2Finished(true);
      setVip2SavedStep('article1');
      if (userPhone) {
        localStorage.setItem(`gy_${userPhone}_vip2_finished`, 'true');
        localStorage.removeItem(`gy_${userPhone}_vip2_step`);
        fetch('/api/user/sync-tick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: userPhone,
            isVip2Finished: true
          }),
        }).catch(() => {});
      }
      setVip2CommanderStep('success');
    }, 250);
  };

  // Calculate total user investment capital & balance status
  const totalInvestedSum = activeInvestments.reduce((sum, item) => sum + item.price, 0);
  const totalDailyRevenue = activeInvestments.reduce((sum, item) => sum + item.dailyProfit, 0);

  // Progressive VIP 1 earnings accumulation (Total 500 000 FCFA distributed across the 5 articles)
  // Step 1: 100 000 F, Step 2: 100 000 F, Step 3: 100 000 F, Step 4: 100 000 F, Step 5: 100 000 F
  let accumulatedVip1Gains = 0;
  if (isVip1Finished) {
    accumulatedVip1Gains = 500000;
  } else if (vip1SavedStep === 'article5') {
    accumulatedVip1Gains = 400000;
  } else if (vip1SavedStep === 'article4') {
    accumulatedVip1Gains = 300000;
  } else if (vip1SavedStep === 'article3') {
    accumulatedVip1Gains = 200000;
  } else if (vip1SavedStep === 'article2') {
    accumulatedVip1Gains = 100000;
  }

  const accumulatedVip2Gains = isVip2Finished ? 1000000 : 0;
  const totalVipGains = accumulatedVip1Gains + accumulatedVip2Gains;
  // Capital to withdraw reflects the accumulated withdrawable funds (VIP gains and balance)
  const withdrawableCapital = Math.max(balance, totalVipGains);

  // VIP 1 requires user balance to be >= 3500 FCFA
  const isVip1Unlocked = balance >= 3500;

  // VIP 2 requires user balance to be >= 10,000 FCFA
  const isVip2Unlocked = balance >= 10000;

  // Helper to check if a task is locked based on VIP rules
  const isTaskLocked = (task: DailyTask) => {
    if (task.category === 'beginner') {
      return !isVip1Unlocked;
    }
    if (task.category === 'intermediate' || task.category === 'vip') {
      return !isVip1Unlocked;
    }
    if (task.category === 'elite') {
      return !isVip1Unlocked;
    }
    return false;
  };

  const saveCompletedTask = (taskId: string) => {
    const updated = [...completedTaskIds, taskId];
    setCompletedTaskIds(updated);
    if (userPhone) {
      const todayStr = new Date().toISOString().split('T')[0];
      localStorage.setItem(`gy_${userPhone}_tasks_${todayStr}`, JSON.stringify(updated));
    }
  };

  const handleExecuteTask = (task: DailyTask) => {
    // Check if task is already completed today
    if (completedTaskIds.includes(task.id)) {
      return;
    }

    // Check requirement
    if (isTaskLocked(task)) {
      setLockedTaskModal(task);
      return;
    }

    // Unlocked -> Execute with animated simulation
    setExecutingTask(task);
    setExecutingProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      setExecutingProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setExecutingTask(null);
          saveCompletedTask(task.id);
          if (onCompleteTask) {
            onCompleteTask(task.title, task.reward);
          }
          setTaskRewardSuccessModal({ title: task.title, reward: task.reward });
        }, 400);
      }
    }, 350);
  };

  // Dynamically obtain current domain
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return "https://goldyields.org";
  };

  const inviteLink = userPhone 
    ? `${getBaseUrl()}/?ref=${userPhone}` 
    : `${getBaseUrl()}/?ref=GOLDYIELD`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText("ALTER TABLE users ADD COLUMN IF NOT EXISTS claimable_sum NUMERIC DEFAULT 0;\nALTER TABLE users ADD COLUMN IF NOT EXISTS last_tick_time BIGINT DEFAULT 0;\nNOTIFY pgrst, 'reload schema';");
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 3000);
  };

  const handleCopyLink = () => {
    const textToCopy = `📢 *OPPORTUNITÉ D'EMPLOI EN LIGNE — GOLD YIELD* 💼\n\n` +
                       `Rejoignez notre équipe et travaillez directement depuis votre téléphone pour percevoir un salaire quotidien compris entre *35 000 FCFA et 65 000 FCFA par jour* !\n\n` +
                       `💰 *RÉMUNÉRATION & GAINS QUOTIDIENS :*\n` +
                       `💵 *Gains quotidiens :* De 35 000 FCFA à 65 000 FCFA par jour !\n` +
                       `🎁 *Bonus de Bienvenue :* 1 000 FCFA offerts gratuitement dès votre inscription !\n` +
                       `🔹 *Missions quotidiennes :* Exécutez des commandes simples et retirez votre argent tous les jours.\n\n` +
                       `💸 *Retraits Instantanés :* Recevez vos revenus directement sur votre compte Mobile Money (Wave, Orange, MTN, Moov) !\n\n` +
                       `👉 *Inscrivez-vous gratuitement et commencez à travailler dès aujourd'hui :*\n` +
                       `${inviteLink}\n\n` +
                       `🚀 Prenez votre autonomie financière en main avec Gold Yield !`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    if (showToast) showToast('Lien et offre d\'emploi (35 000 - 65 000 FCFA/jour) copiés !', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const renderVipLevelTickets = () => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm md:text-base font-extrabold font-display text-white flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400" />
          <span>Niveaux de Membres Exécutifs VIP</span>
        </h3>
        <span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold font-mono">
          Adhésion Officielle
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* VIP 1 TICKET - ACCESSIBLE DÈS 3 500 FCFA */}
        <div
          onClick={() => setVipLevelModal({
            level: 'VIP1',
            price: '3 500.00 FCFA',
            title: isVip1Finished
              ? 'Niveau Membre VIP 1 — Terminé & Validé !'
              : isVip1Unlocked ? 'Niveau Membre VIP 1 — Accès Débloqué !' : 'Niveau Membre VIP 1',
            subtitle: isVip1Finished
              ? 'Félicitations ! Vous avez complété les articles du VIP 1 et empoché 500 000 FCFA !'
              : isVip1Unlocked
              ? `Votre solde est de ${balance.toLocaleString('fr-FR')} FCFA. Cliquez sur Commander pour acheter les articles de mine !`
              : 'Un solde d\'au moins 3 500 FCFA sur votre compte débloque l\'accès au VIP 1.',
            isVip1: true,
            isVip2: false,
            isVip3: false
          })}
          className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 rounded-2xl p-4.5 shadow-xl overflow-hidden flex justify-between items-center cursor-pointer hover:border-amber-400/50 hover:scale-[1.01] active:scale-[0.99] transition-all border border-amber-500/30 group"
        >
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black font-display tracking-tight text-white flex items-center gap-1.5 leading-none">
                VIP 1
                {isVip1Finished ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 fill-emerald-400/20 animate-pulse" />
                ) : isVip1Unlocked ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : null}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-mono">
                Adhésion de Base
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black font-mono text-white">3 500 FCFA</span>
              <span className="text-[10px] font-black bg-emerald-500/15 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-mono shadow-sm">
                Gain Total : 500 000 FCFA
              </span>
            </div>
            
            {isVip1Finished ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg inline-block bg-emerald-950/80 text-emerald-300 border border-emerald-400/30">
                ✓ VIP 1 Terminé (+500 000F)
              </span>
            ) : (
              <div className="flex flex-col gap-1.5 items-start pt-0.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block ${
                  isVip1Unlocked ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-950/80 text-amber-400 border border-slate-800'
                }`}>
                  {isVip1Unlocked ? 'Accès Débloqué (≥ 3 500F)' : 'Solde Requis : 3 500F'}
                </span>

                {isVip1Unlocked ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartVip1Commander();
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>
                      {vip1SavedStep === 'article5'
                        ? 'Reprendre (5/5)'
                        : vip1SavedStep === 'article4'
                        ? 'Reprendre (4/5)'
                        : vip1SavedStep === 'article3'
                        ? 'Reprendre (3/5)'
                        : vip1SavedStep === 'article2'
                        ? 'Reprendre (2/5)'
                        : 'Commander (1/5)'}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTriggerMentorDepositPopup('VIP 1');
                    }}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 text-amber-300 font-bold text-xs rounded-xl shadow-md border border-amber-500/30 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Débloquer dès 3 500F</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0 relative z-10 pl-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-amber-400/40 relative shadow-lg shadow-black/40">
              <img
                src={imgGoldVaultBars}
                alt="Lingots 24K VIP 1"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <span className="absolute bottom-1 right-1 text-[8px] font-mono font-bold text-amber-300 bg-black/70 px-1.5 py-0.5 rounded backdrop-blur-xs">
                500k F
              </span>
            </div>
            <span className="text-[8px] font-mono font-bold text-slate-400 tracking-wider">CERTIFIÉ VIP 1</span>
          </div>
        </div>

        {/* VIP 2 TICKET - ACCESSIBLE SI SOLDE >= 10 000 FCFA */}
        <div
          onClick={() => setVipLevelModal({
            level: 'VIP2',
            price: '10 000.00 FCFA',
            title: isVip2Finished
              ? 'Niveau Membre VIP 2 — Terminé & Validé !'
              : isVip2Unlocked ? 'Niveau Membre VIP 2 — Accès Débloqué !' : 'Niveau Membre VIP 2',
            subtitle: isVip2Finished
              ? 'Félicitations ! Vous avez accompli le VIP 2 (50 000 FCFA) et empoché 1 000 000 FCFA !'
              : isVip2Unlocked
              ? 'Félicitations ! VIP 2 Débloqué (Solde ≥ 10 000 FCFA). Cliquez sur Commander pour passer votre commande VIP 2 (50 000 FCFA) !'
              : 'Pour accéder au VIP 2, le solde de votre compte doit être supérieur ou égal à 10 000 FCFA !',
            isVip1: false,
            isVip2: true,
            isVip3: false
          })}
          className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 rounded-2xl p-4.5 shadow-xl overflow-hidden flex justify-between items-center cursor-pointer hover:border-amber-400/50 hover:scale-[1.01] active:scale-[0.99] transition-all border border-amber-500/30 group"
        >
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black font-display tracking-tight text-white flex items-center gap-1.5 leading-none">
                VIP 2
                {isVip2Finished ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 fill-emerald-400/20 animate-pulse" />
                ) : isVip2Unlocked ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : null}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-mono">
                Adhésion Avancée
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black font-mono text-white">10 000 FCFA</span>
              <span className="text-[10px] font-black bg-emerald-500/15 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-mono shadow-sm">
                Gain Total : 1 000 000 FCFA
              </span>
            </div>
            
            {isVip2Finished ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg inline-block bg-emerald-950/80 text-emerald-300 border border-emerald-400/30">
                ✓ VIP 2 Terminé (+1 000 000F)
              </span>
            ) : isVip2Unlocked ? (
              <div className="flex flex-col gap-1.5 items-start pt-0.5">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Accès Débloqué (≥ 10 000F)
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartVip2Commander();
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Commander (1/1 • 50 000F)</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 items-start pt-0.5">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block bg-slate-950/80 text-amber-400 border border-slate-800">
                  Solde Requis : 10 000F
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTriggerMentorDepositPopup('VIP 2');
                  }}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 text-amber-300 font-bold text-xs rounded-xl shadow-md border border-amber-500/30 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Débloquer dès 10 000F</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0 relative z-10 pl-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-emerald-400/40 relative shadow-lg shadow-black/40">
              <img
                src={imgGoldMiningRig}
                alt="Excavatrice VIP 2"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <span className="absolute bottom-1 right-1 text-[8px] font-mono font-bold text-emerald-300 bg-black/70 px-1.5 py-0.5 rounded backdrop-blur-xs">
                1M F
              </span>
            </div>
            <span className="text-[8px] font-mono font-bold text-slate-400 tracking-wider">CERTIFIÉ VIP 2</span>
          </div>
        </div>

        {/* VIP 3 TICKET - WITH USER REQUESTED TEXT */}
        <div
          onClick={() => setVipLevelModal({
            level: 'VIP3',
            price: '',
            title: 'Société VIP 3',
            subtitle: 'Vous êtes devenus membre de notre société pour percevoir un salaire de 35 000 FCFA à 65 000 FCFA par jour',
            isVip1: false,
            isVip2: false,
            isVip3: true
          })}
          className="relative bg-gradient-to-br from-amber-500/20 via-slate-900 to-amber-950/50 rounded-2xl p-4.5 shadow-xl overflow-hidden flex justify-between items-center cursor-pointer hover:border-amber-400/60 hover:scale-[1.01] active:scale-[0.99] transition-all border-2 border-amber-500/40 group"
        >
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black font-display tracking-tight text-white flex items-center gap-1.5 leading-none">
                VIP 3
                <Crown className="w-4 h-4 text-amber-400 animate-pulse" />
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-md font-mono">
                Statut Société
              </span>
            </div>
            
            <div className="bg-slate-950/80 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold px-3 py-2 rounded-xl inline-flex flex-col gap-1 shadow-sm max-w-[210px]">
              <span className="leading-tight text-white">Vous êtes devenus membre de notre société</span>
              <span className="text-[10px] text-emerald-400 font-mono font-black leading-tight">
                Salaire : 35 000 - 65 000 FCFA/jour
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0 relative z-10 pl-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-amber-400/50 relative shadow-lg shadow-black/40">
              <img
                src={imgGoldRefineryHero}
                alt="Raffinerie VIP 3"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <span className="absolute bottom-1 right-1 text-[8px] font-mono font-bold text-amber-300 bg-black/70 px-1.5 py-0.5 rounded backdrop-blur-xs">
                Salaire
              </span>
            </div>
            <span className="text-[8px] font-mono font-bold text-amber-400 tracking-wider">ÉLITE 24K</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-8 space-y-8 pb-28 font-sans">
      
      {/* DB Schema Cache Alert / Action notice */}
      {schemaCacheStale && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-3xl p-6 space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-400">
                Action Recommandée : Cache de schéma Supabase obsolète détecté !
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Votre base de données Supabase ne reconnaît pas encore les colonnes de mining (<code className="text-amber-300 font-mono">claimable_sum</code>, <code className="text-amber-300 font-mono">last_tick_time</code>). 
                L'application utilise un système de secours local sécurisé, mais pour activer la sauvegarde de votre progression dans le cloud, veuillez exécuter ces commandes de mise à jour.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex-1 font-mono text-[11px] text-slate-400 select-all overflow-x-auto whitespace-pre leading-normal w-full max-w-full">
              {`ALTER TABLE users ADD COLUMN IF NOT EXISTS claimable_sum NUMERIC DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_tick_time BIGINT DEFAULT 0;
NOTIFY pgrst, 'reload schema';`}
            </div>
            <button
              onClick={handleCopyCmd}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/10 shrink-0 cursor-pointer"
            >
              {copiedCmd ? 'Copié !' : 'Copier le script SQL'}
            </button>
          </div>
        </motion.div>
      )}

      {/* ==================== VIP LEVEL TICKETS COMPONENT ==================== */}
      {(() => null)()}

      {/* ==================== TAB 1: ACCUEIL (HOME) ==================== */}
      {(activeTab === 'home') && (
        <div className="space-y-5">
          {/* CINEMATIC REFINERY HERO BANNER */}
          <RefineryHeroBanner
            onOpenPlans={() => onTabChange && onTabChange('plans')}
            onOpenTasks={() => onTabChange && onTabChange('tasks')}
            onOpenVideoAd={onOpenVideoAd}
          />

          {/* HERO BLOCK & CORE METRICS CARD */}
          <div>
            {/* Glowing Gold Card (Main Balance) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="bg-gradient-to-br from-slate-900 via-[#0d1424] to-amber-950/40 border border-amber-500/35 rounded-3xl p-5 md:p-6 relative overflow-hidden shadow-xl shadow-black/40 flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-start justify-between relative z-10 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-mono">
                      <Wallet className="w-3 h-3 text-amber-400" />
                      Portefeuille Principal
                    </span>
                    <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400">
                      ID: GY-CI-{(userPhone || '7788').slice(-4)}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-white font-mono tracking-tight leading-none pt-1">
                    <span>
                      {balance.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-amber-400 text-xl md:text-2xl font-bold ml-2">FCFA</span>
                  </h2>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {onOpenTutorial && (
                    <button
                      onClick={onOpenTutorial}
                      className="px-3.5 py-2 bg-gradient-to-r from-amber-500/15 to-yellow-500/10 hover:from-amber-500/25 hover:to-yellow-500/20 text-amber-300 border border-amber-500/35 hover:border-amber-500/50 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm shadow-amber-500/10 cursor-pointer active:scale-95"
                      title="Consulter le Guide Officiel & Paliers VIP"
                    >
                      <HelpCircle className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                      <span className="font-mono uppercase tracking-wider text-[11px]">Guide VIP</span>
                    </button>
                  )}
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-amber-500/20 text-amber-400">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Quick Stats inside the main wallet */}
              <div className="grid grid-cols-2 gap-3 pt-4 mt-5 border-t border-white/[0.08] relative z-10">
                <div className="bg-slate-950/50 border border-white/[0.04] rounded-2xl p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">Capital à retirer</p>
                    <span className="text-[9px] font-mono text-slate-400">VIP 1 & 2</span>
                  </div>
                  <p className="text-base font-black font-mono text-emerald-400 mt-0.5">
                    {withdrawableCapital.toLocaleString('fr-FR')} FCFA
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
                    {isVip1Finished ? (
                      <span className="text-emerald-400 font-bold">✓ VIP 1 débloqué (500 000 F)</span>
                    ) : accumulatedVip1Gains > 0 ? (
                      <span className="text-amber-300 font-semibold">Cumul VIP 1 : {accumulatedVip1Gains.toLocaleString('fr-FR')} / 500 000 F</span>
                    ) : (
                      <span>Cumul VIP 1 : 0 / 500 000 F</span>
                    )}
                  </p>
                </div>
                <div className="bg-slate-950/50 border border-white/[0.04] rounded-2xl p-3">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Rendement Journalier</p>
                  <p className="text-base font-black font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{totalDailyRevenue.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* INSTANT ACTION SHORTCUTS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={onOpenRecharge}
              className="p-4 bg-slate-900/90 hover:bg-slate-850 border border-white/[0.07] hover:border-amber-500/40 rounded-2xl transition-all text-left flex flex-col gap-3 group cursor-pointer shadow-lg shadow-black/20"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/25 group-hover:text-amber-300 transition-colors">
                <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Recharger</span>
                <span className="text-[10px] text-slate-400 font-mono">Dépôt min: 3 000 F</span>
              </div>
            </button>

            <button
              onClick={onOpenWithdraw}
              className="p-4 bg-slate-900/90 hover:bg-slate-850 border border-white/[0.07] hover:border-emerald-500/40 rounded-2xl transition-all text-left flex flex-col gap-3 group cursor-pointer shadow-lg shadow-black/20"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/25 group-hover:text-emerald-300 transition-colors">
                <ArrowUpRight className="w-4.5 h-4.5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Retirer</span>
                <span className="text-[10px] text-slate-400 font-mono">Retrait min: 1 000 F</span>
              </div>
            </button>

            <button
              onClick={() => onTabChange && onTabChange('tasks')}
              className="p-4 bg-slate-900/90 hover:bg-slate-850 border border-white/[0.07] hover:border-amber-500/40 rounded-2xl transition-all text-left flex flex-col gap-3 group cursor-pointer relative overflow-hidden shadow-lg shadow-black/20"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/25 group-hover:text-amber-300 transition-colors">
                <CheckSquare className="w-4.5 h-4.5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                  Tâches VIP
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                </span>
                <span className="text-[10px] text-amber-300/80 font-mono font-semibold">+13 500 F/jour</span>
              </div>
            </button>

            <a
              href="https://t.me/goldyieldservice"
              target="_blank"
              rel="noreferrer"
              className="p-4 bg-slate-900/90 hover:bg-slate-850 border border-white/[0.07] hover:border-sky-500/40 rounded-2xl transition-all text-left flex flex-col gap-3 group cursor-pointer shadow-lg shadow-black/20"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:bg-sky-500/25 group-hover:text-sky-300 transition-colors">
                <MessageSquare className="w-4.5 h-4.5 stroke-[2]" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Support Télégram</span>
                <span className="text-[10px] text-slate-400">Assistance 24/7</span>
              </div>
            </a>
          </div>

          {/* VIDEO PROMO SHOWCASE BANNER */}
          {onOpenVideoAd && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950/70 via-slate-900 to-amber-950/60 border border-amber-500/35 p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer hover:border-amber-400/60 transition-all group"
              onClick={onOpenVideoAd}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-black uppercase bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                      Spot Publicitaire HD
                    </span>
                    <span className="text-[10px] text-amber-300 font-mono font-bold">
                      Preuves & Retraits
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-white font-display mt-0.5">
                    Gros Gains & Retraits Instantanés Mobile Money
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-300">
                    Découvrez comment les investisseurs perçoivent jusqu'à 1 000 000 FCFA avec retraits Wave & Orange Money.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenVideoAd();
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95 transition-transform"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950 ml-0.5" />
                <span>Voir le Spot (30s)</span>
              </button>
            </motion.div>
          )}

          {/* VIP MEMBER LEVELS TICKET GALLERY */}
          {renderVipLevelTickets()}

          {/* REFERRAL CARD */}
          <div className="bg-gradient-to-br from-slate-900 via-[#0b1220] to-slate-950 border border-white/[0.08] rounded-3xl shadow-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center justify-center md:justify-start gap-1 font-mono">
                <Sparkles className="w-3.5 h-3.5" /> Programme Parrainage Gold
              </span>
              <h4 className="text-lg font-black text-white font-display">Partagez l'opportunité et gagnez +10%</h4>
              <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                Gagnez une commission instantanée de 10% sur chaque recharge effectuée par vos filleuls. Vos invités bénéficient également de 1 000 FCFA de bienvenue.
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto items-end shrink-0">
              <div className="flex items-center gap-2.5 w-full">
                <div className="bg-slate-950/90 border border-white/[0.08] px-3.5 py-2.5 rounded-xl font-mono text-xs text-slate-300 select-all flex-1 md:flex-none text-center truncate max-w-[200px] md:max-w-xs">
                  {inviteLink}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 shrink-0"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copié !' : 'Partager'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: INVESTIR (PLANS) ==================== */}
      {(activeTab === 'plans') && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-extrabold font-display text-white">Catalogue des Plans aurifères</h2>
            <p className="text-xs text-slate-400 mt-1">
              Choisissez la formule adaptée à votre capital et percevez des gains quotidiens garantis pendant 30 jours.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEFAULT_PLANS.map((plan) => {
              const isPlanPoussiereAlreadyPurchased = plan.id === 'plan_poussiere' && activeInvestments.some((inv) => inv.planId === 'plan_poussiere');

              return (
                <div
                  key={plan.id}
                  className={`bg-slate-900/90 border rounded-3xl p-5 shadow-lg flex flex-col justify-between group transition-all ${
                    isPlanPoussiereAlreadyPurchased ? 'border-red-500/20 opacity-80' : 'border-slate-800 hover:border-amber-500/40'
                  }`}
                >
                  <div className="space-y-3">
                    {plan.imageUrl && (
                      <div className="h-36 w-full rounded-2xl overflow-hidden relative border border-white/[0.08] shadow-md group-hover:border-amber-400/40 transition-colors">
                        <img
                          src={plan.imageUrl}
                          alt={plan.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                        <span className="absolute bottom-2 left-2 text-[10px] font-mono font-black text-slate-950 bg-amber-400 px-2 py-0.5 rounded shadow">
                          {plan.dailyProfit > 0 ? `+${plan.dailyProfit.toLocaleString('fr-FR')} FCFA/j` : 'ÉQUIPEMENT VALIDATION'}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className={`p-3 bg-gradient-to-br ${plan.colorScheme.from} ${plan.colorScheme.to} rounded-2xl border border-white/5`}>
                        <PlanIcon name={plan.iconName} className={`w-5 h-5 ${plan.colorScheme.text}`} />
                      </div>
                      <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 py-1 px-2.5 rounded-lg font-mono">
                        Rendement 30 jours
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold font-display text-white leading-tight">{plan.name}</h4>
                      <span className="text-2xl font-black font-mono text-amber-400 block mt-1">
                        {plan.price.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>

                    <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-900 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Gains/Jour</span>
                        <span className="font-bold font-mono text-green-400">+{plan.dailyProfit.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Retour Total</span>
                        <span className="font-bold font-mono text-white">{plan.totalProfit.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                    </div>
                  </div>

                  {isPlanPoussiereAlreadyPurchased ? (
                    <button disabled className="w-full mt-4 py-2.5 px-4 bg-slate-950/40 text-red-400 font-bold text-xs rounded-xl border border-red-500/20 cursor-not-allowed">
                      Achat unique (Déjà investi)
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectPlan(plan)}
                      className="w-full mt-4 py-2.5 px-4 bg-slate-950 hover:bg-amber-500 hover:text-slate-950 text-amber-400 font-bold text-xs rounded-xl border border-amber-500/20 hover:border-transparent transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Souscrire ce plan</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* INFRASTRUCTURE SHOWCASE */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Nos Infrastructures Réelles & Chantiers Partenaires</span>
              </h3>
              <p className="text-xs text-slate-400">
                Chaque contrat souscrit est directement financé par des opérations réelles de raffinage et d'extraction aurifère.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="h-44 overflow-hidden relative">
                  <img src={imgMinePit} alt="Extraction" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-[10px] bg-amber-500 text-slate-950 font-extrabold px-2.5 py-1 rounded-lg font-mono">
                    CONCESSION ACTIVE
                  </span>
                </div>
                <div className="p-4 space-y-1">
                  <h4 className="text-xs font-bold text-amber-400 uppercase">Mine de Kibali</h4>
                  <p className="text-[11px] text-slate-400">Extraction industrielle garantissant un approvisionnement continu.</p>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="h-44 overflow-hidden relative">
                  <img src={imgRefinery} alt="Raffinage" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-[10px] bg-amber-500 text-slate-950 font-extrabold px-2.5 py-1 rounded-lg font-mono">
                    RAFFINAGE CERTIFIÉ 99.9%
                  </span>
                </div>
                <div className="p-4 space-y-1">
                  <h4 className="text-xs font-bold text-amber-400 uppercase">Purification Lingotage</h4>
                  <p className="text-[11px] text-slate-400">Transformation sécurisée en lingots d'or certifiés 99.9%.</p>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="h-44 overflow-hidden relative">
                  <img src={imgEngineers} alt="Ingénieurs" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-[10px] bg-amber-500 text-slate-950 font-extrabold px-2.5 py-1 rounded-lg font-mono">
                    CONTRÔLE QUALITÉ
                  </span>
                </div>
                <div className="p-4 space-y-1">
                  <h4 className="text-xs font-bold text-amber-400 uppercase">Équipe d'Experts</h4>
                  <p className="text-[11px] text-slate-400">Géologues et ingénieurs assurant le rendement optimal des chantiers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: MES ACTIFS & TRANSACTIONS ==================== */}
      {(activeTab === 'assets') && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-extrabold font-display text-white">Mes Actifs & Transactions</h2>
            <p className="text-xs text-slate-400 mt-1">
              Consultez l'état de vos contrats en cours et l'historique complet de vos opérations.
            </p>
          </div>

          {/* Active VIP Mission Card (Replacing old Contrats Actifs) */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Niveau VIP En Cours (Non Terminé)</span>
            </h3>

            {!isVip1Finished ? (
              /* VIP 1 ACTIVE / UNFINISHED CARD */
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-3xl p-6 relative overflow-hidden space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/[0.08] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black font-display text-white">Niveau VIP 1 — Articles de Mine</h4>
                      <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wider font-mono">
                        En cours
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {vip1SavedStep === 'article5'
                        ? "Étape 5 / 5 : Plus qu'un dernier article à régler (30 300 F) pour empocher vos 500 000 FCFA !"
                        : vip1SavedStep === 'article4'
                        ? "Étape 4 / 5 : Réglez le 4e article (15 500 F) pour accéder à l'étape finale du VIP 1."
                        : vip1SavedStep === 'article3'
                        ? "Étape 3 / 5 : Réglez le 3e article (6 300 F) pour continuer votre progression VIP 1."
                        : vip1SavedStep === 'article2' 
                        ? "Étape 2 / 5 : Réglez le 2e article (2 100 F) pour avancer vers la récompense de 500 000 FCFA."
                        : "Étape 1 / 5 : Complétez les 5 articles VIP 1 (dès 1 820 F) pour empocher vos 500 000 FCFA de gain total."}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Gain Total Garanti</span>
                    <span className="text-base font-black font-mono text-emerald-400">+500 000 FCFA</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/70 rounded-2xl p-3.5 border border-white/[0.06] text-xs">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">Avancement</span>
                    <span className="font-black text-white font-mono text-sm">
                      {vip1SavedStep === 'article5'
                        ? '80% (4/5 Articles)'
                        : vip1SavedStep === 'article4'
                        ? '60% (3/5 Articles)'
                        : vip1SavedStep === 'article3'
                        ? '40% (2/5 Articles)'
                        : vip1SavedStep === 'article2'
                        ? '20% (1/5 Articles)'
                        : '0% (0/5 Articles)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">Prochaine étape</span>
                    <span className="font-black text-amber-400 font-mono text-sm">
                      {vip1SavedStep === 'article5'
                        ? '30 300 FCFA'
                        : vip1SavedStep === 'article4'
                        ? '15 500 FCFA'
                        : vip1SavedStep === 'article3'
                        ? '6 300 FCFA'
                        : vip1SavedStep === 'article2'
                        ? '2 100 FCFA'
                        : '1 820 FCFA'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">Statut Accès</span>
                    <span className={`font-bold ${isVip1Unlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isVip1Unlocked ? 'Débloqué (Solde ≥ 3 500F)' : 'Requis : Dépôt 3 500F'}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 font-mono">
                    <span>Progression VIP 1</span>
                    <span>
                      {vip1SavedStep === 'article5'
                        ? 'Étape 5 sur 5'
                        : vip1SavedStep === 'article4'
                        ? 'Étape 4 sur 5'
                        : vip1SavedStep === 'article3'
                        ? 'Étape 3 sur 5'
                        : vip1SavedStep === 'article2'
                        ? 'Étape 2 sur 5'
                        : 'Étape 1 sur 5'}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/[0.06]">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500 rounded-full" 
                      style={{
                        width: vip1SavedStep === 'article5'
                          ? '80%'
                          : vip1SavedStep === 'article4'
                          ? '60%'
                          : vip1SavedStep === 'article3'
                          ? '40%'
                          : vip1SavedStep === 'article2'
                          ? '20%'
                          : '5%'
                      }} 
                    />
                  </div>
                </div>

                <button
                  onClick={handleStartVip1Commander}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>
                    {vip1SavedStep === 'article5'
                      ? 'Poursuivre la commande VIP 1 (Étape 5/5 • 30 300 FCFA)'
                      : vip1SavedStep === 'article4'
                      ? 'Poursuivre la commande VIP 1 (Étape 4/5 • 15 500 FCFA)'
                      : vip1SavedStep === 'article3'
                      ? 'Poursuivre la commande VIP 1 (Étape 3/5 • 6 300 FCFA)'
                      : vip1SavedStep === 'article2'
                      ? 'Poursuivre la commande VIP 1 (Étape 2/5 • 2 100 FCFA)'
                      : 'Démarrer la commande VIP 1 (Étape 1/5 • 1 820 FCFA)'}
                  </span>
                </button>
              </div>
            ) : !isVip2Finished ? (
              /* VIP 2 ACTIVE / UNFINISHED CARD */
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-3xl p-6 relative overflow-hidden space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/[0.08] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black font-display text-white">Niveau VIP 2 — Équipement de Mine</h4>
                      <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wider font-mono">
                        En cours
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Étape Unique 1 / 1 : Réglez l'article unique de mine VIP 2 à 50 000 F pour débloquer immédiatement vos 1 000 000 FCFA !
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Gain Total Garanti</span>
                    <span className="text-base font-black font-mono text-emerald-400">+1 000 000 FCFA</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/70 rounded-2xl p-3.5 border border-white/[0.06] text-xs">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">Avancement</span>
                    <span className="font-black text-white font-mono text-sm">
                      0% (0/1 Article)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">Prochaine étape</span>
                    <span className="font-black text-amber-400 font-mono text-sm">
                      50 000 FCFA
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">Statut Accès</span>
                    <span className="font-bold text-emerald-400">
                      Débloqué (Solde ≥ 10 000F)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 font-mono">
                    <span>Progression VIP 2</span>
                    <span>Étape 1 sur 1</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/[0.06]">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500 rounded-full" 
                      style={{ width: '15%' }} 
                    />
                  </div>
                </div>

                <button
                  onClick={handleStartVip2Commander}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>Démarrer la commande VIP 2 (1/1 • 50 000 FCFA)</span>
                </button>
              </div>
            ) : (
              /* ALL VIP COMPLETED - VIP 3 MEMBER CARD */
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/40 rounded-3xl p-6 relative overflow-hidden space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-white">VIP 3 — Membre Officiel Société</h4>
                      <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30 uppercase tracking-wider">
                        Validé ✓
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Toutes les missions VIP 1 & VIP 2 ont été achevées avec succès.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Salaire journalier</span>
                    <span className="text-base font-black font-mono text-emerald-400">35 000 F – 65 000 F</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="https://t.me/goldyieldservice"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>Rejoindre le canal Telegram VIP 3</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Transactions History */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-amber-400" />
              <span>Historique des Transactions</span>
            </h3>

            {transactions.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs">
                Aucune transaction enregistrée.
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
                {transactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    onClick={() => setSelectedReceiptTx(tx)}
                    className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        tx.type === 'deposit' ? 'bg-green-500/10 text-green-400' :
                        tx.type === 'withdrawal' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {tx.type === 'deposit' ? <Plus className="w-4 h-4" /> :
                         tx.type === 'withdrawal' ? <ArrowUpRight className="w-4 h-4" /> :
                         <Sparkles className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                          <span>
                            {tx.type === 'deposit' ? 'Recharge approuvée' :
                             tx.type === 'withdrawal' ? 'Retrait d\'argent' :
                             tx.type === 'investment' ? 'Achat plan minier' : 'Gain collecté'}
                          </span>
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono group-hover:bg-amber-500/20 group-hover:text-amber-300">
                            Reçu 📄
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {new Date(tx.date).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-xs font-black font-mono ${tx.type === 'deposit' || tx.type === 'collect' ? 'text-green-400' : 'text-white'}`}>
                        {tx.type === 'deposit' || tx.type === 'collect' ? '+' : '-'}
                        {tx.amount.toLocaleString('fr-FR')} FCFA
                      </p>
                      <span className={`text-[9px] uppercase font-bold ${tx.status === 'completed' ? 'text-green-400' : 'text-amber-400'}`}>
                        {tx.status === 'completed' ? 'Réussi' : 'En attente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB: TÂCHES & MISSIONS VIP ==================== */}
      {(activeTab === 'tasks') && (
        <div className="space-y-5">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg space-y-3">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Centre des Commandes VIP
                </span>
                <h2 className="text-xl md:text-2xl font-black text-white font-display">
                  Niveaux & Offres VIP
                </h2>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  Accédez directement à vos niveaux VIP pour passer vos commandes et générer vos revenus.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-amber-500/20 rounded-xl p-3 text-right shrink-0">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Statut VIP</span>
                <div className="text-sm font-black font-mono text-amber-400 mt-0.5">
                  Actif
                </div>
              </div>
            </div>
          </div>

          {/* VIP MEMBER LEVELS TICKET GALLERY */}
          {renderVipLevelTickets()}
        </div>
      )}

      {/* ==================== TAB 4: PROFIL / MON COMPTE ==================== */}
      {(activeTab === 'profile') && (
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* User Profile Header Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-3xl p-6 relative overflow-hidden shadow-xl text-center md:text-left flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0 border-2 border-amber-300">
              {userName.substring(0, 2).toUpperCase()}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h2 className="text-xl font-bold text-white truncate">{userName}</h2>
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-3 h-3" /> VIP VÉRIFIÉ
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{userPhone || 'Compte Gold Yield'}</p>
              <p className="text-[11px] text-slate-500">ID Membre : <span className="font-mono text-amber-400">GY-{userPhone.slice(-4) || '2026'}</span></p>
            </div>
          </div>

          {/* Quick Balance Summary & Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Solde Disponible</span>
                <p className="text-2xl font-black text-amber-400 font-mono">{balance.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onOpenRecharge}
                  className="px-3.5 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 transition-all cursor-pointer"
                >
                  Dépôt
                </button>
                <button
                  onClick={onOpenWithdraw}
                  className="px-3.5 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-700 transition-all border border-slate-700 cursor-pointer"
                >
                  Retrait
                </button>
              </div>
            </div>
          </div>

          {/* Theme & Visual Customizer */}
          <div className="bg-slate-900/90 border border-amber-500/20 rounded-3xl p-5 sm:p-6 space-y-3 relative overflow-hidden shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Thème & Couleurs du Site
                    <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      {currentTheme}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Choisissez parmi 4 ambiances : Or Royal, Émeraude, Nuit d'Or ou Mode Clair.
                  </p>
                </div>
              </div>
              {onOpenThemeSelector && (
                <button
                  onClick={onOpenThemeSelector}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shrink-0"
                >
                  <Palette className="w-4 h-4" />
                  <span>Changer le Thème</span>
                </button>
              )}
            </div>
          </div>

          {/* Supabase Cloud Database Status & Configuration Card */}
          <div className="bg-slate-900/90 border border-emerald-500/25 rounded-3xl p-5 sm:p-6 space-y-3 relative overflow-hidden shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg shrink-0 ${supabaseStatus?.connected ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/20' : 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/20'}`}>
                  <Database className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Base de Données Cloud Supabase
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${supabaseStatus?.connected ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                      {supabaseStatus?.connected ? '● En Ligne / Connecté' : '● Mode Local Résilient'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {supabaseStatus?.connected
                      ? 'Vos utilisateurs, soldes et gains sont synchronisés en direct sur Supabase Cloud.'
                      : 'Connectez votre projet Supabase pour synchroniser et persister vos données sur le Cloud.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSupabaseModalOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shrink-0"
              >
                <Database className="w-4 h-4" />
                <span>{supabaseStatus?.connected ? 'Gérer Supabase' : 'Connecter Supabase'}</span>
              </button>
            </div>
          </div>

          {/* Parrainage details */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Mon Lien de Parrainage (+10% commission)</span>
            </h3>
            <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="bg-transparent font-mono text-xs text-slate-300 flex-1 outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 shrink-0"
              >
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>

          {/* App & Security Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Assurance & Sécurité des Fonds</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Toutes les transactions et les dépôts effectués sur la plateforme Gold Yield sont encadrés par des contrats sécurisés et adossés à des réserves physiques vérifiées.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <a
                href="https://t.me/goldyieldservice"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 bg-slate-950 rounded-xl text-xs text-slate-300 hover:text-white border border-slate-850"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  <span>Support Telegram Officiel</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
            </div>
          </div>

          {/* Logout button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs rounded-2xl border border-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Se Déconnecter de l'Application</span>
            </button>
          )}
        </div>
      )}

      {/* ==================== INTERACTIVE TASK EXECUTING OVERLAY ==================== */}
      <AnimatePresence>
        {executingTask && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-5 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Activity className="w-8 h-8 animate-spin" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">{executingTask.title}</h4>
                <p className="text-xs text-slate-400">Validation et contrôle de conformité du rapport en cours...</p>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                    style={{ width: `${executingProgress}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">{executingProgress}% effectué</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== LOCKED VIP TASK UNLOCK MODAL ==================== */}
      <AnimatePresence>
        {lockedTaskModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative"
            >
              <button
                onClick={() => setLockedTaskModal(null)}
                className="absolute top-4 right-4 p-2 bg-slate-950 text-slate-400 hover:text-white rounded-full border border-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400">
                    {lockedTaskModal.category === 'beginner' ? 'Accès VIP 1 Requis' :
                     lockedTaskModal.category === 'elite' ? 'VIP 3 — Membre Société' : 'Accès VIP 2 Requis'}
                  </span>
                  <h4 className="text-lg font-bold text-white">{lockedTaskModal.title}</h4>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2">
                {lockedTaskModal.category === 'beginner' ? (
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Pour débloquer et exécuter les tâches du <strong>VIP 1</strong> (+{lockedTaskModal.reward.toLocaleString('fr-FR')} FCFA), le système exige un solde d'au moins <strong>3 500 FCFA</strong> sur votre compte (ou l'accomplissement des commandes VIP 1). Votre solde actuel est de <strong className="text-amber-400 font-mono">{balance.toLocaleString('fr-FR')} FCFA</strong>.
                  </p>
                ) : lockedTaskModal.category === 'elite' ? (
                  <div className="space-y-2">
                    <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 p-2.5 rounded-xl border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Vous êtes devenus membre de notre société</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Pour devenir membre officiel de notre société (VIP 3) et percevoir un salaire de <strong>35 000 FCFA à 65 000 FCFA par jour</strong>, vous devez d'abord accomplir et débloquer les niveaux VIP 1 et VIP 2 !
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Pour accéder au <strong>VIP 2</strong> et exécuter cette commande (+{lockedTaskModal.reward.toLocaleString('fr-FR')} FCFA), le solde de votre compte doit être d'au moins <strong>10 000 FCFA</strong>. Votre solde actuel est de <strong className="text-amber-400 font-mono">{balance.toLocaleString('fr-FR')} FCFA</strong>.
                  </p>
                )}

                <p className="text-[11px] text-slate-400">
                  Rechargez votre solde dès maintenant pour débloquer automatiquement l'accès !
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => {
                    setLockedTaskModal(null);
                    onOpenRecharge();
                  }}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer text-center"
                >
                  Effectuer un Dépôt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== REWARD SUCCESS CELEBRATION MODAL ==================== */}
      <AnimatePresence>
        {taskRewardSuccessModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-8 h-8 animate-bounce" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black text-white">Tâche Réussie !</h4>
                <p className="text-xs text-slate-300">{taskRewardSuccessModal.title}</p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-2xl border border-emerald-500/30">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Gain crédité dans votre solde</span>
                <span className="text-2xl font-black font-mono text-green-400 mt-0.5 block">
                  +{taskRewardSuccessModal.reward.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              <button
                onClick={() => setTaskRewardSuccessModal(null)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Continuer
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== VIP LEVEL INFO & VIP 3 MEMBERSHIP MODAL ==================== */}
      <AnimatePresence>
        {vipLevelModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4"
            >
              <button
                onClick={() => setVipLevelModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 text-amber-400 border border-amber-500/30 rounded-2xl">
                  <Crown className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-400 tracking-wider block">
                    {vipLevelModal.price ? `${vipLevelModal.level} • ${vipLevelModal.price}` : vipLevelModal.level}
                  </span>
                  <h3 className="text-lg font-black text-white font-display">
                    {vipLevelModal.title}
                  </h3>
                </div>
              </div>

              {vipLevelModal.isVip3 ? (
                <div className="bg-gradient-to-br from-amber-500/15 via-amber-950/30 to-slate-950 border border-amber-500/40 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Vous êtes devenus membre de notre société</span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Avantage Salaire Quotidien</span>
                    <span className="text-sm font-black font-mono text-green-400">35 000 FCFA à 65 000 FCFA / jour</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-950/70 p-3 rounded-xl border border-amber-500/20">
                    Pour devenir membre officiel de notre société (VIP 3) et percevoir un salaire de <strong>35 000 FCFA à 65 000 FCFA par jour</strong>, vous devez d'abord accomplir et débloquer les niveaux VIP 1 et VIP 2 !
                  </p>
                </div>
              ) : vipLevelModal.isVip2 ? (
                <div className="bg-gradient-to-br from-amber-500/10 to-slate-950 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
                    <Lock className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Condition de Déblocage VIP 2</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-950/80 p-3 rounded-xl border border-amber-500/20">
                    {isVip2Unlocked ? (
                      <span>
                        Félicitations ! Avec votre solde actuel de <strong className="text-emerald-400 font-mono">{balance.toLocaleString('fr-FR')} FCFA</strong> (≥ 10 000 FCFA), vous avez débloqué l'accès complet au <strong>VIP 2</strong> ! Vous pouvez passer vos commandes d'articles de mine.
                      </span>
                    ) : (
                      <span>
                        Pour accéder au <strong>VIP 2</strong>, le solde de votre compte doit être supérieur ou égal à <strong>10 000 FCFA</strong> ! Votre solde actuel est de <strong className="text-amber-400 font-mono">{balance.toLocaleString('fr-FR')} FCFA</strong>. Effectuez un dépôt pour débloquer l'accès.
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <div className={`border rounded-2xl p-4 space-y-2 ${isVip1Finished ? 'bg-emerald-950/80 border-emerald-500/50' : 'bg-slate-950/80 border-slate-800'}`}>
                  <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{isVip1Finished ? 'VIP 1 Clôturé & Bloqué (Terminé)' : 'Accès Automatique dès 3 500 FCFA'}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isVip1Finished ? (
                      <span>
                        Félicitations ! Vous avez accompli l'ensemble des 5 commandes d'articles du <strong>VIP 1</strong> (1 820F, 2 100F, 6 300F, 15 500F, 30 300F) et empoché la récompense globale de <strong>500 000 FCFA</strong>. Ce niveau est désormais sauvegardé et définitivement bloqué.
                      </span>
                    ) : isVip1Unlocked ? (
                      <span>
                        Félicitations ! Avec votre solde actuel de <strong className="text-emerald-400 font-mono">{balance.toLocaleString('fr-FR')} FCFA</strong>, le système vous donne accès au <strong>VIP 1 (5 articles de mine à valider)</strong> !
                      </span>
                    ) : (
                      <span>
                        Pour accéder au <strong>VIP 1</strong>, vous devez acquérir les 5 articles de mine à tarif préférentiel (1 820F, 2 100F, 6 300F, 15 500F, 30 300F). Effectuez un dépôt pour commencer l'exploitation.
                      </span>
                    )}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                {vipLevelModal.isVip1 && !isVip1Finished && (
                  isVip1Unlocked ? (
                    <button
                      onClick={handleStartVip1Commander}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-400 via-amber-400 to-yellow-400 hover:from-emerald-300 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-amber-500/25 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                    >
                      <ShoppingCart className="w-4 h-4 text-slate-950" />
                      <span>
                        {vip1SavedStep === 'article5'
                          ? 'Reprendre la commande VIP 1 (Étape 5/5 • 30 300 FCFA)'
                          : vip1SavedStep === 'article4'
                          ? 'Reprendre la commande VIP 1 (Étape 4/5 • 15 500 FCFA)'
                          : vip1SavedStep === 'article3'
                          ? 'Reprendre la commande VIP 1 (Étape 3/5 • 6 300 FCFA)'
                          : vip1SavedStep === 'article2'
                          ? 'Reprendre la commande VIP 1 (Étape 2/5 • 2 100 FCFA)'
                          : 'Commander (Articles VIP 1 • Étape 1/5 • 1 820 FCFA)'}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTriggerMentorDepositPopup('VIP 1')}
                      className="w-full py-3.5 bg-slate-800 hover:bg-slate-750 text-amber-300 font-black text-xs rounded-xl border border-amber-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Solde insuffisant pour commander (Dépôt requis)</span>
                    </button>
                  )
                )}

                {vipLevelModal.isVip1 && isVip1Finished && (
                  <div className="w-full py-3.5 bg-slate-900 border border-emerald-500/40 text-emerald-400 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 opacity-90 select-none cursor-not-allowed">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Niveau VIP 1 Validé & Bloqué (Déjà Terminé)</span>
                  </div>
                )}

                {vipLevelModal.isVip2 && !isVip2Finished && (
                  isVip2Unlocked ? (
                    <button
                      onClick={handleStartVip2Commander}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-400 via-amber-400 to-yellow-400 hover:from-emerald-300 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-amber-500/25 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                    >
                      <ShoppingCart className="w-4 h-4 text-slate-950" />
                      <span>Commander (Article de mine VIP 2 • 1/1 • 50 000 FCFA)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTriggerMentorDepositPopup('VIP 2')}
                      className="w-full py-3.5 bg-slate-800 hover:bg-slate-750 text-amber-300 font-black text-xs rounded-xl border border-amber-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Solde insuffisant pour commander (Dépôt min. 10 000F)</span>
                    </button>
                  )
                )}

                {vipLevelModal.isVip2 && isVip2Finished && (
                  <div className="w-full py-3.5 bg-slate-900 border border-emerald-500/40 text-emerald-400 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 opacity-90 select-none cursor-not-allowed">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Niveau VIP 2 Validé & Bloqué (Déjà Terminé)</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    const level = vipLevelModal.isVip2 ? 'VIP 2' : vipLevelModal.isVip1 ? 'VIP 1' : 'VIP 1 & 2';
                    handleTriggerMentorDepositPopup(level);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>
                    {vipLevelModal.isVip3
                      ? "Faire un Dépôt (Débloquer VIP 1 & 2)"
                      : vipLevelModal.isVip2
                      ? (isVip2Unlocked ? "Recharger mon compte" : "Débloquer VIP 2 (Dépôt min 10 000F)")
                      : isVip1Unlocked
                      ? "Recharger mon compte"
                      : "Débloquer VIP 1 (Dépôt min 3 500F)"}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>


                <button
                  onClick={() => setVipLevelModal(null)}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white font-bold text-xs rounded-xl border border-slate-800 transition-all cursor-pointer"
                >
                  Compris
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== MENTOR DEPOSIT POPUP MODAL ==================== */}
      <AnimatePresence>
        {mentorDepositPopup?.show && (
          <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center space-y-4 overflow-hidden"
            >
              {/* Top ambient gold glow */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

              <button
                onClick={() => setMentorDepositPopup(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-slate-900 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl relative">
                <UserCheck className="w-8 h-8 text-amber-400" />
                <Sparkles className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full inline-block font-mono">
                  Assistance Dépôt • {mentorDepositPopup.vipLevel}
                </span>
                <h3 className="text-xl font-black text-white font-display">
                  Validation de Dépôt
                </h3>
              </div>

              {/* Exact user-requested message popup */}
              <div className="p-4 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border-2 border-amber-500/50 rounded-2xl shadow-inner space-y-1">
                <p className="text-base sm:text-lg font-black text-amber-300 leading-snug">
                  Pour effectuer un dépôt, contactez votre mentor
                </p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed px-1">
                Votre mentor attitré vous communiquera les instructions de recharge officielles pour activer votre adhésion <strong>{mentorDepositPopup.vipLevel}</strong> et valider vos gains en toute sécurité.
              </p>

              <div className="space-y-2 pt-2">
                <a
                  href="https://t.me/goldyieldservice"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Headphones className="w-4 h-4 text-slate-950" />
                  <span>Contacter mon Mentor</span>
                </a>

                <button
                  onClick={() => setMentorDepositPopup(null)}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-800 transition-all cursor-pointer"
                >
                  Compris
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== VIP 1 COMMANDER & MINING ARTICLES WORKFLOW ==================== */}
      <AnimatePresence>
        {vip1CommanderStep !== 'none' && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5 text-center overflow-hidden"
            >
              {vip1CommanderStep !== 'loading' && (
                <button
                  onClick={() => setVip1CommanderStep('none')}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* 1. FAST LOADING POPUP (0% to 100% Progress) */}
              {vip1CommanderStep === 'loading' && (
                <div className="py-6 space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-slate-900 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl relative">
                    <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
                    <Sparkles className="w-5 h-5 text-yellow-300 absolute top-2 right-2 animate-bounce" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white font-display">
                      Recherche d'articles de mine...
                    </h3>
                    <p className="text-xs text-slate-400">
                      Analyse des équipements aurifères VIP 1 à tarif préférentiel
                    </p>
                  </div>

                  {/* 0-100% Progress Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between items-center text-xs font-mono font-bold">
                      <span className="text-amber-400">Progression</span>
                      <span className="text-amber-300 font-black">{vip1LoadingProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-3.5 rounded-full border border-amber-500/30 overflow-hidden p-0.5">
                      <motion.div
                        className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full shadow-md"
                        style={{ width: `${vip1LoadingProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ARTICLE 1: 1 820 FCFA */}
              {vip1CommanderStep === 'article1' && (
                <div className="space-y-4 text-left">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full inline-block">
                      Article de Mine VIP 1 • Étape 1/5
                    </span>
                    <h3 className="text-xl font-black text-white font-display">
                      Pelle & Détecteur Aurifère
                    </h3>
                  </div>

                  <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 rounded-2xl border-2 border-amber-500/40 overflow-hidden shrink-0 shadow-xl relative bg-slate-900">
                        <img src={imgDetectorKit} alt="Kit Détecteur de Pépites 24K" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-mono block">Équipement d'Excavation (1/5)</span>
                        <h4 className="text-sm font-extrabold text-white">Kit Détecteur de Pépites 24K</h4>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-xs text-slate-500 line-through font-mono">4 500 F</span>
                          <span className="text-lg font-black font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                            1 820 FCFA
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      Achetez le premier article au prix de <strong>1 820 FCFA</strong> et recevez immédiatement <strong>+100 000 FCFA</strong> dans votre capital à retirer !
                    </p>
                  </div>

                  <button
                    onClick={handlePayArticle1}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 hover:from-emerald-400 hover:to-green-300 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <CheckCircle className="w-5 h-5 text-slate-950" />
                    <span>Payer 1 820 FCFA & Recevoir +100 000 FCFA (Étape 1/5)</span>
                  </button>
                </div>
              )}

              {/* 3. ARTICLE 2: 2 100 FCFA */}
              {vip1CommanderStep === 'article2' && (
                <div className="space-y-4 text-left">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full inline-block">
                      Article de Mine VIP 1 • Étape 2/5
                    </span>
                    <h3 className="text-xl font-black text-white font-display">
                      Sonde Spectrométrique Lazer
                    </h3>
                  </div>

                  <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 rounded-2xl border-2 border-amber-500/40 overflow-hidden shrink-0 shadow-xl relative bg-slate-900">
                        <img src={imgSpectrometerProbe} alt="Sonde Spectrométrique Lazer" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-mono block">Analyse Pureté Métal (2/5)</span>
                        <h4 className="text-sm font-extrabold text-white">Sonde Spectrométrique Lazer</h4>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-xs text-slate-500 line-through font-mono">5 000 F</span>
                          <span className="text-lg font-black font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                            2 100 FCFA
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      Réglez le second équipement à <strong>2 100 FCFA</strong> et encaissez <strong>+100 000 FCFA</strong> supplémentaires dans votre capital à retirer (cumul : 200 000 FCFA).
                    </p>
                  </div>

                  <button
                    onClick={handlePayArticle2}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 hover:from-emerald-400 hover:to-green-300 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <CheckCircle className="w-5 h-5 text-slate-950" />
                    <span>Payer 2 100 FCFA & Recevoir +100 000 FCFA (Étape 2/5)</span>
                  </button>
                </div>
              )}

              {/* 4. ARTICLE 3: 6 300 FCFA */}
              {vip1CommanderStep === 'article3' && (
                <div className="space-y-4 text-left">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full inline-block">
                      Article de Mine VIP 1 • Étape 3/5
                    </span>
                    <h3 className="text-xl font-black text-white font-display">
                      Broyeur Concasseur Quartz 24K
                    </h3>
                  </div>

                  <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 rounded-2xl border-2 border-amber-500/40 overflow-hidden shrink-0 shadow-xl relative bg-slate-900">
                        <img src={imgHydraulicCrusher} alt="Broyeur Concasseur Quartz 24K" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-mono block">Broyage Minier (3/5)</span>
                        <h4 className="text-sm font-extrabold text-white">Broyeur Concasseur Quartz 24K</h4>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-xs text-slate-500 line-through font-mono">12 000 F</span>
                          <span className="text-lg font-black font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                            6 300 FCFA
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      Acquérez le 3e équipement de broyage à <strong>6 300 FCFA</strong> et recevez <strong>+100 000 FCFA</strong> supplémentaires dans votre capital à retirer (cumul : 300 000 FCFA).
                    </p>
                  </div>

                  <button
                    onClick={handlePayArticle3}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 hover:from-emerald-400 hover:to-green-300 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <CheckCircle className="w-5 h-5 text-slate-950" />
                    <span>Payer 6 300 FCFA & Recevoir +100 000 FCFA (Étape 3/5)</span>
                  </button>
                </div>
              )}

              {/* 5. ARTICLE 4: 15 500 FCFA */}
              {vip1CommanderStep === 'article4' && (
                <div className="space-y-4 text-left">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full inline-block">
                      Article de Mine VIP 1 • Étape 4/5
                    </span>
                    <h3 className="text-xl font-black text-white font-display">
                      Refroidisseur & Thermorégulateur
                    </h3>
                  </div>

                  <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 rounded-2xl border-2 border-amber-500/40 overflow-hidden shrink-0 shadow-xl relative bg-slate-900">
                        <img src={imgCrucibleChiller} alt="Refroidisseur de Creusets d'Or" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-mono block">Thermorégulation (4/5)</span>
                        <h4 className="text-sm font-extrabold text-white">Refroidisseur de Creusets d'Or</h4>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-xs text-slate-500 line-through font-mono">25 000 F</span>
                          <span className="text-lg font-black font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                            15 500 FCFA
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      Réglez le 4e article à <strong>15 500 FCFA</strong> et recevez <strong>+100 000 FCFA</strong> de récompense immédiate (cumul : 400 000 FCFA).
                    </p>
                  </div>

                  <button
                    onClick={handlePayArticle4}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 hover:from-emerald-400 hover:to-green-300 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <CheckCircle className="w-5 h-5 text-slate-950" />
                    <span>Payer 15 500 FCFA & Recevoir +100 000 FCFA (Étape 4/5)</span>
                  </button>
                </div>
              )}

              {/* 6. ARTICLE 5: 30 300 FCFA -> FINISH VIP 1 */}
              {vip1CommanderStep === 'article5' && (
                <div className="space-y-4 text-left">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full inline-block">
                      Article de Mine VIP 1 • Étape Finale 5/5
                    </span>
                    <h3 className="text-xl font-black text-white font-display">
                      Moule & Filtre Pureté Finale Lingots 24K
                    </h3>
                  </div>

                  <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 rounded-2xl border-2 border-amber-500/40 overflow-hidden shrink-0 shadow-xl relative bg-slate-900">
                        <img src={imgGoldIngotFilter} alt="Moule & Filtre Pureté Finale" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-mono block">Dernier Équipement (5/5)</span>
                        <h4 className="text-sm font-extrabold text-white">Moule & Filtre Pureté Finale Lingots 24K</h4>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-xs text-slate-500 line-through font-mono">55 000 F</span>
                          <span className="text-lg font-black font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                            30 300 FCFA
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      Réglez ce 5e et dernier article à <strong>30 300 FCFA</strong> pour clôturer définitivement le cycle VIP 1 et toucher votre dernière tranche de <strong>100 000 FCFA</strong> (gain total : <strong>500 000 FCFA</strong>) !
                    </p>
                  </div>

                  <button
                    onClick={handlePayArticle5}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 hover:from-emerald-400 hover:to-green-300 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Crown className="w-5 h-5 text-slate-950" />
                    <span>Payer 30 300 FCFA & Finaliser les 500 000 FCFA</span>
                  </button>
                </div>
              )}

              {/* 7. SUCCESS CELEBRATION MODAL */}
              {vip1CommanderStep === 'success' && (
                <div className="py-2 space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center text-slate-950 shadow-2xl shadow-emerald-500/40 animate-bounce">
                    <CheckCircle className="w-12 h-12 text-slate-950 fill-emerald-300" />
                  </div>

                  <div className="space-y-1 text-center">
                    <span className="text-[10px] uppercase font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full inline-block">
                      ✓ VIP 1 Terminé avec Succès
                    </span>
                    <h3 className="text-2xl font-black text-white font-display">
                      Récompense de 500 000 FCFA !
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed px-2">
                      Félicitations ! Vous avez acquis vos 5 articles de mine VIP 1 (1 820 F, 2 100 F, 6 300 F, 15 500 F, 30 300 F) et complété votre VIP 1. Votre gain total de <strong>500 000 FCFA</strong> a été intégralement débloqué dans votre capital à retirer !
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Nouveau Solde Disponible</span>
                    <span className="text-3xl font-black font-mono text-emerald-400 block">
                      {balance.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>

                  <button
                    onClick={() => setVip1CommanderStep('none')}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                  >
                    Super ! Continuer
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== VIP 2 COMMANDER & MINING ARTICLES WORKFLOW ==================== */}
      <AnimatePresence>
        {vip2CommanderStep !== 'none' && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5 text-center overflow-hidden"
            >
              {vip2CommanderStep !== 'loading' && (
                <button
                  onClick={() => setVip2CommanderStep('none')}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* 1. FAST LOADING POPUP (0% to 100% Progress) */}
              {vip2CommanderStep === 'loading' && (
                <div className="py-6 space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-slate-900 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl relative">
                    <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
                    <Sparkles className="w-5 h-5 text-yellow-300 absolute top-2 right-2 animate-bounce" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white font-display">
                      Recherche d'articles de mine VIP 2...
                    </h3>
                    <p className="text-xs text-slate-400">
                      Analyse des équipements aurifères lourds VIP 2 à tarif préférentiel
                    </p>
                  </div>

                  {/* 0-100% Progress Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between items-center text-xs font-mono font-bold">
                      <span className="text-amber-400">Progression</span>
                      <span className="text-amber-300 font-black">{vip2LoadingProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-3.5 rounded-full border border-amber-500/30 overflow-hidden p-0.5">
                      <motion.div
                        className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full shadow-md"
                        style={{ width: `${vip2LoadingProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ARTICLE 1/1: 50 000 FCFA */}
              {vip2CommanderStep === 'article1' && (
                <div className="space-y-4 text-left">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full inline-block">
                      Article de Mine VIP 2 • Étape Unique 1/1
                    </span>
                    <h3 className="text-xl font-black text-white font-display">
                      Station Industrielle d'Extraction Aurifère VIP 2
                    </h3>
                  </div>

                  <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 rounded-2xl border-2 border-amber-500/40 overflow-hidden shrink-0 shadow-xl relative bg-slate-900">
                        <img src={imgGoldMiningRig} alt="Station Industrielle d'Extraction VIP 2" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-mono block">Station Industrielle VIP 2</span>
                        <h4 className="text-sm font-extrabold text-white">Station Industrielle Aurifère</h4>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-xs text-slate-500 line-through font-mono">95 000 F</span>
                          <span className="text-lg font-black font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                            50 000 FCFA
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      Réglez cet article unique de mine VIP 2 à <strong>50 000 FCFA</strong> pour valider définitivement le VIP 2 et percevoir immédiatement votre prime spéciale de <strong>1 000 000 FCFA</strong> !
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handlePayVip2Article1}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 hover:from-emerald-400 hover:to-green-300 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Crown className="w-5 h-5 text-slate-950" />
                      <span>Payer 50 000 FCFA sur Solde &amp; Recevoir 1 000 000 FCFA</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3. SUCCESS CELEBRATION MODAL (VIP 2) */}
              {vip2CommanderStep === 'success' && (
                <div className="py-2 space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center text-slate-950 shadow-2xl shadow-emerald-500/40 animate-bounce">
                    <CheckCircle className="w-12 h-12 text-slate-950 fill-emerald-300" />
                  </div>

                  <div className="space-y-1 text-center">
                    <span className="text-[10px] uppercase font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full inline-block">
                      ✓ VIP 2 Terminé avec Succès
                    </span>
                    <h3 className="text-2xl font-black text-white font-display">
                      Récompense de 1 000 000 FCFA !
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed px-2">
                      Félicitations ! Vous avez acquis votre article de mine VIP 2 (50 000 FCFA) et validé votre VIP 2. Une prime de <strong>1 000 000 FCFA</strong> a été créditée sur votre solde !
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Nouveau Solde Disponible</span>
                    <span className="text-3xl font-black font-mono text-emerald-400 block">
                      {balance.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>

                  <button
                    onClick={() => setVip2CommanderStep('none')}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                  >
                    Super ! Continuer
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== INSUFFICIENT BALANCE POPUP ==================== */}
      <AnimatePresence>
        {insufficientBalanceModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="bg-slate-900 border-2 border-red-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4 text-center overflow-hidden"
            >
              <button
                onClick={() => setInsufficientBalanceModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-lg flex items-center justify-center">
                <AlertCircle className="w-9 h-9 text-red-400" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono font-black text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full inline-block">
                  Solde Insuffisant
                </span>
                <h3 className="text-xl font-black text-white font-display">
                  Recharge requise pour commander
                </h3>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 text-left">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-mono block">Article à commander</span>
                  <p className="text-sm font-extrabold text-amber-400">{insufficientBalanceModal.articleName}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Prix de l'article</span>
                    <span className="text-sm font-black font-mono text-white">
                      {insufficientBalanceModal.requiredPrice.toLocaleString('fr-FR')} F
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Votre solde actuel</span>
                    <span className="text-sm font-black font-mono text-slate-300">
                      {balance.toLocaleString('fr-FR')} F
                    </span>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-red-400 block">Montant à ajouter sur votre solde</span>
                  <span className="text-2xl font-black font-mono text-red-400 block">
                    +{insufficientBalanceModal.missingAmount.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 text-center leading-relaxed">
                  Vous devez recharger au moins <strong>{insufficientBalanceModal.missingAmount.toLocaleString('fr-FR')} FCFA</strong> sur votre compte pour débloquer et passer cette commande.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {insufficientBalanceModal.articleName.includes('VIP 2') || insufficientBalanceModal.requiredPrice === 50000 ? (
                  <a
                    href="https://geniuspay.ci/product/refroidisseur-de-creusets-dor-SU8bSn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 text-center cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>🔗 Payer directement sur GeniusPay (VIP 2 • 50 000 FCFA)</span>
                  </a>
                ) : (
                  <a
                    href="https://geniuspay.ci/product/article-vip1-HTWkud"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 text-center cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>🔗 Payer directement sur GeniusPay (VIP 1)</span>
                  </a>
                )}

                <button
                  onClick={() => {
                    const level = insufficientBalanceModal.articleName.includes('VIP 2') ? 'VIP 2' : 'VIP 1';
                    setInsufficientBalanceModal(null);
                    handleTriggerMentorDepositPopup(level);
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-850 text-amber-300 font-extrabold text-xs rounded-xl border border-amber-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4 text-amber-400" />
                  <span>Recharger le solde de mon compte (+{insufficientBalanceModal.missingAmount.toLocaleString('fr-FR')} FCFA)</span>
                </button>

                <button
                  onClick={() => setInsufficientBalanceModal(null)}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 font-extrabold text-xs rounded-xl border border-slate-800 transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Official Transaction Receipt Modal */}
      <ReceiptModal
        transaction={selectedReceiptTx}
        isOpen={!!selectedReceiptTx}
        onClose={() => setSelectedReceiptTx(null)}
        showToast={showToast}
      />

      {/* Supabase Connection & Configuration Modal */}
      <AnimatePresence>
        {isSupabaseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
                    <Database className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Connecter Supabase Cloud
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Synchronisation des utilisateurs, soldes et transactions
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSupabaseModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${supabaseStatus?.connected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <div className={`w-2.5 h-2.5 rounded-full ${supabaseStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>Statut : {supabaseStatus?.connected ? 'Connecté à Supabase Cloud' : 'Mode Local Résilient (Non connecté)'}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/50">
                  {supabaseStatus?.engine || 'Local'}
                </span>
              </div>

              {/* Step 1: SQL Script Guide */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">1. Tables SQL (à exécuter dans Supabase)</span>
                  <button
                    onClick={() => {
                      const sql = `-- Script SQL Gold Yield
CREATE TABLE IF NOT EXISTS users (phone TEXT PRIMARY KEY, name TEXT NOT NULL, password TEXT NOT NULL, invite_code TEXT DEFAULT 'GOLDYIELD', balance NUMERIC DEFAULT 1000, claimable_sum NUMERIC DEFAULT 0, last_tick_time BIGINT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS active_investments (id TEXT PRIMARY KEY, user_phone TEXT REFERENCES users(phone) ON DELETE CASCADE, plan_id TEXT NOT NULL, plan_name TEXT NOT NULL, price NUMERIC NOT NULL, daily_profit NUMERIC NOT NULL, date_activated TEXT NOT NULL, last_collected_date TEXT NOT NULL, total_collected NUMERIC DEFAULT 0, total_profit NUMERIC NOT NULL, duration_days NUMERIC NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, user_phone TEXT REFERENCES users(phone) ON DELETE CASCADE, type TEXT NOT NULL, amount NUMERIC NOT NULL, date TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', details TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS investment_plans (id TEXT PRIMARY KEY, name TEXT NOT NULL, price NUMERIC NOT NULL, daily_profit NUMERIC DEFAULT 0, duration_days NUMERIC DEFAULT 30, total_profit NUMERIC DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW());
TRUNCATE TABLE investment_plans CASCADE;
INSERT INTO investment_plans (id, name, price, daily_profit, duration_days, total_profit) VALUES
('vip1_machine', 'Pack Machine VIP 1', 1800, 1000, 30, 30000),
('vip2_article1', 'Broyeur Hydraulique Quartz 24K (VIP 2 • 1/3)', 25000, 0, 30, 0),
('vip2_article2', 'Refroidisseur de Creusets d''Or (VIP 2 • 2/3)', 50000, 0, 30, 0),
('vip2_article3', 'Moule & Filtre Spectrométrique (VIP 2 • 3/3)', 75000, 3000, 30, 200000);`;
                      navigator.clipboard.writeText(sql);
                      if (showToast) showToast('Script SQL copié dans le presse-papier !', 'success');
                    }}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier le SQL</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Sur <strong>supabase.com</strong> ➔ <strong>SQL Editor</strong> ➔ coller et cliquer sur <strong>Run</strong>.
                </p>
              </div>

              {/* Step 2: Form */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-200 block">2. Vos identifiants Supabase</span>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 mb-1 block">
                    Project URL (ex: https://xyzcompany.supabase.co)
                  </label>
                  <input
                    type="url"
                    placeholder="https://votre-projet.supabase.co"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 mb-1 block">
                    API Key (service_role secret ou anon public)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handleConnectSupabase}
                  disabled={supabaseLoading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {supabaseLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Test de connexion en cours...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      <span>Tester & Connecter en Direct</span>
                    </>
                  )}
                </button>

                {supabaseStatus?.connected && (
                  <button
                    onClick={handleDisconnectSupabase}
                    className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs rounded-xl border border-red-500/30 transition-all cursor-pointer"
                  >
                    Déconnecter la base actuelle
                  </button>
                )}

                <button
                  onClick={() => setIsSupabaseModalOpen(false)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
