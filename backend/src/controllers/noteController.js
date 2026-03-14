const { Note } = require('../models');

exports.getByProject = async (req, res) => {
  try {
    const notes = await Note.findAll({
      where: { projectId: req.params.projectId },
      order: [['createdAt', 'DESC']]
    });
    res.json(notes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const note = await Note.create({
      ...req.body,
      projectId: req.params.projectId
    });
    res.status(201).json(note);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    await note.update(req.body);
    res.json(note);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    await note.destroy();
    res.json({ message: 'Note deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
