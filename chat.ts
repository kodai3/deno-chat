import { v4 } from "https://deno.land/std/uuid/mod.ts";
import {
  isWebSocketCloseEvent,
  WebSocket,
} from "https://deno.land/std/ws/mod.ts";
const users = new Map<string, WebSocket>();

const broadcast = (message: string, senderId?: string) => {
  if (!message) return;
  for (const user of users.values()) {
    user.send(senderId ? `[${senderId}]: ${message}` : message);
  }
};

export const chat = async (ws: WebSocket) => {
  const userId = v4.generate();

  users.set(userId, ws);
  broadcast(`>User with the id ${userId} is connected`);

  for await (const event of ws) {
    const message = typeof event === "string" ? event : "";

    broadcast(message, userId);

    if (!message && isWebSocketCloseEvent(event)) {
      users.delete(userId);
      broadcast(`>User with the id ${userId} is disconnected`);
    }
  }
};
