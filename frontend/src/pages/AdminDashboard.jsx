import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, LogOut, Image, ToggleLeft, ToggleRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';

const AdminDashboard = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    isCritical: false,
    image: ''
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data } = await api.get('/questions');
      setQuestions(data);
    } catch (err) {
      toast.error('Failed to load questions');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const resetForm = () => {
    setFormData({ question: '', options: ['', '', '', ''], correctAnswer: 0, isCritical: false, image: '' });
    setEditingId(null);
    setShowModal(false);
  };

  const handleEdit = (q) => {
    setFormData({
      question: q.question || '',
      options: q.options?.length === 4 ? q.options : ['', '', '', ''],
      correctAnswer: q.correctAnswer || 0,
      isCritical: q.isCritical || false,
      image: q.image || ''
    });
    setEditingId(q._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await api.delete(`/questions/${id}`);
        toast.success('Question deleted');
        fetchQuestions();
      } catch (err) {
        toast.error('Failed to delete question');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.options.some(opt => !opt.trim())) {
      return toast.error('All 4 options are required');
    }
    
    setLoading(true);
    let finalImageUrl = formData.image;
    
    try {
      // If there's an image file selected (it will be a File object instead of a string)
      if (formData.image instanceof File) {
        const uploadData = new FormData();
        uploadData.append('image', formData.image);
        
        // Fallback to axios. Ensure headers don't strictly overwrite boundary
        const uploadRes = await api.post('/upload', uploadData);
        finalImageUrl = uploadRes.data.url;
      }

      const questionData = {
        ...formData,
        image: finalImageUrl
      };

      if (editingId) {
        await api.put(`/questions/${editingId}`, questionData);
        toast.success('Question updated');
      } else {
        await api.post('/questions', questionData);
        toast.success('Question created');
      }
      resetForm();
      fetchQuestions();
    } catch (err) {
      console.error('Submit Error:', err);
      console.error('Response Data:', err.response?.data);
      console.error('Response Status:', err.response?.status);
      toast.error(err.response?.data?.message || err.message || 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 font-medium">Question Bank Management</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-red-600 focus:outline-none transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Questions</h2>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add New Question
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <CheckCircle2 className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No questions</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new question.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {questions.map((q) => (
              <div key={q._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-6 flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-snug">{q.question}</h3>
                    {q.isCritical && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 shrink-0 ml-2">
                        Critical
                      </span>
                    )}
                  </div>
                  {q.image && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-gray-100 shadow-sm max-h-32 bg-gray-50 flex items-center justify-center">
                      <img src={q.image} alt="Question Diagram" className="object-contain max-h-32 w-full" />
                    </div>
                  )}
                  <ul className="mt-4 space-y-2">
                    {q.options?.map((opt, idx) => (
                      <li key={idx} className={`text-sm p-2 rounded-md ${idx === q.correctAnswer ? 'bg-green-50 text-green-700 border border-green-200 font-medium' : 'bg-gray-50 text-gray-600 border border-transparent'}`}>
                        {String.fromCharCode(65 + idx)}. {opt}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(q)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(q._id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6 sm:px-0" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          {/* Background overlay with blur */}
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={resetForm}></div>
          
          <div className="relative bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 w-full sm:max-w-4xl border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-white flex items-center gap-2" id="modal-title">
                {editingId ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {editingId ? 'Edit Question' : 'Create New Question'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="bg-white/10 rounded-full p-2 hover:bg-white/20 transition-colors focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
              <div className="px-6 py-8 overflow-y-auto custom-scrollbar flex-1">
                <div className="space-y-8 max-w-3xl mx-auto">
                  
                  {/* Question Input */}
                  <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100 shadow-sm">
                    <label className="block text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="flex items-center justify-center bg-blue-100 text-blue-700 w-6 h-6 rounded-full text-xs font-bold">1</span>
                      What is the question?
                    </label>
                    <textarea
                      required
                      rows={3}
                      className="block w-full border-2 border-gray-200 rounded-xl py-3 px-4 text-gray-900 focus:outline-none focus:ring-0 focus:border-blue-500 focus:bg-white transition-colors text-base resize-y min-h-[100px]"
                      placeholder="Type your question here, e.g., 'What is the capital of France?'"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    />
                  </div>
                  
                  {/* Options Grid */}
                  <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-base font-semibold text-gray-800 flex items-center gap-2">
                        <span className="flex items-center justify-center bg-blue-100 text-blue-700 w-6 h-6 rounded-full text-xs font-bold">2</span>
                        Provide the options
                      </label>
                      <span className="text-xs text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-3 py-1 rounded-full shadow-sm">
                        Select the correct answer
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {formData.options.map((opt, idx) => {
                        const isCorrect = formData.correctAnswer === idx;
                        const letter = String.fromCharCode(65 + idx);
                        return (
                          <div 
                            key={idx} 
                            className={`relative rounded-xl border-2 transition-all duration-200 flex overflow-hidden group ${
                              isCorrect 
                                ? 'border-green-500 bg-green-50 shadow-sm shadow-green-100/50' 
                                : 'border-gray-200 bg-white hover:border-gray-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50 focus-within:shadow-sm'
                            }`}
                          >
                            {/* Selection Area */}
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, correctAnswer: idx })}
                              className={`flex items-center justify-center w-14 border-r-2 shrink-0 ${
                                isCorrect ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-400 group-hover:bg-gray-100 hover:text-gray-600'
                              } transition-colors cursor-pointer`}
                              title={`Mark option ${letter} as correct`}
                            >
                              {isCorrect ? <CheckCircle2 className="h-6 w-6" /> : <span className="font-bold text-lg">{letter}</span>}
                            </button>
                            
                            {/* Input Area */}
                            <input
                              type="text"
                              required
                              className="flex-1 w-full bg-transparent py-3 px-4 focus:outline-none text-gray-900 placeholder-gray-400 font-medium"
                              value={opt}
                              onChange={(e) => handleOptionChange(idx, e.target.value)}
                              placeholder={`Enter option ${letter}...`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Image Input & Preview */}
                    <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col h-full">
                      <label className="block text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="flex items-center justify-center bg-blue-100 text-blue-700 w-6 h-6 rounded-full text-xs font-bold">3</span>
                        Add an image <span className="text-gray-400 font-normal text-sm ml-1">(Optional)</span>
                      </label>
                      <div className="flex rounded-xl shadow-sm border-2 border-gray-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50 transition-all bg-white overflow-hidden w-full">
                        <span className="inline-flex items-center px-4 bg-gray-50 text-gray-500 border-r border-gray-200">
                          <Image className="h-5 w-5" />
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="flex-1 min-w-0 block w-full px-4 py-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setFormData({ ...formData, image: e.target.files[0] });
                            }
                          }}
                        />
                      </div>
                      <div className="mt-4 rounded-xl border-2 border-dashed border-gray-200 bg-white relative group overflow-hidden h-40 flex items-center justify-center flex-1 transition-all">
                        {formData.image ? (
                          <img 
                            src={typeof formData.image === 'string' ? formData.image : URL.createObjectURL(formData.image)} 
                            alt="Preview" 
                            className="max-h-full max-w-full object-contain p-2"
                            onError={(e) => {
                              e.target.onerror = null; 
                              e.target.src = 'https://placehold.co/400x200?text=Invalid+Image+URL';
                            }}
                          />
                        ) : (
                          <div className="text-center text-gray-400 flex flex-col items-center">
                            <Image className="h-8 w-8 mb-2 opacity-50" />
                            <span className="text-sm font-medium">Image preview will appear here</span>
                          </div>
                        )}
                        {formData.image && (
                          <div className="absolute top-2 right-2">
                           <button 
                             type="button" 
                             onClick={(e) => {
                               e.preventDefault();
                               setFormData({ ...formData, image: '' });
                             }}
                             className="bg-white/80 backdrop-blur-sm p-1.5 rounded-full text-red-500 hover:bg-red-50 hover:text-red-700 shadow-sm transition-colors border border-gray-100"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Settings */}
                    <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100 shadow-sm h-full">
                      <label className="block text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="flex items-center justify-center bg-blue-100 text-blue-700 w-6 h-6 rounded-full text-xs font-bold">4</span>
                        Additional Settings
                      </label>
                      <div 
                        className={`mt-2 flex items-center justify-between p-5 rounded-xl border-2 cursor-pointer transition-all h-[calc(100%-40px)] ${
                          formData.isCritical ? 'border-red-300 bg-red-50 shadow-sm shadow-red-100/50' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                        }`}
                        onClick={() => setFormData({ ...formData, isCritical: !formData.isCritical })}
                      >
                        <div>
                          <p className={`font-bold text-lg ${formData.isCritical ? 'text-red-800' : 'text-gray-800'}`}>Critical Question</p>
                          <p className="text-sm text-gray-500 mt-1 leading-relaxed max-w-[200px]">Mark this question as high-priority or difficult.</p>
                        </div>
                        <div className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none shadow-inner ${formData.isCritical ? 'bg-red-500' : 'bg-gray-300'}`}>
                          <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${formData.isCritical ? 'translate-x-7' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Footer Controls */}
              <div className="bg-white px-6 py-5 border-t border-gray-100 sm:flex sm:flex-row-reverse shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-transparent shadow-sm px-8 py-3 bg-blue-600 text-base font-bold text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-4 sm:w-auto transition-all duration-200"
                >
                  {editingId ? 'Update Question' : 'Save Question'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center items-center rounded-xl border border-gray-300 shadow-sm px-8 py-3 bg-white text-base font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 sm:mt-0 sm:w-auto transition-all duration-200"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
