// src/components/CourseAssignment.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../Services/ResultService';
import { CLASS_OPTIONS } from '../../services/booklistService';
import { Button } from '@/components/ui/button'; 
import { PlusCircle } from 'lucide-react'; // Assuming you're using lucide-react for icons

const CourseAssignment = () => {
  const [classCourses, setClassCourses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('single'); // 'single' or 'bulk'
  
  // Form states
  const [classCourseSingle, setClassCourseSingle] = useState({
    course: '',
    class_name: '',
    term: '',
    is_active: true
  });
  
  const [bulkAssignments, setBulkAssignments] = useState([
    { course: '', class_name: '', term: '', is_active: true }
  ]);
  
  // Filter states
  const [filterClass, setFilterClass] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  
  // Term options
  const TERM_CHOICES = [
    { value: 'first', label: 'First Term' },
    { value: 'second', label: 'Second Term' },
    { value: 'third', label: 'Third Term' }
  ];

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
    setClassCourseSingle({ ...classCourseSingle, [name]: value });
  };

  const handleBulkInputChange = (index, e) => {
    const { name, value } = e.target;
    const updatedAssignments = [...bulkAssignments];
    updatedAssignments[index] = { ...updatedAssignments[index], [name]: value };
    setBulkAssignments(updatedAssignments);
  };

  const addAssignmentRow = () => {
    setBulkAssignments([...bulkAssignments, { course: '', class_name: '', term: '', is_active: true }]);
  };

  const removeAssignmentRow = (index) => {
    if (bulkAssignments.length > 1) {
      const updatedAssignments = [...bulkAssignments];
      updatedAssignments.splice(index, 1);
      setBulkAssignments(updatedAssignments);
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    
    if (!classCourseSingle.course || !classCourseSingle.class_name || !classCourseSingle.term) {
      setError('All fields are required');
      return;
    }
    
    try {
      await apiService.classCourses.create({
        ...classCourseSingle,
        course: parseInt(classCourseSingle.course)
      });
      
      // Reset form and refresh data
      setClassCourseSingle({ course: '', class_name: '', term: '', is_active: true });
      fetchData();
      setError(null);
    } catch (err) {
      setError('Failed to assign course. The course might already be assigned to this class and term.');
      console.error('Error assigning course:', err);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all assignments
    const isValid = bulkAssignments.every(
      assignment => assignment.course && assignment.class_name && assignment.term
    );
    
    if (!isValid) {
      setError('All fields are required for all assignments');
      return;
    }
    
    // Convert course IDs from string to number
    const formattedAssignments = bulkAssignments.map(assignment => ({
      ...assignment,
      course: parseInt(assignment.course)
    }));
    
    try {
      const result = await apiService.classCourses.bulkAssign(formattedAssignments);
      
      if (result.errors && result.errors.length > 0) {
        setError(`Some assignments failed. ${result.errors.length} errors occurred.`);
      } else {
        setError(null);
        // Reset form and refresh data
        setBulkAssignments([{ course: '', class_name: '', term: '', is_active: true }]);
        fetchData();
      }
    } catch (err) {
      setError('Failed to bulk assign courses.');
      console.error('Error bulk assigning courses:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this course assignment?')) {
      return;
    }
    
    try {
      await apiService.classCourses.delete(id);
      fetchData();
    } catch (err) {
      setError('Failed to delete assignment.');
      console.error('Error deleting assignment:', err);
    }
  };

  const filteredClassCourses = classCourses.filter(cc => {
    let matches = true;
    
    if (filterClass && cc.class_name !== filterClass) {
      matches = false;
    }
    
    if (filterTerm && cc.term !== filterTerm) {
      matches = false;
    }
    
    return matches;
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
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              className={`py-2 px-4 font-medium text-sm leading-5 ${
                selectedTab === 'single'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTab('single')}
            >
              Single Assignment
            </button>
            <button
              className={`ml-8 py-2 px-4 font-medium text-sm leading-5 ${
                selectedTab === 'bulk'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTab('bulk')}
            >
              Bulk Assignment
            </button>
          </nav>
        </div>
      </div>
      
      {selectedTab === 'single' ? (
        <div className="bg-white shadow-md rounded p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Assign Course to Class</h2>
          <form onSubmit={handleSingleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="course">
                  Course
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
                  Class
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
                    <option key={cls.value} value={cls.value}>
                      {cls.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="term">
                  Term
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
                    <option key={term.value} value={term.value}>
                      {term.label}
                    </option>
                  ))}
                </select>
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
      ) : (
        <div className="bg-white shadow-md rounded p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Bulk Assign Courses</h2>
          <form onSubmit={handleBulkSubmit}>
            {bulkAssignments.map((assignment, index) => (
              <div key={index} className="p-4 mb-4 border border-gray-200 rounded">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-medium">Assignment #{index + 1}</h3>
                  {bulkAssignments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAssignmentRow(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Course
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
                      Class
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
                        <option key={cls.value} value={cls.value}>
                          {cls.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Term
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
                        <option key={term.value} value={term.value}>
                          {term.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mt-2">
                  <input
                    id={`is_active_${index}`}
                    name="is_active"
                    type="checkbox"
                    checked={assignment.is_active}
                    onChange={(e) => handleBulkInputChange(index, { target: { name: 'is_active', value: e.target.checked } })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-gray-700 text-sm font-bold" htmlFor={`is_active_${index}`}>
                    Active
                  </label>
                </div>
              </div>
            ))}
            
            <div className="flex justify-between items-center">
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
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Term
                  </th>
                  
                  <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClassCourses.map((cc) => (
                  <tr key={cc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                      {typeof cc.course === 'object' ? cc.course.name : 
                        courses.find(c => c.id === cc.course)?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                      {CLASS_OPTIONS.find(c => c.value === cc.class_name)?.label || cc.class_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                      {TERM_CHOICES.find(t => t.value === cc.term)?.label || cc.term}
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