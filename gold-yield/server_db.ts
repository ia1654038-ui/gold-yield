/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface UserRecord {
  phone: string;
  name: string;
  password: string;
  invite_code: string;
  balance: number;
  claimable_sum: number;
  last_tick_time: number;
  created_at: string;
  is_vip1_finished?: boolean;
  is_vip2_finished?: boolean;
}

export interface ActiveInvestmentRecord {
  id: string;
  user_phone: string;
  plan_id: string;
  plan_name: string;
  price: number;
  daily_profit: number;
  date_activated: string;
  last_collected_date: string;
  total_collected: number;
  total_profit: number;
  duration_days: number;
  created_at?: string;
}

export interface TransactionRecord {
  id: string;
  user_phone: string;
  type: 'deposit' | 'withdrawal' | 'investment' | 'collect';
  amount: number;
  date?: string;
  created_at?: string;
  status: 'pending' | 'completed' | 'failed';
  details?: string;
}

export interface InvestmentPlanRecord {
  id: string;
  name: string;
  price: number;
  daily_profit: number;
  duration_days: number;
  total_profit: number;
  created_at?: string;
}

interface LocalDatabase {
  users: UserRecord[];
  active_investments: ActiveInvestmentRecord[];
  transactions: TransactionRecord[];
  investment_plans: InvestmentPlanRecord[];
}

const DEFAULT_VIP_PLANS: InvestmentPlanRecord[] = [
  { id: 'vip1_machine', name: 'Pack Machine VIP 1', price: 1800, daily_profit: 1000, duration_days: 30, total_profit: 30000 },
  { id: 'vip2_article1', name: 'Broyeur Hydraulique Quartz 24K (VIP 2 • 1/3)', price: 25000, daily_profit: 0, duration_days: 30, total_profit: 0 },
  { id: 'vip2_article2', name: "Refroidisseur de Creusets d'Or (VIP 2 • 2/3)", price: 50000, daily_profit: 0, duration_days: 30, total_profit: 0 },
  { id: 'vip2_article3', name: 'Moule & Filtre Spectrométrique (VIP 2 • 3/3)', price: 75000, daily_profit: 3000, duration_days: 30, total_profit: 200000 }
];

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Memory cache
let inMemoryDb: LocalDatabase | null = null;

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadLocalDb(): LocalDatabase {
  if (inMemoryDb) return inMemoryDb;

  ensureDataDirectory();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      inMemoryDb = {
        users: parsed.users || [],
        active_investments: parsed.active_investments || [],
        transactions: parsed.transactions || [],
        investment_plans: parsed.investment_plans && parsed.investment_plans.length > 0 ? parsed.investment_plans : DEFAULT_VIP_PLANS
      };
      return inMemoryDb;
    } catch (e) {
      console.warn('[LocalDB] Failed reading db.json, creating a fresh one:', e);
    }
  }

  // Initialize fresh DB with default user demo
  const initialDb: LocalDatabase = {
    users: [
      {
        phone: '+2250102030405',
        name: 'Investisseur Test',
        password: 'password',
        invite_code: 'GOLDYIELD',
        balance: 1000,
        claimable_sum: 0,
        last_tick_time: Date.now(),
        created_at: new Date().toISOString()
      }
    ],
    active_investments: [],
    transactions: [],
    investment_plans: DEFAULT_VIP_PLANS
  };

  inMemoryDb = initialDb;
  saveLocalDb();
  return inMemoryDb;
}

