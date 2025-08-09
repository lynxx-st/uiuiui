import supabase from './supabaseClient';
import { cacheGet, cacheSet, queueAdd, queueGetAll, queueClear } from './offline';
import type { Expense, Category } from './types';

// Cache keys
const KEY_EXPENSES = 'expenses';
const KEY_CATEGORIES = 'categories';

function uuid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({ provider: 'google' });
}

export async function signOut() {
  return supabase.auth.signOut();
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// Categories
export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    await cacheSet(KEY_CATEGORIES, data || []);
    return (data || []) as Category[];
  } catch (e) {
    const cached = await cacheGet<Category[]>(KEY_CATEGORIES);
    return cached || [];
  }
}

export async function upsertCategory(input: Partial<Category> & { name: string }): Promise<void> {
  try {
    const ownerId = (input.owner_id as string) || (await getUserId());
    const payload = { ...input, owner_id: ownerId };
    const { error } = await supabase.from('categories').upsert(payload);
    if (error) throw error;
    await fetchCategories();
  } catch (e) {
    await queueAdd({ id: uuid(), table: 'categories', op: 'insert', payload: input as any, createdAt: Date.now() });
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    await fetchCategories();
  } catch (e) {
    await queueAdd({ id: uuid(), table: 'categories', op: 'delete', payload: { id } as any, createdAt: Date.now() });
  }
}

// Expenses
export async function fetchExpenses(monthIso?: string): Promise<Expense[]> {
  try {
    let query = supabase.from('expenses').select('*').order('occurred_on', { ascending: false });
    if (monthIso) {
      const start = new Date(monthIso);
      const end = new Date(start);
      end.setMonth(start.getMonth() + 1);
      query = query.gte('occurred_on', start.toISOString()).lt('occurred_on', end.toISOString());
    }
    const { data, error } = await query;
    if (error) throw error;
    await cacheSet(KEY_EXPENSES, data || []);
    return (data || []) as Expense[];
  } catch (e) {
    const cached = await cacheGet<Expense[]>(KEY_EXPENSES);
    return cached || [];
  }
}

export async function upsertExpense(input: Partial<Expense> & { title: string; amount: number; occurred_on: string }): Promise<void> {
  try {
    const ownerId = (input.owner_id as string) || (await getUserId());
    const payload = { currency: 'USD', ...input, owner_id: ownerId };
    const { error } = await supabase.from('expenses').upsert(payload);
    if (error) throw error;
    await fetchExpenses();
  } catch (e) {
    await queueAdd({ id: uuid(), table: 'expenses', op: 'insert', payload: input as any, createdAt: Date.now() });
  }
}

export async function deleteExpense(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
    await fetchExpenses();
  } catch (e) {
    await queueAdd({ id: uuid(), table: 'expenses', op: 'delete', payload: { id } as any, createdAt: Date.now() });
  }
}

// Sync queued operations when back online
export async function trySyncQueue(): Promise<void> {
  const items = await queueGetAll<any>();
  if (!items.length) return;
  const userId = await getUserId();
  for (const item of items) {
    try {
      if (item.table === 'expenses') {
        if (item.op === 'insert' || item.op === 'update') {
          const payload = { owner_id: userId, currency: 'USD', ...item.payload };
          const { error } = await supabase.from('expenses').upsert(payload);
          if (error) throw error;
        } else if (item.op === 'delete') {
          const { error } = await supabase.from('expenses').delete().eq('id', (item.payload as any).id);
          if (error) throw error;
        }
      } else if (item.table === 'categories') {
        if (item.op === 'insert' || item.op === 'update') {
          const payload = { owner_id: userId, ...item.payload };
          const { error } = await supabase.from('categories').upsert(payload);
          if (error) throw error;
        } else if (item.op === 'delete') {
          const { error } = await supabase.from('categories').delete().eq('id', (item.payload as any).id);
          if (error) throw error;
        }
      }
    } catch (err) {
      // stop on first error to retry later
      return;
    }
  }
  await queueClear();
}

// Storage
export async function uploadReceipt(file: File): Promise<string> {
  const userId = await getUserId();
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID?.() || Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `${userId || 'anonymous'}/${fileName}`;
  const { error } = await supabase.storage.from('receipts').upload(filePath, file, { upsert: false });
  if (error) throw error;
  return filePath; // store storage path; backend can serve via signed URLs
}


