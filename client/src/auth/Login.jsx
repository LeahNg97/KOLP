import { useState } from 'react'; // Import useState hook to manage state
import { useNavigate, Link } from 'react-router-dom';// Import useNavigate for navigation and Link for routing
import { useAuth } from '../context/AuthContext';// Import useAuth to access authentication context
import { loginUser } from './api/authApi';// Import loginUser function to handle login API call
import './style/Login.css';// Import CSS styles for the Login component

// Define the Login component
// This component handles user login functionality
// It allows users to enter their email and password, validates the input, and communicates with the server to authenticate the user
export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);// State to manage loading state during API calls
  const [error, setError] = useState('');// State to manage error messages
  const [success, setSuccess] = useState('');// State to manage success messages after login
  const navigate = useNavigate();// Hook to programmatically navigate to different routes
  const { login } = useAuth();// Use the login function from AuthContext to handle user authentication

  // Handle input changes in the form
  // This function updates the formData state with the user's input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Validate form data before submitting
  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email should not be empty');// Check if email is empty
      return false;
    }
    if (!formData.password.trim()) {
      setError('Password should not be empty');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  // Handle form submission
  // This function is called when the user submits the login form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Set loading state and reset messages
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

      setSuccess('Login succesful');

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
        const errorMessage = err.response.data?.message || 'Login fail';
        setError(errorMessage);
      } else if (err.request) {
        // Network error
        setError('Cannot connect to server.');
      } else {
        // Other error
        setError('Error, please try again.');
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
          <h1 className="login-title">Log In</h1>
          <p className="login-subtitle">Please fill your information</p>
        </div>
        
        {error && (
          <div className="error-message">
            <span> {error}</span>
          </div>
        )}

        {success && (
          <div className="success-message">
            <span> {success}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className={`form-input ${error && !formData.email ? 'error' : ''}`}
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className={`form-input ${error && !formData.password ? 'error' : ''}`}
              placeholder="Enter your password"
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
            className={`login-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Loading...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="login-footer">
          <div className="register-link">
            <p>Don't have account yet?</p>
            <Link to="/register" className="register-button-link">
              Register Now
            </Link>
          </div>
          
          <div className="test-accounts">
            <details>
              <summary>Test Accounts</summary>
              <div className="test-accounts-list">
                <div><strong>Student:</strong> alice@student.kolp.vn / password123</div>
                <div><strong>Instructor:</strong> bob@instructor.kolp.vn / password123</div>
                <div><strong>Admin:</strong> admin@kolp.vn / password123</div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}