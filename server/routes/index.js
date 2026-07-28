import express from 'express';

const router = express.Router();

/**
 * @route   GET /
 * @desc    Welcome root route
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to ShipShaft API',
  });
});

export default router;
