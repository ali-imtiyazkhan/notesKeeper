import { WebSocketServer } from "ws";
import { convertor, queryAgent } from "./functions";

interface Message {
  message: string;
  apiKey: string;
  model: string;
  config: object;
  existingTodos?: string;
  notes?: string;
  folders?: string;
  operationType?: "todo" | "query";
  queryId?: string;
  conversationHistory?: Array<{ command: string; response: string }>;
}

interface Response {
  success: boolean;
  type?: "todo" | "query";
  queryId?: string;
  command?: string;
  operation?: {
    type: string;
    todoId?: string;
    data?: object;
    localStorageCommand?: string;
  };
  response?: string;
  error?: string;
  todos?: any[];
}

const wss = new WebSocketServer({ port: 8080, host: "localhost" });

wss.on("connection", (ws, req) => {
  const client = req.socket.remoteAddress;
  console.log(`Client Connected : ${wss.clients.size}`);

  ws.on("message", async (raw) => {
    try {
      const message = raw.toString();
      console.log(`Message: ${message}`);

      let data: Message;
      try {
        data = JSON.parse(message);
      } catch (error) {
        ws.send(
          JSON.stringify({
            success: false,
            error:
              "Invalid JSON format. Expected: {message, apiKey, model, config, existingTodos?, notes?, folders?, operationType?}",
          } as Response),
        );
        return;
      }

      if (
        !data.message ||
        !data.apiKey ||
        !data.model ||
        !data.config ||
        typeof data.message !== "string" ||
        typeof data.apiKey !== "string" ||
        typeof data.model !== "string" ||
        typeof data.config !== "object"
      ) {
        ws.send(
          JSON.stringify({
            success: false,
            error: "Invalid Configuration!",
          } as Response),
        );
        return;
      }

      const apiKey = data.apiKey;
      const model = data.model;
      const config = data.config;
      const todos = data.existingTodos || "";
      const notes = data.notes || "";
      const folders = data.folders || "";
      const operationType = data.operationType;

      const isTodoOperation =
        operationType === "todo" ||
        (operationType !== "query" &&
          todos &&
          (data.message.toLowerCase().includes("todo") ||
            data.message.toLowerCase().includes("task") ||
            data.message.toLowerCase().includes("add") ||
            data.message.toLowerCase().includes("create") ||
            data.message.toLowerCase().includes("delete") ||
            data.message.toLowerCase().includes("remove") ||
            data.message.toLowerCase().includes("update") ||
            data.message.toLowerCase().includes("mark") ||
            data.message.toLowerCase().includes("complete") ||
            data.message.toLowerCase().includes("list") ||
            data.message.toLowerCase().includes("show")));

      let response: Response;

      if (isTodoOperation) {
        const res = await convertor(data.message, apiKey, model, config, todos);

        let operation: any;
        try {
          const clean = res
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

          operation = JSON.parse(clean);
        } catch (error) {
          console.error(`Failed to parse AI Response ${res}`);
          ws.send(
            JSON.stringify({
              success: false,
              error: `Failed to parse AI response: ${error}`,
              rawResponse: error,
            } as Response),
          );
          return;
        }

        if (!operation.type || !operation.localStorageCommand) {
          ws.send(
            JSON.stringify({
              success: false,
              error: "Invalid operation structure from AI",
              operation,
            } as Response),
          );
          return;
        }

        response = {
          success: true,
          type: "todo",
          command: operation.localStorageCommand,
          operation: {
            type: operation.type,
            todoId: operation.todoId,
            data: operation.data,
            localStorageCommand: operation.localStorageCommand,
          },
        };

        if (operation.type === "list" && todos) {
          try {
            response.todos = JSON.parse(todos);
          } catch {}
        }

        ws.send(JSON.stringify(response));
        console.log(`Response Sent- Client ${operation.type} (todo operation)`);
      } else {
        try {
          const conversationHistory = data.conversationHistory || [];
          const res = await queryAgent(
            data.message,
            apiKey,
            model,
            config,
            notes,
            folders,
            conversationHistory,
          );

          response = {
            success: true,
            type: "query",
            queryId: data.queryId,
            response: res,
          };

          ws.send(JSON.stringify(response));
          console.log(`Response Sent- Client (query operation)`);
        } catch (error) {
          console.error("Error in queryAgent:", error);
          ws.send(
            JSON.stringify({
              success: false,
              type: "query",
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred in query",
            } as Response),
          );
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(
        JSON.stringify({
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        } as Response),
      );
    }
  });

  ws.on("close", () => {
    console.log(`Client Disconnected: ${wss.clients.size} remaining`);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

console.log("WebSocket server listening on ws://localhost:8080");
