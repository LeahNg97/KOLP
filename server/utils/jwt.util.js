const jwt = require('jsonwebtoken');
// Import jsonwebtoken for creating and verifying JSON Web Tokens
// This utility provides functions to handle JWT operations, such as signing tokens 


// for user authentication and authorization in the application
// The signToken function creates a JWT with a payload and a secret key from environment variables
// The token is set to expire in 1 day, providing a secure way to manage user sessions
// The generated token can be used to authenticate users in subsequent requests
// dung cho viec xac thuc nguoi dung trong cac yeu cau tiep theo, xac thuc dang nhap phan quyen nguoi dung, bao ve routes va tao token
function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
}

module.exports = { signToken };// Export the signToken function for use in other parts of the application