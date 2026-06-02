import React, { useState } from "react";
import { useSessionContext } from "@/components/auth/SessionContext";
import { WelcomeCarousel } from "@/components/auth/WelcomeCarousel";
import { AuthSheet } from "@/components/auth/AuthSheet";
import { ProfileOnboarding } from "@/components/auth/ProfileOnboarding";

const Auth: React.FC = () => {
  const { session, profile, loading: sessionLoading } = useSessionContext();
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login"); // Corrección TS2322

  if (sessionLoading) {
    return null;
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