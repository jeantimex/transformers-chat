import express from 'express';
import cors from 'cors';
import {
  AutoProcessor,
  AutoModelForImageTextToText,
  TextStreamer,
  env
} from "@huggingface/transformers";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Set up model caching
env.cacheDir = path.join(__dirname, 'models');

// Load processor and model
const model_id = "onnx-community/gemma-3n-E2B-it-ONNX";
let processor = null;
let model = null;
let isModelLoading = false;
let modelLoadingProgress = { status: 'initializing', progress: 0, message: 'Preparing to load model...' };

console.log(`🤖 Loading Gemma 3n model: ${model_id}`);

async function initializeModel() {
  if (isModelLoading || (processor && model)) return;
  
  isModelLoading = true;
  
  try {
    console.log('🚀 Starting Gemma 3n model initialization...');
    
    // Update progress
    modelLoadingProgress = { 
      status: 'downloading', 
      progress: 10, 
      message: 'Loading processor...' 
    };
    
    // Load processor
    console.log('📦 Loading processor...');
    processor = await AutoProcessor.from_pretrained(model_id);
    
    // Update progress
    modelLoadingProgress = { 
      status: 'downloading', 
      progress: 30, 
      message: 'Loading model (this may take several minutes)...' 
    };
    
    // Load model with exact configuration from example
    console.log('🧠 Loading model...');
    model = await AutoModelForImageTextToText.from_pretrained(model_id, {
      dtype: {
        embed_tokens: "q8",
        audio_encoder: "q8",
        vision_encoder: "fp16",
        decoder_model_merged: "q4",
      },
      device: "cpu", // NOTE: WebGPU support coming soon!
    });
    
    modelLoadingProgress = { 
      status: 'ready', 
      progress: 100, 
      message: 'Gemma 3n model loaded successfully!' 
    };
    
    console.log('✅ Gemma 3n model loaded successfully!');
  } catch (error) {
    console.error('❌ Error loading Gemma 3n model:', error);
    modelLoadingProgress = { 
      status: 'error', 
      progress: 0, 
      message: `Failed to load model: ${error.message}` 
    };
  } finally {
    isModelLoading = false;
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!processor || !model) {
      return res.status(503).json({ 
        error: 'Model not loaded yet', 
        loadingProgress: modelLoadingProgress 
      });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('💬 Generating response for:', message);

    // Prepare prompt using the exact format from the example
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: message },
        ],
      },
    ];
    
    const prompt = processor.apply_chat_template(messages, {
      add_generation_prompt: true,
    });
    
    // Prepare inputs (text-only, no image or audio)
    const image = null;
    const audio = null;
    const inputs = await processor(prompt, image, audio, {
      add_special_tokens: false,
    });
    
    // Generate output using the exact parameters from example
    const outputs = await model.generate({
      ...inputs,
      max_new_tokens: 256, // Shorter for chat
      do_sample: true,
      temperature: 0.7,
      top_p: 0.9,
    });
    
    // Decode output using the exact method from example
    const decoded = processor.batch_decode(
      outputs.slice(null, [inputs.input_ids.dims.at(-1), null]),
      { skip_special_tokens: true },
    );
    
    const reply = decoded[0].trim();
    console.log('🤖 Generated reply:', reply);
    
    res.json({ reply: reply || 'I\'m not sure how to respond to that.' });
    
  } catch (error) {
    console.error('❌ Error generating response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'running',
    modelLoaded: !!(processor && model),
    isLoading: isModelLoading,
    loadingProgress: modelLoadingProgress
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Frontend should connect to http://localhost:${PORT}`);
});

// Initialize model on server start
initializeModel();