function saveLocalDb() {
  if (!inMemoryDb) return;
  try {
    ensureDataDirectory();
    fs.writeFileSync(DB_FILE, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('[LocalDB] Error saving to disk:', err);
  }
}

// Supabase Client and Connectivity State
let supabaseClient: SupabaseClient | null = null;
let isSupabaseHealthy = false;
let lastSupabaseHealthCheck = 0;

export function disconnectSupabase() {
  supabaseClient = null;
  isSupabaseHealthy = false;
  lastSupabaseHealthCheck = 0;
  console.log('[Database System] Supabase disconnected. Using Local Resilient DB.');
}

export function initSupabase(url: string, key: string): boolean {
  try {
    if (url && key && url.includes('supabase.co')) {
      const cleanUrl = url.replace(/\/rest\/v1\/?$/, '').trim();
      supabaseClient = createClient(cleanUrl, key, {
        auth: { persistSession: false },
        global: { fetch: (input, init) => fetch(input, init) }
      });
      isSupabaseHealthy = true;
      lastSupabaseHealthCheck = 0; // Reset throttle
      checkSupabaseHealth(true);
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[Supabase Init Error]:', e);
    return false;
  }
}

export async function checkSupabaseHealth(force: boolean = false): Promise<boolean> {
  const now = Date.now();
  // Throttle health checks to once every 45 seconds if failing unless forced
  if (!force && now - lastSupabaseHealthCheck < 45000 && !isSupabaseHealthy && lastSupabaseHealthCheck > 0) {
    return false;
  }
  lastSupabaseHealthCheck = now;

  if (!supabaseClient) {
    isSupabaseHealthy = false;
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const { error } = await supabaseClient.from('investment_plans').select('id').limit(1).abortSignal(controller.signal);
    clearTimeout(timeout);

    if (error) {
      isSupabaseHealthy = false;
    } else {
      isSupabaseHealthy = true;
    }
  } catch {
    isSupabaseHealthy = false;
  }

  console.log(`[Database System] Storage engine: ${isSupabaseHealthy ? 'Supabase Cloud (Active)' : 'Local Resilient DB (Active - Offline Safe)'}`);
  return isSupabaseHealthy;
}

// Export DB operations with resilient automatic fallback

export async function dbFindUser(phone: string): Promise<UserRecord | null> {
  const db = loadLocalDb();

  // Try Supabase if initialized
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('users').select('*').eq('phone', phone).maybeSingle();
      if (!error && data) {
        // Cache in local db
        const existingIdx = db.users.findIndex(u => u.phone === phone);
        const record: UserRecord = {
          phone: data.phone,
          name: data.name,
          password: data.password,
          invite_code: data.invite_code || 'GOLDYIELD',
          balance: Number(data.balance ?? 0),
          claimable_sum: Number(data.claimable_sum ?? 0),
          last_tick_time: Number(data.last_tick_time ?? Date.now()),
          created_at: data.created_at || new Date().toISOString(),
          is_vip1_finished: data.is_vip1_finished,
          is_vip2_finished: data.is_vip2_finished
        };
        if (existingIdx >= 0) db.users[existingIdx] = record;
        else db.users.push(record);
        saveLocalDb();
        return record;
      }
    } catch (e) {
      console.warn('[dbFindUser Supabase error]:', e);
    }
  }

  // Fallback to local DB
  return db.users.find(u => u.phone === phone) || null;
}

export async function dbCreateUser(userData: {
  phone: string;
  name: string;
  password: string;
  invite_code?: string;
  balance?: number;
}): Promise<UserRecord> {
  const db = loadLocalDb();

  const newUser: UserRecord = {
    phone: userData.phone,
    name: userData.name,
    password: userData.password,
    invite_code: userData.invite_code || 'GOLDYIELD',
    balance: userData.balance !== undefined ? userData.balance : 1000,
    claimable_sum: 0,
    last_tick_time: Date.now(),
    created_at: new Date().toISOString()
  };

  // 1. Direct write to Supabase Cloud
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from('users').upsert({
        phone: newUser.phone,
        name: newUser.name,
        password: newUser.password,
        invite_code: newUser.invite_code,
        balance: newUser.balance,
        claimable_sum: 0,
        last_tick_time: newUser.last_tick_time
      });
      if (error) {
        console.error('[Supabase dbCreateUser Error]:', error.message);
      } else {
        console.log('[Supabase dbCreateUser Success]: Created user', newUser.phone);
      }
    } catch (err) {
      console.warn('[Supabase Sync Warning]: Could not replicate new user to Supabase:', err);
    }
  }

  // 2. Cache in local DB for fallback
  const existingIdx = db.users.findIndex(u => u.phone === userData.phone);
  if (existingIdx >= 0) {
    db.users[existingIdx] = newUser;
  } else {
    db.users.push(newUser);
  }
  saveLocalDb();

  return newUser;
}

export async function dbUpdateUser(phone: string, updates: Partial<UserRecord>): Promise<UserRecord | null> {
  const db = loadLocalDb();
  const user = db.users.find(u => u.phone === phone);
  if (!user) return null;

  Object.assign(user, updates);
  saveLocalDb();

  if (supabaseClient) {
    try {
      const updatePayload: any = {};
      if (updates.balance !== undefined) updatePayload.balance = updates.balance;
      if (updates.claimable_sum !== undefined) updatePayload.claimable_sum = updates.claimable_sum;
      if (updates.last_tick_time !== undefined) updatePayload.last_tick_time = updates.last_tick_time;
      if (updates.is_vip1_finished !== undefined) updatePayload.is_vip1_finished = updates.is_vip1_finished;
      if (updates.is_vip2_finished !== undefined) updatePayload.is_vip2_finished = updates.is_vip2_finished;

      if (Object.keys(updatePayload).length > 0) {
        await supabaseClient.from('users').update(updatePayload).eq('phone', phone);
      }
    } catch {
      // Ignored - local is master
    }
  }

  return user;
}

