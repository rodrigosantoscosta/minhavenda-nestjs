import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { BusinessException } from '@domain/exceptions/business.exception';
import { ResourceNotFoundException } from '@domain/exceptions/resource-not-found.exception';
import { EntityAlreadyExistsException } from '@domain/exceptions/entity-already-exists.exception';

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { status, message } = this.resolve(exception);

    const body: ErrorBody = {
      statusCode: status,
      error: this.httpStatusText(status),
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }

  // ─── resolution ────────────────────────────────────────────────────────────

  private resolve(exception: unknown): {
    status: number;
    message: string | string[];
  } {
    // Domain exceptions (ordered most-specific → least)
    if (exception instanceof ResourceNotFoundException) {
      return { status: HttpStatus.NOT_FOUND, message: exception.message };
    }

    if (exception instanceof EntityAlreadyExistsException) {
      return { status: HttpStatus.CONFLICT, message: exception.message };
    }

    if (exception instanceof BusinessException) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: exception.message,
      };
    }

    // NestJS / class-validator validation errors
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const message =
        typeof res === 'object' && res !== null && 'message' in res
          ? (res as Record<string, unknown>).message
          : exception.message;
      return {
        status: exception.getStatus(),
        message: message as string | string[],
      };
    }

    // Unexpected errors — never leak internals
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Ocorreu um erro interno. Tente novamente mais tarde.',
    };
  }

  private httpStatusText(status: number): string {
    const map: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
    };
    return map[status] ?? 'Error';
  }
}
