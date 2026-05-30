import { useEffect } from "react";
import { useSessionContext } from "@/components/auth/SessionContext";
import { supabase } from "@/integrations/supabase/client";

// Public VAPID key (in a real app, this should be an env variable)
// You generate this with a tool like web-push: npx web-push generate-vapid-keys
const PUBLIC_VAPID_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushSubscription = () => {
  const { session } = useSessionContext();

  useEffect(() => {
    if (!session) return;

    const subscribeToPush = async () => {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          return; // Push not supported
        }

        const registration = await navigator.serviceWorker.ready;
        
        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          // Subscribe
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
          });
        }

        // Save subscription to DB
        const subData = JSON.parse(JSON.stringify(subscription));
        
        await supabase.from("push_subscriptions").upsert({
          user_id: session.user.id,
          endpoint: subData.endpoint,
          keys: subData.keys,
        }, { onConflict: 'user_id, endpoint' });
        
      } catch (error) {
        console.error("Failed to subscribe to push notifications", error);
      }
    };

    // Ask for permission if not granted
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          subscribeToPush();
        }
      });
    } else if (Notification.permission === "granted") {
      subscribeToPush();
    }
  }, [session]);
};
