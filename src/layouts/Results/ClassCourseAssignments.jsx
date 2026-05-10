// src/components/CourseAssignment.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../Services/ResultService';
import { CLASS_OPTIONS } from '../../services/booklistService';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

const TERM_CHOICES = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' }
];

const EMPTY_SINGLE = {
  course: '',
  class_name: '',
  term: '',
  is_active: true,
  teacher_name: '',
  teacher_email: '',
  teacher_phone: ''
};

const EMPTY_BULK_ROW = {
  course: '',
  class_name: '',
  term: '',
  is_active: true,
  teacher_name: '',
  teacher_email: '',
  teacher_phone: ''
};

// ✅ Moved OUTSIDE CourseAssignment to prevent remounting on every render
const TeacherFields = ({ values, onChange }) => (
  <>
    <div>
      <label className="block text-gray-700 text-sm font-bold mb-2">
        Teacher Name <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="teacher_name"
        value={values.teacher_name}
        onChange={onChange}
        placeholder="e.g. Mr. John Mensah"
        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        required
      />
    </div>

    <div>
      <label className="block text-gray-700 text-sm font-bold mb-2">
        Teacher Email <span className="text-red-500">*</span>
      </label>
      <input
        type="email"
        name="teacher_email"
        value={values.teacher_email}
        onChange={onChange}
        placeholder="e.g. john.mensah@school.edu"
        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        required
      />
    </div>

    <div>
      <label className="block text-gray-700 text-sm font-bold mb-2">
        Teacher Phone <span className="text-red-500">*</span>
      </label>
      <input
        type="tel"
        name="teacher_phone"
        value={values.teacher_phone}
        onChange={onChange}
        placeholder="e.g. +233 24 000 0000"
        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        required
      />
    </div>
  </>
);

