# Transformers Chat

A simple chat app using transformers.js, Vite, and Express.

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

3. **Environment Variables:**

    This project uses a `.env` file for environment variables. Some Hugging Face models require authentication, which can be provided via an `HF_TOKEN` environment variable.

    Create a `.env` file in the root of the project and add any necessary variables. For a basic setup, you can copy the example:

    ```bash
    cp .env.example .env
    ```

    *Note: If `.env.example` does not exist, you can create a new `.env` file.*

4. **Running the application:**

    You need to run the server and the frontend separately.

    * **Start the server:**

        ```bash
        npm run server
        ```

        This will start the Express server on the port specified in your environment or the default.

    * **Start the frontend (in a new terminal):**

        ```bash
        npm run dev
        ```

        This will start the Vite development server, and you can access the chat application in your browser at the provided URL.

## Available Scripts

* `npm run dev`: Starts the Vite dev server.
* `npm run build`: Builds the project for production.
* `npm run preview`: Previews the production build.
* `npm run server`: Starts the Express server.
