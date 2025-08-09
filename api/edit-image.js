import Replicate from "replicate";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // مهم حتى نستقبل form-data (ملفات)
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const form = formidable();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "Error parsing form" });
    }

    const prompt = fields.prompt?.[0] || "Modern bright interior";
    const imagePath = files.image?.[0]?.filepath;

    if (!imagePath) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    try {
      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
      });

      // نموذج img2img — هنا نستخدم SDXL image-to-image
      const output = await replicate.run(
        "stability-ai/sdxl:5c3d6f9fbe6b0b5f0ddc94f9d1e69db47b01a83c2298255e1e1af0b8ff37fd9c",
        {
          input: {
            image: fs.createReadStream(imagePath),
            prompt: prompt,
            scheduler: "K_EULER",
            num_inference_steps: 20,
            guidance_scale: 7.5
          }
        }
      );

      return res.status(200).json({ output: output[0] });
    } catch (error) {
      console.error("Replicate error:", error);
      return res.status(500).json({ error: error.message });
    }
  });
}
