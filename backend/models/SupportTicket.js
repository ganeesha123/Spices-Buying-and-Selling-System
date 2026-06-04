const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    enum: ['order', 'product', 'payment', 'account', 'technical', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false
    }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolution: {
    type: String,
    trim: true
  },
  resolvedAt: {
    type: Date
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    providedAt: Date
  }
}, {
  timestamps: true
});

// Generate ticket number before saving
supportTicketSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('SupportTicket').countDocuments();
    this.ticketNumber = `TKT-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Index for better performance
supportTicketSchema.index({ submittedBy: 1, status: 1, createdAt: -1 });
supportTicketSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
supportTicketSchema.index({ ticketNumber: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
