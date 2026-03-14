const express = require('express');
const router = express.Router();

const projectCtrl = require('../controllers/projectController');
const noteCtrl = require('../controllers/noteController');
const labelCtrl = require('../controllers/labelController');
const systemCtrl = require('../controllers/systemController');
const settingCtrl = require('../controllers/settingController');
const secretCtrl = require('../controllers/secretController');

// Projects
router.get('/projects', projectCtrl.getAll);
router.post('/projects', projectCtrl.create);
router.patch('/projects/:id', projectCtrl.update);
router.delete('/projects/:id', projectCtrl.delete);
router.get('/projects/git', projectCtrl.getGitStatuses);
router.post('/analyze-project', projectCtrl.analyze);
router.post('/analyze-projects-bulk', projectCtrl.analyzeBulk);

// Notes
router.get('/projects/:projectId/notes', noteCtrl.getByProject);
router.post('/projects/:projectId/notes', noteCtrl.create);
router.patch('/projects/:projectId/notes/:id', noteCtrl.update);
router.delete('/projects/:projectId/notes/:id', noteCtrl.delete);

// Labels
router.get('/labels', labelCtrl.getAll);
router.post('/labels', labelCtrl.create);
router.delete('/labels/:id', labelCtrl.delete);

// System / Dashboard
router.get('/stats', systemCtrl.getStats);
router.get('/ports/active', systemCtrl.getActivePorts);
router.get('/scan-dir', systemCtrl.scanDir);
router.post('/run', systemCtrl.runProject);
router.post('/open-vscode', systemCtrl.openVSCode);
router.post('/open-folder', systemCtrl.openFolder);

// Settings
router.get('/settings', settingCtrl.getAIConfig);
router.post('/settings', settingCtrl.updateAIConfig);
 
// Secrets
router.get('/secrets', secretCtrl.getAll);
router.post('/secrets', secretCtrl.create);
router.patch('/secrets/:id', secretCtrl.update);
router.delete('/secrets/:id', secretCtrl.delete);

// Vault Management
router.get('/vault/status', secretCtrl.getVaultStatus);
router.post('/vault/init', secretCtrl.initVault);
router.post('/vault/verify', secretCtrl.verifyVault);
 
module.exports = router;
