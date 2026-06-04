const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get seller's products
router.get('/products', authenticateToken, authorizeRole('seller'), async (req, res) => {
  try {
    const { page = 1, limit = 12, status, category, search } = req.query;

    const filter = { seller: req.user._id };
    
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }

    let query = Product.find(filter);

    // Add text search if provided
    if (search) {
      query = query.find({ $text: { $search: search } });
    }

    const products = await query
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    // Get summary statistics
    const stats = await Product.aggregate([
      { $match: { seller: req.user._id } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
          inStockProducts: { $sum: { $cond: ['$inStock', 1, 0] } },
          outOfStockProducts: { $sum: { $cond: [{ $eq: ['$inStock', false] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      products,
      stats: stats[0] || { totalProducts: 0, activeProducts: 0, inStockProducts: 0, outOfStockProducts: 0 },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Seller products fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

// Get single product
router.get('/products/:id', authenticateToken, authorizeRole('seller'), async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      seller: req.user._id 
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });

  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
});

// Create new product
router.post('/products', authenticateToken, authorizeRole('seller'), [
  body('name').trim().isLength({ min: 2 }).withMessage('Product name must be at least 2 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').isIn(['whole-spices', 'ground-spices', 'spice-blends', 'herbs', 'tea-spices', 'other']).withMessage('Invalid category'),
  body('weight.value').isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  body('weight.unit').isIn(['g', 'kg', 'lb', 'oz']).withMessage('Invalid weight unit'),
  body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      name,
      description,
      price,
      category,
      origin,
      weight,
      images,
      stockQuantity
    } = req.body;

    const product = new Product({
      name,
      description,
      price,
      category,
      origin: origin || 'Sri Lanka',
      weight,
      images: images || [],
      stockQuantity: stockQuantity || 0,
      inStock: (stockQuantity || 0) > 0,
      seller: req.user._id
    });

    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});

// Update product
router.put('/products/:id', authenticateToken, authorizeRole('seller'), [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Product name must be at least 2 characters'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').optional().isIn(['whole-spices', 'ground-spices', 'spice-blends', 'herbs', 'tea-spices', 'other']).withMessage('Invalid category'),
  body('weight.value').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  body('weight.unit').optional().isIn(['g', 'kg', 'lb', 'oz']).withMessage('Invalid weight unit'),
  body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const product = await Product.findOne({ 
      _id: req.params.id, 
      seller: req.user._id 
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const {
      name,
      description,
      price,
      category,
      origin,
      weight,
      images,
      stockQuantity,
      inStock
    } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(description && { description }),
        ...(price !== undefined && { price }),
        ...(category && { category }),
        ...(origin && { origin }),
        ...(weight && { weight }),
        ...(images && { images }),
        ...(stockQuantity !== undefined && { stockQuantity }),
        ...(inStock !== undefined && { inStock }),
        // Auto-set inStock based on stockQuantity if not explicitly provided
        ...(stockQuantity !== undefined && inStock === undefined && { inStock: stockQuantity > 0 })
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
});

// Toggle product status (active/inactive)
router.patch('/products/:id/toggle-status', authenticateToken, authorizeRole('seller'), async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      seller: req.user._id 
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.json({
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      product
    });

  } catch (error) {
    console.error('Product status toggle error:', error);
    res.status(500).json({ message: 'Failed to toggle product status', error: error.message });
  }
});

// Delete product (soft delete)
router.delete('/products/:id', authenticateToken, authorizeRole('seller'), async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      seller: req.user._id 
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product has pending orders
    const pendingOrders = await Order.countDocuments({
      'items.product': product._id,
      status: { $in: ['pending', 'confirmed', 'processing'] }
    });

    if (pendingOrders > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete product with pending orders. Please wait for orders to complete or cancel them first.' 
      });
    }

    // Soft delete
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
});

// Get received orders
router.get('/orders', authenticateToken, authorizeRole('seller'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { seller: req.user._id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate([
        { path: 'buyer', select: 'name email phone' },
        { path: 'items.product', select: 'name images category' }
      ])
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    // Get summary statistics
    const stats = await Order.aggregate([
      { $match: { seller: req.user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      orders,
      stats: stats[0] || { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, completedOrders: 0 },
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
});

// Get single order
router.get('/orders/:id', authenticateToken, authorizeRole('seller'), async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id, 
      seller: req.user._id 
    }).populate([
      { path: 'buyer', select: 'name email phone address' },
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
});

// Update order status
router.patch('/orders/:id/status', authenticateToken, authorizeRole('seller'), [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { status, notes } = req.body;

    const order = await Order.findOne({ 
      _id: req.params.id, 
      seller: req.user._id 
    }).populate('items.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate status transition
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'delivered': [],
      'cancelled': []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot change status from ${order.status} to ${status}` 
      });
    }

    // If cancelling, restore product stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product._id, {
          $inc: { stockQuantity: item.quantity },
          inStock: true
        });
      }
    }

    order.status = status;
    if (notes) {
      order.notes = order.notes ? `${order.notes}\n\n${notes}` : notes;
    }

    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
});

// Get sales analytics
router.get('/analytics/sales', authenticateToken, authorizeRole('seller'), async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const analytics = await Order.aggregate([
      {
        $match: {
          seller: req.user._id,
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get top-selling products
    const topProducts = await Order.aggregate([
      {
        $match: {
          seller: req.user._id,
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          category: '$product.category',
          totalQuantity: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      period: parseInt(period),
      dailySales: analytics,
      topProducts
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
});

module.exports = router;
