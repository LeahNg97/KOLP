
// Import necessary modules
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {// Middleware to verify JWT token
  // This middleware checks for the presence of a JWT token in the Authorization header
  // If the token is valid, it decodes the token and attaches the user information to the request object
  // If the token is missing or invalid, it responds with an error message

  const authHeader = req.headers.authorization; // Get the Authorization header from the request, khi user đăng nhập sẽ có 1 token
  // Check if the Authorization header is present and starts with 'Bearer '

  if (!authHeader || !authHeader.startsWith('Bearer ')) {// nếu chuỗi authorization không có hoặc không bắt đầu 
    return res.status(401).json({ message: 'Incorrect Token' });
  }

  const token = authHeader.split(' ')[1];// lấy token từ chuỗi authorization, tách chuỗi bằng dấu cách

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);// giải mã token bằng secret key từ biến môi trường để kiểm tra tính hợp lệ
    req.user = decoded; // gắn thông tin user vào request object để sử dụng trong các middleware hoặc route handler sau này
    next();// đi tới controller nếu token hợp lệ
  } catch (err) {
    return res.status(403).json({ message: 'Incorrect or Exprired Token' });
  }
};
exports.authorizeRole = (...roles) => {//kiểm tra users có quyền truy cập vào các route nhất định dựa trên vai trò của họ
  // This middleware checks if the user's role matches one of the allowed roles
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
      next();
    };
  };