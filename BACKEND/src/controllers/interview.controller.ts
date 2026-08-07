import type { NextFunction, Request, Response } from "express";
import { interviewService } from "../services";
import { candidateService } from "../services";
import { curriculumService } from "../services";

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function wrap(handler: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

export const interviewController = {
  listCandidates: wrap(async (_req, res) => {
    res.json({ success: true, data: { candidates: candidateService.list() } });
  }),

  listCurricula: wrap(async (_req, res) => {
    res.json({ success: true, data: { curricula: curriculumService.list() } });
  }),

  start: wrap(async (req, res) => {
    const result = await interviewService.startInterview(req.body);
    res.status(201).json({ success: true, data: result });
  }),

  getState: wrap(async (req, res) => {
    const data = interviewService.getInterview(req.params.id);
    res.json({ success: true, data });
  }),

  answer: wrap(async (req, res) => {
    const data = await interviewService.submitAnswer({
      interviewId: req.params.id,
      answer: req.body.answer,
    });
    res.json({ success: true, data });
  }),

  end: wrap(async (req, res) => {
    const data = await interviewService.endInterview(req.params.id);
    res.json({ success: true, data });
  }),

  getFeedback: wrap(async (req, res) => {
    const data = interviewService.getFeedback(req.params.id);
    res.json({ success: true, data });
  }),
};
