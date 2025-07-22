# Backend API

This is a Node.js + Express API for the coding challenge.

## Setup Instructions

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start the Server:**
    ```bash
    node server.js
    ```

The server will run on `http://localhost:3000`.

## Database

This API uses SQLite and stores data in `database.sqlite` in the project root.

## Environment Variables

-   `JWT_SECRET`: Used for signing and verifying JWT tokens. (Currently hardcoded in `server.js` for simplicity, but should be an environment variable in production).

## Webhook

The `/send` endpoint attempts to trigger a webhook. You will need to replace `https://webhook.site/YOUR_WEBHOOK_ID` in `server.js` with your actual webhook URL to test this functionality.
