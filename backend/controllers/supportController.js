const { validationResult } = require('express-validator');
const SupportTicket = require('../models/SupportTicket');
const Order = require('../models/Order');

// Buyer-side: Create support ticket
async function createTicket(req, res) {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
		}

		const { subject, description, category, priority, relatedOrder } = req.body;

		// Validate related order if provided
		if (relatedOrder) {
			const order = await Order.findOne({ _id: relatedOrder, buyer: req.user._id });
			if (!order) {
				return res.status(400).json({ message: 'Invalid or unauthorized order reference' });
			}
		}

		const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

		const ticket = new SupportTicket({
			ticketNumber,
			subject,
			description,
			category,
			priority: priority || 'medium',
			submittedBy: req.user._id,
			relatedOrder: relatedOrder || null,
			messages: [{
				sender: req.user._id,
				message: description,
				timestamp: new Date()
			}]
		});

		await ticket.save();
		await ticket.populate([
			{ path: 'submittedBy', select: 'name email' },
			{ path: 'relatedOrder', select: 'orderNumber totalAmount' }
		]);

		res.status(201).json({ message: 'Support ticket created successfully', ticket });

	} catch (error) {
		console.error('Ticket creation error:', error);
		res.status(500).json({ message: 'Failed to create support ticket', error: error.message });
	}
}

// Buyer-side: List own tickets
async function getMyTickets(req, res) {
	try {
		const { page = 1, limit = 10, status } = req.query;
		const filter = { submittedBy: req.user._id };
		if (status && status !== 'all') {
			filter.status = status;
		}

		const tickets = await SupportTicket.find(filter)
			.populate([
				{ path: 'assignedTo', select: 'name email' },
				{ path: 'relatedOrder', select: 'orderNumber totalAmount' }
			])
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(parseInt(limit));

		const total = await SupportTicket.countDocuments(filter);

		res.json({
			tickets,
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(total / limit),
				totalTickets: total,
				hasNext: page * limit < total,
				hasPrev: page > 1
			}
		});

	} catch (error) {
		console.error('Tickets fetch error:', error);
		res.status(500).json({ message: 'Failed to fetch support tickets', error: error.message });
	}
}

// Buyer-side: Get single ticket
async function getMyTicketById(req, res) {
	try {
		const ticket = await SupportTicket.findOne({
			_id: req.params.id,
			submittedBy: req.user._id
		}).populate([
			{ path: 'assignedTo', select: 'name email' },
			{ path: 'relatedOrder', select: 'orderNumber totalAmount items' },
			{ path: 'messages.sender', select: 'name role' }
		]);

		if (!ticket) {
			return res.status(404).json({ message: 'Support ticket not found' });
		}

		res.json({ ticket });

	} catch (error) {
		console.error('Ticket fetch error:', error);
		res.status(500).json({ message: 'Failed to fetch support ticket', error: error.message });
	}
}

// Buyer-side: Add message to own ticket
async function addMessageToMyTicket(req, res) {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
		}

		const { message } = req.body;

		const ticket = await SupportTicket.findOne({ _id: req.params.id, submittedBy: req.user._id });
		if (!ticket) {
			return res.status(404).json({ message: 'Support ticket not found' });
		}

		if (ticket.status === 'closed') {
			return res.status(400).json({ message: 'Cannot add messages to closed tickets' });
		}

		ticket.messages.push({
			sender: req.user._id,
			message,
			timestamp: new Date()
		});

		// Update status if it was resolved
		if (ticket.status === 'resolved') {
			ticket.status = 'in-progress';
		}

		await ticket.save();
		await ticket.populate('messages.sender', 'name role');

		res.json({ message: 'Message added successfully', ticket });

	} catch (error) {
		console.error('Message addition error:', error);
		res.status(500).json({ message: 'Failed to add message', error: error.message });
	}
}

