const { Secret, Project, Setting } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const { projectId } = req.query;
    const where = projectId ? { projectId } : {};
    const secrets = await Secret.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(secrets);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { key, value, category, projectId, description } = req.body;
    const secret = await Secret.create({ key, value, category, projectId, description });
    res.status(201).json(secret);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { key, value, category, projectId, description } = req.body;
    const secret = await Secret.findByPk(req.params.id);
    if (!secret) return res.status(404).json({ error: 'Secret not found' });
    await secret.update({ key, value, category, projectId, description });
    res.json(secret);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const secret = await Secret.findByPk(req.params.id);
    if (!secret) return res.status(404).json({ error: 'Secret not found' });
    await secret.destroy();
    res.json({ message: 'Secret deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Vault Management
exports.getVaultStatus = async (req, res) => {
  try {
    const setting = await Setting.findByPk('vault_password');
    res.json({ initialized: !!setting });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.initVault = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });

    const existing = await Setting.findByPk('vault_password');
    if (existing) return res.status(400).json({ error: 'Vault already initialized' });

    await Setting.create({
      key: 'vault_password',
      value: password // In a real app we'd hash this, but simplified as requested
    });

    res.json({ message: 'Vault initialized' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.verifyVault = async (req, res) => {
  try {
    const { password } = req.body;
    const setting = await Setting.findByPk('vault_password');
    
    if (!setting) return res.status(400).json({ error: 'Vault not initialized' });

    if (setting.value === password) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Incorrect password' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
