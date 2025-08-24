import React, { useState } from 'react';
import { paymentApi } from '../api/paymentApi';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, course, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);

    try {
      // Validate form
      if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
        setError('Please fill in all fields');
        setIsProcessing(false);
        return;
      }

      if (cardNumber.length < 13 || cardNumber.length > 19) {
        setError('Please enter a valid card number');
        setIsProcessing(false);
        return;
      }

      if (cvv.length < 3 || cvv.length > 4) {
        setError('Please enter a valid CVV');
        setIsProcessing(false);
        return;
      }

      // Process payment
      const result = await paymentApi.createPayment(
        course._id,
        paymentMethod,
        course.salePrice || course.price,
        course
      );

      // Payment successful
      onPaymentSuccess(result);
      onClose();
      
    } catch (error) {
      setError(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setError('');
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      setCardholderName('');
      onClose();
    }
  };

  return (
    <div className="payment-modal-overlay" onClick={handleClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="payment-modal-header">
          <h2>Complete Payment</h2>
          <button 
            className="close-button" 
            onClick={handleClose}
            disabled={isProcessing}
          >
            ×
          </button>
        </div>

        <div className="payment-modal-body">
          <div className="course-summary">
            <h3>{course.title}</h3>
            {course.subtitle && <p className="course-subtitle">{course.subtitle}</p>}
            <p className="course-price">
              {course.priceType === 'free' || course.price === 0 ? 'Free' : (
                <>
                  {course.salePrice && course.salePrice < course.price && (
                    <span className="original-price">${course.price}</span>
                  )}
                  <span className="final-price">
                    {course.currency || 'AUD'}${course.salePrice || course.price}
                  </span>
                </>
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-group">
              <label>Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={isProcessing}
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
              </select>
            </div>

            <div className="form-group">
              <label>Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ''))}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                disabled={isProcessing}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  placeholder="MM/YY"
                  maxLength="5"
                  disabled={isProcessing}
                />
              </div>
              <div className="form-group">
                <label>CVV</label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                  placeholder="123"
                  maxLength="4"
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Cardholder Name</label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="John Doe"
                disabled={isProcessing}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="payment-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={handleClose}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="pay-button"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Pay ${course.currency || 'AUD'}${course.salePrice || course.price}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
