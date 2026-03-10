# How to Run the Earthworm Backend

The Earthworm backend is a FastAPI application that acts as a bridge between the React frontend and n8n webhooks. This guide will walk you through the steps to set up and run it on your machine.

## Prerequisites

- **Python 3.10+**: Ensure you have Python installed. You can check by running `python --version` in your terminal.
- **n8n**: Make sure your n8n instance is running if you want to test the full AI functionality.

## Step-by-Step Instructions

### 1. Navigate to the Backend Directory

Open your terminal and change the directory to the backend folder:

```bash
cd app/src/backend
```

### 2. Set Up a Virtual Environment (Recommended)

A virtual environment keeps the project's dependencies separate from your global Python installation.

**On Windows:**

```powershell
python -m venv venv
.\venv\Scripts\activate
```

**On macOS/Linux:**

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

Install the required Python packages using `pip`:

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the `app/src/backend` directory (if it doesn't exist) and configure your settings. You can use `.env.example` as a template.

```bash
cp .env.example .env
```

Key settings in `.env`:

- `HOST`: `0.0.0.0` (accessible from any IP)
- `PORT`: `8000` (default port)
- `N8N_WEBHOOK_URL`: The URL of your n8n webhook.

### 5. Start the Backend Server

Run the `main.py` script to start the FastAPI server:

```bash
python main.py
```

The server will start, typically on `http://localhost:8000`. You should see output indicating that the application startup is complete.

## Verifying the Setup

You can verify that the backend is running correctly by visiting the health check endpoint in your browser or using `curl`:

```bash
curl http://localhost:8000/health
```

A successful response will look like this:

```json
{
  "status": "healthy",
  "timestamp": "2026-02-27T20:25:00",
  "version": "1.0.0",
  "n8n_connected": true
}
```

## Troubleshooting

- **CORS Errors**: If the frontend cannot communicate with the backend, ensure your frontend URL (e.g., `http://localhost:5173`) is listed in the `ALLOWED_ORIGINS` section of your `.env` file.
- **Port Already in Use**: If you get an error saying port 8000 is in use, you can change the `PORT` in your `.env` file and restart the server.
- **n8n Connection**: If `n8n_connected` is `false` in the health check, verify that n8n is running and your `N8N_WEBHOOK_URL` is correct.
