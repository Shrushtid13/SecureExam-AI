const proctoringModel = require('./model');
const axios = require('axios');
const FormData = require('form-data');
const { Client: MinioClient } = require('minio');
const crypto = require('crypto');
const { aiTasksQueue } = require('../../queue');

// Initialize MinIO client
const minioClient = new MinioClient({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'admin123',
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'secureexam-snapshots';

// Ensure bucket exists on startup
minioClient.bucketExists(BUCKET_NAME).then(exists => {
  if (!exists) {
    return minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
  }
}).catch(err => console.error("MinIO init error:", err));

async function logFlag(req, res) {
  try {
    const { examId } = req.params;
    const { source, flagType, detail, snapshotKey } = req.body;

    if (!source || !flagType) {
      return res.status(400).json({ error: 'source and flagType are required' });
    }

    const flag = await proctoringModel.logFlag(
      examId,
      req.user.id,
      source,
      flagType,
      detail || null,
      snapshotKey || null
    );

    // Broadcast to Socket.io room for live monitoring
    const io = req.app.get('io');
    if (io) {
      // Attach student info for the live dashboard
      const enrichedFlag = {
        ...flag,
        student_name: req.user.name || req.user.email,
        student_email: req.user.email,
      };
      io.to(`exam:${examId}`).emit('new_proctoring_flag', enrichedFlag);
    }

    res.status(201).json({ message: 'Flag logged', flag });
  } catch (error) {
    console.error('logFlag error:', error);
    res.status(500).json({ error: 'Failed to log proctoring flag' });
  }
}

async function getFlagsForExam(req, res) {
  try {
    const { examId } = req.params;
    const flags = await proctoringModel.getFlagsForExam(examId);
    res.json({ flags });
  } catch (error) {
    console.error('getFlagsForExam error:', error);
    res.status(500).json({ error: 'Failed to fetch proctoring flags' });
  }
}

async function processSnapshot(req, res) {
  try {
    const { examId } = req.params;
    const studentId = req.user.id;
    const snapshotFile = req.files?.snapshot?.[0];
    const audioFile = req.files?.audio?.[0];

    if (!snapshotFile) {
      return res.status(400).json({ error: 'No snapshot provided' });
    }

    // 1. Save to MinIO
    const snapshotKey = `exam_${examId}/student_${studentId}/${Date.now()}_${crypto.randomBytes(4).toString('hex')}.jpg`;
    await minioClient.putObject(BUCKET_NAME, snapshotKey, snapshotFile.buffer, snapshotFile.size, { 'Content-Type': 'image/jpeg' });

    let audioKey = null;
    if (audioFile) {
      audioKey = `exam_${examId}/student_${studentId}/${Date.now()}_${crypto.randomBytes(4).toString('hex')}.webm`;
      await minioClient.putObject(BUCKET_NAME, audioKey, audioFile.buffer, audioFile.size, { 'Content-Type': 'audio/webm' });
    }

    // 2. Push to BullMQ AI Task Queue
    await aiTasksQueue.add('analyze-snapshot', {
      examId,
      studentId,
      snapshotKey,
      audioKey,
      userName: req.user.name || req.user.email,
      userEmail: req.user.email,
    });

    res.status(202).json({ success: true, message: 'Snapshot queued for AI analysis' });
  } catch (error) {
    console.error('processSnapshot error:', error);
    res.status(500).json({ error: 'Failed to process snapshot' });
  }
}

module.exports = {
  logFlag,
  getFlagsForExam,
  processSnapshot,
};
