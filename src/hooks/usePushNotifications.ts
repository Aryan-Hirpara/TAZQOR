"use client";
// src/hooks/usePushNotifications.ts
// Hook to subscribe/unsubscribe this device from Web Push notifications

import { useState, useEffect, useCallback } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getDeviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  return "Browser";
}

export type PushStatus = "unsupported" | "denied" | "subscribed" | "unsubscribed" | "loading";

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    async function checkStatus() {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          setStatus("subscribed");
        } else {
          const perm = Notification.permission;
          setStatus(perm === "denied" ? "denied" : "unsubscribed");
        }
      } catch {
        setStatus("unsubscribed");
      }
    }

    // Register service worker first
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => checkStatus())
      .catch(() => setStatus("unsupported"));
  }, []);

  const subscribe = useCallback(async () => {
    setError(null);
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setError("Notification permission denied. Please enable in browser settings.");
        return false;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
      });

      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          device_label: getDeviceLabel(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to save subscription");
      }

      setStatus("subscribed");
      return true;
    } catch (err: any) {
      setError(err?.message || "Failed to subscribe");
      setStatus("unsubscribed");
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setError(null);
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
      return true;
    } catch (err: any) {
      setError(err?.message || "Failed to unsubscribe");
      setStatus("subscribed");
      return false;
    }
  }, []);

  return { status, error, subscribe, unsubscribe };
}