// Support-agent: list under review
async function listUnderReview(req, res) {
	try {
		const { page = 1, limit = 10, category, priority } = req.query;
		const filter = { status: { $in: ['open', 'assigned'] }, assignedTo: null };
		if (category && category !== 'all') filter.category = category;
		if (priority && priority !== 'all') filter.priority = priority;

		const tickets = await SupportTicket.find(filter)
			.populate([
				{ path: 'submittedBy', select: 'name email role' },
				{ path: 'relatedOrder', select: 'orderNumber totalAmount status' }
			])
			.sort({ priority: -1, createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(parseInt(limit));

		const total = await SupportTicket.countDocuments(filter);

		const stats = await SupportTicket.aggregate([
			{ $match: { assignedTo: null } },
			{ $group: { _id: '$priority', count: { $sum: 1 } } }
		]);

		const priorityStats = { urgent: 0, high: 0, medium: 0, low: 0 };
		stats.forEach(s => { priorityStats[s._id] = s.count; });

		res.json({
			tickets,
			stats: priorityStats,
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(total / limit),
				totalTickets: total,
				hasNext: page * limit < total,
				hasPrev: page > 1
			}
		});
	} catch (error) {
		console.error('Under review tickets fetch error:', error);
		res.status(500).json({ message: 'Failed to fetch tickets under review', error: error.message });
	}
}

// Support-agent: list assigned to me
async function listAssigned(req, res) {
	try {
		const { page = 1, limit = 10, status, category, priority } = req.query;
		const filter = { assignedTo: req.user._id };
		if (status && status !== 'all') filter.status = status;
		if (category && category !== 'all') filter.category = category;
		if (priority && priority !== 'all') filter.priority = priority;

		const tickets = await SupportTicket.find(filter)
			.populate([
				{ path: 'submittedBy', select: 'name email role' },
				{ path: 'relatedOrder', select: 'orderNumber totalAmount status' }
			])
			.sort({ status: 1, priority: -1, createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(parseInt(limit));

		const total = await SupportTicket.countDocuments(filter);

		const stats = await SupportTicket.aggregate([
			{ $match: { assignedTo: req.user._id } },
			{ $group: { _id: '$status', count: { $sum: 1 } } }
		]);

		const statusStats = { 'assigned': 0, 'in-progress': 0, 'resolved': 0, 'closed': 0 };
		stats.forEach(s => { statusStats[s._id] = s.count; });

		res.json({
			tickets,
			stats: statusStats,
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(total / limit),
				totalTickets: total,
				hasNext: page * limit < total,
				hasPrev: page > 1
			}
		});
	} catch (error) {
		console.error('Assigned tickets fetch error:', error);
		res.status(500).json({ message: 'Failed to fetch assigned tickets', error: error.message });
	}
}

// Support-agent: get one ticket
async function getTicketById(req, res) {
	try {
		const ticket = await SupportTicket.findById(req.params.id)
			.populate([
				{ path: 'submittedBy', select: 'name email phone role address' },
				{ path: 'assignedTo', select: 'name email' },
				{ path: 'relatedOrder', select: 'orderNumber totalAmount status items shippingAddress', populate: { path: 'items.product', select: 'name category price' } },
				{ path: 'messages.sender', select: 'name role' }
			]);

		if (!ticket) {
			return res.status(404).json({ message: 'Support ticket not found' });
		}

		res.json({ ticket });
	} catch (error) {
		console.error('Ticket fetch error:', error);
		res.status(500).json({ message: 'Failed to fetch ticket', error: error.message });
	}
}

// Support-agent: assign
async function assignTicket(req, res) {
	try {
		const ticket = await SupportTicket.findById(req.params.id);
		if (!ticket) return res.status(404).json({ message: 'Support ticket not found' });
		if (ticket.assignedTo) return res.status(400).json({ message: 'Ticket is already assigned' });
		if (ticket.status === 'closed') return res.status(400).json({ message: 'Cannot assign closed tickets' });

		ticket.assignedTo = req.user._id;
		ticket.status = 'assigned';
		ticket.messages.push({ sender: req.user._id, message: `Ticket assigned to ${req.user.name}`, timestamp: new Date(), isInternal: true });

		await ticket.save();
		await ticket.populate([{ path: 'submittedBy', select: 'name email' }, { path: 'assignedTo', select: 'name email' }]);
		res.json({ message: 'Ticket assigned successfully', ticket });
	} catch (error) {
		console.error('Ticket assignment error:', error);
		res.status(500).json({ message: 'Failed to assign ticket', error: error.message });
	}
}

// Support-agent: update status
async function updateTicketStatus(req, res) {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
		}

		const { status, resolution } = req.body;
		const ticket = await SupportTicket.findById(req.params.id);
		if (!ticket) return res.status(404).json({ message: 'Support ticket not found' });
		if (ticket.assignedTo && ticket.assignedTo.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: 'You can only update tickets assigned to you' });
		}
		if (!ticket.assignedTo) ticket.assignedTo = req.user._id;

		const oldStatus = ticket.status;
		ticket.status = status;
		if (status === 'resolved' && resolution) {
			ticket.resolution = resolution;
			ticket.resolvedAt = new Date();
		}

		const statusMessages = {
			'assigned': 'Ticket has been assigned',
			'in-progress': 'Work on ticket has started',
			'resolved': 'Ticket has been resolved',
			'closed': 'Ticket has been closed'
		};
		if (oldStatus !== status) {
			ticket.messages.push({ sender: req.user._id, message: statusMessages[status] || `Status changed to ${status}`, timestamp: new Date(), isInternal: true });
		}

		await ticket.save();
		await ticket.populate([{ path: 'submittedBy', select: 'name email' }, { path: 'assignedTo', select: 'name email' }]);
		res.json({ message: 'Ticket status updated successfully', ticket });
	} catch (error) {
		console.error('Ticket status update error:', error);
		res.status(500).json({ message: 'Failed to update ticket status', error: error.message });
	}
}

