const fs = require('fs');
const path = require('path');
const { Project, Note, Label, Setting } = require('../models');
const sequelize = require('../config/database');

const DATA_DIR = path.join(__dirname, '../../');

async function migrate() {
  await sequelize.sync({ force: true }); // Clear db for clean migration
  console.log('Starting migration...');

  // 1. Labels
  const labelsFile = path.join(DATA_DIR, 'labels.json');
  if (fs.existsSync(labelsFile)) {
    const labels = JSON.parse(fs.readFileSync(labelsFile, 'utf-8'));
    for (const l of labels) {
      await Label.create(l);
    }
    console.log(`Migrated ${labels.length} labels.`);
  }

  // 2. Settings
  const settingsFile = path.join(DATA_DIR, 'settings.json');
  if (fs.existsSync(settingsFile)) {
    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
    await Setting.create({ key: 'ai_config', value: settings });
    console.log('Migrated settings.');
  }

  // 3. Projects
  const projectsFile = path.join(DATA_DIR, 'projects.json');
  if (fs.existsSync(projectsFile)) {
    const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf-8'));
    const seenPaths = new Set();
    let count = 0;
    for (const p of projects) {
      if (seenPaths.has(p.path)) continue;
      seenPaths.add(p.path);
      
      const data = {
        id: p.id,
        name: p.name,
        description: p.description,
        path: p.path,
        startCommand: p.startCommand,
        pinned: p.pinned || false,
        groupName: p.groupName,
        lastOpened: p.lastOpened ? new Date(p.lastOpened) : null,
        tags: Array.isArray(p.tags) ? p.tags : [],
        status: p.status || 'idle'
      };
      await Project.create(data);
      count++;
    }
    console.log(`Migrated ${count} unique projects.`);
  }

  // 4. Notes
  const notesFile = path.join(DATA_DIR, 'notes.json');
  if (fs.existsSync(notesFile)) {
    const notesMap = JSON.parse(fs.readFileSync(notesFile, 'utf-8'));
    let noteCount = 0;
    for (const projectId in notesMap) {
      // Check if project exists
      const p = await Project.findByPk(projectId);
      if (!p) {
        console.warn(`Skipping notes for missing project: ${projectId}`);
        continue;
      }

      const notes = notesMap[projectId];
      for (const n of notes) {
        await Note.create({
          id: n.id,
          content: n.content,
          labels: n.labels || [],
          projectId: projectId,
          createdAt: n.createdAt ? new Date(n.createdAt) : new Date()
        });
        noteCount++;
      }
    }
    console.log(`Migrated ${noteCount} notes.`);
  }

  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
