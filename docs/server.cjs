var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_ws = require("ws");

// server/dbStore.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var DATA_DIR = import_path.default.join(process.cwd(), "data");
var DB_FILE = import_path.default.join(DATA_DIR, "negofact_db.json");
var SEED_FILE = import_path.default.join(DATA_DIR, "seedData.json");
var memoryState = null;
var saveTimeout = null;
function loadInitialSeed() {
  try {
    if (import_fs.default.existsSync(SEED_FILE)) {
      const raw = import_fs.default.readFileSync(SEED_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Failed to load seedData.json, using fallback:", err);
  }
  return {
    profile: {
      name: "INVERSIONES LA BENDICI\xD3N 2026, C.A.",
      commercialName: "Supermercado & Servicios NegoFact",
      rif: "J-41238910-4",
      phone: "+58 412-5550199",
      email: "ventas@negofact.com.ve",
      address: "Av. Bol\xEDvar cruce con Calle Comercio, Local 14",
      city: "Valencia",
      state: "Carabobo",
      invoicePrefix: "FACT-",
      controlPrefix: "00-",
      quotePrefix: "COT-",
      nextInvoiceSeq: 1042,
      nextControlSeq: 5820,
      nextQuoteSeq: 118,
      pagoMovilBank: "0102 - Banco de Venezuela",
      pagoMovilPhone: "04125550199",
      pagoMovilId: "V-20123456",
      zelleEmail: "pagos.negofact@gmail.com",
      zelleHolder: "Inversiones La Bendicion LLC",
      binancePayId: "782910411",
      defaultThermalSize: "80mm",
      footerMessage: "\xA1Gracias por su compra! Tasa BCV aplicada seg\xFAn normativa vigente.",
      enableTax: false,
      taxRatePercent: 16
    },
    users: [],
    products: [],
    customers: [],
    sales: [],
    quotes: [],
    shifts: [],
    debts: [],
    expenses: [],
    suppliers: [],
    supplierDebts: [],
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function initDatabase() {
  if (memoryState) return memoryState;
  if (!import_fs.default.existsSync(DATA_DIR)) {
    import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (import_fs.default.existsSync(DB_FILE)) {
    try {
      const raw = import_fs.default.readFileSync(DB_FILE, "utf-8");
      memoryState = JSON.parse(raw);
      console.log("Central Database loaded from negofact_db.json successfully.");
      return memoryState;
    } catch (err) {
      console.error("Error reading negofact_db.json, recreating from seed:", err);
    }
  }
  memoryState = loadInitialSeed();
  saveDatabaseImmediately(memoryState);
  console.log("Central Database initialized with default seed data.");
  return memoryState;
}
function getDatabaseState() {
  if (!memoryState) {
    return initDatabase();
  }
  return memoryState;
}
function saveDatabaseImmediately(state) {
  try {
    if (!import_fs.default.existsSync(DATA_DIR)) {
      import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    import_fs.default.writeFileSync(tempFile, JSON.stringify(state, null, 2), "utf-8");
    import_fs.default.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error("Failed to write database file:", err);
  }
}
function scheduleSaveDatabase() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    if (memoryState) {
      saveDatabaseImmediately(memoryState);
    }
  }, 100);
}
function applyMutation(mutation) {
  const db = getDatabaseState();
  const { entity, action, payload } = mutation;
  db.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
  const collection = db[entity];
  if (action === "REPLACE_ALL" || action === "UPDATE_BATCH") {
    db[entity] = Array.isArray(payload) ? payload : payload;
  } else if (action === "CREATE") {
    if (Array.isArray(collection)) {
      const existsIndex = collection.findIndex((item) => item && item.id === payload.id);
      if (existsIndex >= 0) {
        collection[existsIndex] = payload;
      } else {
        collection.unshift(payload);
      }
    } else {
      db[entity] = payload;
    }
  } else if (action === "UPDATE") {
    if (Array.isArray(collection)) {
      const index = collection.findIndex((item) => item && item.id === payload.id);
      if (index >= 0) {
        collection[index] = { ...collection[index], ...payload };
      } else {
        collection.push(payload);
      }
    } else if (typeof collection === "object" && collection !== null) {
      db[entity] = { ...collection, ...payload };
    } else {
      db[entity] = payload;
    }
  } else if (action === "DELETE") {
    const idToDelete = typeof payload === "string" ? payload : payload?.id;
    if (Array.isArray(collection) && idToDelete) {
      db[entity] = collection.filter((item) => item && item.id !== idToDelete);
    }
  } else if (action === "UPDATE_STOCK_BATCH") {
    if (Array.isArray(payload) && Array.isArray(db.products)) {
      payload.forEach((updateItem) => {
        const prod = db.products.find((p) => p.id === (updateItem.id || updateItem.productId));
        if (prod) {
          if (typeof updateItem.stock === "number") prod.stock = updateItem.stock;
          if (updateItem.priceUSD !== void 0) prod.priceUSD = updateItem.priceUSD;
        }
      });
    }
  } else if (action === "SYNC_BATCH") {
    if (payload && typeof payload === "object") {
      Object.keys(payload).forEach((key) => {
        if (Array.isArray(db[key]) && Array.isArray(payload[key])) {
          db[key] = payload[key];
        } else if (key === "profile" && payload.profile) {
          db.profile = payload.profile;
        }
      });
    }
  }
  scheduleSaveDatabase();
  return { success: true, entity, state: db };
}
function resetDatabaseToSeed() {
  memoryState = loadInitialSeed();
  memoryState.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
  saveDatabaseImmediately(memoryState);
  return memoryState;
}

// server.ts
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const server = import_http.default.createServer(app);
  const PORT = 3e3;
  initDatabase();
  const wss = new import_ws.WebSocketServer({ noServer: true });
  function broadcastClientCount() {
    const count = wss.clients.size;
    const msg = JSON.stringify({ type: "CLIENTS_COUNT", count });
    wss.clients.forEach((client) => {
      if (client.readyState === import_ws.WebSocket.OPEN) {
        client.send(msg);
      }
    });
  }
  function broadcastMutationToClients(mutation, excludeSenderId) {
    const msg = JSON.stringify({
      type: "MUTATION_BROADCAST",
      entity: mutation.entity,
      action: mutation.action,
      payload: mutation.payload,
      senderId: mutation.senderId,
      timestamp: mutation.timestamp || Date.now()
    });
    wss.clients.forEach((client) => {
      if (client.readyState === import_ws.WebSocket.OPEN) {
        if (!excludeSenderId || client.deviceId !== excludeSenderId) {
          client.send(msg);
        }
      }
    });
  }
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 25e3);
  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });
  wss.on("connection", (ws, req) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
    const currentState = getDatabaseState();
    ws.send(JSON.stringify({
      type: "INIT_STATE",
      payload: currentState,
      clientCount: wss.clients.size,
      serverTime: Date.now()
    }));
    broadcastClientCount();
    ws.on("message", (messageRaw) => {
      try {
        const data = JSON.parse(messageRaw.toString());
        if (data.type === "REGISTER_DEVICE") {
          ws.deviceId = data.deviceId;
          ws.deviceName = data.deviceName;
          return;
        }
        if (data.type === "PING") {
          ws.send(JSON.stringify({ type: "PONG" }));
          return;
        }
        if (data.type === "MUTATION") {
          const mutation = {
            entity: data.entity,
            action: data.action,
            payload: data.payload,
            senderId: data.senderId,
            timestamp: data.timestamp || Date.now()
          };
          applyMutation(mutation);
          broadcastMutationToClients(mutation, data.senderId);
        }
      } catch (err) {
        console.error("Error handling WebSocket message:", err);
      }
    });
    ws.on("close", () => {
      broadcastClientCount();
    });
    ws.on("error", (err) => {
      console.warn("WebSocket client error:", err?.message);
    });
  });
  server.on("upgrade", (request, socket, head) => {
    try {
      const url = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
      if (url.pathname === "/api/realtime") {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      }
    } catch (e) {
      socket.destroy();
    }
  });
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
  let geminiClient = null;
  function getGeminiClient() {
    if (!geminiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not configured");
      }
      geminiClient = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
    return geminiClient;
  }
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.post("/api/scan-invoice", async (req, res) => {
    try {
      const { imageBase64, mimeType, currentBcvRate } = req.body;
      if (!imageBase64) {
        return res.status(400).json({
          error: "Se requiere la imagen de la factura en formato base64."
        });
      }
      const ai = getGeminiClient();
      const safeRate = Number(currentBcvRate) || 86.45;
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
      const validMimeType = mimeType || "image/jpeg";
      const promptText = `Eres un asistente experto contable y auditor tributario de Venezuela (fiscalidad SENIAT y facturaci\xF3n comercial).
Analiza detalladamente esta imagen de una factura, nota de entrega, ticket fiscal o recibo de compra de un proveedor de mercanc\xEDas/servicios.

Extrae con m\xE1xima precisi\xF3n todos los datos legibles estructurados en formato JSON:

1. Proveedor:
   - supplierName: Raz\xF3n Social o Nombre comercial del emisor/proveedor.
   - supplierRif: RIF fiscal (ej: J-12345678-9, V-12345678-0, G-20000000-0, etc.).
   - supplierPhone: Tel\xE9fono del proveedor o vendedor si aparece.
   - supplierContact: Nombre del vendedor o persona de contacto si aparece.

2. Documento:
   - invoiceNumber: N\xFAmero de factura, nota de entrega o correlativo (ej: 004921, FAC-8891, NE-102).
   - controlNumber: N\xFAmero de control fiscal SENIAT si est\xE1 impreso (ej: 00-004921).
   - dateCreated: Fecha de emisi\xF3n en formato ISO YYYY-MM-DD (ej: "2026-09-01"). Si no hay a\xF1o expl\xEDcito, asume el a\xF1o en curso.
   - dueDate: Fecha de vencimiento si est\xE1 indicada, o calcula una fecha coherente con el cr\xE9dito en formato YYYY-MM-DD.
   - category: Sugiere una de las siguientes categor\xEDas comerciales:
     'Mercanc\xEDa (V\xEDveres & Alimentos)', 'Bebidas & Licores', 'Charcuter\xEDa & L\xE1cteos', 'Enlatados & Salsas', 'Limpieza & Cuidado Personal', 'Insumos Comerciales (Bolsas/Rollos)', 'Servicios & Mantenimiento', 'Equipos & Maquinaria'.

3. Montos y Moneda (Bimoneda):
   - currency: Moneda predominante del total ('USD' o 'VES').
   - totalAmount: Monto total final a pagar (num\xE9rico positivo).
   - totalUSD: Total expresado en d\xF3lares estadounidenses ($). Si la factura est\xE1 en Bol\xEDvares y la tasa BCV de referencia es ${safeRate}, convi\xE9rtelo coherentemente.
   - totalVES: Total expresado en Bol\xEDvares (Bs). Si la factura est\xE1 en USD, usa la tasa de cambio para calcularlo.
   - bcvRate: Tasa de cambio indicada en la factura si figura expl\xEDcitamente, o 0.

4. Desglose y Resumen:
   - description: Resumen claro de los productos comprados (ejemplo: 'Compra de 50 bultos de harina PAN y 20 cajas de aceite vegetal').
   - items: Lista de los \xEDtems o productos que figuran en la factura con su descripci\xF3n, cantidad, precio unitario y total.
   - notes: Condiciones de pago, n\xFAmero de cuenta bancaria, plazo de cr\xE9dito (ej: 'Pago a 15 d\xEDas, Banesco o Pago M\xF3vil').

Si alg\xFAn dato secundario no est\xE1 visible, d\xE9jalo como cadena vac\xEDa o lista vac\xEDa, pero aseg\xFArate de extraer el nombre del proveedor, n\xFAmero de factura y el monto total con exactitud.`;
      const imagePart = {
        inlineData: {
          mimeType: validMimeType,
          data: cleanBase64
        }
      };
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: {
          parts: [
            imagePart,
            { text: promptText }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              supplierName: { type: import_genai.Type.STRING, description: "Nombre o Raz\xF3n Social del proveedor" },
              supplierRif: { type: import_genai.Type.STRING, description: "RIF del proveedor" },
              supplierPhone: { type: import_genai.Type.STRING, description: "Tel\xE9fono de contacto" },
              supplierContact: { type: import_genai.Type.STRING, description: "Persona de contacto o vendedor" },
              invoiceNumber: { type: import_genai.Type.STRING, description: "N\xFAmero de factura o nota" },
              controlNumber: { type: import_genai.Type.STRING, description: "N\xFAmero de control SENIAT" },
              dateCreated: { type: import_genai.Type.STRING, description: "Fecha de emisi\xF3n YYYY-MM-DD" },
              dueDate: { type: import_genai.Type.STRING, description: "Fecha de vencimiento YYYY-MM-DD" },
              category: { type: import_genai.Type.STRING, description: "Categor\xEDa sugerida" },
              currency: { type: import_genai.Type.STRING, description: "Moneda (USD o VES)" },
              totalAmount: { type: import_genai.Type.NUMBER, description: "Monto total del documento" },
              totalUSD: { type: import_genai.Type.NUMBER, description: "Monto total en USD" },
              totalVES: { type: import_genai.Type.NUMBER, description: "Monto total en VES" },
              bcvRate: { type: import_genai.Type.NUMBER, description: "Tasa indicada en la factura" },
              description: { type: import_genai.Type.STRING, description: "Resumen de mercanc\xEDa o concepto" },
              items: {
                type: import_genai.Type.ARRAY,
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    description: { type: import_genai.Type.STRING },
                    quantity: { type: import_genai.Type.NUMBER },
                    unitPriceUSD: { type: import_genai.Type.NUMBER },
                    totalPriceUSD: { type: import_genai.Type.NUMBER }
                  }
                }
              },
              notes: { type: import_genai.Type.STRING, description: "Notas o condiciones de cr\xE9dito" }
            },
            required: ["supplierName", "invoiceNumber", "totalAmount"]
          }
        }
      });
      const responseText = response.text || "{}";
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseErr) {
        return res.status(500).json({
          error: "Error al interpretar los datos procesados por la IA.",
          raw: responseText
        });
      }
      if (!parsedData.totalUSD && parsedData.totalVES && safeRate > 0) {
        parsedData.totalUSD = Number((parsedData.totalVES / safeRate).toFixed(2));
      }
      if (!parsedData.totalVES && parsedData.totalUSD && safeRate > 0) {
        parsedData.totalVES = Number((parsedData.totalUSD * safeRate).toFixed(2));
      }
      if (!parsedData.dateCreated) {
        parsedData.dateCreated = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      }
      return res.json({
        success: true,
        data: parsedData
      });
    } catch (err) {
      console.error("Error scanning invoice:", err);
      return res.status(500).json({
        error: err.message || "Ocurri\xF3 un error inesperado al procesar la factura con IA."
      });
    }
  });
  app.get("/api/sync/state", (req, res) => {
    try {
      const state = getDatabaseState();
      res.json({
        success: true,
        data: state,
        connectedDevices: wss.clients.size,
        serverTime: Date.now()
      });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  });
  app.post("/api/sync/mutate", (req, res) => {
    try {
      const { entity, action, payload, senderId } = req.body;
      if (!entity || !action) {
        return res.status(400).json({ success: false, error: "entity and action are required" });
      }
      const mutation = {
        entity,
        action,
        payload,
        senderId,
        timestamp: Date.now()
      };
      const result = applyMutation(mutation);
      broadcastMutationToClients(mutation, senderId);
      res.json({
        success: true,
        lastUpdated: result.state.lastUpdated,
        connectedDevices: wss.clients.size
      });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  });
  app.post("/api/sync/reset", (req, res) => {
    try {
      const newState = resetDatabaseToSeed();
      const resetMsg = {
        entity: "all",
        action: "SYNC_BATCH",
        payload: newState,
        senderId: req.body.senderId,
        timestamp: Date.now()
      };
      broadcastMutationToClients(resetMsg);
      res.json({ success: true, data: newState });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  });
  app.get("/api/sync/info", (req, res) => {
    res.json({
      status: "active",
      engine: "WebSocket + File JSON Store",
      connectedDevices: wss.clients.size,
      time: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`NegoFact server running with WebSockets on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
