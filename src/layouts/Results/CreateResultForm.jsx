import React, { useState, useEffect, useMemo } from 'react';
import apiService from '../../Services/ResultService';
import { CLASS_OPTIONS } from '../../services/booklistService';

const CreateResultForm = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [courses, setCourses] = useState([]);
  const [courseResults, setCourseResults] = useState([]);

  const [classTeacherRemarks, setClassTeacherRemarks] = useState('');
  const [promotedTo, setPromotedTo] = useState('');
  const [nextTermBegins, setNextTermBegins] = useState('');

  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const TERM_CHOICES = [
    { value: 'first', label: 'First Term' },
    { value: 'second', label: 'Second Term' },
    { value: 'third', label: 'Third Term' },
  ];

  const isThirdTerm = selectedTerm === 'third';

  const selectedStudentObject = useMemo(() => {
    return students.find((student) => String(student.id) === String(selectedStudent)) || null;
  }, [students, selectedStudent]);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setAcademicYear(`${currentYear}-${currentYear + 1}`);
  }, []);

  useEffect(() => {
    if (!isThirdTerm) {
      setPromotedTo('');
    }
  }, [isThirdTerm]);

  useEffect(() => {
    setSelectedStudent('');
    setStudents([]);
    setCourses([]);
    setCourseResults([]);

    if (!selectedClass) {
      return;
    }

    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        setError(null);

        const studentsData = await apiService.results.getStudentsByClass(selectedClass);
        setStudents(Array.isArray(studentsData) ? studentsData : []);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage || 'Failed to fetch students.');
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass]);

  useEffect(() => {
    setCourses([]);
    setCourseResults([]);

    if (!selectedClass || !selectedTerm) {
      return;
    }

    const fetchCourses = async () => {
      try {
        setCoursesLoading(true);
        setError(null);

        const coursesData = await apiService.results.getAvailableCourses(
          selectedClass,
          selectedTerm
        );

        const safeCourses = Array.isArray(coursesData) ? coursesData : [];
        setCourses(safeCourses);

        const initialCourseResults = safeCourses.map((classCourse) => ({
          class_course: classCourse.id,
          class_score: '',
          exam_score: '',
          remarks: '',
        }));

        setCourseResults(initialCourseResults);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage || 'Failed to fetch courses.');
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchCourses();
  }, [selectedClass, selectedTerm]);

  useEffect(() => {
    setLoading(studentsLoading || coursesLoading || submitting);
  }, [studentsLoading, coursesLoading, submitting]);

  const extractErrorMessage = (err) => {
    console.error('Full error object:', err);
    console.error('Error response data:', err?.response?.data);

    const responseData = err?.response?.data;

    if (!responseData) {
      return null;
    }

    if (typeof responseData === 'string') {
      return responseData;
    }

    if (Array.isArray(responseData)) {
      return responseData.join(', ');
    }

    if (responseData.detail) {
      return responseData.detail;
    }

    if (responseData.message) {
      return responseData.message;
    }

    if (responseData.error) {
      return responseData.error;
    }

    if (responseData.errors && Array.isArray(responseData.errors)) {
      return responseData.errors.join(', ');
    }

    if (responseData.messages && Array.isArray(responseData.messages)) {
      return responseData.messages.join(', ');
    }

    const fieldErrors = Object.entries(responseData)
      .map(([field, value]) => {
        if (Array.isArray(value)) {
          return `${field}: ${value.join(', ')}`;
        }

        if (typeof value === 'object' && value !== null) {
          return `${field}: ${JSON.stringify(value)}`;
        }

        return `${field}: ${value}`;
      })
      .join(' | ');

    return fieldErrors || null;
  };

  const extractSuccessMessage = (responseData) => {
    console.log('Success response:', responseData);

    if (!responseData) {
      return 'Result created successfully.';
    }

    if (typeof responseData === 'string') {
      return responseData;
    }

    if (Array.isArray(responseData)) {
      return responseData.join(', ');
    }

    if (responseData.message) {
      return responseData.message;
    }

    if (responseData.success && typeof responseData.success === 'string') {
      return responseData.success;
    }

    if (responseData.id) {
      return 'Result created successfully. Attendance values will be calculated automatically from the attendance records.';
    }

    return 'Result created successfully.';
  };

  // FIX: was setting a literal "value" key instead of the dynamic [field] key,
  // so class_score / exam_score never actually updated and inputs appeared "stuck".
  const handleCourseResultChange = (index, field, value) => {
    setCourseResults((prevResults) => {
      const updatedResults = [...prevResults];
      updatedResults[index] = {
        ...updatedResults[index],
        [field]: value,
      };
      return updatedResults;
    });
  };

  const calculateTotalScore = (classScore, examScore) => {
    const classScoreNum = parseFloat(classScore) || 0;
    const examScoreNum = parseFloat(examScore) || 0;

    return classScoreNum + examScoreNum;
  };

  const getGrade = (totalScore) => {
    if (totalScore >= 70) return 'A';
    if (totalScore >= 60) return 'B';
    if (totalScore >= 50) return 'C';
    if (totalScore >= 45) return 'D';
    if (totalScore >= 40) return 'E';
    return 'F';
  };

  const validateForm = () => {
    if (!selectedClass) return false;
    if (!selectedStudent) return false;
    if (!selectedTerm) return false;
    if (!academicYear || academicYear.trim() === '') return false;
    if (!nextTermBegins) return false;
    if (!classTeacherRemarks || classTeacherRemarks.trim() === '') return false;

    if (isThirdTerm && (!promotedTo || promotedTo.trim() === '')) {
      return false;
    }

    if (!courses.length) {
      return false;
    }

    const allCourseResultsFilled = courseResults.every((result) => {
      return (
        result.class_score !== '' &&
        result.exam_score !== '' &&
        result.class_score !== null &&
        result.exam_score !== null
      );
    });

    if (!allCourseResultsFilled) {
      return false;
    }

    const allScoresValid = courseResults.every((result) => {
      const classScore = Number(result.class_score);
      const examScore = Number(result.exam_score);

      return (
        !Number.isNaN(classScore) &&
        !Number.isNaN(examScore) &&
        classScore >= 0 &&
        classScore <= 40 &&
        examScore >= 0 &&
        examScore <= 60
      );
    });

    return allScoresValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      setError('Please fill all required fields and make sure scores are valid.');
      return;
    }

    const processedCourseResults = courseResults.map((result) => ({
      class_course: Number(result.class_course),
      class_score: Number(result.class_score),
      exam_score: Number(result.exam_score),
      remarks: result.remarks || '',
    }));

    const resultData = {
      student: Number(selectedStudent),
      class_name: selectedClass,
      term: selectedTerm,
      academic_year: academicYear.trim(),
      class_teacher_remarks: classTeacherRemarks.trim(),
      next_term_begins: nextTermBegins,
      promoted_to: isThirdTerm ? promotedTo : null,
      course_results: processedCourseResults,
    };

    console.log('Final payload being sent:', JSON.stringify(resultData, null, 2));

    try {
      setSubmitting(true);

      const responseData = await apiService.results.create(resultData);

      const successMessage = extractSuccessMessage(responseData);
      setSuccess(successMessage);
      setError(null);

      setSelectedStudent('');
      setSelectedTerm('');
      setCourses([]);
      setCourseResults([]);
      setClassTeacherRemarks('');
      setPromotedTo('');
      setNextTermBegins('');
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage || 'Failed to create result.');
      setSuccess(null);
    } finally {
      setSubmitting(false);
    }
  };

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

  const selectedStudentName = selectedStudentObject
    ? `${selectedStudentObject.last_name || ''} ${selectedStudentObject.first_name || ''}`.trim()
    : '';

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
          {success}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
        <p className="font-semibold">Attendance is now automatic.</p>
        <p className="text-sm mt-1">
          Days Present, Days Absent, Total School Days, and Attendance Percentage will be retrieved from the Attendance system by the backend.
          You no longer need to type attendance totals when creating a result.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                <option key={cls.value} value={cls.value}>
                  {cls.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Student <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              disabled={!selectedClass || studentsLoading}
              required
            >
              <option value="">
                {studentsLoading ? 'Loading students...' : 'Select Student'}
              </option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.last_name} {student.first_name}
                </option>
              ))}
            </select>
          </div>

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
                <option key={term.value} value={term.value}>
                  {term.label}
                </option>
              ))}
            </select>
          </div>

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
              placeholder="e.g. 2026-2027"
            />
          </div>

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
                  <option key={cls.value} value={cls.value}>
                    {cls.label}
                  </option>
                ))}
              </select>
            </div>
          )}

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

        {selectedStudentName && selectedClass && selectedTerm && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
            <h2 className="font-semibold text-gray-800 mb-2">Selected Result Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="font-medium">Student:</span> {selectedStudentName}
              </div>
              <div>
                <span className="font-medium">Class:</span> {selectedClass}
              </div>
              <div>
                <span className="font-medium">Term:</span> {selectedTerm}
              </div>
              <div>
                <span className="font-medium">Academic Year:</span> {academicYear}
              </div>
            </div>
          </div>
        )}

        {coursesLoading && (
          <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded mb-6">
            Loading courses...
          </div>
        )}

        {!coursesLoading && selectedClass && selectedTerm && courses.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded mb-6">
            No courses found for the selected class and term.
          </div>
        )}

        {courses.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-4">
              Course Results <span className="text-red-500">*</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border">Course</th>
                    <th className="px-4 py-2 border">
                      Class Score (40%) <span className="text-red-500">*</span>
                    </th>
                    <th className="px-4 py-2 border">
                      Exam Score (60%) <span className="text-red-500">*</span>
                    </th>
                    <th className="px-4 py-2 border">Total Score</th>
                    <th className="px-4 py-2 border">Grade</th>
                    <th className="px-4 py-2 border">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((classCourse, index) => {
                    const courseResult = courseResults[index] || {
                      class_score: '',
                      exam_score: '',
                      remarks: '',
                    };

                    const totalScore = calculateTotalScore(
                      courseResult.class_score,
                      courseResult.exam_score
                    );

                    const grade = getGrade(totalScore);

                    return (
                      <tr key={classCourse.id || index}>
                        <td className="px-4 py-2 border">
                          {displayCourseName(classCourse)}
                        </td>

                        <td className="px-4 py-2 border">
                          <input
                            type="number"
                            min="0"
                            max="40"
                            step="0.01"
                            className="w-full px-2 py-1 border rounded"
                            value={courseResult.class_score}
                            onChange={(e) =>
                              handleCourseResultChange(index, 'class_score', e.target.value)
                            }
                            required
                          />
                        </td>

                        <td className="px-4 py-2 border">
                          <input
                            type="number"
                            min="0"
                            max="60"
                            step="0.01"
                            className="w-full px-2 py-1 border rounded"
                            value={courseResult.exam_score}
                            onChange={(e) =>
                              handleCourseResultChange(index, 'exam_score', e.target.value)
                            }
                            required
                          />
                        </td>

                        <td className="px-4 py-2 border text-center">
                          {totalScore.toFixed(2)}
                        </td>

                        <td className="px-4 py-2 border text-center">
                          {grade}
                        </td>

                        <td className="px-4 py-2 border">
                          <input
                            type="text"
                            className="w-full px-2 py-1 border rounded"
                            value={courseResult.remarks || ''}
                            onChange={(e) =>
                              handleCourseResultChange(index, 'remarks', e.target.value)
                            }
                            placeholder="Add remarks"
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
            {submitting ? 'Creating...' : 'Create Result'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateResultForm;