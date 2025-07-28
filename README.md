# Transformers Chat

A simple chat app using transformers.js and Vite. This application uses the `onnx-community/Qwen2.5-0.5B-Instruct-onnx-web` model from Hugging Face and runs it in the browser using WebGPU for acceleration.

## Prerequisites

Make sure you have Node.js and npm installed on your system.

## Setup Instructions

1. **Clone the repository:**

    ```bash
    git clone https://github.com/xenova/transformers-chat.git
    cd transformers-chat
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Running the application:**

    Start the development server:

    ```bash
    npm run dev
    ```

    Then, open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).

    **Note on Gated Models:**
    Some models require you to be logged into your Hugging Face account. If you encounter any issues, make sure you are logged in at [huggingface.co](https://huggingface.co).

## Available Scripts

* `npm run dev`: Starts the Vite development server.
* `npm run build`: Builds the project for production.
* `npm run preview`: Previews the production build.
