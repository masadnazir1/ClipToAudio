import { Router } from 'express';
import * as ConversionController from '../controllers/conversionController';
import { upload } from '../middlewares/upload';

const router = Router();

router.post(
  '/upload',
  upload.single('video'),
  ConversionController.uploadVideo,
);
router.get('/status/:id', ConversionController.getJobStatus);
router.delete('/job/:id', ConversionController.deleteJob);

export default router;
