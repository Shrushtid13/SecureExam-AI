const examModel = require('./model');
const authModel = require('../auth/model');

// --- Helper: Verify Exam Ownership ---
async function isExamOwner(examId, userId, role) {
  if (role === 'admin') return true;
  const exam = await examModel.getExamById(examId);
  return exam && exam.created_by === userId;
}

// --- Exam Controllers ---

async function createExam(req, res) {
  try {
    const { title, durationMinutes, startTime, endTime } = req.body;

    if (!title || !durationMinutes || !startTime || !endTime) {
      return res.status(400).json({ error: 'All fields (title, durationMinutes, startTime, endTime) are required' });
    }

    const duration = parseInt(durationMinutes, 10);
    if (isNaN(duration) || duration <= 0) {
      return res.status(400).json({ error: 'Duration must be a positive integer' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid dates provided' });
    }

    if (start >= end) {
      return res.status(400).json({ error: 'Start time must be before end time' });
    }

    const exam = await examModel.createExam(
      title.trim(),
      duration,
      start.toISOString(),
      end.toISOString(),
      req.user.id
    );

    res.status(201).json({ message: 'Exam created successfully', exam });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ error: 'Failed to create exam' });
  }
}

async function getExam(req, res) {
  try {
    const examId = parseInt(req.params.id, 10);
    if (isNaN(examId)) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    const exam = await examModel.getExamById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const isTeacherOrAdmin = ['teacher', 'admin'].includes(req.user.role);
    let isEnrolled = false;

    if (!isTeacherOrAdmin) {
      // Check if student is enrolled
      const enrollment = await examModel.getEnrollment(examId, req.user.id);
      if (!enrollment) {
        return res.status(403).json({ error: 'You are not enrolled in this exam' });
      }
      isEnrolled = true;
    }

    // Get questions
    const questions = await examModel.listQuestionsByExam(examId);

    // If student, remove correct answers for security, and verify exam is active
    if (!isTeacherOrAdmin) {
      const now = new Date();
      const start = new Date(exam.start_time);
      const end = new Date(exam.end_time);

      if (now < start) {
        return res.status(403).json({ 
          error: 'Exam has not started yet', 
          startTime: exam.start_time 
        });
      }

      if (now > end) {
        return res.status(403).json({ error: 'Exam window has closed' });
      }

      // Strip correct answers
      questions.forEach(q => {
        delete q.correct_answer;
      });
    }

    res.json({
      exam,
      questions,
    });
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({ error: 'Failed to fetch exam details' });
  }
}

async function listExams(req, res) {
  try {
    let exams;
    if (req.user.role === 'student') {
      exams = await examModel.listExamsForStudent(req.user.id);
    } else if (req.user.role === 'teacher') {
      exams = await examModel.listExamsByCreator(req.user.id);
    } else {
      exams = await examModel.listAllExams();
    }
    res.json({ exams });
  } catch (error) {
    console.error('List exams error:', error);
    res.status(500).json({ error: 'Failed to list exams' });
  }
}

async function updateExam(req, res) {
  try {
    const examId = parseInt(req.params.id, 10);
    if (isNaN(examId)) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    const hasAccess = await isExamOwner(examId, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not own this exam' });
    }

    const { title, durationMinutes, startTime, endTime } = req.body;
    if (!title || !durationMinutes || !startTime || !endTime) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const duration = parseInt(durationMinutes, 10);
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(duration) || duration <= 0 || isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ error: 'Invalid input parameters' });
    }

    const updated = await examModel.updateExam(examId, title.trim(), duration, start.toISOString(), end.toISOString());
    res.json({ message: 'Exam updated successfully', exam: updated });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ error: 'Failed to update exam' });
  }
}