// Support-agent: add message
async function addMessageAsSupport(req, res) {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
		}

		const { message, isInternal = false } = req.body;
		const ticket = await SupportTicket.findById(req.params.id);
		if (!ticket) return res.status(404).json({ message: 'Support ticket not found' });
		if (ticket.status === 'closed') return res.status(400).json({ message: 'Cannot add messages to closed tickets' });
		if (ticket.assignedTo && ticket.assignedTo.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: 'You can only add messages to tickets assigned to you' });
		}
		if (!ticket.assignedTo) {
			ticket.assignedTo = req.user._id;
			ticket.status = 'assigned';
		}
		if (ticket.status === 'assigned') {
			ticket.status = 'in-progress';
		}

		ticket.messages.push({ sender: req.user._id, message, timestamp: new Date(), isInternal });
		await ticket.save();
		await ticket.populate('messages.sender', 'name role');
		res.json({ message: 'Message added successfully', ticket });
	} catch (error) {
		console.error('Message addition error:', error);
		res.status(500).json({ message: 'Failed to add message', error: error.message });
	}
}

module.exports = {
	// buyer side
	createTicket,
	getMyTickets,
	getMyTicketById,
	addMessageToMyTicket,
	// support agent side
	listUnderReview,
	listAssigned,
	getTicketById,
	assignTicket,
	updateTicketStatus,
	addMessageAsSupport,
	// analytics for support
	async analytics(req, res) {
		try {
			const { period = '30' } = req.query;
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - parseInt(period));

			const overallStats = await SupportTicket.aggregate([
				{ $facet: {
					totalTickets: [{ $count: 'count' }],
					openTickets: [ { $match: { status: { $in: ['open', 'assigned', 'in-progress'] } } }, { $count: 'count' } ],
					resolvedTickets: [ { $match: { status: 'resolved' } }, { $count: 'count' } ],
					closedTickets: [ { $match: { status: 'closed' } }, { $count: 'count' } ],
					avgResolutionTime: [
						{ $match: { status: { $in: ['resolved', 'closed'] }, resolvedAt: { $exists: true } } },
						{ $project: { resolutionTime: { $divide: [ { $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60 * 24 ] } } },
						{ $group: { _id: null, avgDays: { $avg: '$resolutionTime' } } }
					]
				}}
			]);

			const categoryStats = await SupportTicket.aggregate([
				{ $group: { _id: '$category', count: { $sum: 1 }, resolved: { $sum: { $cond: [ { $eq: ['$status', 'resolved'] }, 1, 0 ] } } } },
				{ $sort: { count: -1 } }
			]);

			const dailyStats = await SupportTicket.aggregate([
				{ $match: { createdAt: { $gte: startDate } } },
				{ $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } }, created: { $sum: 1 }, resolved: { $sum: { $cond: [ { $eq: ['$status', 'resolved'] }, 1, 0 ] } } } },
				{ $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
			]);

			const agentStats = await SupportTicket.aggregate([
				{ $match: { assignedTo: req.user._id, createdAt: { $gte: startDate } } },
				{ $group: { _id: null, totalAssigned: { $sum: 1 }, resolved: { $sum: { $cond: [ { $eq: ['$status', 'resolved'] }, 1, 0 ] } }, avgResolutionTime: { $avg: { $cond: [ { $and: [ { $eq: ['$status', 'resolved'] }, { $ne: ['$resolvedAt', null] } ] }, { $divide: [ { $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60 * 24 ] }, null ] } } } }
			]);

			const stats = overallStats[0];
			res.json({
				period: parseInt(period),
				overall: {
					total: stats.totalTickets[0]?.count || 0,
					open: stats.openTickets[0]?.count || 0,
					resolved: stats.resolvedTickets[0]?.count || 0,
					closed: stats.closedTickets[0]?.count || 0,
					avgResolutionTime: stats.avgResolutionTime[0]?.avgDays || 0
				},
				categories: categoryStats,
				dailyTrend: dailyStats,
				agentPerformance: agentStats[0] || { totalAssigned: 0, resolved: 0, avgResolutionTime: 0 }
			});
		} catch (error) {
			console.error('Analytics fetch error:', error);
			res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
		}
	}
};


