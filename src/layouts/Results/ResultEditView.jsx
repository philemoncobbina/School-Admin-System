import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../Services/ResultService';
import { CLASS_OPTIONS } from '../../services/booklistService';

const STATUS_STYLES = {
  PUBLISHED: 'bg-green-100 text-green-800',
  DRAFT: 'bg-gray-100 text-gray-800',
  SCHEDULED: 'bg-blue-100 text-blue-800'
};

const TERM_CHOICES = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' }
];

const GRADE_CHOICES = [
  { grade: 'A', label: 'Excellent (70-100)', min: 70, max: 100 },
  { grade: 'B', label: 'Very Good (60-69)', min: 60, max: 69 },
  { grade: 'C', label: 'Good (50-59)', min: 50, max: 59 },
  { grade: 'D', label: 'Fair (45-49)', min: 45, max: 49 },
  { grade: 'E', label: 'Pass (40-44)', min: 40, max: 44 },
  { grade: 'F', label: 'Fail (0-39)', min: 0, max: 39 }
];

const GRADE_STYLES = {
  A: 'bg-green-100 text-green-800 font-semibold',
  B: 'bg-blue-100 text-blue-800 font-semibold',
  C: 'bg-yellow-100 text-yellow-800 font-semibold',
  D: 'bg-orange-100 text-orange-800 font-semibold',
  E: 'bg-red-100 text-red-800 font-semibold',
  F: 'bg-red-200 text-red-900 font-bold'
};