export async function dbGetUserInvestments(phone: string): Promise<ActiveInvestmentRecord[]> {
  const db = loadLocalDb();

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('active_investments').select('*').eq('user_phone', phone);
      if (!error && data && Array.isArray(data)) {
        return data.map(inv => ({
          id: inv.id,
          user_phone: inv.user_phone,
          plan_id: inv.plan_id,
          plan_name: inv.plan_name,
          price: Number(inv.price),
          daily_profit: Number(inv.daily_profit),
          date_activated: inv.date_activated,
          last_collected_date: inv.last_collected_date,
          total_collected: Number(inv.total_collected || 0),
          total_profit: Number(inv.total_profit || 0),
          duration_days: Number(inv.duration_days || 30)
        }));
      }
    } catch {
      isSupabaseHealthy = false;
    }
  }

  return db.active_investments.filter(i => i.user_phone === phone);
}

export async function dbAddInvestment(inv: ActiveInvestmentRecord): Promise<void> {
  const db = loadLocalDb();
  db.active_investments.push(inv);
  saveLocalDb();

  if (supabaseClient) {
    try {
      await supabaseClient.from('active_investments').insert({
        id: inv.id,
        user_phone: inv.user_phone,
        plan_id: inv.plan_id,
        plan_name: inv.plan_name,
        price: inv.price,
        daily_profit: inv.daily_profit,
        date_activated: inv.date_activated,
        last_collected_date: inv.last_collected_date,
        total_collected: inv.total_collected,
        total_profit: inv.total_profit,
        duration_days: inv.duration_days
      });
    } catch (e) {
      console.warn('[Supabase Sync Warning]: Could not replicate investment:', e);
    }
  }
}

export async function dbUpdateInvestment(id: string, updates: Partial<ActiveInvestmentRecord>): Promise<void> {
  const db = loadLocalDb();
  const inv = db.active_investments.find(i => i.id === id);
  if (inv) {
    Object.assign(inv, updates);
    saveLocalDb();
  }

  if (supabaseClient) {
    try {
      await supabaseClient.from('active_investments').update({
        total_collected: updates.total_collected,
        last_collected_date: updates.last_collected_date
      }).eq('id', id);
    } catch {
      // Ignored
    }
  }
}

export async function dbGetUserTransactions(phone: string): Promise<TransactionRecord[]> {
  const db = loadLocalDb();

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('transactions').select('*').eq('user_phone', phone).order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data)) {
        return data.map(tx => ({
          id: tx.id,
          user_phone: tx.user_phone,
          type: tx.type,
          amount: Number(tx.amount),
          date: tx.created_at || tx.date,
          created_at: tx.created_at,
          status: tx.status,
          details: tx.details
        }));
      }
    } catch {
      isSupabaseHealthy = false;
    }
  }

  return db.transactions
    .filter(t => t.user_phone === phone)
    .sort((a, b) => new Date(b.created_at || b.date || 0).getTime() - new Date(a.created_at || a.date || 0).getTime());
}

export async function dbAddTransaction(tx: TransactionRecord): Promise<void> {
  const db = loadLocalDb();
  const fullTx: TransactionRecord = {
    ...tx,
    created_at: tx.created_at || new Date().toISOString(),
    date: tx.date || new Date().toISOString()
  };
  db.transactions.unshift(fullTx);
  saveLocalDb();

  if (supabaseClient) {
    try {
      await supabaseClient.from('transactions').insert({
        id: fullTx.id,
        user_phone: fullTx.user_phone,
        type: fullTx.type,
        amount: fullTx.amount,
        status: fullTx.status,
        details: fullTx.details
      });
    } catch (e) {
      console.warn('[Supabase Sync Warning]: Could not replicate transaction:', e);
    }
  }
}

export async function dbFindTransaction(id: string): Promise<TransactionRecord | null> {
  const db = loadLocalDb();
  return db.transactions.find(t => t.id === id) || null;
}

export async function dbUpdateTransaction(id: string, updates: Partial<TransactionRecord>): Promise<void> {
  const db = loadLocalDb();
  const tx = db.transactions.find(t => t.id === id);
  if (tx) {
    Object.assign(tx, updates);
    saveLocalDb();
  }

  if (supabaseClient) {
    try {
      await supabaseClient.from('transactions').update({
        status: updates.status,
        details: updates.details
      }).eq('id', id);
    } catch {
      // Ignored
    }
  }
}
