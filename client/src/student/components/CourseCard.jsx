import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CourseCard.css';


export default function CourseCard({ course, onClick, className = '' }) {
  const navigate = useNavigate();
  // Use imageIntroduction if available
  const introImage = course.imageIntroduction;


  const handleLearnNow = (e) => {
    e.stopPropagation(); // Prevent triggering the card's onClick
    navigate(`/student/courses/${course._id}`);
  };


  return (
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
      <button
        className="learn-now-btn"
        onClick={handleLearnNow}
      >
        Learn Now
      </button>
    </div>
  );
}



