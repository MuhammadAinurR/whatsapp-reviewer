const express = require('express');
const whatsappController = require('../controllers/whatsapp.controller');

const router = express.Router();

router.get('/', whatsappController.healthCheck);

module.exports = router; 