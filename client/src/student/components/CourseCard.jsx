import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CourseCard.css';

export default function CourseCard({ course, onClick, className = '', onEnrollmentSuccess }) {
  const navigate = useNavigate();
  const [isEnrolled, setIsEnrolled] = useState(false);
  
  // Use imageIntroduction if available
  const introImage = course.imageIntroduction;

  const handleLearnNow = (e) => {
    e.stopPropagation(); // Prevent triggering the card's onClick
    
    if (course.price === 0) {
      // Free course - navigate directly
      navigate(`/student/courses/${course._id}`);
    } else {
      // Paid course - show payment modal
    }
  };

  const handlePaymentSuccess = (result) => {
    setIsEnrolled(true);
    if (onEnrollmentSuccess) {
      onEnrollmentSuccess(result);
    }
    // Navigate to course after successful payment
    navigate(`/student/courses/${course._id}`);
  };

  const getButtonText = () => {
    if (isEnrolled) {
      return 'Continue Learning';
    }
    if (course.price === 0) {
      return 'Start Learning';
    }
    return `Enroll Now - $${course.price}`;
  };

  const getButtonClass = () => {
    if (isEnrolled) {
      return 'learn-now-btn enrolled';
    }
    if (course.price === 0) {
      return 'learn-now-btn free';
    }
    return 'learn-now-btn paid';
  };

  return (
    <>
      <div className={`student-course-card ${className}`}>
        <div className="student-course-title">{course.title}</div>
        {introImage && (
          <img
            src={introImage}
            alt="Course intro"
            className="student-course-card-image"
          />
        )}
        <div className="student-course-desc">{course.description}</div>
        <div className="student-course-price">
          {course.price === 0 ? (
            <span className="price-free">Free</span>
          ) : (
            <span className="price-paid">${course.price}</span>
          )}
        </div>
        <button 
          className={getButtonClass()}
          onClick={handleLearnNow}
        >
          {getButtonText()}
        </button>
      </div>
    </>
  );
} 