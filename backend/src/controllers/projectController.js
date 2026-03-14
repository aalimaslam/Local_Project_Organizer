const { Project, Note, Label, Setting } = require('../models');
const systemService = require('../services/systemService');
const AIService = require('../services/aiService');
const fs = require('fs');

exports.getAll = async (req, res) => {
  try {
    const projects = await Project.findAll({ order: [['name', 'ASC']] });
    // Add health check on the fly
    const results = projects.map(p => {
      const plain = p.get({ plain: true });
      plain.health = fs.existsSync(plain.path);
      return plain;
    });
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await project.update(req.body);
    res.json(project);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await project.destroy();
    res.json({ message: 'Project deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getGitStatuses = async (req, res) => {
  try {
    const projects = await Project.findAll();
    const statuses = {};
    for (const p of projects) {
      const info = systemService.getGitInfo(p.path);
      if (info) statuses[p.id] = info;
    }
    res.json(statuses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.analyze = async (req, res) => {
  try {
    const { path } = req.body;
    const context = systemService.getProjectContext(path);
    const settingsSetting = await Setting.findByPk('ai_config');
    const labels = await Label.findAll();
    
    const aiService = new AIService(settingsSetting?.value || {});
    const analysis = await aiService.analyzeProject(context, labels.map(l => ({ id: l.id, name: l.name })));
    res.json(analysis);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.analyzeBulk = async (req, res) => {
  try {
    const { paths } = req.body;
    const projectContexts = paths.map(p => ({ path: p, context: systemService.getProjectContext(p) }));
    const settingsSetting = await Setting.findByPk('ai_config');
    const labels = await Label.findAll();

    const aiService = new AIService(settingsSetting?.value || {});
    const analyses = await aiService.analyzeProjectsBulk(projectContexts, labels.map(l => ({ id: l.id, name: l.name })));
    res.json(analyses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
