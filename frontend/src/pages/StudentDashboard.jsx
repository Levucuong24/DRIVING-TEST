import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, LogOut, CheckCircle, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';

const QUESTION_TIME_LIMIT = 1;

const StudentDashboard = () => {
  const [examState, setExamState] = useState('idle'); 
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // key: questionIndex, value: selectedOptionIndex
  const [result, setResult] = useState(null);
  const [examHistory, setExamHistory] = useState([]);
  const [selectedExamDetails, setSelectedExamDetails] = useState(null);
  const [selectedTotalQuestions, setSelectedTotalQuestions] = useState(25);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (examState !== 'active' || questions.length === 0) {
      return undefined;
    }

    const timer = setTimeout(() => {
      submitExam(true);
    }, questions.length * QUESTION_TIME_LIMIT * 1000);

    return () => clearTimeout(timer);
  }, [examState, questions.length]);

  useEffect(() => {
    if (examState !== 'active' || questions.length === 0) {
      return undefined;
    }

    const countdown = setInterval(() => {
      setTimeLeft((prev) => (prev <= 0 ? 0 : Number(Math.max(prev - 0.1, 0).toFixed(1))));
    }, 100);

    return () => clearInterval(countdown);
  }, [examState, questions.length]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const startExam = async () => {
    setExamState('loading');
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResult(null);
    try {
      const { data } = await api.get('/exam/generate', { params: { amount: selectedTotalQuestions } });
      if (data.length === 0) {
        toast.warning('No questions available to generate an exam.');
        setExamState('idle');
        return;
      }
      setQuestions(data);
      setTimeLeft(data.length * QUESTION_TIME_LIMIT);
      setExamState('active');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate exam');
      setExamState('idle');
    }
  };

  const handleSelectOption = (optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }));
  };

  const submitExam = async (skipConfirmation = false) => {
    if (!skipConfirmation && Object.keys(answers).length < questions.length) {
      if (!window.confirm('You have unanswered questions. Are you sure you want to submit?')) {
        return;
      }
    }

    setExamState('loading');
    const formattedAnswers = questions.map((q, idx) => ({
      questionId: q._id,
      selectedAnswer: answers[idx],
    }));

    try {
      const { data } = await api.post('/exam/submit', {
        answers: formattedAnswers,
        userId: user._id
      });
      setResult(data);
      setExamState('submitted');
      toast.success('Exam submitted successfully!');
    } catch (err) {
      toast.error('Failed to submit exam');
      setExamState('active');
    }
  };

  const fetchHistory = async () => {
    setExamState('loading');
    try {
      const { data } = await api.get(`/exam/history/${user._id}`);
      setExamHistory(data);
      setExamState('history');
    } catch (err) {
      toast.error('Failed to load exam history');
      setExamState('idle');
    }
  };

  const fetchExamDetails = async (examId) => {
    setExamState('loading');
    try {
      const { data } = await api.get(`/exam/${examId}/details`);
      setSelectedExamDetails(data);
      setExamState('details');
    } catch (err) {
      toast.error('Failed to load exam details');
      setExamState('history');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Student Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-5 w-5 inline" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto px-4 w-full py-8 sm:px-6 lg:px-8">
        {examState === 'idle' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center mt-10">
            <div className="mx-auto w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <FileText className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Ready for your test?</h2>
            <p className="text-lg text-gray-500 mb-6 max-w-lg mx-auto">
              This exam consists of multiple-choice questions. You will only fail if you answer 2/3 of the total questions incorrectly.
            </p>
            <div className="mb-8 max-w-xs mx-auto">
              <label htmlFor="total-questions" className="block text-sm font-medium text-gray-700 mb-2">
                Select Total Questions
              </label>
              <select
                id="total-questions"
                value={selectedTotalQuestions}
                onChange={(e) => setSelectedTotalQuestions(Number(e.target.value))}
                className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-xl shadow-sm border"
              >
                <option value={10}>10 Questions</option>
                <option value={20}>20 Questions</option>
                <option value={25}>25 Questions (Standard)</option>
                <option value={30}>30 Questions</option>
                <option value={50}>50 Questions</option>
                <option value={100}>100 Questions</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={startExam}
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-all hover:-translate-y-0.5"
              >
                Start Exam Now
              </button>
              <button
                onClick={fetchHistory}
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-200 text-lg font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all hover:-translate-y-0.5"
              >
                View Exam History
              </button>
            </div>
          </div>
        )}

        {examState === 'loading' && (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-gray-500 font-medium">Please wait...</p>
          </div>
        )}

        {examState === 'active' && questions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <span className="text-sm font-bold tracking-wider text-gray-500 uppercase">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <div className="mt-2 h-2 w-48 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-red-500 transition-all duration-100"
                    style={{ width: `${(timeLeft / (questions.length * QUESTION_TIME_LIMIT)) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <div className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2">
                  Total: {timeLeft.toFixed(1)}s left
                </div>
                <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {Math.round((Object.keys(answers).length / questions.length) * 100)}% Answered
                </div>
              </div>
            </div>
            
            <div className="p-6 sm:p-10 text-xl text-gray-900 font-medium leading-relaxed">
              {questions[currentQuestionIndex].isCritical && (
                <div className="mb-4">
                  <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                    Critical Question
                  </span>
                </div>
              )}
              {questions[currentQuestionIndex].question}
            </div>
            
            {questions[currentQuestionIndex].image && (
              <div className="px-6 sm:px-10 pb-6">
                <img src={questions[currentQuestionIndex].image} alt="Question" className="max-h-64 rounded-lg shadow-sm border border-gray-100" />
              </div>
            )}

            <div className="px-6 sm:px-10 pb-10 space-y-3">
              {questions[currentQuestionIndex].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all ${
                    answers[currentQuestionIndex] === idx
                      ? 'border-blue-600 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full border mr-4 font-semibold text-sm ${
                      answers[currentQuestionIndex] === idx
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 text-gray-500'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className={answers[currentQuestionIndex] === idx ? 'text-blue-900 font-medium' : 'text-gray-700'}>
                      {opt}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </button>
              
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
                
              ) : (
                <button
                  onClick={submitExam}
                  className="inline-flex items-center px-6 py-2 text-sm font-bold tracking-wide text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 shadow-sm transition-colors"
                >
                  Submit Exam
                </button>
              )}
               <button
                onClick={() => setExamState('idle')}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors focus:outline-none bg-white/10"
              >
                 <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setExamState('idle')}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors focus:outline-none bg-white/10"
              >
                 <ArrowLeft className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {examState === 'submitted' && result && (
           <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 sm:p-12 text-center mt-10 max-w-2xl mx-auto transform transition-all">
             <div className="flex justify-center mb-6">
               {result.status === 'pass' ? (
                 <CheckCircle className="h-24 w-24 text-green-500 drop-shadow-md" />
               ) : (
                 <XCircle className="h-24 w-24 text-red-500 drop-shadow-md" />
               )}
             </div>
             <h2 className="text-4xl font-black text-gray-900 mb-2 mt-4">
               {result.status === 'pass' ? 'Congratulations!' : 'Keep Trying!'}
             </h2>
             <p className="text-xl text-gray-600 font-medium mb-8">
               You {result.status === 'pass' ? 'passed' : 'did not pass'} the exam.
             </p>
             {result.failReason === 'failed_critical_questions' && (
               <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                 You answered all 3 critical questions incorrectly, so the exam is failed automatically.
               </p>
             )}
             
             <div className="bg-gray-50 rounded-2xl p-6 sm:px-10 flex border border-gray-100 justify-around divide-x divide-gray-200 mb-8">
                <div className="px-4 text-center">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Score</p>
                  <p className="text-3xl font-bold text-gray-900">{result.score}</p>
                </div>
                <div className="px-4 text-center">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Correct</p>
                  <p className="text-3xl font-bold text-green-600">{result.correctAnswers}</p>
                </div>
                <div className="px-4 text-center">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Total</p>
                  <p className="text-3xl font-bold text-gray-900">{result.totalQuestions}</p>
                </div>
                <div className="px-4 text-center">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Critical Wrong</p>
                  <p className="text-3xl font-bold text-red-600">{result.criticalWrongAnswers ?? 0}</p>
                </div>
             </div>

             <button
               onClick={() => setExamState('idle')}
               className="inline-flex justify-center px-8 py-3 w-full border border-gray-300 shadow-sm text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
             >
               Return to Dashboard
             </button>
           </div>
        )}

        {examState === 'history' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Your Exam History
              </h2>
              <button
                onClick={() => setExamState('idle')}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors focus:outline-none bg-white/10"
              >
                 <ArrowLeft className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-0">
              {examHistory.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-lg font-medium">No previous exams found.</p>
                  <p className="text-sm mt-1">Take your first exam to see your history here.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {examHistory.map((exam, index) => (
                    <li key={exam._id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-md">
                            Attempt #{examHistory.length - index}
                          </span>
                          <span className="text-sm text-gray-600 flex items-center">
                            {formatDate(exam.createdAt)}
                          </span>
                        </div>
                        <p className="text-base text-gray-800">
                          Score: <span className="font-bold">{exam.score}</span> / <span className="text-gray-500">{exam.totalQuestions}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border ${
                          exam.status === 'pass' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {exam.status === 'pass' ? (
                            <><CheckCircle className="mr-1.5 h-4 w-4" /> Passed</>
                          ) : (
                            <><XCircle className="mr-1.5 h-4 w-4" /> Failed</>
                          )}
                        </span>
                        <button
                          onClick={() => fetchExamDetails(exam._id)}
                          className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium shadow-sm border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:text-blue-600 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {examHistory.length > 0 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-sm text-gray-500 text-center font-medium">
                Total Exams Taken: {examHistory.length}
              </div>
            )}
          </div>
        )}

        {examState === 'details' && selectedExamDetails && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Exam Details
              </h2>
              <button
                onClick={() => setExamState('history')}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors focus:outline-none bg-white/10"
              >
                 <ArrowLeft className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 bg-gray-50 rounded-xl p-6 border border-gray-200 flex justify-around">
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-500 uppercase">Score</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedExamDetails.exam.score}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-500 uppercase">Result</p>
                  <p className={`text-2xl font-bold ${selectedExamDetails.exam.status === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedExamDetails.exam.status === 'pass' ? 'Passed' : 'Failed'}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {selectedExamDetails.answers.map((answerObj, idx) => {
                  const q = answerObj.questionId;
                  if (!q) return null;
                  return (
                    <div key={idx} className="border border-gray-200 rounded-xl p-6 relative">
                      {q.isCritical && (
                        <span className="absolute top-4 right-4 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                          Critical
                        </span>
                      )}
                      <h3 className="text-lg font-medium text-gray-900 mb-4 pr-20 flex" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        <span className="mr-2">{idx + 1}.</span> 
                        <span>{q.question}</span>
                      </h3>
                      {q.image && (
                        <div className="mb-4">
                          <img src={q.image} alt="Question" className="max-h-48 rounded-lg shadow-sm border border-gray-100" />
                        </div>
                      )}
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = answerObj.selectedAnswer === optIdx;
                          const isCorrect = q.correctAnswer === optIdx;
                          let bgColor = 'bg-gray-50 border-gray-200 text-gray-700';
                          if (isCorrect) {
                            bgColor = 'bg-green-50 border-green-300 text-green-800 font-medium';
                          } else if (isSelected && !isCorrect) {
                            bgColor = 'bg-red-50 border-red-300 text-red-800 font-medium';
                          }
                          return (
                            <div key={optIdx} className={`px-4 py-3 rounded-lg border ${bgColor} flex items-center justify-between`}>
                              <div className="flex items-center">
                                <span className="font-semibold mr-3">{String.fromCharCode(65 + optIdx)}.</span>
                                <span>{opt}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {isCorrect && <CheckCircle className="h-5 w-5 text-green-500" />}
                                {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default StudentDashboard;
