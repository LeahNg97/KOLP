import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from './api/authApi';
import './style/Login.css';


export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };


  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email should not be empty');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Password should not be empty');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
   
    if (!validateForm()) return;


    setLoading(true);
    setError('');
    setSuccess('');


    try {
      console.log('Attempting login with:', { email: formData.email });
     
      const response = await loginUser({
        email: formData.email.trim(),
        password: formData.password
      });


      console.log('Login response:', response);


      // Use AuthContext to handle login
      login(response.user, response.token);


      setSuccess('Login successfully! Redirecting...');


      // Navigate based on user role
      const role = response.user.role;
      setTimeout(() => {
        switch (role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'instructor':
            navigate('/instructor/courses');
            break;
          case 'student':
            navigate('/student');
            break;
          default:
            navigate('/student');
        }
      }, 1000);


    } catch (err) {
      console.error('Login error:', err);
     
      if (err.response) {
        // Server responded with error
        const errorMessage = err.response.data?.message || 'Login failed. Please try again.';
        setError(errorMessage);
      } else if (err.request) {
        // Network error
        setError('Network error. Please check your connection.');
      } else {
        // Other error
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };


  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Welcome to KOLP</h1>
          <p className="login-subtitle">Please login to your account</p>
        </div>
       
        {error && (
          <div className="login-error-message">
            <span>⚠️ {error}</span>
          </div>
        )}


        {success && (
          <div className="login-success-message">
            <span> {success}</span>
          </div>
        )}


        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form-group">
            <label htmlFor="email" className="login-form-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className={`login-form-input ${error && !formData.email ? 'login-error' : ''}`}
              placeholder="Please enter your email"
              value={formData.email}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>
         
          <div className="login-form-group">
            <label htmlFor="password" className="login-form-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className={`login-form-input ${error && !formData.password ? 'login-error' : ''}`}
              placeholder="Please enter your password"
              value={formData.password}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
         
          <button
            type="submit"
            className={`login-button ${loading ? 'login-loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
          
                
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>


        <div className="login-footer">
          <div className="login-register-link">
            <p>Don't have an account yet?</p>
            <Link to="/register" className="login-register-button-link">
              Register Now
            </Link>
          </div>
         
          {/* <div className="test-accounts">
            <details>
              <summary> Tài khoản test</summary>
              <div className="test-accounts-list">
                <div><strong>Student:</strong> alice@student.kolp.vn / password123</div>
                <div><strong>Instructor:</strong> bob@instructor.kolp.vn / password123</div>
                <div><strong>Admin:</strong> admin@kolp.vn / password123</div>
              </div>
            </details>
          </div> */}
        </div>
      </div>
    </div>
  );
}



