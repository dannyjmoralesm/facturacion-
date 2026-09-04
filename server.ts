import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Generous limit for image/document uploads (photos of invoices)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Lazy / Safe Gemini AI client
  let geminiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!geminiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not configured');
      }
      geminiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return geminiClient;
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API endpoint: Scan supplier invoice image using Gemini Vision OCR
  app.post('/api/scan-invoice', async (req, res) => {
    try {
      const { imageBase64, mimeType, currentBcvRate } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ 
          error: 'Se requiere la imagen de la factura en formato base64.' 
        });
      }

      const ai = getGeminiClient();
      const safeRate = Number(currentBcvRate) || 86.45;

      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      const validMimeType = mimeType || 'image/jpeg';

      const promptText = `Eres un asistente experto contable y auditor tributario de Venezuela (fiscalidad SENIAT y facturación comercial).
Analiza detalladamente esta imagen de una factura, nota de entrega, ticket fiscal o recibo de compra de un proveedor de mercancías/servicios.

Extrae con máxima precisión todos los datos legibles estructurados en formato JSON:

1. Proveedor:
   - supplierName: Razón Social o Nombre comercial del emisor/proveedor.
   - supplierRif: RIF fiscal (ej: J-12345678-9, V-12345678-0, G-20000000-0, etc.).
   - supplierPhone: Teléfono del proveedor o vendedor si aparece.
   - supplierContact: Nombre del vendedor o persona de contacto si aparece.

2. Documento:
   - invoiceNumber: Número de factura, nota de entrega o correlativo (ej: 004921, FAC-8891, NE-102).
   - controlNumber: Número de control fiscal SENIAT si está impreso (ej: 00-004921).
   - dateCreated: Fecha de emisión en formato ISO YYYY-MM-DD (ej: "2026-09-01"). Si no hay año explícito, asume el año en curso.
   - dueDate: Fecha de vencimiento si está indicada, o calcula una fecha coherente con el crédito en formato YYYY-MM-DD.
   - category: Sugiere una de las siguientes categorías comerciales:
     'Mercancía (Víveres & Alimentos)', 'Bebidas & Licores', 'Charcutería & Lácteos', 'Enlatados & Salsas', 'Limpieza & Cuidado Personal', 'Insumos Comerciales (Bolsas/Rollos)', 'Servicios & Mantenimiento', 'Equipos & Maquinaria'.

3. Montos y Moneda (Bimoneda):
   - currency: Moneda predominante del total ('USD' o 'VES').
   - totalAmount: Monto total final a pagar (numérico positivo).
   - totalUSD: Total expresado en dólares estadounidenses ($). Si la factura está en Bolívares y la tasa BCV de referencia es ${safeRate}, conviértelo coherentemente.
   - totalVES: Total expresado en Bolívares (Bs). Si la factura está en USD, usa la tasa de cambio para calcularlo.
   - bcvRate: Tasa de cambio indicada en la factura si figura explícitamente, o 0.

4. Desglose y Resumen:
   - description: Resumen claro de los productos comprados (ejemplo: 'Compra de 50 bultos de harina PAN y 20 cajas de aceite vegetal').
   - items: Lista de los ítems o productos que figuran en la factura con su descripción, cantidad, precio unitario y total.
   - notes: Condiciones de pago, número de cuenta bancaria, plazo de crédito (ej: 'Pago a 15 días, Banesco o Pago Móvil').

Si algún dato secundario no está visible, déjalo como cadena vacía o lista vacía, pero asegúrate de extraer el nombre del proveedor, número de factura y el monto total con exactitud.`;

      const imagePart = {
        inlineData: {
          mimeType: validMimeType,
          data: cleanBase64,
        },
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: {
          parts: [
            imagePart,
            { text: promptText },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              supplierName: { type: Type.STRING, description: 'Nombre o Razón Social del proveedor' },
              supplierRif: { type: Type.STRING, description: 'RIF del proveedor' },
              supplierPhone: { type: Type.STRING, description: 'Teléfono de contacto' },
              supplierContact: { type: Type.STRING, description: 'Persona de contacto o vendedor' },
              invoiceNumber: { type: Type.STRING, description: 'Número de factura o nota' },
              controlNumber: { type: Type.STRING, description: 'Número de control SENIAT' },
              dateCreated: { type: Type.STRING, description: 'Fecha de emisión YYYY-MM-DD' },
              dueDate: { type: Type.STRING, description: 'Fecha de vencimiento YYYY-MM-DD' },
              category: { type: Type.STRING, description: 'Categoría sugerida' },
              currency: { type: Type.STRING, description: 'Moneda (USD o VES)' },
              totalAmount: { type: Type.NUMBER, description: 'Monto total del documento' },
              totalUSD: { type: Type.NUMBER, description: 'Monto total en USD' },
              totalVES: { type: Type.NUMBER, description: 'Monto total en VES' },
              bcvRate: { type: Type.NUMBER, description: 'Tasa indicada en la factura' },
              description: { type: Type.STRING, description: 'Resumen de mercancía o concepto' },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    unitPriceUSD: { type: Type.NUMBER },
                    totalPriceUSD: { type: Type.NUMBER },
                  },
                },
              },
              notes: { type: Type.STRING, description: 'Notas o condiciones de crédito' },
            },
            required: ['supplierName', 'invoiceNumber', 'totalAmount'],
          },
        },
      });

      const responseText = response.text || '{}';
      let parsedData: any;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseErr) {
        return res.status(500).json({
          error: 'Error al interpretar los datos procesados por la IA.',
          raw: responseText
        });
      }

      // Normalization and safety checks
      if (!parsedData.totalUSD && parsedData.totalVES && safeRate > 0) {
        parsedData.totalUSD = Number((parsedData.totalVES / safeRate).toFixed(2));
      }
      if (!parsedData.totalVES && parsedData.totalUSD && safeRate > 0) {
        parsedData.totalVES = Number((parsedData.totalUSD * safeRate).toFixed(2));
      }
      if (!parsedData.dateCreated) {
        parsedData.dateCreated = new Date().toISOString().slice(0, 10);
      }

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error('Error scanning invoice:', err);
      return res.status(500).json({
        error: err.message || 'Ocurrió un error inesperado al procesar la factura con IA.',
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NegoFact server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
