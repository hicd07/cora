import React, { useState, useEffect } from 'react';
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
        sector: userType === 'hardware' ? 'Alma Rosa I' : undefined,
        delivery_coverage: userType === 'hardware' ? ['Alma Rosa I', 'Alma Rosa II'] : undefined,
        is_public: userType === 'hardware' ? true : undefined,
        rating: userType === 'hardware' ? 5.0 : undefined,
        reviews_count: userType === 'hardware' ? 0 : undefined,
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
    <div className="min-h-screen bg-slate-50 flex justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in duration-300">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-8 text-white text-center relative">
          <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
            SDE • B2B
          </div>
          <div className="bg-white text-amber-600 p-3 rounded-2xl inline-flex items-center justify-center shadow-lg mb-4">
            <HardHat className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">ConstruBid</h1>
          <p className="text-xs text-amber-100 mt-1 font-medium">
            El mercado de subastas de construcción de Santo Domingo Este
          </p>
        </div>

        <div className="p-6 flex-1">
          {!isOnboarding ? (
            <form onSubmit={handleAuth} className="space-y-5">
              <div className="text-center mb-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {isSignUp ? 'Crear una Cuenta' : 'Iniciar Sesión'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {isSignUp
                    ? 'Únete a la red de ingenieros y ferreterías de SDE'
                    : 'Ingresa tus credenciales para acceder a la plataforma'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Correo Electrónico</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Contraseña</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl shadow-md shadow-amber-500/10 transition-all flex items-center justify-center gap-2 min-h-[48px]"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : isSignUp ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Registrarse
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Ingresar
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  {isSignUp
                    ? '¿Ya tienes una cuenta? Inicia Sesión'
                    : '¿No tienes cuenta? Regístrate aquí'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOnboardingSubmit} className="space-y-5">
              <div className="text-center mb-2">
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Paso 2: Configuración
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-2">Completa tu Perfil</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Necesitamos estos datos para validar tu cuenta en la República Dominicana
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Nombre Completo o Razón Social</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Ing. Juan Pérez / Ferretería El Sol"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">RNC o Cédula de Identidad</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <FileText className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 131-XXXXX-X o 402-XXXXXXX-X"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">¿Cómo usarás ConstruBid?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType('engineer')}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[110px] relative ${
                      userType === 'engineer'
                        ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className={`p-2 rounded-xl ${userType === 'engineer' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <HardHat className="w-5 h-5" />
                      </div>
                      {userType === 'engineer' && (
                        <span className="bg-amber-500 text-white p-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Soy Ingeniero</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">Quiero cotizar y comprar materiales</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserType('hardware')}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[110px] relative ${
                      userType === 'hardware'
                        ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className={`p-2 rounded-xl ${userType === 'hardware' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Store className="w-5 h-5" />
                      </div>
                      {userType === 'hardware' && (
                        <span className="bg-amber-500 text-white p-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Soy Ferretería</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">Quiero vender y enviar cotizaciones</p>
                    </div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !userType}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold rounded-xl shadow-md shadow-amber-500/10 transition-all flex items-center justify-center gap-2 min-h-[48px]"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    Completar Registro
                    <ArrowRight className="w-4 h-4" />
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