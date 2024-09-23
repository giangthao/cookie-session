// Create a WebSocket server
const express = require("express");
const WebSocket = require("ws");
const app = express();
const PORT = 3001;
const DEFAULT_CALLBACK = 6 * 1000;
const wss = new WebSocket.Server({ noServer: true });
const cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
  })
);

// Generate fake data
function generateResponse() {
  return {
    lastUpdatedAt: new Date().toISOString(),
    data: [
      { code: "total_locate", value: Math.floor(Math.random() * 1000) },
      { code: "total_catching", value: Math.floor(Math.random() * 1000) },
      //  Locate
      { code: "locate_manual_location_imei", value: Math.floor(Math.random() * 1000) },
      { code: "locate_manual_location_not_imei", value: Math.floor(Math.random() * 1000) },
      { code: "locate_manual_not_location_imei", value: Math.floor(Math.random() * 1000) },
      { code: "locate_manual_not_location_not_imei", value: Math.floor(Math.random() * 1000) },
      { code: "locate_auto_imei", value: Math.floor(Math.random() * 1000) },
      { code: "locate_auto_not_imei", value: Math.floor(Math.random() * 1000) },
      // Catching
      { code: "catching_manual_location_imei", value: Math.floor(Math.random() * 1000) },
      { code: "catching_manual_location_not_imei", value: Math.floor(Math.random() * 1000) },
      { code: "catching_manual_not_location_imei", value: Math.floor(Math.random() * 1000) },
      { code: "catching_manual_not_location_not_imei", value: Math.floor(Math.random() * 1000) },
      { code: "catching_auto_imei", value: Math.floor(Math.random() * 1000) },
      { code: "catching_auto_not_imei", value: Math.floor(Math.random() * 1000) },
      //  System
      {
        code: "max_imei_per_second",
        value: Math.floor(Math.random() * 1000),
      },
      {
        code: "max_imsi_per_second",
        value: Math.floor(Math.random() * 1000),
      },
      {
        code: "total_response",
        value: Math.floor(Math.random() * 1000),
      },
    ],
  };
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    const params = JSON.parse(message);
    const { network, from, to } = params;

    if (!["VIETTEL", "MOBILEPHONE", "VINAPHONE", "VIETNAMMOBILE"].includes(network.toUpperCase())) {
      ws.send(JSON.stringify({ error: "Invalid network" }));
      return;
    }
    console.log(`Received params: network = ${network}, from = ${from}, to = ${to}`);

    const initialResponse = generateResponse();
    ws.send(JSON.stringify(initialResponse));

    const interval = setInterval(() => {
      const response = generateResponse();
      ws.send(JSON.stringify(response)); 
    }, DEFAULT_CALLBACK);

    ws.on("close", () => {
      ``;
      console.log("Client disconnected");
      clearInterval(interval);
    });
  });

  setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ message: "Connection timed out" }));
      ws.close();
    }
  }, DEFAULT_CALLBACK * 60);
});

wss.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port 3000 is already in use.`);
  } else {
    console.error("WebSocket server error:", error);
  }
});

// Tạo HTTP server để tích hợp WebSocket
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Chuyển đổi HTTP thành WebSocket
server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});
