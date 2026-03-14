const Project = require('./Project');
const Note = require('./Note');
const Label = require('./Label');
const Setting = require('./Setting');
const Secret = require('./Secret');

// Associations
Project.hasMany(Note, { foreignKey: 'projectId', as: 'projectNotes', onDelete: 'CASCADE' });
Note.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Project.hasMany(Secret, { foreignKey: 'projectId', as: 'projectSecrets', onDelete: 'CASCADE' });
Secret.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

module.exports = {
  Project,
  Note,
  Label,
  Setting,
  Secret,
};
