import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PaymentModal from "./PaymentModal";
import { getEnrollmentByCourseId } from "../api/enrollmentApi";
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
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [isLoadingEnrollment, setIsLoadingEnrollment] = useState(true);

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

  // ===== Effects =====
  useEffect(() => {
    const checkEnrollmentStatus = async () => {
      if (!course?._id) return;
      
      try {
        setIsLoadingEnrollment(true);
        const token = localStorage.getItem('token');
        const enrollment = await getEnrollmentByCourseId(token, course._id);
        
        if (enrollment) {
          setEnrollmentStatus(enrollment.status);
          setIsEnrolled(enrollment.status === 'approved');
        } else {
          setEnrollmentStatus(null);
          setIsEnrolled(false);
        }
      } catch (error) {
        console.error('Error checking enrollment status:', error);
        setEnrollmentStatus(null);
        setIsEnrolled(false);
      } finally {
        setIsLoadingEnrollment(false);
      }
    };

    checkEnrollmentStatus();
  }, [course?._id]);

  // ===== Handlers =====
  const handleView = () => {
    if (onClick) return onClick(course._id);
    navigate(`/student/courses/${course._id}`);
  };

  const handleLearnNow = (e) => {
    e.stopPropagation();
    
    // Nếu đã được duyệt (approved), chuyển thẳng đến trang learning
    if (enrollmentStatus === 'approved') {
      navigate(`/student/courses/${course._id}/learn`);
      return;
    }
    
    // Nếu khóa học miễn phí, chuyển đến trang course detail
    if (isFree) {
      navigate(`/student/courses/${course._id}`);
    } else {
      // Nếu khóa học trả phí, hiển thị modal payment
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = (result) => {
    setIsEnrolled(true);
    setEnrollmentStatus('approved');
    onEnrollmentSuccess?.(result);
    // Sau khi thanh toán thành công, chuyển thẳng đến trang learning
    navigate(`/student/courses/${course._id}/learn`);
  };

  // ===== UI helpers =====
  const getButtonText = () => {
    if (isLoadingEnrollment) return "Loading...";
    if (enrollmentStatus === 'approved') return "Continue Learning";
    if (enrollmentStatus === 'pending') return "Pending Approval";
    return "Start Learning";
  };

  const buttonText = getButtonText();

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
            className={`cc-btn cc-btn--primary ${enrollmentStatus === 'pending' ? 'cc-btn--disabled' : ''}`}
            type="button"
            onClick={handleLearnNow}
            disabled={enrollmentStatus === 'pending' || isLoadingEnrollment}
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