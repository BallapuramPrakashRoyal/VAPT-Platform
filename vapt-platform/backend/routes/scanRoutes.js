const express = require('express');
const router = express.Router();
const { createScan, getScans, getScanById, deleteScan } = require('../controllers/scanController');
const { validateTarget } = require('../middleware/validateTarget');

router.route('/').post(validateTarget, createScan).get(getScans);
router.route('/:id').get(getScanById).delete(deleteScan);

module.exports = router;
