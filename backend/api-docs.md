# API Documentation

## Endpoints

### `POST /signup`

Registers a new user.

- **Method:** `POST`
- **URL:** `/signup`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "role": "psp"
  }
  ```
- **Success Response:**
  - **Code:** `201 Created`
  - **Content:**
    ```json
    {
      "message": "User registered successfully"
    }
    ```
- **Error Responses:**
  - **Code:** `400 Bad Request` (e.g., missing fields, invalid role)
  - **Code:** `409 Conflict` (e.g., user with email already exists)

### `POST /login`

Authenticates a user and returns a JWT.

- **Method:** `POST`
- **URL:** `/login`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Success Response:**
  - **Code:** `200 OK`
  - **Content:**
    ```json
    {
      "token": "your_jwt_token_here"
    }
    ```
- **Error Responses:**
  - **Code:** `400 Bad Request` (e.g., missing fields)
  - **Code:** `401 Unauthorized` (e.g., invalid credentials)

### `GET /transactions`

Returns a mock list of transactions for the authenticated user.

- **Method:** `GET`
- **URL:** `/transactions`
- **Headers:**
  - `Authorization: Bearer <your_jwt_token>`
- **Success Response:**
  - **Code:** `200 OK`
  - **Content:**
    ```json
    [
      {
        "recipient": "John Doe",
        "amount": 100.50,
        "currency": "USD",
        "timestamp": "2023-10-27T10:00:00Z"
      },
      {
        "recipient": "Jane Smith",
        "amount": 50.00,
        "currency": "EUR",
        "timestamp": "2023-10-26T15:30:00Z"
      }
    ]
    ```
- **Error Responses:**
  - **Code:** `401 Unauthorized` (e.g., missing or invalid token)

### `POST /send`

Accepts payment data and returns success or failure.

- **Method:** `POST`
- **URL:** `/send`
- **Headers:**
  - `Authorization: Bearer <your_jwt_token>`
- **Request Body:**
  ```json
  {
    "recipient": "Alice",
    "amount": 25.00,
    "currency": "USD"
  }
  ```
- **Success Response:**
  - **Code:** `200 OK`
  - **Content:**
    ```json
    {
      "message": "Payment successful",
      "transactionId": "mock_transaction_id"
    }
    ```
- **Error Responses:**
  - **Code:** `400 Bad Request` (e.g., missing fields, invalid amount)
  - **Code:** `401 Unauthorized` (e.g., missing or invalid token)
  - **Code:** `500 Internal Server Error` (e.g., payment processing failure)

### Webhook (Bonus)

When `POST /send` is called, a `POST` request is triggered to a mock webhook URL.

- **Method:** `POST`
- **URL:** `https://usewebhook.com/` (mock URL)
- **Request Body:** (Example, actual content may vary)
  ```json
  {
    "event": "payment_sent",
    "transaction": {
      "recipient": "Alice",
      "amount": 25.00,
      "currency": "USD",
      "timestamp": "2023-10-27T11:00:00Z"
    }
  }
  ```
