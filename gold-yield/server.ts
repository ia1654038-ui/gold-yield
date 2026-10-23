/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  initSupabase,
  dbFindUser,
  dbCreateUser,
  dbUpdateUser,
  dbGetUserInvestments,
  dbAddInvestment,
  dbUpdateInvestment,
  dbGetUserTransactions,
  dbAddTransaction,
  dbFindTransaction,
  dbUpdateTransaction,
  ActiveInvestmentRecord,
  TransactionRecord
} from './server_db';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// Lazy-initialized Gemini AI client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }
  return geminiClient;
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Setup Supabase credentials (with automatic local resilient fallback)
const DEFAULT_SUPABASE_URL = 'https://ifreybansmlibegsfhkj.supabase.co';
const USER_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmcmV5YmFuc21saWJlZ3NmaGtqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQxNzc2NCwiZXhwIjoyMDk4OTkzNzY0fQ.V76X5EpN-nMN3wVq36pr5YaBtmV5LtTu-EFGSN7UwQ8';

const rawUrl = (process.env.SUPABASE_URL && process.env.SUPABASE_URL.includes('supabase.co'))
  ? process.env.SUPABASE_URL
  : DEFAULT_SUPABASE_URL;
const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').trim();

const envServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = (envServiceKey && envServiceKey.startsWith('eyJ'))
  ? envServiceKey
  : USER_SERVICE_ROLE_KEY;

initSupabase(cleanUrl, serviceRoleKey);

// --- API Endpoints ---

// 1. Auth: Register
app.post('/api/auth/register', async (req, res) => {
  const { phone, name, password, inviteCode } = req.body;
  if (!phone || !name || !password) {
    return res.status(400).json({ error: 'Champs requis manquants.' });
  }

  try {
    const existing = await dbFindUser(phone);
    if (existing) {
      return res.status(400).json({ error: 'Ce numéro est déjà enregistré. Veuillez vous connecter.' });
    }

    const newUser = await dbCreateUser({
      phone,
      name,
      password,
      invite_code: inviteCode || 'GOLDYIELD',
      balance: 500
    });

    res.json({
      success: true,
      user: {
        phone: newUser.phone,
        name: newUser.name,
        inviteCode: newUser.invite_code,
        balance: newUser.balance,
        claimableSum: newUser.claimable_sum,
        lastTickTime: newUser.last_tick_time
      }
    });
  } catch (error: any) {
    console.error('[Register Error]:', error?.message || error);
    res.status(400).json({ error: error?.message || 'Erreur lors de l\'inscription.' });
  }
});

// 2. Auth: Login
app.post('/api/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Numéro et mot de passe requis.' });
  }

  try {
    const user = await dbFindUser(phone);
    if (!user) {
      return res.status(404).json({ error: 'Numéro de téléphone non enregistré. Veuillez d’abord créer un compte.' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Mot de passe incorrect. Veuillez réessayer.' });
    }

    const activeInvestments = await dbGetUserInvestments(phone);
    const transactions = await dbGetUserTransactions(phone);

    res.json({
      success: true,
      user: {
        phone: user.phone,
        name: user.name,
        inviteCode: user.invite_code || 'GOLDYIELD',
        balance: Number(user.balance ?? 0),
        claimableSum: Number(user.claimable_sum ?? 0),
        lastTickTime: Number(user.last_tick_time ?? Date.now())
      },
      schemaCacheStale: false,
      activeInvestments,
      transactions
    });
  } catch (error: any) {
    console.error('[Login Error]:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Erreur lors de la connexion.' });
  }
});

// 2.5 Auth: Get profile (used on refresh / auto-login)
app.get('/api/auth/profile', async (req, res) => {
  const { phone } = req.query;
  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ error: 'Phone requis.' });
  }

  try {
    const user = await dbFindUser(phone);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    const activeInvestments = await dbGetUserInvestments(phone);
    const transactions = await dbGetUserTransactions(phone);

    res.json({
      success: true,
      user: {
        phone: user.phone,
        name: user.name,
        inviteCode: user.invite_code || 'GOLDYIELD',
        balance: Number(user.balance ?? 0),
        claimableSum: Number(user.claimable_sum ?? 0),
        lastTickTime: Number(user.last_tick_time ?? Date.now())
      },
      schemaCacheStale: false,
      activeInvestments,
      transactions
    });
  } catch (error: any) {
    console.error('[Profile Error]:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Erreur lors du chargement du profil.' });
  }
});

