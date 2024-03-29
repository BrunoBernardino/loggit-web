export type EncryptedData = string;

export interface KeyPair {
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
}

export interface User {
  id: string;
  email: string;
  encrypted_key_pair: EncryptedData;
  subscription: {
    external: {
      paypal?: {
        user_id: string;
        subscription_id: string;
      };
      stripe?: {
        user_id: string;
        subscription_id: string;
      };
    };
    isMonthly?: boolean;
    expires_at: string;
    updated_at: string;
  };
  status: 'trial' | 'active' | 'inactive';
  extra: {
    show_current_month_stats_in_top_stats?: boolean;
  };
  created_at: Date;
}

export interface UserSession {
  id: string;
  user_id: string;
  expires_at: Date;
  verified: boolean;
  last_seen_at: Date;
  created_at: Date;
}

export interface VerificationCode {
  id: string;
  user_id: string;
  code: string;
  verification: {
    type: 'session' | 'user-update' | 'data-delete' | 'user-delete';
    id: string;
  };
  expires_at: Date;
  created_at: Date;
}

export interface Event {
  id: string;
  user_id: User['id'];
  name: EncryptedData;
  date: string;
  extra: Record<never, never>; // NOTE: Here for potential future fields
}
