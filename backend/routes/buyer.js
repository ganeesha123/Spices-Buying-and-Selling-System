const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const orderController = require('../controllers/orderController');
const supportController = require('../controllers/supportController');

const router = express.Router();

// Create new order
router.post('/orders', authenticateToken, authorizeRole('buyer'), [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product').isMongoId().withMessage('Invalid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress.street').notEmpty().withMessage('Street address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.postalCode').notEmpty().withMessage('Postal code is required'),
  body('shippingAddress.phone').notEmpty().withMessage('Phone number is required')
], orderController.createOrder);

// Get buyer's orders
router.get('/orders', authenticateToken, authorizeRole('buyer'), orderController.getOrders);

// Get single order
router.get('/orders/:id', authenticateToken, authorizeRole('buyer'), orderController.getOrderById);

// Cancel order (only if status is pending)
router.patch('/orders/:id/cancel', authenticateToken, authorizeRole('buyer'), orderController.cancelOrder);

// Create support ticket
router.post('/support/tickets', authenticateToken, authorizeRole('buyer'), [
  body('subject').trim().isLength({ min: 5 }).withMessage('Subject must be at least 5 characters'),
  body('description').trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('category').isIn(['order', 'product', 'payment', 'account', 'technical', 'other']).withMessage('Invalid category'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('relatedOrder').optional().isMongoId().withMessage('Invalid order ID')
], supportController.createTicket);

// Get buyer's support tickets
router.get('/support/tickets', authenticateToken, authorizeRole('buyer'), supportController.getMyTickets);

// Get single support ticket
router.get('/support/tickets/:id', authenticateToken, authorizeRole('buyer'), supportController.getMyTicketById);

// Add message to support ticket
router.post('/support/tickets/:id/messages', authenticateToken, authorizeRole('buyer'), [
  body('message').trim().isLength({ min: 1 }).withMessage('Message cannot be empty')
], supportController.addMessageToMyTicket);

module.exports = router;
