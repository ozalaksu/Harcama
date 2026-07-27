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

export interface EventRecord {
  id: string;
  title: string;
  date: string;
  participants: Participant[];
  expenses: Expense[];
}

export interface SessionRecord {
  sessionToken: string;
  isActive: boolean;
  expiresAt: string;
}

export interface EventInput {
  title: string;
  date?: string;
  participants?: Participant[];
  expenses?: Expense[];
}

export interface EventStore {
  createSession(session: SessionRecord): Promise<void>;
  getSession(sessionToken: string): Promise<SessionRecord | null>;
  deactivateSession(sessionToken: string): Promise<void>;
  listEvents(): Promise<EventRecord[]>;
  createEvent(input: EventInput): Promise<EventRecord>;
  updateEvent(eventId: string, event: EventRecord): Promise<EventRecord | null>;
  deleteEvent(eventId: string): Promise<boolean>;
}