async function deleteExam(req, res) {
  try {
    const examId = parseInt(req.params.id, 10);
    if (isNaN(examId)) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    const hasAccess = await isExamOwner(examId, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not own this exam' });
    }

    await examModel.deleteExam(examId);
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
}

// --- Question Controllers ---

async function createQuestion(req, res) {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (isNaN(examId)) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    const hasAccess = await isExamOwner(examId, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not own this exam' });
    }

    const { type, question_text, options, correct_answer, points } = req.body;
    if (!type || !question_text || points === undefined) {
      return res.status(400).json({ error: 'Type, question text, and points are required' });
    }

    if (!['mcq', 'true_false', 'numeric', 'subjective'].includes(type)) {
      return res.status(400).json({ error: 'Invalid question type' });
    }

    if (type === 'mcq' && (!options || !Array.isArray(options) || options.length === 0)) {
      return res.status(400).json({ error: 'Options array is required for MCQ questions' });
    }

    const pts = parseInt(points, 10);
    if (isNaN(pts) || pts < 0) {
      return res.status(400).json({ error: 'Points must be a non-negative integer' });
    }

    const question = await examModel.createQuestion(
      examId,
      type,
      question_text.trim(),
      options,
      correct_answer !== undefined ? String(correct_answer).trim() : null,
      pts
    );

    res.status(201).json({ message: 'Question created successfully', question });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
}

async function updateQuestion(req, res) {
  try {
    const { examId, id } = req.params;
    const qId = parseInt(id, 10);
    const exId = parseInt(examId, 10);

    if (isNaN(qId) || isNaN(exId)) {
      return res.status(400).json({ error: 'Invalid question or exam ID' });
    }

    const hasAccess = await isExamOwner(exId, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not own this exam' });
    }

    const question = await examModel.getQuestionById(qId);
    if (!question || question.exam_id !== exId) {
      return res.status(404).json({ error: 'Question not found in this exam' });
    }

    const { type, question_text, options, correct_answer, points } = req.body;
    if (!type || !question_text || points === undefined) {
      return res.status(400).json({ error: 'Type, question text, and points are required' });
    }

    if (!['mcq', 'true_false', 'numeric', 'subjective'].includes(type)) {
      return res.status(400).json({ error: 'Invalid question type' });
    }

    if (type === 'mcq' && (!options || !Array.isArray(options) || options.length === 0)) {
      return res.status(400).json({ error: 'Options array is required for MCQ questions' });
    }

    const pts = parseInt(points, 10);
    if (isNaN(pts) || pts < 0) {
      return res.status(400).json({ error: 'Points must be a non-negative integer' });
    }

    const updated = await examModel.updateQuestion(
      qId,
      type,
      question_text.trim(),
      options,
      correct_answer !== undefined ? String(correct_answer).trim() : null,
      pts
    );

    res.json({ message: 'Question updated successfully', question: updated });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
}

async function deleteQuestion(req, res) {
  try {
    const { examId, id } = req.params;
    const qId = parseInt(id, 10);
    const exId = parseInt(examId, 10);

    if (isNaN(qId) || isNaN(exId)) {
      return res.status(400).json({ error: 'Invalid question or exam ID' });
    }

    const hasAccess = await isExamOwner(exId, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not own this exam' });
    }

    const question = await examModel.getQuestionById(qId);
    if (!question || question.exam_id !== exId) {
      return res.status(404).json({ error: 'Question not found in this exam' });
    }

    await examModel.deleteQuestion(qId);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
}

// --- Enrollment Controllers ---

async function enrollStudent(req, res) {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (isNaN(examId)) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    const hasAccess = await isExamOwner(examId, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not own this exam' });
    }

    const { studentId, studentEmail } = req.body;
    if (!studentId && !studentEmail) {
      return res.status(400).json({ error: 'Either studentId or studentEmail is required' });
    }

    let targetStudent;
    if (studentId) {
      targetStudent = await authModel.findUserById(studentId);
    } else {
      targetStudent = await authModel.findUserByEmail(studentEmail.toLowerCase().trim());
    }

    if (!targetStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (targetStudent.role !== 'student') {
      return res.status(400).json({ error: 'User is not a student' });
    }

    // Check if already enrolled
    const existing = await examModel.getEnrollment(examId, targetStudent.id);
    if (existing) {
      return res.status(409).json({ error: 'Student is already enrolled in this exam' });
    }

    const enrollment = await examModel.enrollStudent(examId, targetStudent.id);
    res.status(201).json({
      message: 'Student enrolled successfully',
      enrollment: {
        id: enrollment.id,
        examId: enrollment.exam_id,
        studentId: enrollment.student_id,
        studentName: targetStudent.name,
        studentEmail: targetStudent.email
      }
    });
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({ error: 'Failed to enroll student' });
  }
}

async function listEnrollments(req, res) {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (isNaN(examId)) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    const hasAccess = await isExamOwner(examId, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not own this exam' });
    }

    const enrollments = await examModel.listEnrollmentsByExam(examId);
    res.json({ enrollments });
  } catch (error) {
    console.error('List enrollments error:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
}

async function bulkEnrollStudents(req, res) {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (isNaN(examId)) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    const hasAccess = await isExamOwner(examId, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not own this exam' });
    }

    const { emails, enrollAll, classId } = req.body;
    const results = { enrolled: [], skipped: [], notFound: [], notStudent: [] };

    let studentsToEnroll = [];

    if (enrollAll) {
      // Get all registered students
      const allStudents = await authModel.listAllStudents();
      studentsToEnroll = allStudents;
    } else if (classId) {
      // Look up students in the class
      const classModel = require('../classes/model');
      const classStudents = await classModel.listStudentsByClass(classId);
      studentsToEnroll = classStudents;
    } else if (emails && Array.isArray(emails) && emails.length > 0) {
      // Look up each email
      for (const email of emails) {
        const trimmed = email.toLowerCase().trim();
        if (!trimmed) continue;
        const user = await authModel.findUserByEmail(trimmed);
        if (!user) {
          results.notFound.push(trimmed);
        } else if (user.role !== 'student') {
          results.notStudent.push(trimmed);
        } else {
          studentsToEnroll.push(user);
        }
      }
    } else {
      return res.status(400).json({ error: 'Provide an array of emails or set enrollAll: true' });
    }

    // Enroll each student (skip if already enrolled)
    for (const student of studentsToEnroll) {
      const existing = await examModel.getEnrollment(examId, student.id);
      if (existing) {
        results.skipped.push(student.email);
      } else {
        await examModel.enrollStudent(examId, student.id);
        results.enrolled.push(student.email);
      }
    }

    res.json({
      message: `Enrolled ${results.enrolled.length} student(s)`,
      results,
    });
  } catch (error) {
    console.error('Bulk enroll error:', error);
    res.status(500).json({ error: 'Failed to bulk enroll students' });
  }
}

async function listStudents(req, res) {
  try {
    const students = await authModel.listAllStudents();
    res.json({ students });
  } catch (error) {
    console.error('List students error:', error);
    res.status(500).json({ error: 'Failed to list students' });
  }
}

module.exports = {
  createExam,
  getExam,
  listExams,
  updateExam,
  deleteExam,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  enrollStudent,
  listEnrollments,
  bulkEnrollStudents,
  listStudents,
};
