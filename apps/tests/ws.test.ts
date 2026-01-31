import { describe, it, expect } from "bun:test";
import { WebSocket as WSClient } from "ws";

const URL = "ws://localhost:8000";

const connect = (): Promise<WSClient> => {
  return new Promise((resolve, reject) => {
    const ws = new WSClient(URL);
    ws.on("open", () => resolve(ws));
    ws.on("error", reject);
  });
};

const send = (ws: WSClient, message: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timeout waiting for response!"));
    }, 30000);

    ws.once("message", (data) => {
      clearTimeout(timeout);
      try {
        const response = JSON.parse(data.toString());
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });

    ws.send(JSON.stringify(message));
  });
};

describe("WS Server E2E", () => {
    describe("Connection", () => {
        it("should connect to WebSocket server at port 8000", async () => {
          const ws = await connect();
          expect(ws.readyState).toBe(WSClient.OPEN);
          ws.close();
        });
    });

    describe("Create Todo", () => {
        const valid = {
            message: "Order Groceries from Blinkit tomorrow at 5pm",
            apiKey: process.env.GEMINI_API_KEY,
            model: "gemini-2.5-flash",
            existingTodos: "[]",
        }

        it("should create a todo", async () => {
            const ws = await connect();
            const res = await send(ws, valid);

            expect(res.success).toBe(true);
            expect(res.success).toBe(true);
            expect(res.operation).toBeDefined();
            expect(res.operation.type).toBe("create");
            expect(res.command).toBeDefined();
            expect(res.command).toContain("localStorage");
            expect(res.command).toContain("todos");
            ws.close();
        })

        it("should create todo with priority", async () => {
            const ws = await connect();
            const response = await send(ws, {
              ...valid,
              message: "High priority: fix the bug",
            });
      
            expect(response.success).toBe(true);
            expect(response.operation.type).toBe("create");
            expect(response.operation.data?.priority).toBe("high");
            ws.close();
        });

        it("should create todo in X days", async () => {
            const ws = await connect();
            const response = await send(ws, {
              ...valid,
              message: "Add review code in 3 days",
            });
      
            expect(response.success).toBe(true);
            expect(response.operation.type).toBe("create");
            expect(response.operation.data?.dueDate).toBeDefined();
            expect(response.command).toContain("dueDate");
            ws.close();
        });
    })
})
