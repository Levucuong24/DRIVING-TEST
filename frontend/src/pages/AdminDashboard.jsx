import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, LogOut, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';

const initialFormData = {
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  isCritical: false,
  image: '',
  categoryId: '',
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('questions');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [selectedQuestionCategory, setSelectedQuestionCategory] = useState('all');
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin' && role !== 'teacher') {
      navigate('/login');
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchQuestions(), fetchCategories()]);
    setLoading(false);
  };

  const fetchQuestions = async () => {
    try {
      const { data } = await api.get('/questions');
      setQuestions(data);
    } catch (err) {
      toast.error('Failed to load questions');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (err) {
      toast.error('Failed to load categories');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowModal(false);
  };

  const resetCategoryForm = () => {
    setCategoryName('');
    setCategoryDescription('');
    setEditingCategoryId(null);
    setCategoryModal(false);
  };

  const handleOptionChange = (index, value) => {
    const nextOptions = [...formData.options];
    nextOptions[index] = value;
    setFormData({ ...formData, options: nextOptions });
  };

  const handleEdit = (question) => {
    setFormData({
      question: question.question || '',
      options: question.options?.length === 4 ? question.options : ['', '', '', ''],
      correctAnswer: question.correctAnswer ?? 0,
      isCritical: Boolean(question.isCritical),
      image: question.image || '',
      categoryId: question.categoryId?._id || question.categoryId || '',
    });
    setEditingId(question._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await api.delete(`/questions/${id}`);
      toast.success('Question deleted');
      fetchQuestions();
    } catch (err) {
      toast.error('Failed to delete question');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.question.trim()) {
      toast.error('Question is required');
      return;
    }

    if (formData.options.some((option) => !option.trim())) {
      toast.error('All 4 options are required');
      return;
    }

    setSaving(true);
    let finalImageUrl = typeof formData.image === 'string' ? formData.image : '';

    try {
      if (formData.image instanceof File) {
        const uploadData = new FormData();
        uploadData.append('image', formData.image);
        const uploadRes = await api.post('/upload', uploadData);
        finalImageUrl = uploadRes.data.url;
      }

      const payload = {
        ...formData,
        image: finalImageUrl,
      };

      if (editingId) {
        await api.put(`/questions/${editingId}`, payload);
        toast.success('Question updated');
      } else {
        await api.post('/questions', payload);
        toast.success('Question created');
      }

      resetForm();
      fetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const startCreateCategory = () => {
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryDescription('');
    setCategoryModal(true);
  };

  const startEditCategory = (category) => {
    setEditingCategoryId(category._id);
    setCategoryName(category.name || '');
    setCategoryDescription(category.description || '');
    setCategoryModal(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editingCategoryId) {
        await api.put(`/categories/${editingCategoryId}`, {
          name: categoryName,
          description: categoryDescription,
        });
        toast.success('Category updated');
      } else {
        await api.post('/categories', {
          name: categoryName,
          description: categoryDescription,
        });
        toast.success('Category created');
      }

      resetCategoryForm();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const filteredQuestions = questions.filter((question) => {
    if (selectedQuestionCategory === 'all') {
      return true;
    }

    if (selectedQuestionCategory === 'uncategorized') {
      return !question.categoryId?._id;
    }

    return question.categoryId?._id === selectedQuestionCategory;
  });

  const selectedCategoryLabel =
    selectedQuestionCategory === 'all'
      ? 'All Questions'
      : selectedQuestionCategory === 'uncategorized'
        ? 'Uncategorized'
        : categories.find((category) => category._id === selectedQuestionCategory)?.name || 'Category';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('questions')}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'questions'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              Questions
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              Categories
            </button>
            <button
              onClick={handleLogout}
              className="rounded-md p-2 text-gray-500 transition-colors hover:text-red-600"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'questions' && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Questions</h2>
                <p className="text-sm text-gray-500">Manage your exam question bank.</p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Question
              </button>
            </div>

            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-medium text-gray-700">Filter by category</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedQuestionCategory('all')}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedQuestionCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => setSelectedQuestionCategory(category._id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      selectedQuestionCategory === category._id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedQuestionCategory('uncategorized')}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedQuestionCategory === 'uncategorized'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Uncategorized
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-white py-12 text-center shadow-sm">
                <CheckCircle2 className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-sm font-medium text-gray-900">
                  No questions found in {selectedCategoryLabel}
                </h3>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedCategoryLabel}</h3>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {filteredQuestions.length} question(s)
                  </span>
                </div>
                <div className="space-y-4">
                  {filteredQuestions.map((question) => (
                    <article key={question._id} className="rounded-xl border border-gray-100 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-medium text-gray-900">{question.question}</h4>
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                              {question.categoryId?.name || 'Uncategorized'}
                            </span>
                            {question.isCritical && (
                              <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
                                Critical
                              </span>
                            )}
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {question.options?.map((option, index) => (
                              <div
                                key={`${question._id}-${index}`}
                                className={`rounded-lg border px-3 py-2 text-sm ${
                                  index === question.correctAnswer
                                    ? 'border-green-200 bg-green-50 text-green-700'
                                    : 'border-gray-200 bg-gray-50 text-gray-700'
                                }`}
                              >
                                {String.fromCharCode(65 + index)}. {option}
                              </div>
                            ))}
                          </div>
                          {question.image && (
                            <img
                              src={question.image}
                              alt="Question"
                              className="max-h-56 rounded-lg border border-gray-200"
                            />
                          )}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => handleEdit(question)}
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                            title="Edit question"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(question._id)}
                            className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                            title="Delete question"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'categories' && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
                <p className="text-sm text-gray-500">Create and organize question topics.</p>
              </div>
              <button
                onClick={startCreateCategory}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Category
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <article key={category._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {category.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditCategory(category)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                        title="Edit category"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category._id)}
                        className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                        title="Delete category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Edit Question' : 'Create Question'}
              </h3>
              <button onClick={resetForm} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Question</label>
                <textarea
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="min-h-28 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {formData.options.map((option, index) => (
                  <div key={index}>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Option {String.fromCharCode(65 + index)}
                    </label>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Correct answer</label>
                  <select
                    value={formData.correctAnswer}
                    onChange={(e) =>
                      setFormData({ ...formData, correctAnswer: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500"
                  >
                    {['A', 'B', 'C', 'D'].map((label, index) => (
                      <option key={label} value={index}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500"
                  >
                    <option value="">No category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={formData.isCritical}
                    onChange={(e) => setFormData({ ...formData, isCritical: e.target.checked })}
                  />
                  <span className="text-sm font-medium text-gray-700">Critical question</span>
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Image upload</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.files?.[0] || formData.image })
                    }
                    className="block w-full text-sm text-gray-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Or image URL</label>
                  <input
                    type="text"
                    value={typeof formData.image === 'string' ? formData.image : ''}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500"
                    placeholder="https://example.com/image.png"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Question' : 'Create Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {categoryModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingCategoryId ? 'Edit Category' : 'Create Category'}
              </h3>
              <button
                onClick={resetCategoryForm}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  className="min-h-28 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {editingCategoryId ? 'Update Category' : 'Create Category'}
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