const CourseAssignment = () => {
  const [classCourses, setClassCourses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('single');

  const [classCourseSingle, setClassCourseSingle] = useState(EMPTY_SINGLE);
  const [bulkAssignments, setBulkAssignments] = useState([{ ...EMPTY_BULK_ROW }]);

  const [filterClass, setFilterClass] = useState('');
  const [filterTerm, setFilterTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [coursesData, classCoursesData] = await Promise.all([
        apiService.courses.getAll(),
        apiService.classCourses.getAll()
      ]);
      setCourses(coursesData);
      setClassCourses(classCoursesData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSingleInputChange = (e) => {
    const { name, value } = e.target;
    setClassCourseSingle(prev => ({ ...prev, [name]: value }));
  };

  const handleBulkInputChange = (index, e) => {
    const { name, value } = e.target;
    setBulkAssignments(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [name]: value };
      return updated;
    });
  };

  const addAssignmentRow = () => {
    setBulkAssignments(prev => [...prev, { ...EMPTY_BULK_ROW }]);
  };

  const removeAssignmentRow = (index) => {
    if (bulkAssignments.length > 1) {
      setBulkAssignments(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    const { course, class_name, term, teacher_name, teacher_email, teacher_phone } = classCourseSingle;

    if (!course || !class_name || !term || !teacher_name || !teacher_email || !teacher_phone) {
      setError('All fields including teacher information are required.');
      return;
    }

    try {
      await apiService.classCourses.create({
        ...classCourseSingle,
        course: parseInt(classCourseSingle.course)
      });
      setClassCourseSingle(EMPTY_SINGLE);
      fetchData();
      setError(null);
    } catch (err) {
      setError('Failed to assign course. The course might already be assigned to this class and term.');
      console.error('Error assigning course:', err);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();

    const isValid = bulkAssignments.every(a =>
      a.course && a.class_name && a.term &&
      a.teacher_name && a.teacher_email && a.teacher_phone
    );

    if (!isValid) {
      setError('All fields including teacher information are required for every assignment.');
      return;
    }

    const formattedAssignments = bulkAssignments.map(a => ({
      ...a,
      course: parseInt(a.course)
    }));

    try {
      const result = await apiService.classCourses.bulkAssign(formattedAssignments);
      if (result.errors && result.errors.length > 0) {
        setError(`Some assignments failed. ${result.errors.length} error(s) occurred.`);
      } else {
        setError(null);
        setBulkAssignments([{ ...EMPTY_BULK_ROW }]);
        fetchData();
      }
    } catch (err) {
      setError('Failed to bulk assign courses.');
      console.error('Error bulk assigning courses:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this course assignment?')) return;
    try {
      await apiService.classCourses.delete(id);
      fetchData();
    } catch (err) {
      setError('Failed to delete assignment.');
      console.error('Error deleting assignment:', err);
    }
  };

  const filteredClassCourses = classCourses.filter(cc => {
    if (filterClass && cc.class_name !== filterClass) return false;
    if (filterTerm && cc.term !== filterTerm) return false;
    return true;
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Course Assignment</h1>
        <Link to="/dashboard/course-management/create-course">
          <Button className="bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all">
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {['single', 'bulk'].map(tab => (
              <button
                key={tab}
                className={`py-2 px-4 font-medium text-sm leading-5 ${tab === 'bulk' ? 'ml-8' : ''} ${
                  selectedTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setSelectedTab(tab)}
              >
                {tab === 'single' ? 'Single Assignment' : 'Bulk Assignment'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Single Assignment */}
      {selectedTab === 'single' && (
        <div className="bg-white shadow-md rounded p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Assign Course to Class</h2>
          <form onSubmit={handleSingleSubmit}>
            {/* Course, Class, Term */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="course">
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  id="course"
                  name="course"
                  value={classCourseSingle.course}
                  onChange={handleSingleInputChange}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="class_name">
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  id="class_name"
                  name="class_name"
                  value={classCourseSingle.class_name}
                  onChange={handleSingleInputChange}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Class</option>
                  {CLASS_OPTIONS.map(cls => (
                    <option key={cls.value} value={cls.value}>{cls.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="term">
                  Term <span className="text-red-500">*</span>
                </label>
                <select
                  id="term"
                  name="term"
                  value={classCourseSingle.term}
                  onChange={handleSingleInputChange}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Term</option>
                  {TERM_CHOICES.map(term => (
                    <option key={term.value} value={term.value}>{term.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Teacher Info */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 pb-1 border-b border-gray-200">
                Teacher Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TeacherFields
                  values={classCourseSingle}
                  onChange={handleSingleInputChange}
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow"
              >
                Assign Course
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Assignment */}
      {selectedTab === 'bulk' && (
        <div className="bg-white shadow-md rounded p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Bulk Assign Courses</h2>
          <form onSubmit={handleBulkSubmit}>
            {bulkAssignments.map((assignment, index) => (
              <div key={index} className="p-4 mb-4 border border-gray-200 rounded">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-md font-medium text-gray-700">Assignment #{index + 1}</h3>
                  {bulkAssignments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAssignmentRow(index)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Course / Class / Term */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Course <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="course"
                      value={assignment.course}
                      onChange={(e) => handleBulkInputChange(index, e)}
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="">Select Course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.name} ({course.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="class_name"
                      value={assignment.class_name}
                      onChange={(e) => handleBulkInputChange(index, e)}
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="">Select Class</option>
                      {CLASS_OPTIONS.map(cls => (
                        <option key={cls.value} value={cls.value}>{cls.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Term <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="term"
                      value={assignment.term}
                      onChange={(e) => handleBulkInputChange(index, e)}
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="">Select Term</option>
                      {TERM_CHOICES.map(term => (
                        <option key={term.value} value={term.value}>{term.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Teacher Info */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 pb-1 border-b border-gray-200">
                    Teacher Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TeacherFields
                      values={assignment}
                      onChange={(e) => handleBulkInputChange(index, e)}
                    />
                  </div>
                </div>

                {/* Active checkbox */}
                <div className="mt-3 flex items-center">
                  <input
                    id={`is_active_${index}`}
                    name="is_active"
                    type="checkbox"
                    checked={assignment.is_active}
                    onChange={(e) =>
                      handleBulkInputChange(index, {
                        target: { name: 'is_active', value: e.target.checked }
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-gray-700 text-sm font-bold" htmlFor={`is_active_${index}`}>
                    Active
                  </label>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center mt-2">
              <button
                type="button"
                onClick={addAssignmentRow}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow"
              >
                Add Another Assignment
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow"
              >
                Submit All Assignments
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Current Assignments Table */}
      <div className="bg-white shadow-md rounded p-6">
        <h2 className="text-lg font-semibold mb-4">Current Course Assignments</h2>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="filterClass">
              Filter by Class
            </label>
            <select
              id="filterClass"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">All Classes</option>
              {CLASS_OPTIONS.map(cls => (
                <option key={cls.value} value={cls.value}>{cls.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="filterTerm">
              Filter by Term
            </label>
            <select
              id="filterTerm"
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">All Terms</option>
              {TERM_CHOICES.map(term => (
                <option key={term.value} value={term.value}>{term.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : filteredClassCourses.length === 0 ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            No course assignments found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  {['Course', 'Class', 'Term', 'Teacher Name', 'Teacher Email', 'Teacher Phone', 'Actions'].map(heading => (
                    <th
                      key={heading}
                      className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredClassCourses.map((cc) => (
                  <tr key={cc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                      {typeof cc.course === 'object'
                        ? cc.course.name
                        : courses.find(c => c.id === cc.course)?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                      {CLASS_OPTIONS.find(c => c.value === cc.class_name)?.label || cc.class_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                      {TERM_CHOICES.find(t => t.value === cc.term)?.label || cc.term}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                      {cc.teacher_name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                      {cc.teacher_email || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                      {cc.teacher_phone || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                      <button
                        onClick={() => handleDelete(cc.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseAssignment;