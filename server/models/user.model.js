const mongoose = require('mongoose');// Import mongoose for MongoDB connection, de tao schema cho user
// Define the user schema
// This schema defines the structure of user documents in the MongoDB database
// It includes fields for name, email, password, and role with appropriate validation
// The timestamps option adds createdAt and updatedAt fields automatically
// The unique constraint on email ensures no two users can have the same email address
// The role field is an enumerated type with possible values 'student', 'instructor', 'admin', defaulting to 'student'
// The schema is exported for use in other parts of the application 
// const tao hang so, table moi
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: String,
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' }// Role of the user, can be 'student', 'instructor', or 'admin'
}, { timestamps: true });// Define timestamps for createdAt and updatedAt fields, ngay tao va cap nhat document

module.exports = mongoose.models.User || mongoose.model('User', userSchema);// Export the user model, if it already exists, otherwise create a new one with the defined schema
// This allows the model to be reused without redefining it, preventing errors in the application
// If the User model already exists, it will use that; otherwise, it creates a new one with the userSchema
// This is important for maintaining a single instance of the model throughout the application
// This prevents issues with model redefinition in a hot-reloading environment like development
// The model can then be used to interact with the 'users' collection in the MongoDB database
// The model provides methods for creating, reading, updating, and deleting user documents in the database
// It also allows for querying users based on their attributes, such as email or role
// The model is essential for implementing user authentication and authorization in the application
// It can be used to create new users, authenticate existing users, and manage user roles and permissions
// The user model is a crucial part of the application's data layer, enabling interaction with user data in the database
// It is typically used in conjunction with controllers and routes to handle user-related operations
// The model can also be extended with custom methods for specific user-related functionalities
// This allows for a flexible and scalable user management system within the application
// The user model is a foundational component of the application's architecture, supporting user management and authentication features
// It is designed to be easily extendable and maintainable as the application grows and evolves
// The model can be used in various parts of the application, such as user registration, login