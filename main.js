import { pipeline, env } from '@huggingface/transformers';

// Get UI elements
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const loadingScreen = document.getElementById('loadingScreen');
const loadingMessage = document.getElementById('loadingMessage');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const statusElement = document.getElementById('status');

// Model and state variables
let generator = null;
let isModelReady = false;
const conversationHistory = [];

// Set up model caching and device
env.cacheDir = './models';

// Function to update the loading progress UI
function updateLoadingProgress(progress) {
    const { status, progress: percent, message, file } = progress;
    
    loadingMessage.textContent = message || file || 'Loading...';
    
    if (typeof percent === 'number') {
        const formattedPercent = percent.toFixed(2);
        progressFill.style.width = `${formattedPercent}%`;
        progressText.textContent = `${formattedPercent}%`;
    }
    
    if (status === 'error') {
        loadingMessage.style.color = '#dc3545';
        progressFill.style.background = '#dc3545';
    } else if (status === 'ready') {
        loadingMessage.style.color = '#28a745';
        progressFill.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
    }
}

// Initialize the model using the pipeline API
async function initializeModel() {
    try {
        updateLoadingProgress({ status: 'initializing', message: 'Preparing to load model...' });

        generator = await pipeline(
            "text-generation",
            "onnx-community/Qwen2.5-0.5B-Instruct",
            {
                dtype: "q4",
                device: "webgpu",
                progress_callback: updateLoadingProgress
            }
        );

        updateLoadingProgress({ status: 'ready', progress: 100, message: 'Model loaded successfully!' });
        statusElement.textContent = '✅ Qwen2.5 model ready - Start chatting!';
        statusElement.className = 'status ready';
        messageInput.disabled = false;
        sendButton.disabled = false;
        isModelReady = true;
        loadingScreen.classList.add('hidden');

        // Add system prompt to conversation history
        conversationHistory.push({ role: 'system', content: 'You are a helpful assistant.' });

    } catch (error) {
        console.error('Error loading model:', error);
        const errorMessage = error.message || error.toString();
        updateLoadingProgress({ status: 'error', message: `Failed to load model: ${errorMessage}` });
        statusElement.textContent = '❌ Error loading model.';
        statusElement.className = 'status error';
    }
}

// Function to add a message to the chat UI
function addMessage(content, isUser = false, isLoading = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}${isLoading ? ' loading' : ''}`;
    messageDiv.textContent = content;
    
    const emptyState = messagesContainer.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageDiv;
}

// ElevenLabs API Key
const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
if (!elevenLabsApiKey) {
    console.warn("ElevenLabs API key not found. Text-to-speech will be disabled. Please add it to your .env file.");
}

// Function to convert text to speech and play it
async function playAIAudio(text) {
    if (!elevenLabsApiKey || !text) return;

    const voiceId = '21m00Tcm4TlvDq8ikWAM'; // A default voice, e.g., Rachel
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': elevenLabsApiKey,
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail.message || `API request failed with status ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();

    } catch (error) {
        console.error('Error with ElevenLabs API:', error);
        addMessage(`Sorry, I could not read the response out loud. Error: ${error.message}`, false);
    }
}

// Function to handle sending a message
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !isModelReady) return;

    messageInput.value = '';
    sendButton.disabled = true;

    addMessage(message, true);
    conversationHistory.push({ role: 'user', content: message });

    const loadingMsg = addMessage('Qwen2.5 is thinking...', false, true);

    try {
        const output = await generator(conversationHistory, { max_new_tokens: 256 });
        const reply = output[0].generated_text.at(-1).content;

        loadingMsg.remove();
        addMessage(reply || 'I\'m not sure how to respond to that.');
        conversationHistory.push({ role: 'assistant', content: reply });

        // Play the AI's response
        playAIAudio(reply);

    } catch (error) {
        loadingMsg.remove();
        addMessage('Sorry, there was an error processing your request.', false);
        console.error('Error:', error);
    } finally {
        sendButton.disabled = false;
        messageInput.focus();
    }
}

// Set up event listeners
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Initialize the app
initializeModel();
