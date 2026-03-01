"use client";

import { useSocketStatus, type SocketStatus } from "@/lib/socket";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

const statusConfig: Record<SocketStatus, { color: string; label: string }> = {
  connected: { color: "bg-green-500", label: "Verbunden" },
  disconnected: { color: "bg-red-500", label: "Getrennt" },
  reconnecting: { color: "bg-amber-500 animate-pulse", label: "Verbinde..." },
};

export function ConnectionStatus() {
  const status = useSocketStatus();
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
        status === "connected"
          ? "text-green-700 dark:text-green-400"
          : status === "reconnecting"
            ? "text-amber-700 dark:text-amber-400"
            : "text-red-700 dark:text-red-400"
      )}
      title={`WebSocket: ${config.label}`}
    >
      {status === "connected" ? (
        <Wifi className="size-3.5" />
      ) : (
        <WifiOff className="size-3.5" />
      )}
      <span className={cn("size-2 rounded-full", config.color)} />
    </div>
  );
}
