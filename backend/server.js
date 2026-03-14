const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const LLMService = require('./aiService');

const app = express();
const PORT = process.env.PORT || 6001;
const PROJECTS_FILE = path.join(__dirname, 'projects.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

app.use(cors());
app.use(express.json());

// Helper to read projects
function getProjects() {
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify([], null, 2));
  }
  const data = fs.readFileSync(PROJECTS_FILE, 'utf-8');
  return JSON.parse(data || '[]');
}

// Helper to write projects
function saveProjects(projects) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

// Helper for settings
function getSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
      provider: 'openai',
      apiKey: '',
      model: 'gpt-3.5-turbo',
      baseURL: 'https://api.openai.com/v1'
    }, null, 2));
  }
  return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
}

function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// Get all projects
app.get('/projects', (req, res) => {
  res.json(getProjects());
});

// Add a project
app.post('/projects', (req, res) => {
  const { name, description, path: projectPath, tags, startCommand } = req.body;
  if (!name || !projectPath) {
    return res.status(400).json({ error: 'Name and path are required' });
  }

  const projects = getProjects();
  const newProject = {
    id: Date.now().toString(),
    name,
    description: description || '',
    path: projectPath,
    tags: tags || [],
    startCommand: startCommand || '',
    status: 'stopped'
  };

  projects.push(newProject);
  saveProjects(projects);

  res.status(201).json(newProject);
});

// Delete a project
app.delete('/projects/:id', (req, res) => {
  const { id } = req.params;
  let projects = getProjects();
  
  const initialLength = projects.length;
  projects = projects.filter(p => p.id !== id);
  
  if (projects.length === initialLength) {
    return res.status(404).json({ error: 'Project not found' });
  }

  saveProjects(projects);
  res.json({ message: 'Project deleted successfully' });
});

// Run project
app.post('/run', (req, res) => {
  const { path: projectPath, startCommand } = req.body;
  if (!projectPath) return res.status(400).json({ error: 'Path is required' });

  let command;
  if (startCommand) {
    command = startCommand;
  } else {
    const scriptPath = path.join(projectPath, 'start.ps1');
    command = `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`;
  }

  console.log(`Execution command: ${command}`);

  exec(command, { cwd: projectPath }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running command: ${error}`);
      return;
    }
  });

  res.json({ message: 'Project script started in background.' });
});

// Scan directory
app.get('/scan-dir', (req, res) => {
  const { path: dirPath } = req.query;
  if (!dirPath) return res.status(400).json({ error: 'Path is required' });

  try {
    if (!fs.existsSync(dirPath)) {
      return res.status(404).json({ error: 'Directory does not exist' });
    }
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    const directories = files
      .filter(dirent => dirent.isDirectory())
      .map(dirent => ({
        name: dirent.name,
        path: path.join(dirPath, dirent.name)
      }));
    res.json(directories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze project
app.post('/analyze-project', async (req, res) => {
  const { path: projectPath } = req.body;
  if (!projectPath) return res.status(400).json({ error: 'Path is required' });

  try {
    const context = {
      fileStructure: fs.readdirSync(projectPath)
    };
    const filesToRead = [
      'package.json', 'README.md', 'requirements.txt', 'go.mod', 'pom.xml',
      'Cargo.toml', 'Gemfile', 'composer.json', 'build.gradle', 'Makefile',
      'docker-compose.yml'
    ];

    for (const file of filesToRead) {
      const filePath = path.join(projectPath, file);
      if (fs.existsSync(filePath)) {
        context[file] = fs.readFileSync(filePath, 'utf-8').slice(0, 2000); // Limit context size
      }
    }

    const settings = getSettings();
    const aiService = new LLMService(settings);
    const analysis = await aiService.analyzeProject(context);

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Settings endpoints
app.get('/settings', (req, res) => {
  res.json(getSettings());
});

app.post('/settings', (req, res) => {
  saveSettings(req.body);
  res.json({ message: 'Settings saved' });
});

// Open VS Code
app.post('/open-vscode', (req, res) => {
  const { path: projectPath } = req.body;
  if (!projectPath) return res.status(400).json({ error: 'Path is required' });

  exec(`code "${projectPath}"`, { cwd: projectPath }, (error) => {
    if (error) {
       console.error(`Error opening VS Code: ${error}`);
       return res.status(500).json({ error: 'Failed to open VS Code' });
    }
    res.json({ message: 'VS Code opened' });
  });
});

// Open Folder
app.post('/open-folder', (req, res) => {
  const { path: projectPath } = req.body;
  if (!projectPath) return res.status(400).json({ error: 'Path is required' });

  exec(`explorer "${projectPath}"`, (error) => {
    if (error) {
       console.error(`Error opening folder: ${error}`);
       return res.status(500).json({ error: 'Failed to open folder' });
    }
    res.json({ message: 'Folder opened' });
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