const ResultEditView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Simplified state structure
  const [resultData, setResultData] = useState(null);
  const [courseResults, setCourseResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  
  // Form fields
  const [academicYear, setAcademicYear] = useState('');
  const [daysPresent, setDaysPresent] = useState(0);
  const [daysAbsent, setDaysAbsent] = useState(0);
  const [classTeacherRemarks, setClassTeacherRemarks] = useState('');
  const [promotedTo, setPromotedTo] = useState('');
  const [nextTermBegins, setNextTermBegins] = useState('');
  const [overallPosition, setOverallPosition] = useState('');
  
  // Modal states
  const [statusChangeOpen, setStatusChangeOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  
  // Change log states
  const [showChangeLog, setShowChangeLog] = useState(false);
  const [changeLog, setChangeLog] = useState([]);
  const [loadingChangeLog, setLoadingChangeLog] = useState(false);

  // Check if current term is third term
  const isThirdTerm = resultData?.term === 'third';

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
  };

  const calculateTotalScore = (classScore, examScore) => {
    return (parseFloat(classScore) || 0) + (parseFloat(examScore) || 0);
  };

  const calculateGrade = (totalScore) => {
    const score = parseFloat(totalScore) || 0;
    const gradeOption = GRADE_CHOICES.find(g => score >= g.min && score <= g.max);
    return gradeOption?.grade || 'F';
  };

  // Handle preview report card
  const handlePreviewReportCard = async () => {
    try {
      if (!resultData?.report_card_pdf) {
        setError('No report card available for this result');
        return;
      }
      
      // Open the PDF in a new tab
      window.open(resultData.report_card_pdf, '_blank');
    } catch (err) {
      setError('Failed to open report card');
      console.error('Preview error:', err);
    }
  };

  // Fetch result data
  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await apiService.results.getById(parseInt(id));

        // If student is just an ID, fetch the full student object
        let studentObj = result.student;
        if (typeof studentObj === 'number' || typeof studentObj === 'string') {
          try {
            studentObj = await apiService.students.getById(studentObj);
          } catch (e) {
            // fallback to ID if fetch fails
            studentObj = result.student;
          }
        }

        setResultData({ ...result, student: studentObj });
        setCourseResults(result.course_results || []);
        setAcademicYear(result.academic_year || '');
        setDaysPresent(result.days_present || 0);
        setDaysAbsent(result.days_absent || 0);
        setClassTeacherRemarks(result.class_teacher_remarks || '');
        setPromotedTo(result.promoted_to || '');
        setNextTermBegins(formatDateForInput(result.next_term_begins));
        setOverallPosition(result.overall_position || '');
        setNewStatus(result.status);
        setScheduledDate(formatDateForInput(result.scheduled_date));
        
      } catch (err) {
        setError('Failed to fetch result data');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchResult();
    }
  }, [id]);

  // Handle course result changes
  const handleCourseResultChange = (index, field, value) => {
    const updatedResults = [...courseResults];
    updatedResults[index] = { ...updatedResults[index], [field]: value };
    
    if (['class_score', 'exam_score'].includes(field)) {
      const totalScore = calculateTotalScore(
        field === 'class_score' ? value : updatedResults[index].class_score,
        field === 'exam_score' ? value : updatedResults[index].exam_score
      );
      updatedResults[index].grade = calculateGrade(totalScore);
    }
    
    setCourseResults(updatedResults);
  };

  // Prepare data for API
  const prepareDataForApi = () => ({
    ...resultData,
    course_results: courseResults.map(course => ({
      ...course,
      class_course: course.class_course?.id || course.class_course,
      class_score: parseFloat(course.class_score) || 0,
      exam_score: parseFloat(course.exam_score) || 0,
      grade: course.grade,
    })),
    student: resultData.student?.id || resultData.student,
    academic_year: academicYear,
    days_present: daysPresent,
    days_absent: daysAbsent,
    class_teacher_remarks: classTeacherRemarks,
    promoted_to: isThirdTerm ? promotedTo : '', // Only include if third term
    next_term_begins: nextTermBegins,
    overall_position: overallPosition,
  });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      await apiService.results.update(id, prepareDataForApi());
      setSuccess('Result updated successfully');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Unknown error';
      setError(`Failed to update result: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle status change
  const handleStatusChange = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const updateData = { 
        ...prepareDataForApi(),
        status: newStatus,
        scheduled_date: newStatus === 'SCHEDULED' ? scheduledDate : null
      };
      
      await apiService.results.update(id, updateData);
      
      setResultData(prev => ({
        ...prev,
        status: newStatus,
        scheduled_date: newStatus === 'SCHEDULED' ? scheduledDate : null
      }));
      
      setSuccess('Result status updated successfully');
      setStatusChangeOpen(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Unknown error';
      setError(`Failed to update result status: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setLoading(true);
      await apiService.results.delete(id);
      navigate('/dashboard/results-management/');
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Unknown error';
      setError(`Failed to delete result: ${errorMessage}`);
      setDeleteConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle view change log
  const handleViewChangeLog = async () => {
    if (showChangeLog) {
      setShowChangeLog(false);
      return;
    }
    
    try {
      setLoadingChangeLog(true);
      const logData = await apiService.results.getChangeLog(id);
      setChangeLog(logData);
      setShowChangeLog(true);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Unknown error';
      setError(`Failed to fetch change log: ${errorMessage}`);
    } finally {
      setLoadingChangeLog(false);
    }
  };

  if (loading && !resultData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4">Loading result data...</p>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-red-500">Failed to load result data</p>
      </div>
    );
  }

  // Helper for rendering modals
  const Modal = ({ open, onClose, children }) =>
    open ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md w-full">{children}</div>
      </div>
    ) : null;

  // Helper for rendering table rows
  const renderCourseRows = () =>
    courseResults.map((course, i) => {
      const total = calculateTotalScore(course.class_score, course.exam_score);
      const grade = calculateGrade(total);
      return (
        <tr key={i} className={i % 2 ? 'bg-white' : 'bg-gray-50'}>
          <td className="px-4 py-2 border">{course.class_course?.course?.name || course.course_name || 'Unknown'}</td>
          <td className="px-4 py-2 border text-center">
            <input type="text" className="w-full text-center bg-gray-100 border-none px-2 py-1" value={course.position || 'N/A'} readOnly disabled />
          </td>
          <td className="px-4 py-2 border">
            <input type="number" min="0" max="40" step="0.01" className="w-full px-3 py-1 border rounded-md"
              value={course.class_score || ''} onChange={e => handleCourseResultChange(i, 'class_score', e.target.value)}
              disabled={resultData.status === 'PUBLISHED'} />
          </td>
          <td className="px-4 py-2 border">
            <input type="number" min="0" max="60" step="0.01" className="w-full px-3 py-1 border rounded-md"
              value={course.exam_score || ''} onChange={e => handleCourseResultChange(i, 'exam_score', e.target.value)}
              disabled={resultData.status === 'PUBLISHED'} />
          </td>
          <td className="px-4 py-2 border text-center"><span className="font-medium">{total.toFixed(2)}</span></td>
          <td className="px-4 py-2 border text-center">
            <span className={`inline-block px-2 py-1 rounded text-sm ${GRADE_STYLES[grade]}`}>{grade}</span>
          </td>
          <td className="px-4 py-2 border">
            <input type="text" className="w-full px-3 py-1 border rounded-md"
              value={course.remarks || ''} onChange={e => handleCourseResultChange(i, 'remarks', e.target.value)}
              disabled={resultData.status === 'PUBLISHED'} placeholder="Add remarks" />
          </td>
        </tr>
      );
    });

  return (
    <div className="max-w-9xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Result #{id}</h1>
        <div className="flex space-x-2">
          {resultData.report_card_pdf && (
            <button 
              onClick={handlePreviewReportCard} 
              className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
            >
              Preview Report Card
            </button>
          )}
          <button onClick={() => setStatusChangeOpen(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded">Change Status</button>
          <button onClick={() => setDeleteConfirmOpen(true)} className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded">Delete Result</button>
          <button onClick={handleViewChangeLog} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
            {showChangeLog ? 'Hide Change Log' : 'View Change Log'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      {/* Grading Scale */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">Grading Scale Reference:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {GRADE_CHOICES.map(g => (
            <div key={g.grade} className={`px-2 py-1 rounded text-center ${GRADE_STYLES[g.grade]}`}>
              <div className="font-bold">{g.grade}</div>
              <div>{g.min}-{g.max}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Result Information</h2>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Student:</span> <span className="ml-2">{resultData.student_name || 'Unknown'}</span></div>
            <div><span className="font-medium">Class:</span> <span className="ml-2">{resultData.class_name}</span></div>
            <div><span className="font-medium">Term:</span> <span className="ml-2">{TERM_CHOICES.find(t => t.value === resultData.term)?.label || resultData.term}</span></div>
            <div><span className="font-medium">Academic Year:</span> <span className="ml-2">{resultData.academic_year}</span></div>
            <div><span className="font-medium">Created:</span> <span className="ml-2">{formatDate(resultData.created_at)}</span></div>
            <div><span className="font-medium">Updated:</span> <span className="ml-2">{formatDate(resultData.updated_at)}</span></div>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Status & Additional Information</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${STATUS_STYLES[resultData.status] || ''}`}>{resultData.status}</span>
              {resultData.status === 'SCHEDULED' && resultData.scheduled_date && (
                <div className="mt-1"><span className="font-medium">Scheduled for:</span> <span className="ml-2">{formatDate(resultData.scheduled_date)}</span></div>
              )}
              {resultData.status === 'PUBLISHED' && resultData.published_date && (
                <div className="mt-1"><span className="font-medium">Published on:</span> <span className="ml-2">{formatDate(resultData.published_date)}</span></div>
              )}
            </div>
            <div>
              <span className="font-medium">Attendance:</span>
              <span className="ml-2">{resultData.days_present || 0} present, {resultData.days_absent || 0} absent ({resultData.attendance_percentage || 0}%)</span>
            </div>
            {resultData.overall_position && <div><span className="font-medium">Position:</span> <span className="ml-2">{resultData.overall_position}</span></div>}
            {isThirdTerm && resultData.promoted_to && <div><span className="font-medium">Promoted To:</span> <span className="ml-2">{CLASS_OPTIONS.find(c => c.value === resultData.promoted_to)?.label || resultData.promoted_to}</span></div>}
            {resultData.next_term_begins && <div><span className="font-medium">Next Term Begins:</span> <span className="ml-2">{formatDate(resultData.next_term_begins)}</span></div>}
          </div>
        </div>
      </div>

      {/* Additional Info Form */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block font-medium mb-1">Academic Year</label>
            <input type="text" className="w-full px-4 py-2 border rounded-md" value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="e.g. 2023-2024" />
          </div>
          <div>
            <label className="block font-medium mb-1">Days Present</label>
            <input type="number" min="0" className="w-full px-4 py-2 border rounded-md" value={daysPresent} onChange={e => setDaysPresent(+e.target.value || 0)} />
          </div>
          <div>
            <label className="block font-medium mb-1">Days Absent</label>
            <input type="number" min="0" className="w-full px-4 py-2 border rounded-md" value={daysAbsent} onChange={e => setDaysAbsent(+e.target.value || 0)} />
          </div>
          <div>
            <label className="block font-medium mb-1">Overall Position</label>
            <input type="text" className="w-full px-4 py-2 border rounded-md bg-gray-100" value={overallPosition} readOnly disabled placeholder="Position will be calculated automatically" />
          </div>
          {/* Only show Promoted To for third term */}
          {isThirdTerm && (
            <div>
              <label className="block font-medium mb-1">Promoted To</label>
              <select className="w-full px-4 py-2 border rounded-md" value={promotedTo} onChange={e => setPromotedTo(e.target.value)}>
                <option value="">Select Class</option>
                {CLASS_OPTIONS.map(cls => <option key={cls.value} value={cls.value}>{cls.label}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block font-medium mb-1">Next Term Begins</label>
            <input type="date" className="w-full px-4 py-2 border rounded-md" value={nextTermBegins} onChange={e => setNextTermBegins(e.target.value)} required />
          </div>
          <div className="md:col-span-3">
            <label className="block font-medium mb-1">Class Teacher Remarks</label>
            <textarea className="w-full px-4 py-2 border rounded-md" rows={2} value={classTeacherRemarks} onChange={e => setClassTeacherRemarks(e.target.value)} placeholder="Enter general remarks" />
          </div>
        </div>
      </div>

      {/* Change Log */}
      {showChangeLog && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Change Log</h2>
          {loadingChangeLog ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">Loading change log...</p>
            </div>
          ) : changeLog.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 border text-left">Changed By</th>
                    <th className="px-4 py-2 border text-left">Date</th>
                    <th className="px-4 py-2 border text-left">Field</th>
                    <th className="px-4 py-2 border text-left">Previous Value</th>
                    <th className="px-4 py-2 border text-left">New Value</th>
                  </tr>
                </thead>
                <tbody>
                  {changeLog.map(log => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{log.changed_by?.first_name ? `${log.changed_by.first_name} ${log.changed_by.last_name}` : `User #${log.changed_by}`}</td>
                      <td className="px-4 py-2">{formatDate(log.changed_at)}</td>
                      <td className="px-4 py-2">{log.field_name}</td>
                      <td className="px-4 py-2">{log.previous_value || 'N/A'}</td>
                      <td className="px-4 py-2">{log.new_value || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-gray-500">No changes have been logged for this result.</p>}
        </div>
      )}

      {/* Course Results Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Course Results</h2>
          {courseResults.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 border text-left">Course</th>
                    <th className="px-4 py-2 border text-center">Position</th>
                    <th className="px-4 py-2 border text-center">Class Score (40%)</th>
                    <th className="px-4 py-2 border text-center">Exam Score (60%)</th>
                    <th className="px-4 py-2 border text-center">Total Score</th>
                    <th className="px-4 py-2 border text-center">Grade</th>
                    <th className="px-4 py-2 border text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody>{renderCourseRows()}</tbody>
              </table>
            </div>
          ) : <p className="text-gray-500">No course results available for this student.</p>}
          <div className="mt-6 flex gap-4">
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded" disabled={loading || resultData.status === 'PUBLISHED'}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-6 rounded" onClick={() => navigate('/dashboard/results-management/')}>Back to Results</button>
          </div>
        </div>
      </form>

      {/* Status Change Modal */}
      <Modal open={statusChangeOpen} onClose={() => setStatusChangeOpen(false)}>
        <h3 className="text-xl font-bold mb-4">Change Result Status</h3>
        <div className="mb-4">
          <label className="block font-medium mb-2">Status</label>
          <div className="flex flex-col space-y-2">
            {['DRAFT', 'PUBLISHED', 'SCHEDULED'].map(status => (
              <label key={status} className="inline-flex items-center">
                <input type="radio" className="form-radio" name="status" value={status} checked={newStatus === status} onChange={() => setNewStatus(status)} />
                <span className="ml-2">{status.charAt(0) + status.slice(1).toLowerCase()}</span>
              </label>
            ))}
          </div>
        </div>
        {newStatus === 'SCHEDULED' && (
          <div className="mb-4">
            <label className="block font-medium mb-2">Scheduled Date</label>
            <input type="datetime-local" className="w-full px-4 py-2 border rounded-md" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} required />
          </div>
        )}
        <div className="flex justify-end space-x-4 mt-6">
          <button className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400" onClick={() => setStatusChangeOpen(false)}>Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" onClick={handleStatusChange} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <h3 className="text-xl font-bold mb-4">Confirm Delete</h3>
        <p className="mb-6">Are you sure you want to delete this result? This action cannot be undone.</p>
        <div className="flex justify-end space-x-4">
          <button className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400" onClick={() => setDeleteConfirmOpen(false)}>Cancel</button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ResultEditView;