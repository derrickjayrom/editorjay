import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as pty from 'node-pty';
import os from 'os';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const WORKSPACE_DIR = path.join(__dirname, '../user_workspace');

if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR);
}

// Socket.IO Terminal Logic
io.on('connection', (socket) => {
  console.log('Client connected to socket');

  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
  
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: WORKSPACE_DIR,
    env: process.env
  });

  // Pipe PTY output to socket
  ptyProcess.onData((data: string) => {
    socket.emit('output', data);
  });

  // Pipe socket input to PTY
  socket.on('input', (data: string) => {
    ptyProcess.write(data);
  });

  socket.on('resize', ({ cols, rows }: { cols: number, rows: number }) => {
    ptyProcess.resize(cols, rows);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    ptyProcess.kill();
  });
});

// Helper to get directory contents
app.get('/files', (req: Request, res: Response) => {
  const dirPath = (req.query.path as string) || os.homedir(); // Default to home dir
  
  try {
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
        return res.status(400).json({ error: 'Invalid directory path' });
    }

    const dirents = fs.readdirSync(dirPath, { withFileTypes: true });
    const files = dirents.map(dirent => ({
      name: dirent.name,
      isDirectory: dirent.isDirectory(),
      path: path.join(dirPath, dirent.name)
    }));

    // Sort: Directories first, then files
    files.sort((a, b) => {
        if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
        return a.isDirectory ? -1 : 1;
    });

    res.json({ currentPath: dirPath, files });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list files', details: err });
  }
});

// Read file content
app.get('/files/content', (req: Request, res: Response) => {
  try {
    const filepath = req.query.path as string;
    if (!filepath) {
        return res.status(400).json({ error: 'Path is required' });
    }

    if (fs.existsSync(filepath)) {
      // Basic check to minimize reading huge binaries
      const stats = fs.statSync(filepath);
      if (stats.size > 1024 * 1024 * 5) { // 5MB limit for now
          return res.status(400).json({ error: 'File too large' });
      }

      const content = fs.readFileSync(filepath, 'utf-8');
      res.json({ content });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// Save file content
app.post('/files/save', (req: Request, res: Response) => {
  try {
    const { path: filepath, content } = req.body;
    
    if (!filepath) {
        return res.status(400).json({ error: 'Path is required' });
    }

    fs.writeFileSync(filepath, content);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// Run file
app.post('/run', (req: Request, res: Response) => {
  const { path: filepath } = req.body;

  if (!filepath || !fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Determine command based on extension
  let command = '';
  if (filepath.endsWith('.js')) {
    command = `node "${filepath}"`;
  } else if (filepath.endsWith('.ts')) {
      command = `npx ts-node "${filepath}"`;
  } else if (filepath.endsWith('.py')) {
    command = `python3 "${filepath}"`;
  } else {
    // Attempt to execute directly if executable, or fail
    return res.status(400).json({ error: 'Unsupported file type for execution' });
  }

  const execDir = path.dirname(filepath);

  exec(command, { cwd: execDir }, (error, stdout, stderr) => {
    if (error) {
      return res.json({ output: stdout + '\n' + stderr, error: error.message });
    }
    res.json({ output: stdout || stderr });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
