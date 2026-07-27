export interface Participant {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  paidBy: string;
  splitBetween: string[];
}

export interface Event {
  id: string;
  title: string;
  date: string;
  participants: Participant[];
  expenses: Expense[];
}