// 3. User: Sync Tick (claimable yields, balance & VIP state update)
app.post('/api/user/sync-tick', async (req, res) => {
  const { phone, claimableSum, lastTickTime, balance, isVip1Finished, isVip2Finished, tx } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone requis.' });

  try {
    await dbUpdateUser(phone, {
      claimable_sum: claimableSum,
      last_tick_time: lastTickTime,
      balance,
      is_vip1_finished: isVip1Finished,
      is_vip2_finished: isVip2Finished
    });

    if (tx && tx.amount) {
      await dbAddTransaction({
        id: `tx_${Date.now()}_tick`,
        user_phone: phone,
        type: tx.type || (tx.amount >= 0 ? 'collect' : 'investment'),
        amount: Math.abs(tx.amount),
        status: 'completed',
        details: tx.details || 'Tâche / Validation VIP'
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.warn('[Sync Tick Fallback]:', error?.message || error);
    res.json({ success: true, warned: true });
  }
});

// 4. User: Buy/Purchase active investment plan
app.post('/api/user/purchase', async (req, res) => {
  const { phone, planId, planName, price, dailyProfit, durationDays, totalProfit } = req.body;
  if (!phone || !planId) return res.status(400).json({ error: 'Phone et planId requis.' });

  try {
    const user = await dbFindUser(phone);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    const currentBal = Number(user.balance ?? 0);
    if (currentBal < price) {
      return res.status(400).json({ error: 'Solde insuffisant pour activer cet investissement.' });
    }

    const newBalance = currentBal - price;
    await dbUpdateUser(phone, { balance: newBalance });

    const invId = `act_${Date.now()}_${planId}`;
    const newInv: ActiveInvestmentRecord = {
      id: invId,
      user_phone: phone,
      plan_id: planId,
      plan_name: planName,
      price,
      daily_profit: dailyProfit,
      date_activated: new Date().toISOString(),
      last_collected_date: new Date().toISOString(),
      total_collected: 0,
      total_profit: totalProfit,
      duration_days: durationDays
    };
    await dbAddInvestment(newInv);

    const txId = `tx_${Date.now()}_invest`;
    const newTx: TransactionRecord = {
      id: txId,
      user_phone: phone,
      type: 'investment',
      amount: price,
      status: 'completed',
      details: `Activation du ${planName}`
    };
    await dbAddTransaction(newTx);

    res.json({
      success: true,
      balance: newBalance,
      investment: newInv,
      transaction: newTx
    });
  } catch (error: any) {
    console.error('[Purchase Error]:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Erreur lors de l\'activation de l\'investissement.' });
  }
});

// 5. User: Collect accrued yields
app.post('/api/user/collect', async (req, res) => {
  const { phone, collectedAmount, claimableRemaining, updatedInvestments } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone requis.' });

  try {
    const user = await dbFindUser(phone);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    const newBalance = Number(user.balance ?? 0) + Number(collectedAmount);
    await dbUpdateUser(phone, {
      balance: newBalance,
      claimable_sum: claimableRemaining,
      last_tick_time: Date.now()
    });

    const txId = `tx_${Date.now()}_collect`;
    const newTx: TransactionRecord = {
      id: txId,
      user_phone: phone,
      type: 'collect',
      amount: collectedAmount,
      status: 'completed',
      details: 'Collecte de gains journaliers'
    };
    await dbAddTransaction(newTx);

    if (updatedInvestments && Array.isArray(updatedInvestments)) {
      for (const inv of updatedInvestments) {
        await dbUpdateInvestment(inv.id, {
          total_collected: inv.totalCollected,
          last_collected_date: inv.lastCollectedDate
        });
      }
    }

    res.json({
      success: true,
      balance: newBalance,
      claimableSum: claimableRemaining,
      schemaCacheStale: false,
      transaction: newTx
    });
  } catch (error: any) {
    console.error('[Collect Error]:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Erreur lors de la collecte.' });
  }
});

// 6. User: Recharge Dépôt
app.post('/api/user/recharge', async (req, res) => {
  const { phone, amount } = req.body;
  if (!phone || !amount) return res.status(400).json({ error: 'Phone et montant requis.' });

  try {
    const txId = `tx_${Date.now()}_deposit`;
    const tx: TransactionRecord = {
      id: txId,
      user_phone: phone,
      type: 'deposit',
      amount: Number(amount),
      status: 'pending',
      details: 'Dépôt en attente de validation'
    };
    await dbAddTransaction(tx);

    res.json({
      success: true,
      transaction: tx
    });
  } catch (error: any) {
    console.error('[Recharge Error]:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Erreur lors de la recharge.' });
  }
});

