import React, { useState, useEffect } from 'react'; 
import apiService from '../../Services/ResultService';
import { CLASS_OPTIONS } from '../../services/booklistService';

const CreateResultForm = () => {
  // State for form fields
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [courses, setCourses] = useState([]);
  const [courseResults, setCourseResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Additional fields state
  const [daysPresent, setDaysPresent] = useState(0);
  const [daysAbsent, setDaysAbsent] = useState(0);
  const [classTeacherRemarks, setClassTeacherRemarks] = useState('');
  const [promotedTo, setPromotedTo] = useState('');
  const [nextTermBegins, setNextTermBegins] = useState('');

  // Term options with labels
  const TERM_CHOICES = [
    { value: 'first', label: 'First Term' },
    { value: 'second', label: 'Second Term' },
    { value: 'third', label: 'Third Term' }
  ];

  // Check if current term is third term
  const isThirdTerm = selectedTerm === 'third';

  // Current year for academic year default
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setAcademicYear(`${currentYear}-${currentYear + 1}`);
  }, []);

  // Reset promoted to when term changes
  useEffect(() => {
    if (!isThirdTerm) {
      setPromotedTo('');
    }
  }, [isThirdTerm]);

  // Fetch students when class changes
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) return;
      
      try {
        setLoading(true);
        const studentsData = await apiService.results.getStudentsByClass(selectedClass);
        setStudents(studentsData);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch students');
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, [selectedClass]);

  // Fetch available courses when class and term changes
  useEffect(() => {
    const fetchCourses = async () => {
      if (!selectedClass || !selectedTerm) return;
      
      try {
        setLoading(true);
        const coursesData = await apiService.results.getAvailableCourses(selectedClass, selectedTerm);
        setCourses(coursesData);
        
        // Initialize course results with empty fields
        const initialCourseResults = coursesData.map(classCourse => ({
          class_course: classCourse.id,
          class_score: '',
          exam_score: '',
          remarks: ''
        }));
        
        setCourseResults(initialCourseResults);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch courses');
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, [selectedClass, selectedTerm]);

  // Handle course result changes
  const handleCourseResultChange = (index, field, value) => {
    const updatedResults = [...courseResults];
    updatedResults[index] = {
      ...updatedResults[index],
      [field]: value
    };
    setCourseResults(updatedResults);
  };

  // Calculate total score from class and exam scores
  const calculateTotalScore = (classScore, examScore) => {
    const classScoreNum = parseFloat(classScore) || 0;
    const examScoreNum = parseFloat(examScore) || 0;
    return classScoreNum + examScoreNum;
  };

  // Calculate attendance percentage
  const calculateAttendancePercentage = (present, absent) => {
    const total = present + absent;
    return total > 0 ? Math.round((present / total) * 100) : 0;
  };

  // Validate all required fields
  const validateForm = () => {
    console.log('Validation - selectedStudent:', selectedStudent);
    console.log('Validation - selectedClass:', selectedClass);
    console.log('Validation - selectedTerm:', selectedTerm);
    console.log('Validation - academicYear:', academicYear);
    console.log('Validation - nextTermBegins:', nextTermBegins);
    console.log('Validation - classTeacherRemarks:', classTeacherRemarks);
    console.log('Validation - isThirdTerm:', isThirdTerm);
    console.log('Validation - promotedTo:', promotedTo);
    
    if (!selectedStudent || !selectedClass || !selectedTerm || !academicYear || 
        nextTermBegins === '' || classTeacherRemarks === '') {
      console.log('Basic validation failed');
      return false;
    }
    
    // Promoted To is required only for third term
    if (isThirdTerm && (promotedTo === '' || promotedTo === null || promotedTo === undefined)) {
      console.log('Third term validation failed - promotedTo is required but empty');
      return false;
    }
    
    // Check if all course results are filled
    const allCourseResultsFilled = courseResults.every(result => 
      result.class_score !== '' && result.exam_score !== ''
    );
    
    if (!allCourseResultsFilled) {
      console.log('Course results validation failed');
      return false;
    }
    
    console.log('All validations passed');
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Debug logs before validation
    console.log('Form submission - selectedTerm:', selectedTerm);
    console.log('Form submission - isThirdTerm:', isThirdTerm);
    console.log('Form submission - promotedTo:', promotedTo);
    
    if (!validateForm()) {
      setError('Please fill all required fields');
      return;
    }
    
    // Convert empty string scores to numbers for submission
    const processedCourseResults = courseResults.map(result => ({
      ...result,
      class_score: parseFloat(result.class_score) || 0,
      exam_score: parseFloat(result.exam_score) || 0
    }));
    
    // Build the result data - always include promoted_to field
    const resultData = {
      student: parseInt(selectedStudent),
      class_name: selectedClass,
      term: selectedTerm,
      academic_year: academicYear,
      days_present: daysPresent,
      days_absent: daysAbsent,
      class_teacher_remarks: classTeacherRemarks,
      next_term_begins: nextTermBegins,
      promoted_to: isThirdTerm ? promotedTo : null, // Always include, but set to null for non-third terms
      course_results: processedCourseResults
    };
    
    console.log('Final payload being sent:', JSON.stringify(resultData, null, 2)); // Debug log
    
    try {
      setLoading(true);
      await apiService.results.create(resultData);
      setSuccess(true);
      setError(null);
      
      // Reset form
      setSelectedStudent('');
      setSelectedTerm('');
      setCourseResults([]);
      setDaysPresent(0);
      setDaysAbsent(0);
      setClassTeacherRemarks('');
      setPromotedTo('');
      setNextTermBegins('');
      
      setLoading(false);
    } catch (err) {
      console.error('Full error object:', err); // Debug log
      console.error('Error response data:', err.response?.data); // Debug log
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create result');
      setSuccess(false);
      setLoading(false);
    }
  };

  // Improved course name display function
  const displayCourseName = (course) => {
    if (!course) return 'Unknown Course';
    
    if (course.course?.name) return course.course.name;
    if (course.name) return course.name;
    if (course.course?.course_name) return course.course.course_name;
    if (course.course_name) return course.course_name;
    if (course.course?.code) return course.course.code;
    if (course.code) return course.code;
    
    return `Course ID: ${course.id}`;
  };

  return (
    <div className="max-w-9xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create Student Result</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Result created successfully!
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Class Selection */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Class <span className="text-red-500">*</span>
            </label>
            <select 
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              required
            >
              <option value="">Select Class</option>
              {CLASS_OPTIONS.map((cls) => (
                <option key={cls.value} value={cls.value}>{cls.label}</option>
              ))}
            </select>
          </div>
          
          {/* Student Selection */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Student <span className="text-red-500">*</span>
            </label>
            <select 
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              disabled={!selectedClass || loading}
              required
            >
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.last_name} {student.first_name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Term Selection */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Term <span className="text-red-500">*</span>
            </label>
            <select 
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              required
            >
              <option value="">Select Term</option>
              {TERM_CHOICES.map((term) => (
                <option key={term.value} value={term.value}>{term.label}</option>
              ))}
            </select>
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              required
              placeholder="e.g. 2023-2024"
            />
          </div>

          {/* Days Present */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Days Present <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={daysPresent}
              onChange={(e) => setDaysPresent(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          {/* Days Absent */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Days Absent <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={daysAbsent}
              onChange={(e) => setDaysAbsent(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          {/* Attendance Percentage (readonly) */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Attendance Percentage</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-md bg-gray-100"
              value={`${calculateAttendancePercentage(daysPresent, daysAbsent)}%`}
              readOnly
            />
          </div>

          {/* Promoted To - Only show for third term */}
          {isThirdTerm && (
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Promoted To <span className="text-red-500">*</span>
              </label>
              <select 
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={promotedTo}
                onChange={(e) => setPromotedTo(e.target.value)}
                required={isThirdTerm}
              >
                <option value="">Select Class</option>
                {CLASS_OPTIONS.map((cls) => (
                  <option key={cls.value} value={cls.value}>{cls.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Next Term Begins */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Next Term Begins <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={nextTermBegins}
              onChange={(e) => setNextTermBegins(e.target.value)}
              required
            />
          </div>

          {/* Class Teacher Remarks */}
          <div className="md:col-span-3">
            <label className="block text-gray-700 font-medium mb-2">
              Class Teacher Remarks <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={classTeacherRemarks}
              onChange={(e) => setClassTeacherRemarks(e.target.value)}
              placeholder="Enter general remarks about the student's performance"
              required
            />
          </div>
        </div>
        
        {/* Course Results */}
        {courses.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-4">Course Results <span className="text-red-500">*</span></h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border">Course <span className="text-red-500">*</span></th>
                    <th className="px-4 py-2 border">Class Score (40%) <span className="text-red-500">*</span></th>
                    <th className="px-4 py-2 border">Exam Score (60%) <span className="text-red-500">*</span></th>
                    <th className="px-4 py-2 border">Total Score</th>
                    <th className="px-4 py-2 border">Grade</th>
                    <th className="px-4 py-2 border">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((classCourse, index) => {
                    const courseResult = courseResults[index] || { class_score: '', exam_score: '', remarks: '' };
                    const totalScore = calculateTotalScore(courseResult.class_score, courseResult.exam_score);
                    const grade = totalScore >= 70 ? 'A' :
                                 totalScore >= 60 ? 'B' :
                                 totalScore >= 50 ? 'C' :
                                 totalScore >= 45 ? 'D' :
                                 totalScore >= 40 ? 'E' : 'F';
                    
                    return (
                      <tr key={index}>
                        <td className="px-4 py-2 border">
                          {displayCourseName(classCourse)}
                        </td>
                        <td className="px-4 py-2 border">
                          <input 
                            type="number" 
                            min="0" 
                            max="40" 
                            className="w-full px-2 py-1 border rounded"
                            value={courseResult.class_score}
                            onChange={(e) => handleCourseResultChange(index, 'class_score', e.target.value)}
                            required
                          />
                        </td>
                        <td className="px-4 py-2 border">
                          <input 
                            type="number" 
                            min="0" 
                            max="60" 
                            className="w-full px-2 py-1 border rounded"
                            value={courseResult.exam_score}
                            onChange={(e) => handleCourseResultChange(index, 'exam_score', e.target.value)}
                            required
                          />
                        </td>
                        <td className="px-4 py-2 border text-center">
                          {totalScore}
                        </td>
                        <td className="px-4 py-2 border text-center">
                          {grade}
                        </td>
                        <td className="px-4 py-2 border">
                          <input 
                            type="text" 
                            className="w-full px-2 py-1 border rounded"
                            value={courseResult.remarks || ''}
                            onChange={(e) => handleCourseResultChange(index, 'remarks', e.target.value)}
                            placeholder="Add remarks"
                            required
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={loading || !validateForm()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {loading ? 'Creating...' : 'Create Result'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateResultForm;