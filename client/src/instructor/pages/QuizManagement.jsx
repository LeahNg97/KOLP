import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizManagement.css';
import { getCourseById } from '../api/courseApi';
import { getQuizByCourseId, createQuiz, updateQuiz } from '../api/quizApi';
import { shortQuestionApi } from '../api/shortQuestionApi';

export default function QuizManagement() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz', 'short-quiz', 'grading'
  const [editing, setEditing] = useState(true); // Always start in editing mode
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Quiz form state
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    instructions: '',
    passingScore: 70,
    timeLimit: null,
    questions: []
  });

  // Question form state
  const [newQuestionCount, setNewQuestionCount] = useState(5);
  
  // UI state for collapsible sections
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());

  // Short Quiz state
  const [shortQuestions, setShortQuestions] = useState([]);
  const [shortQuestionData, setShortQuestionData] = useState({
    title: '',
    description: '',
    instructions: '',
    passingScore: 70,
    timeLimit: null,
    questions: []
  });
  const [expandedShortQuestions, setExpandedShortQuestions] = useState(new Set());
  const [newShortQuestionCount, setNewShortQuestionCount] = useState(3);

  useEffect(() => {
    fetchCourseAndQuiz();
  }, [courseId]);

  // Auto-refresh quiz data when quiz state changes
  useEffect(() => {
    if (quiz && quiz.data && quiz.data.length > 0) {
      console.log('🔄 Quiz state changed, ensuring data consistency...');
      console.log('🔄 Current quiz data length:', quiz.data.length);
      // Small delay to ensure backend has processed the changes
      const timer = setTimeout(() => {
        console.log('🔄 Executing auto-refresh...');
        refreshQuizData();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [quiz?.data?.length]);

  const fetchCourseAndQuiz = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      // Validate courseId exists and format
      if (!courseId) {
        setError('Course ID is missing from URL. Please navigate from the courses page.');
        setLoading(false);
        return;
      }
      
      if (courseId.length !== 24) {
        setError('Invalid course ID format');
        setLoading(false);
        return;
      }
      
      // Fetch course details
      try {
        const courseRes = await getCourseById(courseId);
        setCourse(courseRes);
      } catch (err) {
        console.error('Error fetching course:', err);
        if (err.response?.status === 401) {
          setError('Authentication failed. Please login again.');
        } else if (err.response?.status === 403) {
          setError('Access denied. You may not have permission to view this course.');
        } else if (err.response?.status === 404) {
          setError('Course not found. Please check the course ID.');
        } else {
          setError('Failed to load course data. Please check your connection and try again.');
        }
        setLoading(false);
        return;
      }

      // Fetch existing quiz if any
      try {
        console.log('🔍 Fetching quiz for courseId:', courseId);
        const quizRes = await getQuizByCourseId(token, courseId);
        console.log('📊 Quiz API response:', quizRes);
        console.log('📊 Quiz response type:', typeof quizRes);
        console.log('📊 Quiz response length:', Array.isArray(quizRes) ? quizRes.length : 'Not an array');
        
        if (quizRes && Array.isArray(quizRes) && quizRes.length > 0) {
          // Get the first quiz (assuming one quiz per course for now)
          const existingQuiz = quizRes[0];
          console.log('✅ Loading existing quiz:', existingQuiz);
          console.log('✅ Quiz ID:', existingQuiz._id);
          console.log('✅ Quiz title:', existingQuiz.title);
          console.log('✅ Quiz questions count:', existingQuiz.questions ? existingQuiz.questions.length : 0);
          console.log('✅ Quiz questions:', existingQuiz.questions);
          
          setQuiz({ data: quizRes }); // Keep the old structure for compatibility
          
          // Convert existing quiz to form format
          setQuizData({
            title: existingQuiz.title || '',
            description: existingQuiz.description || '',
            instructions: existingQuiz.instructions || '',
            passingScore: existingQuiz.passingScore || 70,
            timeLimit: existingQuiz.timeLimit || null,
            questions: existingQuiz.questions || []
          });
          
          // Auto expand questions if they exist
          if (existingQuiz.questions && existingQuiz.questions.length > 0) {
            setExpandedQuestions(new Set(existingQuiz.questions.map((_, index) => index)));
          }
        } else {
          console.log('❌ No existing quiz found for this course');
          console.log('❌ Quiz response was:', quizRes);
          // No quiz exists yet, reset to empty state
          setQuiz(null);
          setQuizData({
            title: '',
            description: '',
            instructions: '',
            passingScore: 70,
            timeLimit: null,
            questions: []
          });
        }
      } catch (err) {
        // No quiz exists yet, that's okay
        console.log('❌ Error fetching quiz:', err.message);
        console.log('❌ Error details:', err);
        setQuiz(null);
        setQuizData({
          title: '',
          description: '',
          instructions: '',
          passingScore: 70,
          timeLimit: null,
            questions: []
        });
      }


      // Fetch short questions
      try {
        const shortQuestionsRes = await shortQuestionApi.getShortQuestionsByCourseId(courseId);
        console.log('📝 Short questions response:', shortQuestionsRes);
        if (shortQuestionsRes && Array.isArray(shortQuestionsRes)) {
          setShortQuestions(shortQuestionsRes);
          // Load the first short question for editing if exists
          if (shortQuestionsRes.length > 0) {
            const firstShortQuestion = shortQuestionsRes[0];
            setShortQuestionData({
              title: firstShortQuestion.title || '',
              description: firstShortQuestion.description || '',
              instructions: firstShortQuestion.instructions || '',
              passingScore: firstShortQuestion.passingScore || 70,
              timeLimit: firstShortQuestion.timeLimit || null,
              questions: firstShortQuestion.questions || []
            });
          }
        }
      } catch (err) {
        console.log('No short questions found:', err.message);
        setShortQuestions([]);
      }

    } catch (err) {
      console.error('Unexpected error in fetchCourseAndQuiz:', err);
      setError(err.response?.data?.message || 'Failed to load course and quiz data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh only quiz data (without loading state)
  const refreshQuizData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch existing quiz if any
      const quizRes = await getQuizByCourseId(token, courseId);
      console.log('🔄 Refreshing quiz data:', quizRes);
      
      if (quizRes && Array.isArray(quizRes) && quizRes.length > 0) {
        const existingQuiz = quizRes[0];
        console.log('✅ Refreshed quiz data:', existingQuiz);
        
        // Validate and clean quiz data before setting
        const validatedQuiz = {
          ...existingQuiz,
          questions: existingQuiz.questions?.filter(q => q && q.question && q.question.trim()) || []
        };
        
        console.log('🧹 Validated quiz data:', validatedQuiz);
        
        setQuiz({ data: [validatedQuiz] });
        
        // Update quizData with fresh data from server
        setQuizData({
          title: validatedQuiz.title || '',
          description: validatedQuiz.description || '',
          instructions: validatedQuiz.instructions || '',
          passingScore: validatedQuiz.passingScore || 70,
          timeLimit: validatedQuiz.timeLimit || null,
          questions: validatedQuiz.questions || []
        });
        
        // Auto expand questions if they exist
        if (validatedQuiz.questions && validatedQuiz.questions.length > 0) {
          setExpandedQuestions(new Set(validatedQuiz.questions.map((_, index) => index)));
        }
        
        // Clear any error messages
        setError('');
      } else {
        console.log('❌ No quiz found after refresh');
        setQuiz(null);
        setQuizData({
          title: '',
          description: '',
          instructions: '',
          passingScore: 70,
          timeLimit: null,
          questions: []
        });
      }
    } catch (err) {
      console.error('Error refreshing quiz data:', err);
      setError('Failed to refresh quiz data. Please try again.');
    }
  };

  const handleQuizDataChange = (field, value) => {
    setQuizData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleGenerateQuestions = () => {
    if (newQuestionCount < 1 || newQuestionCount > 20) {
      setError('Question count must be between 1 and 20');
      return;
    }

    // If there are unsaved changes, show alert
    if (hasUnsavedChanges) {
      setPendingAction(() => () => regenerateQuestions());
      setShowSaveAlert(true);
    } else {
      regenerateQuestions();
    }
  };

  const regenerateQuestions = () => {
    const generatedQuestions = [];
    for (let i = 0; i < newQuestionCount; i++) {
      generatedQuestions.push({
        question: `Question ${i + 1}`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctIndex: 0,
        explanation: '',
        points: 1
      });
    }
    
    // Clean up any existing questions and replace with new ones
    setQuizData(prev => ({ 
      ...prev, 
      questions: generatedQuestions,
      title: prev.title || 'New Quiz',
      description: prev.description || 'Quiz description',
      instructions: prev.instructions || 'Quiz instructions'
    }));
    setHasUnsavedChanges(true);
    
    // Auto expand all questions
    setExpandedQuestions(new Set(generatedQuestions.map((_, index) => index)));
    
    // Show success message
    setError('');
    setSuccessMessage(`✅ Generated ${newQuestionCount} questions. Don't forget to save!`);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
    
    console.log(`Generated ${newQuestionCount} questions. Don't forget to save!`);
  };

  const handleQuestionChange = (questionIndex, field, value) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[questionIndex][field] = value;
    
    setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
    setHasUnsavedChanges(true);
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    
    setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
    setHasUnsavedChanges(true);
  };

  const handleQuestionCountChange = (newCount) => {
    if (newCount < 1 || newCount > 20) return;
    
    setNewQuestionCount(newCount);
  };

  // Short Quiz handlers
  const handleShortQuestionDataChange = (field, value) => {
    setShortQuestionData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleGenerateShortQuestions = () => {
    if (newShortQuestionCount < 1 || newShortQuestionCount > 10) {
      setError('Short question count must be between 1 and 10');
      return;
    }

    const generatedQuestions = [];
    for (let i = 0; i < newShortQuestionCount; i++) {
      generatedQuestions.push({
        question: `Short Question ${i + 1}`,
        correctAnswer: '',
        explanation: '',
        points: 1,
        maxLength: 500,
        minLength: 10
      });
    }
    
    setShortQuestionData(prev => ({ 
      ...prev, 
      questions: generatedQuestions,
      title: prev.title || 'Short Questions',
      description: prev.description || 'Short answer questions',
      instructions: prev.instructions || 'Answer the following questions in detail'
    }));
    setHasUnsavedChanges(true);
    
    // Auto expand all questions
    setExpandedShortQuestions(new Set(generatedQuestions.map((_, index) => index)));
    
    setError('');
    setSuccessMessage(`✅ Generated ${newShortQuestionCount} short questions. Don't forget to save!`);
    
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const handleShortQuestionChange = (questionIndex, field, value) => {
    const updatedQuestions = [...shortQuestionData.questions];
    updatedQuestions[questionIndex][field] = value;
    
    setShortQuestionData(prev => ({ ...prev, questions: updatedQuestions }));
    setHasUnsavedChanges(true);
  };

  const handleSaveShortQuiz = async () => {
    // Validate short quiz data
    if (!shortQuestionData.title.trim()) {
      setError('Please enter a short quiz title');
      return;
    }

    if (shortQuestionData.questions.length === 0) {
      setError('Please generate questions for the short quiz');
      return;
    }

    // Filter out empty questions and validate
    const validQuestions = shortQuestionData.questions.filter(q => q && q.question && q.question.trim());
    if (validQuestions.length === 0) {
      setError('Please generate and fill in questions for the short quiz');
      return;
    }

    // Validate each question has valid answer
    for (let i = 0; i < validQuestions.length; i++) {
      const question = validQuestions[i];
      if (!question.correctAnswer || !question.correctAnswer.trim()) {
        setError(`Question ${i + 1} must have a correct answer`);
        return;
      }
    }

    const cleanedShortQuestionData = {
      ...shortQuestionData,
      questions: validQuestions
    };
    
    console.log('🧹 Cleaned short quiz data for saving:', cleanedShortQuestionData);

    try {
      setSaving(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (shortQuestions.length > 0) {
        // Update existing short quiz
        const existingShortQuestion = shortQuestions[0];
        console.log('🔄 Updating existing short quiz with ID:', existingShortQuestion._id);
        const updateResponse = await shortQuestionApi.updateShortQuestion(existingShortQuestion._id, cleanedShortQuestionData);
        console.log('✅ Update response:', updateResponse);
      } else {
        // Create new short quiz
        console.log('🆕 Creating new short quiz with data:', { ...cleanedShortQuestionData, courseId });
        const newShortQuizResponse = await shortQuestionApi.createShortQuestion({
          ...cleanedShortQuestionData,
          courseId
        });
        console.log('🆕 Create response:', newShortQuizResponse);
      }

      // Refresh short questions data
      const shortQuestionsRes = await shortQuestionApi.getShortQuestionsByCourseId(courseId);
      if (shortQuestionsRes && Array.isArray(shortQuestionsRes)) {
        setShortQuestions(shortQuestionsRes);
      }

      // Clear unsaved changes after saving
      setHasUnsavedChanges(false);
      
      // Show success message
      setError('');
      setSuccessMessage('✅ Short quiz saved successfully!');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save short quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndContinue = async () => {
    setShowSaveAlert(false);
    try {
      await handleSaveQuiz();
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } catch (err) {
      // Error handling is already in handleSaveQuiz
    }
  };

  const handleContinueWithoutSaving = () => {
    setShowSaveAlert(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleCancelAction = () => {
    setShowSaveAlert(false);
    setPendingAction(null);
  };

  const handleSaveQuiz = async () => {
    // Validate quiz data
    if (!quizData.title.trim()) {
      setError('Please enter a quiz title');
      return;
    }

    if (quizData.questions.length === 0) {
      setError('Please generate questions for the quiz');
      return;
    }

    // Filter out empty questions and validate
    const validQuestions = quizData.questions.filter(q => q && q.question && q.question.trim());
    if (validQuestions.length === 0) {
      setError('Please generate and fill in questions for the quiz');
      return;
    }

    // Validate each question has valid options and correct answer
    for (let i = 0; i < validQuestions.length; i++) {
      const question = validQuestions[i];
      if (!question.options || question.options.length < 2) {
        setError(`Question ${i + 1} must have at least 2 options`);
        return;
      }
      
      const validOptions = question.options.filter(opt => opt && opt.trim());
      if (validOptions.length < 2) {
        setError(`Question ${i + 1} must have at least 2 valid options`);
        return;
      }
      
      if (question.correctIndex < 0 || question.correctIndex >= validOptions.length) {
        setError(`Question ${i + 1} has invalid correct answer selection`);
        return;
      }
    }

    // Update quizData with only valid questions
    const cleanedQuizData = {
      ...quizData,
      questions: validQuestions
    };
    
    console.log('🧹 Cleaned quiz data for saving:', cleanedQuizData);

    try {
      setSaving(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (quiz && quiz.data && quiz.data.length > 0) {
        // Update existing quiz
        const existingQuiz = quiz.data[0];
        console.log('🔄 Updating existing quiz with ID:', existingQuiz._id);
        console.log('🔄 Update data:', cleanedQuizData);
        const updateResponse = await updateQuiz(token, existingQuiz._id, cleanedQuizData);
        console.log('✅ Update response:', updateResponse);
        
        // Refresh quiz data from server to ensure consistency
        await refreshQuizData();
      } else {
        // Create new quiz
        console.log('🆕 Creating new quiz with data:', { ...cleanedQuizData, courseId });
        const newQuizResponse = await createQuiz(token, {
          ...cleanedQuizData,
          courseId
        });
        console.log('🆕 Create response:', newQuizResponse);
        
        // Get the actual quiz ID from the response
        // Backend returns: { success: true, data: quiz }
        const newQuiz = newQuizResponse.data || newQuizResponse;
        const newQuizId = newQuiz._id || newQuiz.id;
        console.log('🆕 New quiz ID:', newQuizId);
        console.log('🆕 New quiz data:', newQuiz);
        
        // Update local quiz state with the real ID
        const newQuizData = {
          _id: newQuizId,
          ...quizData,
          courseId
        };
        setQuiz({
          data: [newQuizData]
        });
        
        // Also update quizData to ensure consistency
        setQuizData(prev => ({
          ...prev,
          _id: newQuizId
        }));
        
        // Refresh quiz data from server to ensure consistency
        await refreshQuizData();
      }

      // Clear unsaved changes after saving
      setHasUnsavedChanges(false);
      
      // Show success message
      setError('');
      setSuccessMessage('✅ Quiz saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      // Force refresh to ensure data consistency
      setTimeout(() => {
        refreshQuizData();
      }, 1000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    if (percentage >= 40) return '#fd7e14';
    return '#dc3545';
  };


  if (loading) {
    return (
      <div className="instructor-layout">
        <main className="instructor-main">
          <div className="quiz-loading">
            <div className="loading-spinner"></div>
            <p>Loading quiz management...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
      <div id="quiz-page" className="kolp-layout">
        <main id="main" className="kolp-main" role="main">
          <article id="quiz-management" className="qm" itemScope itemType="https://schema.org/Article">
            <header id="qm-header" className="qm__header" role="banner">
              <div className="qm__headerContent">
                <h1 className="qm__title" itemProp="headline">Quiz Management 🧠</h1>
                <p className="qm__subtitle">
                  Manage quiz for: <strong itemProp="about">{course?.title}</strong>
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
    
            {/* Tabs */}
            <nav id="qm-tabs" className="tabs" role="tablist" aria-label="Quiz sections">
              <button
                id="tab-editor"
                role="tab"
                aria-selected={activeTab === 'quiz'}
                aria-controls="panel-editor"
                className={`tabs__btn ${activeTab === 'quiz' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('quiz')}
              >
                📝 Quiz Editor
              </button>
              <button
                id="tab-short-quiz"
                role="tab"
                aria-selected={activeTab === 'short-quiz'}
                aria-controls="panel-short-quiz"
                className={`tabs__btn ${activeTab === 'short-quiz' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('short-quiz')}
              >
                📝 Short Quiz ({shortQuestions.length})
              </button>
              <button
                id="tab-grading"
                role="tab"
                aria-selected={activeTab === 'grading'}
                aria-controls="panel-grading"
                className={`tabs__btn ${activeTab === 'grading' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('grading')}
              >
                📊 Grading
              </button>
            </nav>
    
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
    
            {/* Editor */}
            <section
              id="panel-editor"
              className="qm__panel"
              role="tabpanel"
              aria-labelledby="tab-editor"
              hidden={activeTab !== 'quiz'}
            >
              <div className="editor">
                <div className="editor__top">
                  <h2 className="editor__title">Quiz Settings</h2>
                  <div className="editor__actions">
                    
                    {hasUnsavedChanges && <div className="editor__warning">⚠️ You have unsaved changes!</div>}
    
                    <button id="btn-save" className="btn btn--primary" onClick={handleSaveQuiz} disabled={saving}>
                      {saving ? '💾 Saving...' : hasUnsavedChanges ? '💾 Save Quiz*' : '💾 Save Quiz'}
                    </button>
                  </div>
                </div>
    
                <form id="quiz-form" className="form" noValidate>
                  {/* Basic */}
                  <fieldset className="card" aria-labelledby="legend-basic">
                    <legend id="legend-basic" className="card__legend">Basic Settings</legend>
    
                    <div className="grid">
                      <div className="field">
                        <label htmlFor="quiz-title">Quiz Title</label>
                        <input
                          id="quiz-title"
                          type="text"
                          value={quizData.title}
                          onChange={(e) => handleQuizDataChange('title', e.target.value)}
                          placeholder="Enter quiz title..."
                          className="input"
                          required
                        />
                      </div>
    
                      <div className="field">
                        <label htmlFor="quiz-desc">Description</label>
                        <textarea
                          id="quiz-desc"
                          value={quizData.description}
                          onChange={(e) => handleQuizDataChange('description', e.target.value)}
                          placeholder="Enter quiz description..."
                          rows={2}
                          className="textarea"
                        />
                      </div>
                    </div>
    
                    <div className="grid">
                      <div className="field">
                        <label htmlFor="quiz-instructions">Instructions</label>
                        <textarea
                          id="quiz-instructions"
                          value={quizData.instructions}
                          onChange={(e) => handleQuizDataChange('instructions', e.target.value)}
                          placeholder="Enter instructions for students..."
                          rows={2}
                          className="textarea"
                        />
                      </div>
                    </div>
    
                    <div className="grid">
                      <div className="field">
                        <label htmlFor="quiz-pass">Passing Score (%)</label>
                        <input
                          id="quiz-pass"
                          type="number"
                          min="0"
                          max="100"
                          value={quizData.passingScore}
                          onChange={(e) => handleQuizDataChange('passingScore', parseInt(e.target.value) || 70)}
                          className="input input--sm"
                        />
                      </div>
    
                      <div className="field">
                        <label htmlFor="quiz-time">Time Limit (minutes)</label>
                        <input
                          id="quiz-time"
                          type="number"
                          min="1"
                          value={quizData.timeLimit || ''}
                          onChange={(e) => handleQuizDataChange('timeLimit', e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="No limit"
                          className="input input--sm"
                        />
                      </div>
                    </div>
                  </fieldset>
    
                  {/* Questions */}
                  <fieldset className="card" aria-labelledby="legend-questions">
                    <legend id="legend-questions" className="card__legend">Questions</legend>
    
                    <div className="qs__header">
                      <div className="qs__controls">
                        <label htmlFor="qs-count">Number of Questions</label>
                        <input
                          id="qs-count"
                          type="number"
                          min="1"
                          max="20"
                          value={newQuestionCount}
                          onChange={(e) => handleQuestionCountChange(parseInt(e.target.value) || 5)}
                          className="input input--xs"
                        />
                        <button id="btn-generate" className="btn btn--accent" onClick={handleGenerateQuestions} type="button">
                          🎲 Generate Questions
                        </button>
                      </div>
    
                      {hasUnsavedChanges && (
                        <p className="qs__notice">📝 Questions generated! Click “Save Quiz” to persist changes.</p>
                      )}
                    </div>
    
                    {quizData.questions.filter(q => q && q.question && q.question.trim()).length > 0 && (
                      <div className="qs__list">
                        <p className="qs__info">
                          {quizData.questions.filter(q => q && q.question && q.question.trim()).length} questions in this quiz
                          {hasUnsavedChanges && <span className="qs__unsaved"> ⚠️ Unsaved changes</span>}
                        </p>
    
                        {quizData.questions
                          .filter(q => q && q.question && q.question.trim())
                          .map((question, questionIndex) => {
                            const isExpanded = expandedQuestions.has(questionIndex);
                            return (
                              <section key={questionIndex} className="qItem" aria-label={`Question ${questionIndex + 1}`}>
                                <header className="qItem__head">
                                  <button
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
                                      <label>Options</label>
                                      {question.options.filter(Boolean).map((option, optionIndex) => (
                                        <div key={optionIndex} className="optionRow">
                                          <input
                                            type="text"
                                            className="input"
                                            value={option || ''}
                                            onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                                            placeholder={`Option ${optionIndex + 1}`}
                                          />
                                          <label className="optionRow__right">
                                            <input
                                              type="radio"
                                              name={`correct-${questionIndex}`}
                                              checked={question.correctIndex === optionIndex}
                                              onChange={() => handleQuestionChange(questionIndex, 'correctIndex', optionIndex)}
                                            />
                                            <span>Correct</span>
                                          </label>
                                        </div>
                                      ))}
                                    </div>
    
                                    <div className="grid">
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

            {/* Short Quiz Editor */}
            <section
              id="panel-short-quiz"
              className="qm__panel"
              role="tabpanel"
              aria-labelledby="tab-short-quiz"
              hidden={activeTab !== 'short-quiz'}
            >
              <div className="editor">
                <div className="editor__top">
                  <h2 className="editor__title">Short Quiz Settings</h2>
                  <div className="editor__actions">
                    {hasUnsavedChanges && <div className="editor__warning">⚠️ You have unsaved changes!</div>}
                    <button id="btn-save-short" className="btn btn--primary" onClick={handleSaveShortQuiz} disabled={saving}>
                      {saving ? '💾 Saving...' : hasUnsavedChanges ? '💾 Save Short Quiz*' : '💾 Save Short Quiz'}
                    </button>
                  </div>
                </div>

                <form id="short-quiz-form" className="form" noValidate>
                  {/* Basic Settings */}
                  <fieldset className="card" aria-labelledby="legend-short-basic">
                    <legend id="legend-short-basic" className="card__legend">Basic Settings</legend>

                    <div className="grid">
                      <div className="field">
                        <label htmlFor="short-quiz-title">Short Quiz Title</label>
                        <input
                          id="short-quiz-title"
                          type="text"
                          value={shortQuestionData.title}
                          onChange={(e) => handleShortQuestionDataChange('title', e.target.value)}
                          placeholder="Enter short quiz title..."
                          className="input"
                          required
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="short-quiz-desc">Description</label>
                        <textarea
                          id="short-quiz-desc"
                          value={shortQuestionData.description}
                          onChange={(e) => handleShortQuestionDataChange('description', e.target.value)}
                          placeholder="Enter short quiz description..."
                          rows={2}
                          className="textarea"
                        />
                      </div>
                    </div>

                    <div className="grid">
                      <div className="field">
                        <label htmlFor="short-quiz-instructions">Instructions</label>
                        <textarea
                          id="short-quiz-instructions"
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
                        <label htmlFor="short-quiz-pass">Passing Score (%)</label>
                        <input
                          id="short-quiz-pass"
                          type="number"
                          min="0"
                          max="100"
                          value={shortQuestionData.passingScore}
                          onChange={(e) => handleShortQuestionDataChange('passingScore', parseInt(e.target.value) || 70)}
                          className="input input--sm"
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="short-quiz-time">Time Limit (minutes)</label>
                        <input
                          id="short-quiz-time"
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

                  {/* Short Questions */}
                  <fieldset className="card" aria-labelledby="legend-short-questions">
                    <legend id="legend-short-questions" className="card__legend">Short Answer Questions</legend>

                    <div className="qs__header">
                      <div className="qs__controls">
                        <label htmlFor="short-qs-count">Number of Questions</label>
                        <input
                          id="short-qs-count"
                          type="number"
                          min="1"
                          max="10"
                          value={newShortQuestionCount}
                          onChange={(e) => setNewShortQuestionCount(parseInt(e.target.value) || 3)}
                          className="input input--xs"
                        />
                        <button id="btn-generate-short" className="btn btn--accent" onClick={handleGenerateShortQuestions} type="button">
                          🎲 Generate Short Questions
                        </button>
                      </div>

                      {hasUnsavedChanges && (
                        <p className="qs__notice">📝 Short questions generated! Click "Save Short Quiz" to persist changes.</p>
                      )}
                    </div>

                    {shortQuestionData.questions.filter(q => q && q.question && q.question.trim()).length > 0 && (
                      <div className="qs__list">
                        <p className="qs__info">
                          {shortQuestionData.questions.filter(q => q && q.question && q.question.trim()).length} short questions in this quiz
                          {hasUnsavedChanges && <span className="qs__unsaved"> ⚠️ Unsaved changes</span>}
                        </p>

                        {shortQuestionData.questions
                          .filter(q => q && q.question && q.question.trim())
                          .map((question, questionIndex) => {
                            const isExpanded = expandedShortQuestions.has(questionIndex);
                            return (
                              <section key={questionIndex} className="qItem" aria-label={`Short Question ${questionIndex + 1}`}>
                                <header className="qItem__head">
                                  <button
                                    className="qItem__toggle"
                                    aria-expanded={isExpanded}
                                    aria-controls={`short-q-body-${questionIndex}`}
                                    onClick={() => {
                                      setExpandedShortQuestions(prev => {
                                        const s = new Set(prev);
                                        isExpanded ? s.delete(questionIndex) : s.add(questionIndex);
                                        return s;
                                      });
                                    }}
                                  >
                                    {isExpanded ? '▼' : '▶'} Short Question {questionIndex + 1}
                                  </button>
                                </header>

                                {isExpanded && (
                                  <div id={`short-q-body-${questionIndex}`} className="qItem__body">
                                    <div className="field">
                                      <label htmlFor={`short-q-text-${questionIndex}`}>Question Text</label>
                                      <textarea
                                        id={`short-q-text-${questionIndex}`}
                                        value={question.question || ''}
                                        onChange={(e) => handleShortQuestionChange(questionIndex, 'question', e.target.value)}
                                        placeholder="Enter your short answer question here..."
                                        rows={3}
                                        className="textarea"
                                      />
                                    </div>

                                    <div className="field">
                                      <label htmlFor={`short-q-answer-${questionIndex}`}>Correct Answer</label>
                                      <textarea
                                        id={`short-q-answer-${questionIndex}`}
                                        value={question.correctAnswer || ''}
                                        onChange={(e) => handleShortQuestionChange(questionIndex, 'correctAnswer', e.target.value)}
                                        placeholder="Enter the correct answer..."
                                        rows={3}
                                        className="textarea"
                                      />
                                    </div>

                                    <div className="grid">
                                      <div className="field">
                                        <label htmlFor={`short-q-exp-${questionIndex}`}>Explanation</label>
                                        <textarea
                                          id={`short-q-exp-${questionIndex}`}
                                          value={question.explanation || ''}
                                          onChange={(e) => handleShortQuestionChange(questionIndex, 'explanation', e.target.value)}
                                          placeholder="Explain the answer and provide context..."
                                          rows={2}
                                          className="textarea"
                                        />
                                      </div>

                                      <div className="field">
                                        <label htmlFor={`short-q-pts-${questionIndex}`}>Points</label>
                                        <input
                                          id={`short-q-pts-${questionIndex}`}
                                          type="number"
                                          min="1"
                                          max="10"
                                          className="input input--xs"
                                          value={question.points || 1}
                                          onChange={(e) => handleShortQuestionChange(questionIndex, 'points', parseInt(e.target.value) || 1)}
                                        />
                                      </div>
                                    </div>

                                    <div className="grid">
                                      <div className="field">
                                        <label htmlFor={`short-q-min-${questionIndex}`}>Minimum Length</label>
                                        <input
                                          id={`short-q-min-${questionIndex}`}
                                          type="number"
                                          min="1"
                                          className="input input--xs"
                                          value={question.minLength || 10}
                                          onChange={(e) => handleShortQuestionChange(questionIndex, 'minLength', parseInt(e.target.value) || 10)}
                                        />
                                      </div>

                                      <div className="field">
                                        <label htmlFor={`short-q-max-${questionIndex}`}>Maximum Length</label>
                                        <input
                                          id={`short-q-max-${questionIndex}`}
                                          type="number"
                                          min="1"
                                          className="input input--xs"
                                          value={question.maxLength || 500}
                                          onChange={(e) => handleShortQuestionChange(questionIndex, 'maxLength', parseInt(e.target.value) || 500)}
                                        />
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

            {/* Grading Panel */}
            <section
              id="panel-grading"
              className="qm__panel"
              role="tabpanel"
              aria-labelledby="tab-grading"
              hidden={activeTab !== 'grading'}
            >
              <div className="grading">
                <header className="grading__header">
                  <h2>Short Quiz Grading</h2>
                  <p>Review and grade student submissions for short answer questions</p>
                </header>

                <div className="grading__content">
                  <div className="card">
                    <div className="grading__empty">
                      <div className="grading__emptyIcon">📝</div>
                      <h3>Short Quiz Grading</h3>
                      <p>Grade student submissions for short answer questions.</p>
                      <button 
                        className="btn btn--primary"
                        onClick={() => navigate(`/instructor/courses/${courseId}/short-question/grading`)}
                      >
                        📊 Go to Grading Page
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </article>
        </main>
    
        {/* Save Alert Modal */}
        {showSaveAlert && (
          <div id="save-alert" className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal__box">
              <div className="modal__head">
                <div className="modal__icon">💾</div>
                <h3 id="modal-title">Unsaved Changes</h3>
              </div>
              <div className="modal__content">
                <p>You have unsaved changes to your quiz. What would you like to do?</p>
              </div>
              <div className="modal__actions">
                <button className="btn btn--primary" onClick={handleSaveAndContinue} disabled={saving}>
                  {saving ? '💾 Saving...' : '💾 Save & Continue'}
                </button>
                <button className="btn btn--neutral" onClick={handleContinueWithoutSaving} disabled={saving}>
                  ⚠️ Continue Without Saving
                </button>
                <button className="btn btn--ghost" onClick={handleCancelAction} disabled={saving}>
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}