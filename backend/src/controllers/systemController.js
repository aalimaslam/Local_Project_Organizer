const systemService = require('../services/systemService');
const { exec } = require('child_process');
const { Project, Note, Label } = require('../models');

exports.getActivePorts = (req, res) => {
  res.json(systemService.getActivePorts());
};

exports.scanDir = (req, res) => {
  try {
    res.json(systemService.scanDirectory(req.query.path));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.openVSCode = async (req, res) => {
  const { path: projPath } = req.body;
  exec(`code "${projPath}"`, { cwd: projPath }, async (err) => {
    if (err) return res.status(500).json({ error: 'Failed to open VS Code' });
    const project = await Project.findOne({ where: { path: projPath } });
    if (project) {
      await project.update({ lastOpened: new Date() });
    }
    res.json({ message: 'VS Code opened' });
  });
};

exports.openFolder = (req, res) => {
  const { path: projPath } = req.body;
  exec(`explorer "${projPath}"`, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to open folder' });
    res.json({ message: 'Folder opened' });
  });
};

exports.runProject = async (req, res) => {
    const { path: projPath, startCommand } = req.body;
    if (!startCommand) return res.status(400).json({ error: 'Start command required' });
    
    // In a real prod app, you might want to manage processes. 
    // For LocalOrg, we just spawn and detach.
    exec(`start cmd /k "${startCommand}"`, { cwd: projPath }, async (err) => {
        if (err) return res.status(500).json({ error: 'Failed to run project' });
        const project = await Project.findOne({ where: { path: projPath } });
        if (project) {
          await project.update({ lastOpened: new Date() });
        }
        res.json({ message: 'Project started' });
    });
};

exports.getStats = async (req, res) => {
  try {
    const total = await Project.count();
    const pinned = await Project.count({ where: { pinned: true } });
    const groups = (await Project.findAll({ attributes: ['groupName'], group: 'groupName' })).filter(p => p.groupName).length;
    const withStartCmd = await Project.count({ where: { startCommand: { [require('sequelize').Op.ne]: null } } });
    const totalNotes = await Note.count();
    const activePorts = systemService.getActivePorts().length;
    
    // Labeled projects count
    const allProjects = await Project.findAll();
    const labeled = allProjects.filter(p => p.tags && p.tags.length > 0 || p.labels && p.labels.length > 0).length;

    res.json({
      total, pinned, labeled, groups, withStartCmd, totalNotes, activePorts
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
