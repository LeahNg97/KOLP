import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from './api/authApi';
import './style/Register.css';

export default function Register() {//khởi tạo component Register
  const [formData, setFormData] = useState({// quản lý dữ liệu nguời dùng nhập vào form
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  // hook useState, đầu là tên biến, sau là hàm set biến
  const [loading, setLoading] = useState(false);// 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // hàm cập nhật dư liệu tương ứng, xoá lỗi khi người dùng nhập dữ liệu nếu có
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Hàm kiểm tra dữ liệu người dùng nhập vào form trc khi gửi lên server
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name shouldn\'t be empty');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email shouldn\'t be empty');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Email is invalid');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  // Hàm xử lý sự kiện gửi form
  const handleSubmit = async (e) => {
    e.preventDefault();// Ngăn chặn hành động mặc định của form
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    // Gọi API đăng ký người dùng
    // Nếu đăng ký thành công, sẽ lưu thông tin người dùng và token vào localStorage
    try {
      const res = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      setSuccess('Registration successful! You can now log in.');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // giao diện UI
  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">Register</h1>
          <p className="register-subtitle">Create account to start</p>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="Name (Full Name)"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <select
                name="role"
                className="form-select"
                value={formData.role}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          
          <div className="form-group full-width">
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
          >
            {loading && <span className="loading"></span>}
            {loading ? 'Loading' : 'Register'}
          </button>
        </form>

        <div className="login-link">
          <p>Already have account?</p>
          <Link to="/login" className="login-button-link">
            Log in now  
          </Link>
        </div>
      </div>
    </div>
  );
}