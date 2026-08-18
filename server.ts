import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // Initialize Gemini Client safely
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Sample Videos Metadata
  app.get("/api/sample-videos", (_req, res) => {
    res.json({
      samples: [
        {
          id: "traffic",
          name: "City Traffic Intersection",
          category: "Traffic Analytics",
          description: "Busy urban junction with cars, buses, bicycles, and pedestrians.",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          poster: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80",
          defaultTargetClasses: ["car", "bus", "truck", "person", "bicycle"],
        },
        {
          id: "pedestrians",
          name: "Downtown Pedestrian Mall",
          category: "Crowd Analysis",
          description: "High-density pedestrian walkway with multi-direction movement.",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
          poster: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80",
          defaultTargetClasses: ["person", "backpack", "handbag", "umbrella"],
        },
        {
          id: "nature",
          name: "Wildlife & Nature Trail",
          category: "Animal Tracking",
          description: "Open environment with pets, wildlife, and natural movement patterns.",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          poster: "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=800&q=80",
          defaultTargetClasses: ["dog", "cat", "bird", "bear", "person"],
        },
        {
          id: "sports",
          name: "Sports & Athletics Field",
          category: "Sports Analytics",
          description: "Fast multi-object movement with player tracking and sports ball motion.",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
          poster: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
          defaultTargetClasses: ["person", "sports ball", "frisbee", "chair"],
        },
      ],
    });
  });

  // Gemini AI Object Detection & Frame Analysis Endpoint
  app.post("/api/gemini/analyze-frame", async (req, res) => {
    try {
      const { imageBase64, customPrompt, targetClasses, modelName } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64 in request body." });
      }

      const ai = getGenAI();
      const model = modelName || "gemini-3.6-flash";

      // Clean base64 prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

      const promptText =
        customPrompt ||
        `Perform precise zero-shot object detection on this video frame. Identify key objects (such as ${
          targetClasses?.length ? targetClasses.join(", ") : "person, car, truck, bicycle, dog, cat, backpack, phone, laptop, chair, bottle"
        }). 
For each detected object, return normalized bounding box coordinates [ymin, xmin, ymax, xmax] in 0..1000 scale, label, confidence (0.0 to 1.0), visual attributes (color, size), and motion state (stationary, moving left/right/up/down).
Also provide a high-level summary of the scene, object count breakdown, and any notable security or anomaly events.`;

      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanBase64,
              },
            },
            {
              text: promptText,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sceneSummary: {
                type: Type.STRING,
                description: "Concise summary of the scene and main activity.",
              },
              anomalyDetected: {
                type: Type.BOOLEAN,
                description: "True if any unusual behavior, crowding, or security hazard is observed.",
              },
              anomalyReason: {
                type: Type.STRING,
                description: "Explanation of anomaly if detected.",
              },
              detections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    // box in [ymin, xmin, ymax, xmax] normalized to 0..1000
                    box2d: {
                      type: Type.ARRAY,
                      items: { type: Type.NUMBER },
                    },
                    attributes: { type: Type.STRING },
                    predictedDirection: { type: Type.STRING },
                  },
                  required: ["label", "confidence", "box2d"],
                },
              },
              classCounts: {
                type: Type.OBJECT,
                description: "Key-value pair of class name to count",
              },
            },
            required: ["sceneSummary", "detections"],
          },
        },
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText);

      return res.json({
        success: true,
        data: parsedData,
        modelUsed: model,
      });
    } catch (err: any) {
      console.error("Gemini Frame Analysis Error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to analyze frame with Gemini AI.",
      });
    }
  });

  // Mount Vite or Static Serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OBTrack Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
