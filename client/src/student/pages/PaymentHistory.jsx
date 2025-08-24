import React, { useState, useEffect } from 'react';
import { paymentApi } from '../api/paymentApi';
import './PaymentHistory.css';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const data = await paymentApi.getPaymentHistory();
      setPayments(data);
    } catch (error) {
      setError('Failed to fetch payment history');
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      completed: 'status-completed',
      pending: 'status-pending',
      failed: 'status-failed',
      refunded: 'status-refunded'
    };

    return (
      <span className={`status-badge ${statusClasses[status] || ''}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      credit_card: '💳',
      debit_card: '💳',
      paypal: '🔵',
      stripe: '💳'
    };
    return icons[method] || '💳';
  };

  if (loading) {
    return (
      <div className="payment-history-container">
        <div className="loading-spinner">Loading payment history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-history-container">
        <div className="error-message">
          {error}
          <button onClick={fetchPaymentHistory} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-history-container">
      <div className="payment-history-header">
        <h1>Payment History</h1>
        <p>Track all your course payments and enrollments</p>
      </div>

      {payments.length === 0 ? (
        <div className="no-payments">
          <div className="no-payments-icon">💳</div>
          <h3>No payments yet</h3>
          <p>You haven't made any payments yet. Start learning by enrolling in a course!</p>
        </div>
      ) : (
        <div className="payments-list">
          {payments.map((payment) => (
            <div key={payment._id} className="payment-card">
              <div className="payment-header">
                <div className="payment-method">
                  <span className="method-icon">
                    {getPaymentMethodIcon(payment.paymentMethod)}
                  </span>
                  <span className="method-text">
                    {payment.paymentMethod.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                {getStatusBadge(payment.paymentStatus)}
              </div>

              <div className="payment-details">
                <div className="course-info">
                  <h3>{payment.courseId?.title || 'Course Title Unavailable'}</h3>
                  <p className="course-description">
                    {payment.courseId?.description || 'No description available'}
                  </p>
                </div>

                <div className="payment-amount">
                  <span className="amount">${payment.amount}</span>
                  <span className="currency">{payment.currency}</span>
                </div>
              </div>

              <div className="payment-footer">
                <div className="transaction-info">
                  <span className="transaction-id">
                    TXN: {payment.transactionId}
                  </span>
                  <span className="payment-date">
                    {formatDate(payment.paymentDate)}
                  </span>
                </div>

                {payment.notes && (
                  <div className="payment-notes">
                    <strong>Notes:</strong> {payment.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