// 7. User: Demande de retrait
app.post('/api/user/withdraw', async (req, res) => {
  const { phone, amount, vipLevel } = req.body;
  if (!phone || !amount) return res.status(400).json({ error: 'Phone et montant requis.' });

  const numAmount = Number(amount);

  try {
    const isVip2 = vipLevel === 'VIP 2' || vipLevel === 'vip2';
    const maxLimit = isVip2 ? 3000 : 1000;

    const userWithdrawals = await dbGetUserTransactions(phone);
    const withdrawals = userWithdrawals.filter(tx => tx.type === 'withdrawal');
    const vip1Withdrawals = withdrawals.filter(tx => !tx.details || !tx.details.includes('VIP 2'));
    const vip2Withdrawals = withdrawals.filter(tx => tx.details && tx.details.includes('VIP 2'));

    if (!isVip2) {
      if (vip1Withdrawals.length >= 1) {
        return res.status(400).json({
          error: "Retrait refusé : Après épuisement de votre carte de retrait VIP 1 (1 retrait de 1 000 FCFA déjà effectué), vous devez obligatoirement terminer l'ensemble des étapes et commandes du VIP 2 pour débloquer vos prochains retraits !"
        });
      }
    } else {
      if (vip2Withdrawals.length >= 2) {
        return res.status(400).json({
          error: "Vous avez déjà effectué vos 2 retraits autorisés en VIP 2 (3 000 FCFA chacun). Félicitations pour votre parcours !"
        });
      }
    }

    if (numAmount > maxLimit) {
      return res.status(400).json({
        error: `En ${isVip2 ? 'VIP 2' : 'VIP 1'}, le montant maximal de retrait est de ${maxLimit.toLocaleString('fr-FR')} FCFA par opération.`
      });
    }

    const user = await dbFindUser(phone);
    const currentBalanceVal = user ? Number(user.balance) : numAmount;
    if (currentBalanceVal < numAmount) {
      return res.status(400).json({ error: 'Solde insuffisant pour ce retrait.' });
    }

    const txId = `tx_${Date.now()}_withdrawal`;
    const newTx: TransactionRecord = {
      id: txId,
      user_phone: phone,
      type: 'withdrawal',
      amount: numAmount,
      status: 'pending',
      details: `Retrait ${isVip2 ? 'VIP 2 (Max 3000 F)' : 'VIP 1 (Max 1000 F)'} - En attente`
    };
    await dbAddTransaction(newTx);

    res.json({
      success: true,
      balance: currentBalanceVal,
      transaction: newTx
    });
  } catch (error: any) {
    console.error('[Withdraw Error]:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Erreur lors du retrait.' });
  }
});

// 7.5 AI Voice Synthesis (TTS) for Video Narration
app.post('/api/tts', async (req, res) => {
  const { text, voice } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Texte requis pour la synthèse vocale.' });
  }

  try {
    const ai = getGemini();
    if (!ai) {
      return res.json({ success: false, fallback: true, message: 'Gemini non initialisé.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: text,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice || 'Zephyr'
            }
          }
        }
      }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return res.json({
          success: true,
          audioBase64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'audio/mp3'
        });
      }
    }

    res.json({ success: false, fallback: true });
  } catch (err: any) {
    console.warn('[Gemini TTS API Warn]:', err?.message || err);
    res.json({ success: false, fallback: true, error: err?.message });
  }
});

