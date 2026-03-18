import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Use env variables for Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

test.describe('Database Security — Row Level Security (RLS)', () => {
  let supabase: ReturnType<typeof createClient>;

  test.beforeAll(() => {
    // Initialize standard unauthenticated Supabase client
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  });

  test('Unauthenticated user cannot read user_queries', async () => {
    const { data, error } = await supabase.from('user_queries').select('*');
    // We expect an empty array or an error due to RLS
    if (!error) {
      expect(data).toHaveLength(0);
    } else {
      expect(error.message).toContain('row-level security');
    }
  });

  test('Unauthenticated user cannot read agent_memories', async () => {
    const { data, error } = await supabase.from('agent_memories').select('*');
    if (!error) {
      expect(data).toHaveLength(0);
    } else {
      expect(error.message).toContain('row-level security');
    }
  });

  test('Unauthenticated user cannot read chat_sessions', async () => {
    const { data, error } = await supabase.from('chat_sessions').select('*');
    if (!error) {
      expect(data).toHaveLength(0);
    } else {
      expect(error.message).toContain('row-level security');
    }
  });

  // Removed missing messages table test

  test('Unauthenticated user cannot write to agent_memories', async () => {
    const { error } = await supabase.from('agent_memories').insert({
      memory_text: 'malicious memory',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    
    // We expect an error due to RLS preventing unauthenticated inserts
    expect(error).toBeDefined();
    // Sometimes Supabase returns a 401 Unauthorized or RLS violation
    expect(error!.code === '42501' || error!.code === '401' || error!.message.includes('row-level security') || error!.message.includes('permission denied')).toBeTruthy();
  });
});
