// controllers/workshop.controller.js

const Workshop = require('../models/workshop.model');
const User = require('../models/user.model');

// Helper: sanitize workshop output
function leanWorkshop(doc) {
  if (!doc) return null;
  const w = doc.toObject ? doc.toObject() : doc;
  return w;
}

// ==============================
// GET all workshops (admin/instructor view)
// ==============================
exports.getAllWorkshops = async (req, res, next) => {
  try {
    const workshops = await Workshop.find()
      .populate('instructorId', 'name email role')
      .sort({ startAt: -1 })
      .lean();

    res.json(workshops);
  } catch (e) { 
    console.error('Error in getAllWorkshops:', e);
    next(e); 
  }
};

// ==========================================
// GET published workshops (public catalog)
// Only isPublished = true
// ==========================================
exports.getPublishedWorkshops = async (req, res, next) => {
  try {
    const { status, instructorId, upcoming } = req.query;
    
    let filter = { isPublished: true };
    
    if (status) {
      filter.status = status;
    }
    
    if (instructorId) {
      filter.instructorId = instructorId;
    }
    
    if (upcoming === 'true') {
      filter.startAt = { $gte: new Date() };
    }

    const workshops = await Workshop.find(filter)
      .populate('instructorId', 'name email role')
      .sort({ startAt: 1 })
      .lean();

    res.json(workshops);
  } catch (e) { 
    console.error('Error in getPublishedWorkshops:', e);
    next(e); 
  }
};

// ==============================
// GET workshop by ID
// ==============================
exports.getWorkshopById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const workshop = await Workshop.findById(id)
      .populate('instructorId', 'name email role')
      .lean();

    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    res.json(workshop);
  } catch (e) { 
    console.error('Error in getWorkshopById:', e);
    next(e); 
  }
};

// ==============================
// GET workshops by instructor
// ==============================
exports.getWorkshopsByInstructor = async (req, res, next) => {
  try {
    const { instructorId } = req.params;
    const { status, published } = req.query;
    
    console.log('Getting workshops for instructor:', instructorId);
    
    // Validate instructorId
    if (!instructorId || instructorId === 'null' || instructorId === 'undefined') {
      return res.status(400).json({ message: 'Invalid instructor ID' });
    }
    
    let filter = { instructorId };
    
    if (status) {
      filter.status = status;
    }
    
    if (published === 'true') {
      filter.isPublished = true;
    }

    console.log('Filter:', filter);

    const workshops = await Workshop.find(filter)
      .populate('instructorId', 'name email role')
      .sort({ startAt: -1 })
      .lean();

    console.log(`Found ${workshops.length} workshops for instructor ${instructorId}`);
    res.json(workshops);
  } catch (e) { 
    console.error('Error in getWorkshopsByInstructor:', e);
    next(e); 
  }
};

// ==============================
// CREATE workshop
// ==============================
exports.createWorkshop = async (req, res, next) => {
  try {
    const workshopData = req.body;
    
    console.log('Creating workshop with data:', workshopData);
    console.log('User from token:', req.user);
    
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Get user ID from token (could be 'id' or '_id')
    const userId = req.user.id || req.user._id || req.user.userId;
    if (!userId) {
      console.error('No user ID found in token:', req.user);
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    
    // Validate required fields
    if (!workshopData.title || !workshopData.startAt || !workshopData.endAt || !workshopData.meetingUrl) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, startAt, endAt, meetingUrl' 
      });
    }

    // Validate dates
    const startAt = new Date(workshopData.startAt);
    const endAt = new Date(workshopData.endAt);
    
    if (startAt >= endAt) {
      return res.status(400).json({ 
        message: 'End time must be after start time' 
      });
    }

    const workshop = new Workshop({
      ...workshopData,
      instructorId: userId,
      publishedAt: workshopData.isPublished ? new Date() : null
    });

    await workshop.save();
    
    const populatedWorkshop = await Workshop.findById(workshop._id)
      .populate('instructorId', 'name email role')
      .lean();

    res.status(201).json(populatedWorkshop);
  } catch (e) { 
    console.error('Error in createWorkshop:', e);
    next(e); 
  }
};

// ==============================
// UPDATE workshop
// ==============================
exports.updateWorkshop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Check if workshop exists
    const existingWorkshop = await Workshop.findById(id);
    if (!existingWorkshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    // Check if user is the instructor or admin
    if (existingWorkshop.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this workshop' });
    }

    // Validate dates if provided
    if (updateData.startAt && updateData.endAt) {
      const startAt = new Date(updateData.startAt);
      const endAt = new Date(updateData.endAt);
      
      if (startAt >= endAt) {
        return res.status(400).json({ 
          message: 'End time must be after start time' 
        });
      }
    }

    // Set publishedAt if publishing
    if (updateData.isPublished && !existingWorkshop.isPublished) {
      updateData.publishedAt = new Date();
    }

    const workshop = await Workshop.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('instructorId', 'name email role').lean();

    res.json(workshop);
  } catch (e) { 
    console.error('Error in updateWorkshop:', e);
    next(e); 
  }
};

// ==============================
// DELETE workshop
// ==============================
exports.deleteWorkshop = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if workshop exists
    const workshop = await Workshop.findById(id);
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    // Check if user is the instructor or admin
    if (workshop.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this workshop' });
    }

    await Workshop.findByIdAndDelete(id);

    res.json({ message: 'Workshop deleted successfully' });
  } catch (e) { 
    console.error('Error in deleteWorkshop:', e);
    next(e); 
  }
};

// ==============================
// UPDATE workshop status
// ==============================
exports.updateWorkshopStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['scheduled', 'live', 'completed', 'canceled'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: scheduled, live, completed, canceled' 
      });
    }

    const workshop = await Workshop.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true, runValidators: true }
    ).populate('instructorId', 'name email role').lean();

    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    res.json(workshop);
  } catch (e) { 
    console.error('Error in updateWorkshopStatus:', e);
    next(e); 
  }
};

// ==============================
// SEARCH workshops
// ==============================
exports.searchWorkshops = async (req, res, next) => {
  try {
    const { q, status, instructorId, upcoming } = req.query;
    
    let filter = { isPublished: true };
    
    if (status) {
      filter.status = status;
    }
    
    if (instructorId) {
      filter.instructorId = instructorId;
    }
    
    if (upcoming === 'true') {
      filter.startAt = { $gte: new Date() };
    }

    let query = Workshop.find(filter);

    if (q) {
      query = query.find({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ]
      });
    }

    const workshops = await query
      .populate('instructorId', 'name email role')
      .sort({ startAt: 1 })
      .lean();

    res.json(workshops);
  } catch (e) { 
    console.error('Error in searchWorkshops:', e);
    next(e); 
  }
};