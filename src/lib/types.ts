export type Category = {
  id: string;
  name: string;
  color?: string | null;
  owner_id: string;
  created_at: string;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category_id: string | null;
  occurred_on: string; // ISO date
  notes?: string | null;
  images?: string[] | null; // storage public urls
  owner_id: string;
  created_at: string;
};


