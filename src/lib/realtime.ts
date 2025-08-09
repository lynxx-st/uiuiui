import supabase from './supabaseClient';
import type { Expense, Category } from './types';

export type RealtimeCallbacks = {
  onExpenseChange?: (payload: Expense) => void;
  onCategoryChange?: (payload: Category) => void;
};

export function subscribeRealtime(cb: RealtimeCallbacks) {
  const channel = supabase.channel('public-changes');

  channel
    .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
      cb.onExpenseChange?.(payload.new as Expense);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
      cb.onCategoryChange?.(payload.new as Category);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}


