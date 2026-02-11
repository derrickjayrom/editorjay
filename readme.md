# EditorJay

A simple web-based code editor that allows you to create, edit, and run code files.

## Project Structure

- **client**: React application (Vite) for the frontend editor interface.
- **server**: Node.js/Express server that handles file operations and code execution.
- **user_workspace**: A directory created by the server to store user files.

## Prerequisites

- Node.js (v14+ recommended)
- npm

## Getting Started

You need to run both the server and the client simultaneously.

### 1. Start the Backend Server

The server runs on port **3001** and manages the file system.

```bash
cd server
npm install
npm run dev
```

### 2. Start the Frontend Client

The client runs on port **5173** (default) and connects to the backend.

Open a new terminal window/tab:

```bash
cd client
npm install
npm run dev
```

### 3. Usage

1.  Open your browser and navigate to `http://localhost:5173`.
2.  Use the **Sidebar** to view and select files.
3.  Click **"+ New"** to create a new file (e.g., `script.js`).
4.  Write your code in the editor.
5.  Click **"Save"** to save changes to the server.
6.  Click **"Run"** to execute the code on the server and see the output.

### Supported Languages for Execution

The backend currently supports execution for:

- `.js` (Node.js)
- `.ts` (ts-node)
- `.py` (Python 3 - requires python3 installed on host)

## Features

- **File Explorer**: Create and list files from the `user_workspace`.
- **Code Editor**: Syntax highlighting and line numbers.
- **Remote Execution**: Run code securely on the backend server.
