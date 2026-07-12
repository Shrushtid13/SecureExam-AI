const classModel = require('./model');
const authModel = require('../auth/model'); // to lookup students

async function createClass(req, res) {
  try {
    const { grade, section, subject } = req.body;
    if (!grade || !section) {
      return res.status(400).json({ error: 'Grade and section are required' });
    }
    const newClass = await classModel.createClass(grade, section);
    
    let assignment = null;
    if (subject) {
      // Auto-assign the current teacher to this class for the given subject
      assignment = await classModel.assignTeacherToClass(req.user.id, newClass.id, subject);
    }
    
    res.status(201).json({ message: 'Class created', class: newClass, assignment });
  } catch (err) {
    console.error('createClass error:', err);
    res.status(500).json({ error: 'Failed to create class. Note: You may already be assigned to this class and subject.' });
  }
}

async function listAllClasses(req, res) {
  try {
    const classes = await classModel.listAllClasses();
    res.json({ classes });
  } catch (err) {
    console.error('listAllClasses error:', err);
    res.status(500).json({ error: 'Failed to list classes' });
  }
}

async function assignTeacherToClass(req, res) {
  try {
    const { classId, subject, teacherId } = req.body;
    const assigned = await classModel.assignTeacherToClass(teacherId || req.user.id, classId, subject);
    res.json({ message: 'Teacher assigned to class', assignment: assigned });
  } catch (err) {
    console.error('assignTeacherToClass error:', err);
    res.status(500).json({ error: 'Failed to assign teacher to class' });
  }
}

async function listClassesByTeacher(req, res) {
  try {
    const classes = await classModel.listClassesByTeacher(req.user.id);
    res.json({ classes });
  } catch (err) {
    console.error('listClassesByTeacher error:', err);
    res.status(500).json({ error: 'Failed to list classes for teacher' });
  }
}

async function getClassDetail(req, res) {
  try {
    const classId = req.params.id;
    const cls = await classModel.getClassById(classId);
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    
    const students = await classModel.listStudentsByClass(classId);
    res.json({ class: cls, students });
  } catch (err) {
    console.error('getClassDetail error:', err);
    res.status(500).json({ error: 'Failed to get class detail' });
  }
}

async function addStudent(req, res) {
  try {
    const classId = req.params.id;
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Student email is required' });

    const student = await authModel.findUserByEmail(email.toLowerCase().trim());
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (student.role !== 'student') return res.status(400).json({ error: 'User is not a student' });

    const updated = await classModel.assignStudentToClass(classId, student.id);
    res.json({ message: 'Student added to class', student: updated });
  } catch (err) {
    console.error('addStudent error:', err);
    res.status(500).json({ error: 'Failed to add student to class' });
  }
}

async function removeStudent(req, res) {
  try {
    const studentId = req.params.studentId;
    await classModel.removeStudentFromClass(studentId);
    res.json({ message: 'Student removed from class' });
  } catch (err) {
    console.error('removeStudent error:', err);
    res.status(500).json({ error: 'Failed to remove student' });
  }
}

async function deleteClass(req, res) {
  try {
    const classId = req.params.id;
    await classModel.deleteClass(classId);
    res.json({ message: 'Class deleted' });
  } catch (err) {
    console.error('deleteClass error:', err);
    res.status(500).json({ error: 'Failed to delete class' });
  }
}

module.exports = {
  createClass,
  listAllClasses,
  assignTeacherToClass,
  listClassesByTeacher,
  getClassDetail,
  addStudent,
  removeStudent,
  deleteClass
};
