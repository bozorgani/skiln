const express = require('express');
const auth = require('../../middlewares/auth');
const adminController = require('./admin.controller');

const router = express.Router();

// تمام routes نیاز به احراز هویت admin دارند
router.use(auth('admin'));

router.get('/stats', adminController.getStats);

module.exports = router;

