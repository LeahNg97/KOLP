import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ShortQuestionManagement.css';
import { getCourseById } from '../api/courseApi';
import { shortQuestionApi } from '../api/shortQuestionApi';

export default function ShortQuestionManagement() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [shortQuestions, setShortQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  // Removed activeTab state since we only need the editor
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [hasExistingShortQuiz, setHasExistingShortQuiz] = useState(false);

  // Short Question form state
  const [shortQuestionData, setShortQuestionData] = useState({
    title: '',
    description: '',
    instructions: '',
    passingScore: 70,
    timeLimit: null,
    questions: []
  });

  // Question form state
  const [newQuestionCount, setNewQuestionCount] = useState(3);
  
  // UI state for collapsible sections
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());

  useEffect(() => {
    fetchCourseAndShortQuestions();
  }, [courseId]);

  const fetchCourseAndShortQuestions = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch course details
      try {
        const courseRes = await getCourseById(courseId);
        setCourse(courseRes);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Failed to load course data. Please check your connection and try again.');
        setLoading(false);
        return;
      }

      // Fetch existing short questions
      try {
        const shortQuestionsRes = await shortQuestionApi.getShortQuestionsByCourseId(courseId);
        const questions = shortQuestionsRes.data || [];
        setShortQuestions(questions);
        setHasExistingShortQuiz(questions.length > 0);
        
        // If there's an existing short quiz, load it for editing
        if (questions.length > 0) {
          const existingQuiz = questions[0]; // Only use the first one
          setShortQuestionData({
            title: existingQuiz.title || '',
            description: existingQuiz.description || '',
            instructions: existingQuiz.instructions || '',
            passingScore: existingQuiz.passingScore || 70,
            timeLimit: existingQuiz.timeLimit || null,
            questions: existingQuiz.questions || []
          });
          setEditing(true);
        }
      } catch (err) {
        console.log('No short questions found:', err.message);
        setShortQuestions([]);
        setHasExistingShortQuiz(false);
      }

    } catch (err) {
      console.error('Unexpected error in fetchCourseAndShortQuestions:', err);
      setError('Failed to load course and short question data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShortQuestionDataChange = (field, value) => {
    setShortQuestionData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleGenerateQuestions = () => {
    if (newQuestionCount < 1 || newQuestionCount > 20) {
      setError('Question count must be between 1 and 20');
      return;
    }

    const generatedQuestions = [];
    for (let i = 0; i < newQuestionCount; i++) {
      generatedQuestions.push({
        question: `Short Question ${i + 1}`,
        correctAnswer: `Sample correct answer for question ${i + 1}`,
        explanation: `Explanation for question ${i + 1}`,
        points: 1,
        keywords: [],
        maxLength: 500,
        minLength: 10,
        caseSensitive: false,
        exactMatch: false,
        partialCredit: true
      });
    }
    
    setShortQuestionData(prev => ({ 
      ...prev, 
      questions: generatedQuestions,
      title: prev.title || 'New Short Question Set',
      description: prev.description || 'Short question description',
      instructions: prev.instructions || 'Answer the following questions in your own words.'
    }));
    setHasUnsavedChanges(true);
    
    // Auto expand all questions
    setExpandedQuestions(new Set(generatedQuestions.map((_, index) => index)));
    
    setError('');
    setSuccessMessage(`✅ Generated ${newQuestionCount} short questions. Don't forget to save!`);
    
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const handleQuestionChange = (questionIndex, field, value) => {
    const updatedQuestions = [...shortQuestionData.questions];
    updatedQuestions[questionIndex][field] = value;
    
    setShortQuestionData(prev => ({ ...prev, questions: updatedQuestions }));
    setHasUnsavedChanges(true);
  };

  const handleKeywordChange = (questionIndex, keywordIndex, value) => {
    const updatedQuestions = [...shortQuestionData.questions];
    updatedQuestions[questionIndex].keywords[keywordIndex] = value;
    
    setShortQuestionData(prev => ({ ...prev, questions: updatedQuestions }));
    setHasUnsavedChanges(true);
  };

  const addKeyword = (questionIndex) => {
    const updatedQuestions = [...shortQuestionData.questions];
    updatedQuestions[questionIndex].keywords.push('');
    
    setShortQuestionData(prev => ({ ...prev, questions: updatedQuestions }));
    setHasUnsavedChanges(true);
  };

  const removeKeyword = (questionIndex, keywordIndex) => {
    const updatedQuestions = [...shortQuestionData.questions];
    updatedQuestions[questionIndex].keywords.splice(keywordIndex, 1);
    
    setShortQuestionData(prev => ({ ...prev, questions: updatedQuestions }));
    setHasUnsavedChanges(true);
  };

  const handleSaveShortQuestion = async () => {
    // Validate short question data
    if (!shortQuestionData.title.trim()) {
      setError('Please enter a short question title');
      return;
    }

    if (shortQuestionData.questions.length === 0) {
      setError('Please generate questions for the short question set');
      return;
    }

    // Filter out empty questions and validate
    const validQuestions = shortQuestionData.questions.filter(q => q && q.question && q.question.trim());
    if (validQuestions.length === 0) {
      setError('Please generate and fill in questions for the short question set');
      return;
    }

    // Validate each question
    for (let i = 0; i < validQuestions.length; i++) {
      const question = validQuestions[i];
      if (!question.correctAnswer || question.correctAnswer.trim() === '') {
        setError(`Question ${i + 1} must have a correct answer`);
        return;
      }
    }

    const cleanedShortQuestionData = {
      ...shortQuestionData,
      questions: validQuestions,
      courseId
    };
    
    try {
      setSaving(true);
      setError('');
      
      let response;
      if (hasExistingShortQuiz && shortQuestions.length > 0) {
        // Update existing short quiz
        response = await shortQuestionApi.updateShortQuestion(shortQuestions[0]._id, cleanedShortQuestionData);
        setSuccessMessage('✅ Short question set updated successfully!');
      } else {
        // Create new short quiz
        response = await shortQuestionApi.createShortQuestion(cleanedShortQuestionData);
        setSuccessMessage('✅ Short question set created successfully!');
      }
      
      // Clear unsaved changes after saving
      setHasUnsavedChanges(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      // Refresh data
      await fetchCourseAndShortQuestions();
      
    } catch (err) {
      setError(err.message || 'Failed to save short question set');
    } finally {
      setSaving(false);
    }
  };

  const handleEditShortQuestion = (shortQuestion) => {
    setShortQuestionData({
      title: shortQuestion.title || '',
      description: shortQuestion.description || '',
      instructions: shortQuestion.instructions || '',
      passingScore: shortQuestion.passingScore || 70,
      timeLimit: shortQuestion.timeLimit || null,
      questions: shortQuestion.questions || []
    });
    setEditing(true);
    setHasUnsavedChanges(false);
  };

  const handleDeleteShortQuestion = async (shortQuestionId) => {
    if (window.confirm('Are you sure you want to delete this short question set? This action cannot be undone.')) {
      try {
        await shortQuestionApi.deleteShortQuestion(shortQuestionId);
        setSuccessMessage('✅ Short question set deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Reset form after deletion
        setShortQuestionData({
          title: '',
          description: '',
          instructions: '',
          passingScore: 70,
          timeLimit: null,
          questions: []
        });
        setEditing(false);
        setHasUnsavedChanges(false);
        
        await fetchCourseAndShortQuestions();
      } catch (err) {
        setError(err.message || 'Failed to delete short question set');
      }
    }
  };

  if (loading) {
    return (
      <div className="instructor-layout">
        <main className="instructor-main">
          <div className="short-question-loading">
            <div className="loading-spinner"></div>
            <p>Loading short question management...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div id="short-question-page" className="kolp-layout">
      <main id="main" className="kolp-main" role="main">
        <article id="short-question-management" className="sqm" itemScope itemType="https://schema.org/Article">
          <header id="sqm-header" className="sqm__header" role="banner">
            <div className="sqm__headerContent">
              <h1 className="sqm__title" itemProp="headline">Short Quiz Management 📝</h1>
              <p className="sqm__subtitle">
                Manage Short Quiz for: <strong itemProp="about">{course?.title}</strong>
                <br/>
                <small style={{ color: '#666', fontSize: '0.9em' }}>
                  Each course can have only one Short Quiz containing multiple questions
                </small>
              </p>
            </div>
            <button
              id="btn-back"
              className="btn btn--ghost"
              onClick={() => navigate('/instructor/courses')}
            >
              ← Back to Courses
            </button>
          </header>

          {/* No tabs needed - only editor */}

          {/* Alerts */}
          {error && (
            <div id="alert-error" className="alert alert--error" role="alert" aria-live="assertive">
              {error}
            </div>
          )}
          {successMessage && (
            <div id="alert-success" className="alert alert--success" role="status" aria-live="polite">
              {successMessage}
            </div>
          )}

          {/* Short Quiz Editor */}
          <section
            id="panel-editor"
            className="sqm__panel"
          >
            <div className="editor">
              <div className="editor__top">
                <h2 className="editor__title">
                  {hasExistingShortQuiz ? 'Edit Short Quiz' : 'Create Short Quiz'}
                </h2>
                <div className="editor__actions">
                  {hasUnsavedChanges && <div className="editor__warning">⚠️ You have unsaved changes!</div>}
                  <div className="editor__buttons">
                    <button id="btn-save" className="btn btn--primary" onClick={handleSaveShortQuestion} disabled={saving}>
                      {saving ? '💾 Saving...' : hasUnsavedChanges ? '💾 Save Short Quiz*' : '💾 Save Short Quiz'}
                    </button>
                    {hasExistingShortQuiz && shortQuestions.length > 0 && (
                      <button 
                        id="btn-delete" 
                        className="btn btn--danger" 
                        onClick={() => handleDeleteShortQuestion(shortQuestions[0]._id)}
                        style={{ marginLeft: '0.5rem' }}
                      >
                        🗑️ Delete Quiz
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {hasExistingShortQuiz && shortQuestions.length > 0 && (
                <div className="alert alert--info" style={{ marginBottom: '1rem' }}>
                  <strong>📝 Short Quiz Already Exists</strong><br/>
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Title:</strong> {shortQuestions[0].title}<br/>
                    <strong>Questions:</strong> {shortQuestions[0].questions.length} | 
                    <strong> Passing Score:</strong> {shortQuestions[0].passingScore}% | 
                    <strong> Time Limit:</strong> {shortQuestions[0].timeLimit ? `${shortQuestions[0].timeLimit} min` : 'No limit'}
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9em' }}>
                    You can edit it below or delete it to create a new one.
                  </div>
                </div>
              )}

              <form id="short-question-form" className="form" noValidate>
                {/* Basic Settings */}
                <fieldset className="card" aria-labelledby="legend-basic">
                  <legend id="legend-basic" className="card__legend">Basic Settings</legend>

                  <div className="grid">
                    <div className="field">
                      <label htmlFor="sq-title">Short Question Title</label>
                      <input
                        id="sq-title"
                        type="text"
                        value={shortQuestionData.title}
                        onChange={(e) => handleShortQuestionDataChange('title', e.target.value)}
                        placeholder="Enter short question title..."
                        className="input"
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="sq-desc">Description</label>
                      <textarea
                        id="sq-desc"
                        value={shortQuestionData.description}
                        onChange={(e) => handleShortQuestionDataChange('description', e.target.value)}
                        placeholder="Enter short question description..."
                        rows={2}
                        className="textarea"
                      />
                    </div>
                  </div>

                  <div className="grid">
                    <div className="field">
                      <label htmlFor="sq-instructions">Instructions</label>
                      <textarea
                        id="sq-instructions"
                        value={shortQuestionData.instructions}
                        onChange={(e) => handleShortQuestionDataChange('instructions', e.target.value)}
                        placeholder="Enter instructions for students..."
                        rows={2}
                        className="textarea"
                      />
                    </div>
                  </div>

                  <div className="grid">
                    <div className="field">
                      <label htmlFor="sq-pass">Passing Score (%)</label>
                      <input
                        id="sq-pass"
                        type="number"
                        min="0"
                        max="100"
                        value={shortQuestionData.passingScore}
                        onChange={(e) => handleShortQuestionDataChange('passingScore', parseInt(e.target.value) || 70)}
                        className="input input--sm"
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="sq-time">Time Limit (minutes)</label>
                      <input
                        id="sq-time"
                        type="number"
                        min="1"
                        value={shortQuestionData.timeLimit || ''}
                        onChange={(e) => handleShortQuestionDataChange('timeLimit', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="No limit"
                        className="input input--sm"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Questions */}
                <fieldset className="card" aria-labelledby="legend-questions">
                  <legend id="legend-questions" className="card__legend">Short Quiz Questions</legend>

                  <div className="qs__header">
                    <div className="qs__controls">
                      <label htmlFor="qs-count">Number of Questions</label>
                      <input
                        id="qs-count"
                        type="number"
                        min="1"
                        max="20"
                        value={newQuestionCount}
                        onChange={(e) => setNewQuestionCount(parseInt(e.target.value) || 3)}
                        className="input input--xs"
                      />
                      <button id="btn-generate" className="btn btn--accent" onClick={handleGenerateQuestions} type="button">
                        🎲 Generate Quiz Questions
                      </button>
                    </div>

                    {hasUnsavedChanges && (
                      <p className="qs__notice">📝 Questions generated! Click "Save Short Quiz" to persist changes.</p>
                    )}
                  </div>

                  {shortQuestionData.questions.filter(q => q && q.question && q.question.trim()).length > 0 && (
                    <div className="qs__list">
                      <p className="qs__info">
                        {shortQuestionData.questions.filter(q => q && q.question && q.question.trim()).length} questions in this set
                        {hasUnsavedChanges && <span className="qs__unsaved"> ⚠️ Unsaved changes</span>}
                      </p>

                      {shortQuestionData.questions
                        .filter(q => q && q.question && q.question.trim())
                        .map((question, questionIndex) => {
                          const isExpanded = expandedQuestions.has(questionIndex);
                          return (
                            <section key={questionIndex} className="qItem" aria-label={`Question ${questionIndex + 1}`}>
                              <header className="qItem__head">
                                <button
                                  type="button"
                                  className="qItem__toggle"
                                  aria-expanded={isExpanded}
                                  aria-controls={`q-body-${questionIndex}`}
                                  onClick={() => {
                                    setExpandedQuestions(prev => {
                                      const s = new Set(prev);
                                      isExpanded ? s.delete(questionIndex) : s.add(questionIndex);
                                      return s;
                                    });
                                  }}
                                >
                                  {isExpanded ? '▼' : '▶'} Question {questionIndex + 1}
                                </button>
                              </header>

                              {isExpanded && (
                                <div id={`q-body-${questionIndex}`} className="qItem__body">
                                  <div className="field">
                                    <label htmlFor={`q-text-${questionIndex}`}>Question Text</label>
                                    <textarea
                                      id={`q-text-${questionIndex}`}
                                      value={question.question || ''}
                                      onChange={(e) => handleQuestionChange(questionIndex, 'question', e.target.value)}
                                      placeholder="Enter your question here..."
                                      rows={3}
                                      className="textarea"
                                    />
                                  </div>

                                  <div className="field">
                                    <label htmlFor={`q-answer-${questionIndex}`}>Correct Answer</label>
                                    <textarea
                                      id={`q-answer-${questionIndex}`}
                                      value={question.correctAnswer || ''}
                                      onChange={(e) => handleQuestionChange(questionIndex, 'correctAnswer', e.target.value)}
                                      placeholder="Enter the correct answer..."
                                      rows={3}
                                      className="textarea"
                                    />
                                  </div>

                                  <div className="field">
                                    <label htmlFor={`q-exp-${questionIndex}`}>Explanation</label>
                                    <textarea
                                      id={`q-exp-${questionIndex}`}
                                      value={question.explanation || ''}
                                      onChange={(e) => handleQuestionChange(questionIndex, 'explanation', e.target.value)}
                                      placeholder="Explain why this is the correct answer..."
                                      rows={2}
                                      className="textarea"
                                    />
                                  </div>

                                  <div className="grid">
                                    <div className="field">
                                      <label htmlFor={`q-pts-${questionIndex}`}>Points</label>
                                      <input
                                        id={`q-pts-${questionIndex}`}
                                        type="number"
                                        min="1"
                                        max="10"
                                        className="input input--xs"
                                        value={question.points || 1}
                                        onChange={(e) => handleQuestionChange(questionIndex, 'points', parseInt(e.target.value) || 1)}
                                      />
                                    </div>

                                    <div className="field">
                                      <label htmlFor={`q-maxlen-${questionIndex}`}>Max Length</label>
                                      <input
                                        id={`q-maxlen-${questionIndex}`}
                                        type="number"
                                        min="50"
                                        max="2000"
                                        className="input input--xs"
                                        value={question.maxLength || 500}
                                        onChange={(e) => handleQuestionChange(questionIndex, 'maxLength', parseInt(e.target.value) || 500)}
                                      />
                                    </div>

                                    <div className="field">
                                      <label htmlFor={`q-minlen-${questionIndex}`}>Min Length</label>
                                      <input
                                        id={`q-minlen-${questionIndex}`}
                                        type="number"
                                        min="5"
                                        max="500"
                                        className="input input--xs"
                                        value={question.minLength || 10}
                                        onChange={(e) => handleQuestionChange(questionIndex, 'minLength', parseInt(e.target.value) || 10)}
                                      />
                                    </div>
                                  </div>

                                  <div className="field">
                                    <label>Keywords (for grading)</label>
                                    <div className="keywords-container">
                                      {question.keywords?.map((keyword, keywordIndex) => (
                                        <div key={keywordIndex} className="keyword-row">
                                          <input
                                            type="text"
                                            className="input"
                                            value={keyword || ''}
                                            onChange={(e) => handleKeywordChange(questionIndex, keywordIndex, e.target.value)}
                                            placeholder={`Keyword ${keywordIndex + 1}`}
                                          />
                                          <button
                                            type="button"
                                            className="btn btn--sm btn--danger"
                                            onClick={() => removeKeyword(questionIndex, keywordIndex)}
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        className="btn btn--sm btn--accent"
                                        onClick={() => addKeyword(questionIndex)}
                                      >
                                        + Add Keyword
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid">
                                    <div className="field">
                                      <label className="checkbox-label">
                                        <input
                                          type="checkbox"
                                          checked={question.caseSensitive || false}
                                          onChange={(e) => handleQuestionChange(questionIndex, 'caseSensitive', e.target.checked)}
                                        />
                                        Case Sensitive
                                      </label>
                                    </div>

                                    <div className="field">
                                      <label className="checkbox-label">
                                        <input
                                          type="checkbox"
                                          checked={question.exactMatch || false}
                                          onChange={(e) => handleQuestionChange(questionIndex, 'exactMatch', e.target.checked)}
                                        />
                                        Exact Match Required
                                      </label>
                                    </div>

                                    <div className="field">
                                      <label className="checkbox-label">
                                        <input
                                          type="checkbox"
                                          checked={question.partialCredit || true}
                                          onChange={(e) => handleQuestionChange(questionIndex, 'partialCredit', e.target.checked)}
                                        />
                                        Allow Partial Credit
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </section>
                          );
                        })}
                    </div>
                  )}
                </fieldset>
              </form>
            </div>
          </section>

        </article>
      </main>
    </div>
  );
}
