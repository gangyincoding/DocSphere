import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  errorResponse(res, `路径 ${req.originalUrl} 不存在`, 404);
};