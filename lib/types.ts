import { RxDatabase } from 'rxdb';

export interface PlainObject {
  [key: string]: any;
}

export type Theme = 'dark' | 'light';

export interface AuthToken {
  syncToken: string;
  theme?: Theme;
}

export type Event = {
  id: string;
  name: string;
  date: string;
  _rev?: string;
};

export interface PanelProps {
  monthInView: string;
  events: Event[];
  reloadData: () => Promise<void>;
  db: RxDatabase;
}

// API
export interface ApiLoginRequest {
  syncToken: string;
}
export interface ApiLoginResponse {
  sessionCookieValue?: string;
  code?: number;
  message?: string;
}
