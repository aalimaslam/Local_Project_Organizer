const { Label } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const labels = await Label.findAll({ order: [['name', 'ASC']] });
    res.json(labels);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const label = await Label.create(req.body);
    res.status(201).json(label);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const label = await Label.findByPk(req.params.id);
    if (!label) return res.status(404).json({ error: 'Label not found' });
    await label.destroy();
    res.json({ message: 'Label deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
