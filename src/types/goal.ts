export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit?: string; // e.g. "books", "hours", "$"
  deadline: string; // YYYY-MM-DD
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}
