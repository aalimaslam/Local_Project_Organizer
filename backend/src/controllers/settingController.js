const { Setting } = require('../models');

exports.getAIConfig = async (req, res) => {
  try {
    const setting = await Setting.findByPk('ai_config');
    res.json(setting?.value || {});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.updateAIConfig = async (req, res) => {
  try {
    await Setting.upsert({
      key: 'ai_config',
      value: req.body
    });
    res.json({ message: 'Settings saved' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
