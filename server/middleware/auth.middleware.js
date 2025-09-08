const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc thiếu' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // gắn thông tin user vào request
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token không hợp lệ hoặc hết hạn' });
  }
};
exports.authorizeRole = (...roles) => {
    return (req, res, next) => {
      console.log('Authorizing role. User:', req.user);
      console.log('Required roles:', roles);
      console.log('User role:', req.user?.role);
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      // Flatten the roles array in case it's nested
      const flatRoles = roles.flat();
      console.log('Flattened roles:', flatRoles);
      
      if (!flatRoles.includes(req.user.role)) {
        console.log('Access denied. User role:', req.user.role, 'Required:', flatRoles);
        return res.status(403).json({ message: 'Không có quyền truy cập' });
      }
      
      console.log('Access granted for role:', req.user.role);
      next();
    };
  };
  