const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SystemService {
  getActivePorts() {
    try {
      const out = execSync('netstat -ano -p TCP', { timeout: 5000 }).toString();
      let tasklistOut = '';
      try {
        tasklistOut = execSync('tasklist /fo csv /nh', { timeout: 5000 }).toString();
      } catch {}

      const pidToProg = new Map();
      if (tasklistOut) {
        tasklistOut.split('\n').forEach(line => {
          const m = line.split('","');
          if (m.length > 1) {
            const prog = m[0].replace('"', '');
            const pidStr = m[1].replace('"', '');
            const pid = parseInt(pidStr);
            if (!isNaN(pid)) pidToProg.set(pid, prog);
          }
        });
      }

      const listening = new Map();
      out.split('\n').forEach(line => {
        const m = line.match(/LISTENING\s+(\d+)/i);
        if (!m) return;
        const parts = line.trim().split(/\s+/);
        const localAddr = parts[1] || '';
        const pid = parseInt(parts[parts.length - 1]);
        const portMatch = localAddr.match(/:(\d+)$/);
        if (portMatch) {
          const port = parseInt(portMatch[1]);
          if (port > 0 && port < 65536 && !listening.has(port)) {
            listening.set(port, { port, pid, processName: pidToProg.get(pid) || '' });
          }
        }
      });
      return Array.from(listening.values()).sort((a, b) => a.port - b.port);
    } catch {
      return [];
    }
  }

  getGitInfo(projectPath) {
    if (!fs.existsSync(path.join(projectPath, '.git'))) return null;
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: projectPath, stdio: 'pipe' }).toString().trim();
      const status = execSync('git status --porcelain', { cwd: projectPath, stdio: 'pipe' }).toString().trim();
      const lastCommit = execSync('git log -1 --format=%cr', { cwd: projectPath, stdio: 'pipe' }).toString().trim();
      return { branch, hasUncommitted: status.length > 0, lastCommit };
    } catch {
      return null;
    }
  }

  scanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) throw new Error('Directory does not exist');
    return fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'node_modules')
      .map(d => ({ name: d.name, path: path.join(dirPath, d.name) }));
  }

  getProjectContext(projectPath) {
    const context = { fileStructure: [] };
    try { context.fileStructure = fs.readdirSync(projectPath).slice(0, 50); } catch {}
    const filesToRead = [
      'package.json', 'README.md', 'requirements.txt', 'go.mod', 'pom.xml',
      'Cargo.toml', 'Gemfile', 'composer.json', 'Makefile', 'docker-compose.yml'
    ];
    for (const file of filesToRead) {
      const filePath = path.join(projectPath, file);
      if (fs.existsSync(filePath)) {
        try { context[file] = fs.readFileSync(filePath, 'utf-8').slice(0, 1500); } catch {}
      }
    }
    return context;
  }
}

module.exports = new SystemService();
