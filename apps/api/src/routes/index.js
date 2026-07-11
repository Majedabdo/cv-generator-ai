import { Router } from 'express';
import healthCheck from './health-check.js';
import integratedAiRouter from './integrated-ai.js';
import generateResumeHandler from './resume.js';
import qualityReviewHandler from './resume-quality.js';
import checkoutHandler from './payments.js';
import createOrderHandler from './payments-create.js';
import unlockPdfHandler from './unlock-pdf.js';
import { paymentsConfig, paypalWebhook } from './paypal-public.js';
import atsAnalyzeHandler from './ats.js';
import adminRouter from './admin.js';
import chatV2Router from './chat-v2.js';
import resumeV2Handler from './resume-v2.js';
import { integratedAiRateLimit } from '../middleware/integrated-ai-rate-limit.js';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import { uploadFiles } from '../middleware/file-upload.js';
import { extractFromFiles } from '../api/file-extract.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    router.use('/integrated-ai', integratedAiRouter);
    router.use('/chat-v2', chatV2Router);
    router.post('/resume-v2/generate', integratedAiRateLimit, resumeV2Handler);
    router.post('/resume/generate', integratedAiRateLimit, generateResumeHandler);
    router.post('/resume/quality-review', integratedAiRateLimit, qualityReviewHandler);
    router.post('/ats/analyze', integratedAiRateLimit, atsAnalyzeHandler);
    router.get('/payments/config', paymentsConfig);
    router.post('/webhooks/paypal', paypalWebhook);
    router.post('/payments/create', integratedAiRateLimit, createOrderHandler);
    router.post('/payments/checkout', integratedAiRateLimit, checkoutHandler);
    router.post('/payments/verify', integratedAiRateLimit, checkoutHandler);
    router.post('/payments/unlock-pdf', pocketbaseAuth, unlockPdfHandler);
    router.use('/admin', adminRouter());

    router.post('/resume/extract', uploadFiles({
        allowedMimeTypes: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain',
        ],
        fieldName: 'file',
        maxCount: 1,
    }), async (req, res) => {
        try {
            const { documents } = await extractFromFiles(req.files || []);
            if (documents && documents.length > 0) {
                res.json({ text: documents[0].text });
            } else {
                res.status(400).json({ error: 'No text extracted' });
            }
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};