// 8. GeniusPay: Initiate Payment Session
app.post('/api/geniuspay/initiate', async (req, res) => {
  const { phone, amount, paymentMethod } = req.body;
  if (!phone || !amount) {
    return res.status(400).json({ error: 'Phone et montant requis pour le paiement GeniusPay.' });
  }

  const publicKey = process.env.GENIUSPAY_PUBLIC_KEY || 'GPAY-XETU';
  const secretKey = process.env.GENIUSPAY_SECRET_KEY || 'priv_QnqJCaHKwLXIgoXQLACWkFSIIDY9';

  console.log('[GeniusPay] Initiating payment for phone:', phone, 'Amount:', amount, 'Method:', paymentMethod);

  try {
    const txId = `GPAY_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    await dbAddTransaction({
      id: txId,
      user_phone: phone,
      type: 'deposit',
      amount: Number(amount),
      status: 'pending',
      details: `Dépôt GeniusPay via ${paymentMethod || 'Mobile Money/CB'}`
    });

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const geniusPayPayload = {
      amount: Number(amount),
      currency: 'XOF',
      description: `Recharge de compte Gold Yield (${amount} FCFA)`,
      order_id: txId,
      customer: {
        name: `Client ${phone}`,
        phone: phone,
        email: `${phone.replace(/\+/g, '')}@goldyield.app`
      },
      callback_url: `${appUrl}/api/geniuspay/webhook`,
      return_url: `${appUrl}?payment_status=success&tx=${txId}`,
      success_url: `${appUrl}?payment_status=success&tx=${txId}`
    };

    let checkoutUrl: string | null = null;
    let apiSuccess = false;

    try {
      const endpoints = [
        'https://geniuspay.ci/api/v1/merchant',
        'https://geniuspay.ci/api/v1/merchant/payments',
        'https://geniuspay.ci/api/v1/payments',
        'https://api.geniuspay.com/v1/payments'
      ];

      for (const endpoint of endpoints) {
        if (apiSuccess) break;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Public-Key': publicKey,
              'X-Secret-Key': secretKey,
              'Authorization': `Bearer ${secretKey}`
            },
            body: JSON.stringify(geniusPayPayload),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const responseData: any = await response.json();
            if (responseData && (responseData.checkout_url || responseData.payment_url || responseData.url)) {
              checkoutUrl = responseData.checkout_url || responseData.payment_url || responseData.url;
              apiSuccess = true;
            }
          }
        } catch (_epErr) {
          // Continue to next endpoint or fallback
        }
      }
    } catch (_apiErr) {
      console.log('[GeniusPay] Direct API gateway fallback engaged.');
    }

    if (!checkoutUrl) {
      const numAmount = Number(amount);
      if (numAmount === 75000 || req.body.article === '3/3' || (req.body.articleName && (req.body.articleName.includes('3/3') || req.body.articleName.includes('Moule')))) {
        checkoutUrl = 'https://geniuspay.ci/product/moule-filtre-spectrometrique-PSbX7U';
      } else if (numAmount === 50000 || req.body.article === '2/3' || (req.body.articleName && (req.body.articleName.includes('2/3') || req.body.articleName.includes('Refroidisseur')))) {
        checkoutUrl = 'https://geniuspay.ci/product/refroidisseur-de-creusets-dor-SU8bSn';
      } else if (numAmount === 7800 || numAmount === 25000 || req.body.vipLevel === 'vip2' || req.body.article === '1/3' || (req.body.articleName && req.body.articleName.includes('VIP 2'))) {
        checkoutUrl = 'https://geniuspay.ci/product/vip-2-13-aEUmFo';
      } else if (numAmount === 1800 || numAmount === 2300 || req.body.vipLevel === 'vip1' || (req.body.articleName && req.body.articleName.includes('VIP 1'))) {
        checkoutUrl = 'https://geniuspay.ci/product/article-vip1-HTWkud';
      } else {
        checkoutUrl = process.env.GENIUSPAY_CHECKOUT_URL || (numAmount >= 75000 ? 'https://geniuspay.ci/product/moule-filtre-spectrometrique-PSbX7U' : numAmount >= 50000 ? 'https://geniuspay.ci/product/refroidisseur-de-creusets-dor-SU8bSn' : numAmount >= 7800 ? 'https://geniuspay.ci/product/vip-2-13-aEUmFo' : 'https://geniuspay.ci/product/article-vip1-HTWkud');
      }
    }

    res.json({
      success: true,
      transactionId: txId,
      checkoutUrl: checkoutUrl || null,
      paymentUrl: checkoutUrl || null,
      successUrl: `${appUrl}?payment_status=success&tx=${txId}`,
      publicKey: publicKey,
      amount: Number(amount),
      message: 'Lien de paiement GeniusPay attribué à votre demande avec succès.'
    });

  } catch (error: any) {
    console.error('[GeniusPay Initiate Error]:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l’initialisation de GeniusPay.' });
  }
});

// 8.5 GeniusPay: Register Pending Transaction for Admin Manual Crediting
app.post('/api/geniuspay/confirm', async (req, res) => {
  const { transactionId, phone, amount } = req.body;
  console.log('[GeniusPay Request] Received deposit submission for tx:', transactionId, 'phone:', phone, 'amount:', amount);

  try {
    if (transactionId) {
      await dbAddTransaction({
        id: transactionId,
        user_phone: phone,
        type: 'deposit',
        amount: Number(amount),
        status: 'pending',
        details: 'Dépôt GeniusPay en attente de validation administrateur'
      });
      console.log(`[GeniusPay Request] Registered pending deposit tx ${transactionId} for user ${phone} (${amount} FCFA)`);
    }

    res.json({ success: true, message: 'Demande de rechargement enregistrée. Le solde sera crédité après validation administrateur.' });
  } catch (err: any) {
    console.error('[GeniusPay Request Error]:', err);
    res.status(500).json({ error: err.message || 'Erreur lors de l\'enregistrement de la demande.' });
  }
});

// 9. GeniusPay: Webhook Notification Handler
app.post('/api/geniuspay/webhook', async (req, res) => {
  console.log('[GeniusPay Webhook Payload Received]:', req.body);
  const { order_id, reference, status, amount } = req.body;
  const targetTxId = order_id || reference;

  if (status === 'COMPLETED' || status === 'SUCCESS' || status === 'APPROVED' || status === 'SUCCESSFUL') {
    try {
      if (targetTxId) {
        const tx = await dbFindTransaction(targetTxId);
        if (tx && tx.user_phone && tx.status !== 'completed') {
          await dbUpdateTransaction(targetTxId, { status: 'completed' });

          const user = await dbFindUser(tx.user_phone);
          if (user) {
            const newBal = Number(user.balance || 0) + Number(tx.amount || amount || 0);
            await dbUpdateUser(tx.user_phone, { balance: newBal });
            console.log(`[GeniusPay Webhook] Credited user ${tx.user_phone} with +${tx.amount} FCFA. New Balance: ${newBal}`);
          }
        }
      }
    } catch (err) {
      console.error('[GeniusPay Webhook Error]:', err);
    }
  }

  res.status(200).json({ received: true });
});

// 10. Wave Business Direct API: Create Checkout Session
app.post('/api/wave/create-checkout', async (req, res) => {
  const { amount, phone } = req.body;
  const WAVE_MERCHANT_LINK = 'https://pay.wave.com/m/M_ci_v8OIxJ5nyByL/c/ci/';
  const WAVE_RAW_PHONE = '0504402102';
  const txId = `WAVE_DIR_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  console.log('[Wave Direct Link] Creating transaction record for:', { phone, amount, txId });

  try {
    if (phone && amount) {
      await dbAddTransaction({
        id: txId,
        user_phone: phone,
        type: 'deposit',
        amount: Number(amount),
        status: 'pending',
        details: 'Dépôt direct Lien Marchand Wave'
      });
    }

    res.json({
      success: true,
      transactionId: txId,
      merchantPhone: WAVE_RAW_PHONE,
      waveLaunchUrl: WAVE_MERCHANT_LINK,
      waveWebCheckoutUrl: WAVE_MERCHANT_LINK,
      amount: Number(amount),
      message: 'Lien Marchand Wave prêt'
    });
  } catch (err: any) {
    console.error('[Wave Direct Error]:', err);
    res.status(500).json({ error: err.message || 'Erreur lors du traitement de la transaction Wave.' });
  }
});

// 11. Wave Business Direct API: Webhook Listener
app.post('/api/wave/webhook', async (req, res) => {
  console.log('[Wave Direct Webhook Received]:', JSON.stringify(req.body));
  const body = req.body || {};
  
  const eventType = body.type;
  const data = body.data || body;
  const clientRef = data.client_reference || data.payment_intent || data.id;
  const paymentAmount = data.amount || data.amount_total;

  if (eventType === 'checkout.session.completed' || data.status === 'succeeded' || data.payment_status === 'succeeded') {
    try {
      if (clientRef) {
        const tx = await dbFindTransaction(clientRef);
        if (tx && tx.user_phone && tx.status !== 'completed') {
          await dbUpdateTransaction(clientRef, { status: 'completed' });

          const user = await dbFindUser(tx.user_phone);
          if (user) {
            const newBal = Number(user.balance || 0) + Number(tx.amount || paymentAmount || 0);
            await dbUpdateUser(tx.user_phone, { balance: newBal });
            console.log(`[Wave Direct Webhook] AUTO-CREDITED user ${tx.user_phone} with +${tx.amount} FCFA. New Balance: ${newBal}`);
          }
        }
      }
    } catch (err) {
      console.error('[Wave Direct Webhook Error]:', err);
    }
  }

  res.status(200).json({ received: true });
});

// 12. Admin: Seed / Sync VIP Investment Plans
app.all('/api/admin/seed-plans', async (_req, res) => {
  res.json({ success: true, message: 'Structure VIP 1 & VIP 2 prête.' });
});

// --- Vite Dev Middleware and Production Static Server ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log('[Server] Launching in Development mode with Vite middleware');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log('[Server] Launching in Production mode serving built assets');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Server is running on http://localhost:${PORT}`);
  });
}

startServer();
