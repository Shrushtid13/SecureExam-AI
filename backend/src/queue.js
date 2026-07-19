const { Queue, Worker } = require('bullmq');
const axios = require('axios');
const FormData = require('form-data');
const proctoringModel = require('./modules/proctoring/model');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Define the queue
const aiTasksQueue = new Queue('ai-tasks', {
  connection: { url: redisUrl },
});

// Helper function to initialize the worker
function initAiWorker(io, minioClient) {
  const worker = new Worker(
    'ai-tasks',
    async (job) => {
      const { examId, studentId, snapshotKey, userName, userEmail } = job.data;
      const bucketName = process.env.MINIO_BUCKET || 'secureexam-snapshots';
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

      console.log(`Processing AI task for exam=${examId}, student=${studentId}`);

      try {
        // Fetch file chunks from MinIO
        const dataStream = await minioClient.getObject(bucketName, snapshotKey);
        const chunks = [];
        for await (const chunk of dataStream) {
          chunks.push(chunk);
        }
        const fileBuffer = Buffer.concat(chunks);

        // Forward to AI service
        const form = new FormData();
        form.append('file', fileBuffer, { filename: 'snapshot.jpg', contentType: 'image/jpeg' });
        
        // Also grab audio if available (we'll implement audio capture soon)
        if (job.data.audioKey) {
          try {
            const audioStream = await minioClient.getObject(bucketName, job.data.audioKey);
            const audioChunks = [];
            for await (const chunk of audioStream) {
              audioChunks.push(chunk);
            }
            const audioBuffer = Buffer.concat(audioChunks);
            form.append('audio', audioBuffer, { filename: 'audio.webm', contentType: 'audio/webm' });
          } catch (audioErr) {
            console.error('Failed to get audio from MinIO:', audioErr);
          }
        }

        form.append('exam_id', examId);
        form.append('student_id', studentId);

        const aiResponse = await axios.post(`${aiServiceUrl}/check-snapshot`, form, {
          headers: { ...form.getHeaders() },
        });

        const aiResult = aiResponse.data;

        if (aiResult.flagged && aiResult.flags && aiResult.flags.length > 0) {
          for (const f of aiResult.flags) {
            // Deduplication check: ignore if the exact same flag type was logged in the last 30s
            const isDuplicate = await proctoringModel.recentFlagExists(examId, studentId, f.type, 30);
            if (isDuplicate) {
              console.log(`Skipping duplicate flag ${f.type} for student ${studentId}`);
              continue;
            }

            const flag = await proctoringModel.logFlag(
              examId,
              studentId,
              'ai_service',
              f.type,
              JSON.stringify({ confidence: f.confidence, message: aiResult.message }),
              snapshotKey // Keep image as primary evidence
            );

            // Broadcast live
            if (io) {
              const enrichedFlag = {
                ...flag,
                student_name: userName,
                student_email: userEmail,
              };
              io.to(`exam:${examId}`).emit('new_proctoring_flag', enrichedFlag);
            }
          }
        }
        return { success: true, ai_result: aiResult };
      } catch (err) {
        console.error('AI Task Worker error:', err.message);
        throw err;
      }
    },
    {
      connection: { url: redisUrl },
      concurrency: 5, // Process up to 5 snapshots concurrently
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed with error ${err.message}`);
  });

  return worker;
}

module.exports = { aiTasksQueue, initAiWorker };
