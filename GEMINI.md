# GEMINI Project Context: Life-OS

This document provides a comprehensive overview of the Life-OS project, its structure, and how to build and run it.

## 1. Project Overview

Life-OS is a full-stack task management web application. It allows users to organize their tasks within a hierarchical structure of "Spaces" and "Projects".

- **Frontend:** A single-page application (SPA) built with **React** and **Vite**. It handles user authentication and provides the user interface for managing tasks, projects, and spaces.
- **Backend:** A **Node.js** server using the **Express** framework. It exposes a RESTful API for all data operations, handles user authentication with JSON Web Tokens (JWT), and connects to a PostgreSQL database.
- **Database:** **PostgreSQL**. The schema includes tables for `users`, `spaces`, `projects`, and `tasks`, establishing relationships for a structured data model.

## 2. Key Technologies

- **Backend:** Node.js, Express.js, PostgreSQL (`pg`), JWT (`jsonwebtoken`), `bcryptjs`, `cors`, `dotenv`
- **Frontend:** React, Vite, `axios`
- **Development:** `eslint` for linting.

## 3. Building and Running

### 3.1. Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env` file in the `backend` directory and add the following variables. Replace the placeholder values with your PostgreSQL and application settings.

    ```env
    # PostgreSQL Connection
    DB_USER=your_db_user
    DB_HOST=localhost
    DB_NAME=life_os_db
    DB_PASSWORD=your_db_password
    DB_PORT=5432

    # Application Settings
    PORT=3000
    JWT_SECRET=your_super_secret_jwt_key
    ```

4.  **Initialize the Database:**
    Run the following command to create the necessary tables in your PostgreSQL database.
    ```bash
    node db_init.js
    ```

5.  **Start the Server:**
    ```bash
    node server.js
    ```
    The server will start on the port specified in your `.env` file (e.g., `http://localhost:3000`).

### 3.2. Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The React application will start, typically on `http://localhost:5173`, and will connect to the backend API running on port 3000.

4.  **Build for Production:**
    To create a production build of the frontend, run:
    ```bash
    npm run build
    ```
    The output will be in the `frontend/dist` directory.

## 4. Development Conventions

- **Monorepo Structure:** The project is organized into two main folders, `frontend` and `backend`, keeping the client and server codebases separate but within the same repository.
- **API Communication:** The frontend uses the `axios` library to make requests to the backend API. API-related functions are organized in the `frontend/src/api/` directory.
- **Authentication:** The backend uses JWT-based authentication. The frontend sends the token in the `Authorization` header for protected routes. Authentication state is managed globally on the frontend using React's Context API (`frontend/src/context/AuthContext.jsx`).
- **Database Schema:** The database structure is defined imperatively in `backend/db_init.js`. Any changes to the database schema should be made in this file and applied by re-running it.
- **Styling:** Basic CSS is used for styling, located in `frontend/src/index.css`.
