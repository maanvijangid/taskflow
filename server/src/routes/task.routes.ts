import { Router } from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  changeStageSchema,
  addActivitySchema,
  addSubTaskSchema,
  taskIdSchema,
  subTaskStatusSchema,
} from '../schemas/task.schema.js';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  changeStage,
  addActivity,
  addSubTask,
  updateSubTaskStatus,
  trashTask,
  restoreTask,
  deleteTask,
  duplicateTask,
  getDashboard,
} from '../controllers/task.controller.js';

const router = Router();

router.use(protectRoute);

router.get('/dashboard', getDashboard);
router.get('/', getTasks);
router.get('/:id', validate(taskIdSchema), getTask);

router.post('/', validate(createTaskSchema), createTask);
router.post('/:id/duplicate', validate(taskIdSchema), duplicateTask);
router.post('/:id/activity', validate(addActivitySchema), addActivity);

router.put('/:id', validate(updateTaskSchema), updateTask);
router.put('/:id/stage', validate(changeStageSchema), changeStage);
router.put('/:id/subtask', validate(addSubTaskSchema), addSubTask);
router.put('/:taskId/subtask/:subTaskId', validate(subTaskStatusSchema), updateSubTaskStatus);

router.put('/:id/trash', validate(taskIdSchema), trashTask);
router.put('/:id/restore', validate(taskIdSchema), restoreTask);
router.delete('/:id', validate(taskIdSchema), deleteTask);

export default router;
