import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const WORKSPACE_DIR = path.join(__dirname, '../user_workspace');

if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR);
}

app.get('/files', (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(WORKSPACE_DIR);
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list files' });
  }
});

app.get('/files/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename as string;
    const filepath = path.join(WORKSPACE_DIR, filename);
    if (fs.existsSync(filepath)) {
      const content = fs.readFileSync(filepath, 'utf-8');
      res.json({ content });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to read file' });
  }
});

app.post('/files/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename as string;
    const { content } = req.body;
    const filepath = path.join(WORKSPACE_DIR, filename);
    fs.writeFileSync(filepath, content);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save file' });
  }
});

app.post('/run/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename as string;
  const filepath = path.join(WORKSPACE_DIR, filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Determine command based on extension (very basic for now)
  let command = '';
  if (filename.endsWith('.js')) {
    command = `node ${filepath}`;
  } else if (filename.endsWith('.ts')) {
      command = `npx ts-node ${filepath}`;
  } else if (filename.endsWith('.py')) {
    command = `python3 ${filepath}`;
  } else {
    return res.status(400).json({ error: 'Unsupported file type for execution' });
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      // Return error but also stdout/stderr if available
      return res.json({ output: stdout + '\n' + stderr, error: error.message });
    }
    res.json({ output: stdout || stderr });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
