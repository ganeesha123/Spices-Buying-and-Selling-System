const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const productValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Product name must be at least 2 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').isIn(['whole-spices', 'ground-spices', 'spice-blends', 'herbs', 'tea-spices', 'other']).withMessage('Invalid category'),
  body('weight.value').isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  body('weight.unit').isIn(['g', 'kg', 'lb', 'oz']).withMessage('Invalid weight unit'),
  body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer')
];

// Get all products (public - for buyers)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      search, 
      minPrice, 
      maxPrice, 
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('Product search request:', { search, category, minPrice, maxPrice }); // Debug log

    // Build filter object
    const filter = { isActive: true, inStock: true };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Add text search if provided
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    let query = Product.find(filter).populate('seller', 'name email');

    // Apply pagination and sorting
    const products = await query
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email phone address');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });

  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
});

// Create new product (sellers only)
router.post('/', authenticateToken, authorizeRole('seller'), productValidation, async (req, res) => {
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
    await product.populate('seller', 'name email');

    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});

// Update product (sellers only - own products)
router.put('/:id', authenticateToken, authorizeRole('seller'), productValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns the product
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own products' });
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
        name,
        description,
        price,
        category,
        origin,
        weight,
        images,
        stockQuantity,
        inStock: inStock !== undefined ? inStock : (stockQuantity || 0) > 0
      },
      { new: true, runValidators: true }
    ).populate('seller', 'name email');

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
});

// Delete product (sellers only - own products)
router.delete('/:id', authenticateToken, authorizeRole('seller'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns the product
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own products' });
    }

    // Soft delete - just mark as inactive
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
});

// Get categories
router.get('/meta/categories', (req, res) => {
  const categories = [
    { value: 'whole-spices', label: 'Whole Spices' },
    { value: 'ground-spices', label: 'Ground Spices' },
    { value: 'spice-blends', label: 'Spice Blends' },
    { value: 'herbs', label: 'Herbs' },
    { value: 'tea-spices', label: 'Tea Spices' },
    { value: 'other', label: 'Other' }
  ];
  
  res.json({ categories });
});

module.exports = router;
