import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.REACT_APP_SUPABASE_URL || 'https://nsostjcskmszdunoxidd.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zb3N0amNza21zemR1bm94aWRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MTk5MzIsImV4cCI6MjA3MDI5NTkzMn0.0PWGBtKZUY9z86OiER_PEqbdVrRbpCvpbdBJ4W13B_I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-client-info': 'horizon-expense-tracker',
    },
  },
});

export default supabase;


