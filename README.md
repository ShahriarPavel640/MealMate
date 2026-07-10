itg

# Food Panda App

This project consists of a React frontend, a Node.js backend, and a PostgreSQL database (with PostGIS) running via Docker.

## Prerequisites

- Docker & Docker Compose
- Node.js & npm

## How to Run the Project

### 1. Start the Database

The project uses an isolated Docker container for the database (running on port `5434`) to prevent conflicts with other local projects.

Open a terminal in the root of the `food_panda` directory and run:

```bash
docker compose up -d
```

*(Note: The database is automatically seeded with the schema and test data upon its first creation).*

### 2. Start the Backend

Open a new terminal, navigate to the `backend` folder, and start the development server:

```bash
cd backend
npm run dev
```

The backend runs on **http://localhost:5001** and uses `nodemon` for auto-restarts on file changes.

### 3. Start the Frontend

Open another terminal, navigate to the `frontend` folder, and start the Vite development server:

```bash
cd frontend
npm run dev
```

The frontend application will be available at **http://localhost:5173**.

## Stopping the Project

To stop the database, run this command from the root directory:

```bash
docker compose down
```

To stop the frontend and backend servers, simply press `Ctrl + C` in their respective terminals.
