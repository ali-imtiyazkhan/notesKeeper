import { WebSocket } from "ws";

const WS_URL = "ws://localhost:8000";

const testMessages = [
  {
    name: "Simple Create",
    message: {
      message: "Add buy groceries",
      apiKey: "",
      model: "gemini-2.5-flash",
      config: {},
      existingTodos: "[]",
    },
  },
  {
    name: "Create with Tomorrow",
    message: {
      message: "Add complete assignments tomorrow",
      apiKey: "",
      model: "gemini-2.5-flash",
      config: {},
      existingTodos: "[]",
    },
  },
  {
    name: "Create in 3 Days",
    message: {
      message: "Add review code in 3 days",
      apiKey: "",
      model: "gemini-2.5-flash",
      config: {},
      existingTodos: "[]",
    },
  },
  {
    name: "Create Next Week",
    message: {
      message: "Remind me to call mom next week",
      apiKey: "",
      model: "gemini-2.5-flash",
      config: {},
      existingTodos: "[]",
    },
  },
  {
    name: "Create with Priority",
    message: {
      message: "High priority: fix the bug in production",
      apiKey: "",
      model: "gemini-2.5-flash",
      config: {},
      existingTodos: "[]",
    },
  },
  {
    name: "Mark as Done",
    message: {
      message: "Mark buy groceries as done",
      apiKey: "",
      model: "gemini-2.5-flash",
      config: {},
      existingTodos: JSON.stringify([
        { id: "123", title: "buy groceries", completed: false },
      ]),
    },
  },
  {
    name: "Delete Todo",
    message: {
      message: "Delete buy groceries",
      apiKey: "",
      model: "gemini-2.5-flash",
      config: {},
      existingTodos: JSON.stringify([
        { id: "123", title: "buy groceries", completed: false },
      ]),
    },
  },
  {
    name: "Clear All",
    message: {
      message: "Clear all todos",
      apiKey: "",
      model: "gemini-2.5-flash",
      config: {},
      existingTodos: JSON.stringify([
        { id: "123", title: "buy groceries" },
        { id: "456", title: "workout" },
      ]),
    },
  },
  {
    name: "Complex Create",
    message: {
      message:
        "Add a task to complete assignments for SEA and complete projects tomorrow",
      apiKey: "",
      model: "gemini-2.5-flash",
      config: {},
      existingTodos: "[]",
    },
  },
];

async function testWebSocket() {
  console.log("🔌 Connecting to WebSocket server...\n");

  for (const test of testMessages) {
    await new Promise<void>((resolve) => {
      const ws = new WebSocket(WS_URL);

      ws.on("open", () => {
        console.log(`\n📤 Testing: ${test.name}`);
        console.log(`Message: ${test.message.message}`);
        ws.send(JSON.stringify(test.message));
      });

      ws.on("message", (data) => {
        const response = JSON.parse(data.toString());
        console.log("\n📥 Response:");
        console.log(JSON.stringify(response, null, 2));

        if (response.success && response.command) {
          console.log("\n✅ Command received:");
          console.log(response.command);
        }

        if (response.error) {
          console.log("\n❌ Error:", response.error);
        }

        ws.close();
        resolve();
      });

      ws.on("error", (error) => {
        console.error(`\n❌ WebSocket Error: ${error.message}`);
        resolve();
      });

      ws.on("close", () => {
        setTimeout(() => resolve(), 500);
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n✅ All tests completed!");
  process.exit(0);
}

testWebSocket().catch(console.error);

