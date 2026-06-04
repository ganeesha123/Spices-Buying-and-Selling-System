const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Create new order
async function createOrder(req, res) {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				message: 'Validation failed',
				errors: errors.array()
			});
		}

		const { items, shippingAddress, notes } = req.body;

		// Validate products and calculate totals
		const orderItems = [];
		let totalAmount = 0;
		let sellerId = null;

		for (const item of items) {
			const product = await Product.findById(item.product).populate('seller');

			if (!product || !product.isActive || !product.inStock) {
				return res.status(400).json({
					message: `Product ${product?.name || 'Unknown'} is not available`
				});
			}

			if (product.stockQuantity < item.quantity) {
				return res.status(400).json({
					message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`
				});
			}

			// Ensure all items are from the same seller
			if (sellerId && sellerId !== product.seller._id.toString()) {
				return res.status(400).json({
					message: 'All items in an order must be from the same seller'
				});
			}
			sellerId = product.seller._id.toString();

			const subtotal = product.price * item.quantity;
			totalAmount += subtotal;

			orderItems.push({
				product: product._id,
				quantity: item.quantity,
				price: product.price,
				subtotal
			});

			// Update product stock
			await Product.findByIdAndUpdate(product._id, {
				$inc: { stockQuantity: -item.quantity },
				inStock: product.stockQuantity - item.quantity > 0
			});
		}

		// Generate order number
		const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

		// Create order
		const order = new Order({
			orderNumber,
			buyer: req.user._id,
			seller: sellerId,
			items: orderItems,
			totalAmount,
			shippingAddress: {
				...shippingAddress,
				country: shippingAddress.country || 'Sri Lanka'
			},
			notes
		});

		await order.save();
		await order.populate([
			{ path: 'buyer', select: 'name email phone' },
			{ path: 'seller', select: 'name email phone' },
			{ path: 'items.product', select: 'name images category' }
		]);

		res.status(201).json({
			message: 'Order placed successfully',
			order
		});

	} catch (error) {
		console.error('Order creation error:', error);
		res.status(500).json({ message: 'Failed to create order', error: error.message });
	}
}

// Get buyer's orders
async function getOrders(req, res) {
	try {
		const { page = 1, limit = 10, status } = req.query;

		const filter = { buyer: req.user._id };
		if (status && status !== 'all') {
			filter.status = status;
		}

		const orders = await Order.find(filter)
			.populate([
				{ path: 'seller', select: 'name email phone' },
				{ path: 'items.product', select: 'name images category price' }
			])
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(parseInt(limit));

		const total = await Order.countDocuments(filter);

		res.json({
			orders,
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(total / limit),
				totalOrders: total,
				hasNext: page * limit < total,
				hasPrev: page > 1
			}
		});

	} catch (error) {
		console.error('Orders fetch error:', error);
		res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
	}
}

// Get single order
async function getOrderById(req, res) {
	try {
		const order = await Order.findOne({
			_id: req.params.id,
			buyer: req.user._id
		}).populate([
			{ path: 'seller', select: 'name email phone address' },
			{ path: 'items.product', select: 'name images category description weight' }
		]);

		if (!order) {
			return res.status(404).json({ message: 'Order not found' });
		}

		res.json({ order });

	} catch (error) {
		console.error('Order fetch error:', error);
		res.status(500).json({ message: 'Failed to fetch order', error: error.message });
	}
}

// Cancel order (only if status is pending)
async function cancelOrder(req, res) {
	try {
		const order = await Order.findOne({
			_id: req.params.id,
			buyer: req.user._id
		}).populate('items.product');

		if (!order) {
			return res.status(404).json({ message: 'Order not found' });
		}

		if (order.status !== 'pending') {
			return res.status(400).json({ message: 'Only pending orders can be cancelled' });
		}

		// Restore product stock
		for (const item of order.items) {
			await Product.findByIdAndUpdate(item.product._id, {
				$inc: { stockQuantity: item.quantity },
				inStock: true
			});
		}

		order.status = 'cancelled';
		await order.save();

		res.json({
			message: 'Order cancelled successfully',
			order
		});

	} catch (error) {
		console.error('Order cancellation error:', error);
		res.status(500).json({ message: 'Failed to cancel order', error: error.message });
	}
}

module.exports = {
	createOrder,
	getOrders,
	getOrderById,
	cancelOrder
};


