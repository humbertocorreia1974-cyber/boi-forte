'use client';

import { signIn, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function AuthJwtClient({
  googleEnabled,
  autenticado,
}: {
  googleEnabled: boolean;
  autenticado: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function entrarGoogle() {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/auth-jwt' });
    } finally {
      setLoading(false);
    }
  }

  async function sair() {
    setLoading(true);
    try {
      await signOut({ callbackUrl: '/auth-jwt' });
    } finally {
      setLoading(false);
    }
  }

  if (autenticado) {
    return (
      <Button variant="secondary" onClick={sair} disabled={loading}>
        {loading ? 'Saindo…' : 'Encerrar sessão'}
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      onClick={entrarGoogle}
      disabled={!googleEnabled || loading}
      title={googleEnabled ? 'Entrar com Google' : 'Google OAuth não configurado'}
    >
      {loading ? 'Redirecionando…' : 'Entrar com Google'}
    </Button>
  );
}
