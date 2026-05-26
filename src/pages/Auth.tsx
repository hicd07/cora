import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSessionContext } from '@/components/auth/SessionContext';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { HardHat, Store, Mail, Lock, User, FileText, ArrowRight, LogIn, UserPlus, Check } from 'lucide-react';

export const Auth: React.FC = () => {
  const { session, profile, refreshProfile, updateProfile, loading: sessionLoading } = useSessionContext();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [fullName, setFullName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [userType, setUserType] = useState<'engineer' | 'hardware' | null>(null);

  useEffect(() => {
    if (sessionLoading) return;

    if (session && profile) {
      if (profile.onboarded) {
        navigate('/', { replace: true });
      } else {
        setIsOnboarding(true);
      }
    }
  }, [session, profile, sessionLoading, navigate]);

  useEffect(() => {
    if (profile && !profile.onboarded) {
      setFullName(profile.full_name || profile.store_name || '');
      setDocumentId(profile.document_id || '');
      setUserType(profile.user_type || null);
    }
  }, [profile]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    const toastId = showLoading(isSignUp ? 'Creando cuenta...' : 'Iniciando sesión...');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        dismissToast(toastId);

        if (error) {
          showError(error.message);
          return;
        }

        if (data.user) {
          showSuccess('¡Cuenta creada con éxito! Completemos tu perfil.');
          setIsOnboarding(true);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        dismissToast(toastId);

        if (error) {
          showError(error.message);
          return;
        }

        showSuccess('¡Bienvenido de vuelta!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !documentId || !userType) {
      showError('Por favor, completa todos los campos de registro.');
      return;
    }

    setLoading(true);
    const toastId = showLoading('Guardando tu perfil...');

    try {
      const user = (await supabase.auth.getUser()).data.user;

      if (!user) {
        throw new Error('No se encontró un usuario activo.');
      }

      await updateProfile({
        id: user.id,
        full_name: fullName,
        document_id: documentId,
        user_type: userType,
        onboarded: true,
        store_name: userType === 'hardware' ? fullName : null,
        sector: userType === 'hardware' ? 'Alma Rosa I' : null,
        delivery_coverage: userType === 'hardware' ? ['Alma Rosa I', 'Alma Rosa II'] : [],
        is_public: userType === 'hardware',
        rating: userType === 'hardware' ? 5.0 : 0,
        reviews_count: 0,
      });

      await refreshProfile();
      dismissToast(toastId);
      showSuccess('¡Perfil configurado con éxito!');
      navigate('/', { replace: true });
    } catch (err: any) {
      dismissToast(toastId);
      showError(err.message || 'Error al guardar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
        <div className="bg-amber-500 p-8 text-center text-white">
          <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-2xl bg-white p-3 text-amber-600 shadow-lg">
            <HardHat className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">ConstruBid</h1>
          <p className="mt-1 text-xs font-medium text-amber-100">
            El mercado de subastas de construcción de Santo Domingo Este
          </p>
        </div>

        <div className="p-6">
          {!isOnboarding ? (
            <form onSubmit={handleAuth} className="space-y-5">
              <div className="text-center">
                <h2 className="text-lg font-bold text-slate-900">
                  {isSignUp ? 'Crear una Cuenta' : 'Iniciar Sesión'}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {isSignUp
                    ? 'Únete a la red de ingenieros y ferreterías de SDE'
                    : 'Ingresa tus credenciales para acceder a la plataforma'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Correo Electrónico</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Contraseña</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-white shadow-md shadow-amber-500/10 transition-all hover:bg-amber-600 disabled:opacity-70"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : isSignUp ? (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Registrarse
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Ingresar
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs font-bold text-amber-600 transition-colors hover:text-amber-700"
                >
                  {isSignUp
                    ? '¿Ya tienes una cuenta? Inicia Sesión'
                    : '¿No tienes cuenta? Regístrate aquí'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOnboardingSubmit} className="space-y-5">
              <div className="text-center">
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Paso 2: Configuración
                </span>
                <h2 className="mt-2 text-lg font-bold text-slate-900">Completa tu Perfil</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Necesitamos estos datos para validar tu cuenta en la República Dominicana
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Nombre Completo o Razón Social</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Ing. Juan Pérez / Ferretería El Sol"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">RNC o Cédula de Identidad</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <FileText className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 131-XXXXX-X o 402-XXXXXXX-X"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">¿Cómo usarás ConstruBid?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType('engineer')}
                    className={`relative flex min-h-[110px] flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                      userType === 'engineer'
                        ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex w-full items-start justify-between">
                      <div className={`rounded-xl p-2 ${userType === 'engineer' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <HardHat className="h-5 w-5" />
                      </div>
                      {userType === 'engineer' && (
                        <span className="rounded-full bg-amber-500 p-0.5 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Soy Ingeniero</p>
                      <p className="mt-0.5 text-[9px] text-slate-500">Quiero cotizar y comprar materiales</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserType('hardware')}
                    className={`relative flex min-h-[110px] flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                      userType === 'hardware'
                        ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex w-full items-start justify-between">
                      <div className={`rounded-xl p-2 ${userType === 'hardware' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Store className="h-5 w-5" />
                      </div>
                      {userType === 'hardware' && (
                        <span className="rounded-full bg-amber-500 p-0.5 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Soy Ferretería</p>
                      <p className="mt-0.5 text-[9px] text-slate-500">Quiero vender y enviar cotizaciones</p>
                    </div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !userType}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-white shadow-md shadow-amber-500/10 transition-all hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    Completar Registro
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
