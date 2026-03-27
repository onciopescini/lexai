'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import PremiumEcosystemWrapper from '@/components/premium/PremiumEcosystemWrapper';
import FirmDashboard from '@/components/firm/FirmDashboard';

export default function FirmPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: { user: User | null } | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A84C]/30 border-t-[#C9A84C] animate-spin" />
      </div>
    );
  }

  return (
    <PremiumEcosystemWrapper>
      {user ? (
        <FirmDashboard user={user} />
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <p className="text-slate-500">Effettua il login per accedere allo Studio Legale.</p>
        </div>
      )}
    </PremiumEcosystemWrapper>
  );
}
