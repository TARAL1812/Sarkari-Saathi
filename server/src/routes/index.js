import { Router } from 'express';
import { noStore, requireAdmin, requireAuth, requirePasswordChangeComplete } from '../middleware/auth.js';
import * as auth from '../controllers/authController.js';
import * as catalog from '../controllers/catalogController.js';
import * as admin from '../controllers/adminController.js';
import * as personal from '../controllers/personalController.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ data: { ok: true, service: 'sarkari-saathi-api' } });
});

router.get('/categories', catalog.listCategories);
router.get('/journeys', catalog.listJourneys);
router.get('/journeys/:id', noStore, requireAuth, requirePasswordChangeComplete, catalog.getJourney);
router.get('/journeys/:id/steps', noStore, requireAuth, requirePasswordChangeComplete, catalog.getSteps);
router.get('/journeys/:id/documents', noStore, requireAuth, requirePasswordChangeComplete, catalog.getDocuments);
router.get('/journeys/:id/branches', noStore, requireAuth, requirePasswordChangeComplete, catalog.getBranches);

const authRouter = Router();
authRouter.use(noStore);
authRouter.post('/register', auth.register);
authRouter.post('/login', auth.login);
authRouter.post('/logout', auth.logout);
authRouter.get('/me', requireAuth, auth.me);
authRouter.post('/change-password', requireAuth, auth.changePassword);
router.use('/auth', authRouter);

const me = Router();
me.use(noStore, requireAuth, requirePasswordChangeComplete);
me.get('/journeys', personal.listJourneys);
me.post('/journeys', personal.createJourney);
me.get('/journeys/:id', personal.getJourney);
me.put('/journeys/:id', personal.updateJourney);
me.patch('/journeys/:id/progress', personal.patchProgress);
me.put('/journeys/:id/progress', personal.patchProgress);
me.patch('/journeys/:id/checklist', personal.patchChecklist);
me.put('/journeys/:id/checklist', personal.patchChecklist);
me.delete('/journeys/:id', personal.deleteJourney);
me.post('/journeys/:id/restore', personal.restoreJourney);
me.get('/abroad', personal.getAbroad);
me.put('/abroad', personal.putAbroad);
me.get('/requests', personal.listUserRequests);
me.post('/requests', personal.createRequest);
me.get('/requests/:id', personal.getUserRequest);
router.use('/me', me);

const adminRouter = Router();
adminRouter.use(noStore, requireAuth, requirePasswordChangeComplete, requireAdmin);
adminRouter.get('/users/overview', admin.getUserOverview);
adminRouter.post('/users/:userId/temporary-password', admin.resetUserPassword);
adminRouter.delete('/users/:userId', admin.deleteUser);
adminRouter.get('/journeys', admin.listJourneys);
adminRouter.post('/journeys', admin.createJourney);
adminRouter.get('/journeys/:id', admin.getJourney);
adminRouter.put('/journeys/:id', admin.updateJourney);
adminRouter.patch('/journeys/:id/status', admin.setStatus);
adminRouter.delete('/journeys/:id', admin.deleteJourney);
adminRouter.get('/journeys/:id/verifications', admin.listVerifications);
adminRouter.get('/categories', admin.listCategories);
adminRouter.post('/categories', admin.createCategory);
adminRouter.patch('/categories/:id', admin.updateCategory);
adminRouter.delete('/categories/:id', admin.removeCategory);
adminRouter.get('/requests', admin.listRequests);
adminRouter.get('/requests/:id', admin.getRequest);
adminRouter.patch('/requests/:id', admin.updateRequest);
router.use('/admin', adminRouter);

export default router;
