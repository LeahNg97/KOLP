import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PaymentModal from "./PaymentModal";
import "./CourseCard.css";

export default function CourseCard({
  course,
  onClick,                 // optional: custom view handler
  className = "",
  onEnrollmentSuccess,     // callback after paid enrollment
}) {
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // ===== Derived data =====
  const imgSrc = useMemo(() => {
    // Ưu tiên lấy ảnh từ introductionAssets (image)
    const fromIntro = course?.introductionAssets?.find((a) => a.kind === "image")?.url;
    // Fallback về thumbnailUrl
    return fromIntro || course?.thumbnailUrl || course?.imageIntroduction || "";
  }, [course]);

  const isFree = course?.priceType === "free" || Number(course?.price || 0) === 0;
  const hasDiscount = !isFree && course?.salePrice != null && Number(course.salePrice) < Number(course.price);
  const currency = course?.currency || "AUD";
  const minutes = Math.floor((course?.stats?.totalDurationSec || 0) / 60);
  const instructorName = typeof course?.instructorId === "object" ? course.instructorId?.name : undefined;
  const studentCount = course?.stats?.studentCount || course?.studentCount || 0;
  const totalLessons = course?.stats?.totalLessons || 0;

  // ===== Handlers =====
  const handleView = () => {
    if (onClick) return onClick(course._id);
    navigate(`/student/courses/${course._id}`);
  };

  const handleLearnNow = (e) => {
    e.stopPropagation();
    if (isFree) {
      navigate(`/student/courses/${course._id}`);
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = (result) => {
    setIsEnrolled(true);
    onEnrollmentSuccess?.(result);
    navigate(`/student/courses/${course._id}`);
  };

  // ===== UI helpers =====
  const buttonText = isEnrolled ? "Continue Learning" : "Start Learning";

  return (
    <>
      <article className={`cc-card ${className}`} role="article" aria-label={course?.title} onClick={handleView}>
        {/* COURSE TITLE */}
        <div className="cc-header">
          <h3 className="cc-title" title={course?.title}>{course?.title}</h3>
        </div>

        {/* COURSE IMAGE */}
        <div className="cc-image-container">
          {imgSrc ? (
            <img 
              className="cc-course-image" 
              src={imgSrc} 
              alt={course?.title || "Course"} 
              onError={(e) => {
                // Fallback nếu ảnh lỗi
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'grid';
              }}
            />
          ) : null}
          
          {/* Placeholder nếu không có ảnh */}
          <div className="cc-image-placeholder" style={{ display: imgSrc ? 'none' : 'grid' }}>
            <div className="cc-placeholder-icon">📚</div>
            <span className="cc-placeholder-text">Course Preview</span>
          </div>

          {/* Level badge overlay */}
          {course?.level && (
            <span className={`cc-level-badge cc-level--${course.level}`}>
              {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
            </span>
          )}
        </div>

        {/* COURSE DESCRIPTION */}
        <div className="cc-description">
          {course?.subtitle || "Learn the fundamentals to build modern applications."}
        </div>

        {/* PRICE SECTION */}
        <div className="cc-price-section">
          {isFree ? (
            <div className="cc-price-free-container">
              <span className="cc-price-free">FREE</span>
            </div>
          ) : (
            <div className="cc-price-paid-container">
              <span className="cc-price-current">
                {currency}${hasDiscount ? Number(course.salePrice).toFixed(0) : Number(course.price).toFixed(0)}
              </span>
            </div>
          )}
        </div>

        {/* ACTION BUTTON */}
        <div className="cc-action" onClick={(e) => e.stopPropagation()}>
          <button
            className="cc-btn cc-btn--primary"
            type="button"
            onClick={handleLearnNow}
            aria-label={buttonText}
          >
            {buttonText}
          </button>
        </div>
      </article>

      {/* Payment modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        course={course}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
}