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
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
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
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NegoFact server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
