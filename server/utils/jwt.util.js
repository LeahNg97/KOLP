const jwt = require('jsonwebtoken');

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
}

module.exports = { signToken };




// jwt.sign({id,name,role}, JWT_SECRET, {expiresIn: '10m'}   )
