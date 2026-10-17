export type User = { id: string; email: string; name: string };

export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
  expenseCount: number;
};

export type Expense = {
  id: string;
  merchant: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note: string | null;
  category: { id: string; name: string; color: string; icon: string };
};

export type ExpensePage = {
  items: Expense[];
  total: number;
  page: number;
  limit: number;
};

export type Summary = {
  month: string;
  total: number;
  previousTotal: number;
  deltaPercent: number | null;
  count: number;
  dailyAverage: number;
  byCategory: {
    categoryId: string;
    name: string;
    color: string;
    icon: string;
    total: number;
    count: number;
    percent: number;
  }[];
  daily: { date: string; total: number }[];
};

export type ExpenseInput = {
  merchant: string;
  amount: number;
  date: string;
  categoryId: string;
  note?: string;
};
