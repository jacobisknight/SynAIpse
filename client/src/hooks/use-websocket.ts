import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    function connect() {
      // WebSocket connection referenced from javascript_websocket blueprint
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect...");
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Invalidate relevant queries based on message type
          switch (message.type) {
            case "agent_created":
            case "agent_updated":
            case "agent_deleted":
            case "subagents_created":
              queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
              queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
              queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
              break;
            
            case "task_created":
            case "task_updated":
            case "task_completed":
              queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
              queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
              queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
              break;
            
            case "integration_created":
            case "integration_updated":
              queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
              queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
              break;
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient]);

  return { isConnected };
}
