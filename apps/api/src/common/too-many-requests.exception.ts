import { HttpException, HttpStatus } from '@nestjs/common';

/** 429 helper (Nest has no built-in TooManyRequestsException). */
export class TooManyRequestsException extends HttpException {
  constructor(message = 'Too many requests') {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
