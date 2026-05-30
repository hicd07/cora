import React, { useState, useEffect } from "react";
import { useSessionContext } from "@/components/auth/SessionContext";
import { WelcomeCarousel } from "@/components/auth/WelcomeCarousel";
import { AuthSheet, AuthMode } from "@/components/auth/AuthSheet";
import { ProfileOnboarding } from "@/components/auth/ProfileOnboarding";

const Auth: React.FC = () => {
  const { session, profile, loading: sessionLoading } = useSessionContext();
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("type") === "recovery") {
      setAuthMode("reset_password" as any);
      setIsAuthSheetOpen(true);
    }
  }, []);

  if (sessionLoading) {
    return null; // Handled by FullScreenLoader in App.tsx
  }

  const needsOnboarding = Boolean(session && profile && !profile.onboarded);

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
