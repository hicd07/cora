"use client";

import React, { useEffect, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { HardHat } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        setLoading(false);
      }
      if (event === 'SIGNED_IN' && session) {
        navigate('/');
      }
      if (event === 'SIGNED_OUT') {
        setLoading(false);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20">
            <HardHat className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">ConstruBid</h1>
            <p className="text-sm text-slate-500 mt-1">B2B Marketplace de Construcción • SDE</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#f59e0b',
                    brandAccent: '#d97706',
                  },
                },
              },
            }}
            theme="light"
            socialLayout="horizontal"
          />
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-800 mb-2">Credenciales de prueba:</p>
          <div className="space-y-1 text-[11px] text-amber-700">
            <p><strong>Ingeniero:</strong> ingeniero@test.com / password123</p>
            <p><strong>Ferretería 1:</strong> ferreteria1@test.com / password123</p>
            <p><strong>Ferretería 2:</strong> ferreteria2@test.com / password123</p>
            <p><strong>Ferretería 3:</strong> ferreteria3@test.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;