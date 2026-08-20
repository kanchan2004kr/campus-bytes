import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiErrorBody } from './api-response';

/** Maps any thrown error to the standard { error: { code, message, details } } envelope. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Something went wrong';
    let details: unknown[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      code = HttpStatus[status] ?? 'ERROR';
      if (typeof resp === 'string') {
        message = resp;
      } else if (resp && typeof resp === 'object') {
        const r = resp as { message?: string | string[]; error?: string };
        if (Array.isArray(r.message)) {
          message = 'Validation failed';
          details = r.message;
        } else {
          message = r.message ?? r.error ?? message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.stack);
    }

    const body: ApiErrorBody = { error: { code, message, ...(details ? { details } : {}) } };
    res.status(status).json(body);
  }
}
