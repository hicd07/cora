import React, { useState } from "react";
import { useSessionContext } from "@/components/auth/SessionContext";
import { WelcomeCarousel } from "@/components/auth/WelcomeCarousel";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { ProfileOnboarding } from "@/components/auth/ProfileOnboarding";
import { Navigate } from "react-router-dom";

const Auth: React.FC = () => {
  const { session, profile, loading: sessionLoading, isAdmin } = useSessionContext();
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  if (sessionLoading) {
    return null;
  }

  // Si ya está logueado y es admin, o ya completó el onboarding, ir al inicio
  if (session && (isAdmin || profile?.onboarded)) {
    return <Navigate to="/" replace />;
  }

  const needsOnboarding = Boolean(session && profile && !profile.onboarded && !isAdmin);

  if (needsOnboarding) {
    return <ProfileOnboarding />;
  }

  const openLogin = () => {
    setAuthMode("login");
    setIsAuthSheetOpen(true);
  };

  const openSignup = () => {
    setAuthMode("signup");
    setIsAuthSheetOpen(true);
  };

  return (
    <>
      <WelcomeCarousel onLogin={openLogin} onSignup={openSignup} />
      <AuthSheet 
        open={isAuthSheetOpen} 
        onOpenChange={setIsAuthSheetOpen} 
        initialMode={authMode} 
      />
    </>
  );
};

export default Auth;