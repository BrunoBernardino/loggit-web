export interface PlainObject {
  [key: string]: any;
}

export type Theme = 'dark' | 'light';

export interface AuthToken {
  theme?: Theme;
}

export interface EventContent {
  name: string;
  date: string;
}

export interface Event extends EventContent {
  id: string;
}

export interface PanelProps {
  monthInView: string;
  events: Event[];
  reloadData: () => Promise<void>;
}
