const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const supportController = require('../controllers/supportController');

const router = express.Router();

// Get tickets under review (not assigned to anyone)
router.get('/tickets/under-review', authenticateToken, authorizeRole('support'), supportController.listUnderReview);

// Get tickets assigned to current support agent
router.get('/tickets/assigned', authenticateToken, authorizeRole('support'), supportController.listAssigned);

// Get single ticket details
router.get('/tickets/:id', authenticateToken, authorizeRole('support'), supportController.getTicketById);

// Assign ticket to current support agent
router.patch('/tickets/:id/assign', authenticateToken, authorizeRole('support'), supportController.assignTicket);

// Update ticket status
router.patch('/tickets/:id/status', authenticateToken, authorizeRole('support'), [
  body('status').isIn(['assigned', 'in-progress', 'resolved', 'closed']).withMessage('Invalid status'),
  body('resolution').optional().trim()
], supportController.updateTicketStatus);

// Add message to ticket
router.post('/tickets/:id/messages', authenticateToken, authorizeRole('support'), [
  body('message').trim().isLength({ min: 1 }).withMessage('Message cannot be empty'),
  body('isInternal').optional().isBoolean().withMessage('isInternal must be a boolean')
], supportController.addMessageAsSupport);

// Get support analytics
router.get('/analytics', authenticateToken, authorizeRole('support'), supportController.analytics || ((req, res) => res.status(501).json({ message: 'Not implemented in controller' })));

// Get ticket categories and priorities for filters
router.get('/meta/filters', authenticateToken, authorizeRole('support'), (req, res) => {
  const categories = [
    { value: 'order', label: 'Order Issues' },
    { value: 'product', label: 'Product Issues' },
    { value: 'payment', label: 'Payment Issues' },
    { value: 'account', label: 'Account Issues' },
    { value: 'technical', label: 'Technical Issues' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const statuses = [
    { value: 'open', label: 'Open' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  res.json({ categories, priorities, statuses });
});

module.exports = router;
