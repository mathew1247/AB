import { Router } from "express";
import { interviewController } from "../controllers/interview.controller";
import { validateBody, validateParams } from "../middleware/validation.middleware";
import { answerSchema, interviewIdParamSchema, startInterviewSchema } from "../middleware/validation.schemas";

const router = Router();

router.get("/candidates", interviewController.listCandidates);
router.get("/curricula", interviewController.listCurricula);

router.post("/interviews", validateBody(startInterviewSchema), interviewController.start);
router.get(
  "/interviews/:id",
  validateParams(interviewIdParamSchema),
  interviewController.getState,
);
router.post(
  "/interviews/:id/answer",
  validateParams(interviewIdParamSchema),
  validateBody(answerSchema),
  interviewController.answer,
);
router.post(
  "/interviews/:id/end",
  validateParams(interviewIdParamSchema),
  interviewController.end,
);
router.get(
  "/interviews/:id/feedback",
  validateParams(interviewIdParamSchema),
  interviewController.getFeedback,
);

export const interviewRoutes = router;
