"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getSocket, disconnectSocket, subscribeNotifications } from "@/lib/socket";
import { fetchUnreadNotificationCount } from "@/lib/projects-issues-api";
import { isNestBackendConfigured } from "@/lib/aggregate-my-dashboard";
import { getAccessToken } from "@/lib/auth-tokens";

interface WebSocketContextValue {
  connected: boolean;
  reconnecting: boolean;
  unreadCount: number;
  incrementUnread: () => void;
  resetUnread: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  connected: false,
  reconnecting: false,
  unreadCount: 0,
  incrementUnread: () => undefined,
  resetUnread: () => undefined,
});

export function useWebSocket(): WebSocketContextValue {
  return useContext(WebSocketContext);
}

interface NotificationPayload {
  title?: string;
  message?: string;
  body?: string;
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const unsubRef = useRef<(() => void) | void>(undefined);

  const incrementUnread = useCallback(() => setUnreadCount((n) => n + 1), []);
  const resetUnread = useCallback(() => setUnreadCount(0), []);

  // Fetch initial unread count once
  useEffect(() => {
    if (!isNestBackendConfigured() || !getAccessToken()) return;
    void fetchUnreadNotificationCount()
      .then((n) => setUnreadCount(n))
      .catch(() => undefined);
  }, []);

  // Set up socket listeners
  useEffect(() => {
    if (!isNestBackendConfigured() || !getAccessToken()) return;

    const s = getSocket();
    if (!s) return;

    function onConnect() {
      setConnected(true);
      setReconnecting(false);
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onReconnectAttempt() {
      setReconnecting(true);
    }
    function onReconnect() {
      setConnected(true);
      setReconnecting(false);
    }
    function onReconnectError() {
      setReconnecting(true);
    }

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("reconnect_attempt", onReconnectAttempt);
    s.on("reconnect", onReconnect);
    s.on("reconnect_error", onReconnectError);

    if (s.connected) setConnected(true);

    // Subscribe to notifications
    unsubRef.current = subscribeNotifications((raw) => {
      const data = raw as NotificationPayload;
      const title = data?.title ?? "Thông báo mới";
      const description = data?.message ?? data?.body;
      toast(title, { description });
      incrementUnread();
    });

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("reconnect_attempt", onReconnectAttempt);
      s.off("reconnect", onReconnect);
      s.off("reconnect_error", onReconnectError);
      if (typeof unsubRef.current === "function") {
        unsubRef.current();
        unsubRef.current = undefined;
      }
    };
  }, [incrementUnread]);

  // Disconnect socket when the dashboard is unmounted
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ connected, reconnecting, unreadCount, incrementUnread, resetUnread }}>
      {children}
    </WebSocketContext.Provider>
  );
}
