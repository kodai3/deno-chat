import { delay } from "https://deno.land/std/async/delay.ts";
import { BufReader } from "https://deno.land/std/io/bufio.ts";
import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { TextProtoReader } from "https://deno.land/std/textproto/mod.ts";
import { connectWebSocket, WebSocket } from "https://deno.land/std/ws/mod.ts";

const { test } = Deno;

async function startServer(): Promise<Deno.Process> {
  const server = Deno.run({
    // TODO(lucacasonato): remove unstable once possible
    cmd: [
      Deno.execPath(),
      "run",
      "--allow-net",
      "--allow-read",
      "--unstable",
      "server.ts",
    ],
    cwd: "examples/chat",
    stdout: "piped",
  });
  try {
    assert(server.stdout != null);
    const r = new TextProtoReader(new BufReader(server.stdout));
    const s = await r.readLine();
    assert(s !== null && s.includes("chat server starting"));
  } catch (err) {
    server.stdout!.close();
    server.close();
  }

  return server;
}

test({
  name: "[examples/chat] GET / should serve html",
  fn: async () => {
    const server = await startServer();
    try {
      const resp = await fetch("http://127.0.0.1:8080/");
      assertEquals(resp.status, 200);
      assertEquals(resp.headers.get("content-type"), "text/html");
    } finally {
      server.close();
      server.stdout!.close();
    }
    await delay(10);
  },
});

test({
  name: "[example/chat] GET /ws should upgrade conn to ws",
  fn: async () => {
    const server = await startServer();
    let ws: WebSocket | undefined;

    try {
      ws = await connectWebSocket("http://127.0.0.1:8080/ws");
      const it = ws[Symbol.asyncIterator]();

      assertEquals((await it.next()).value, "Connected: [1]");
      ws?.send("Hello");
      assertEquals((await it.next()).value, "[1]: Hello");
    } finally {
      server.close();
      server.stdout!.close();
      ws!.conn.close();
    }
  },
});
