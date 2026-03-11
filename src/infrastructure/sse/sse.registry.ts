import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

interface SseEntry {
  subject: Subject<MessageEvent>;
  timeoutHandle: ReturnType<typeof setTimeout>;
}

/**
 * Thread-safe registry of SSE subjects per authenticated user.
 * Each user can hold one active SSE connection.
 * Connections are automatically cleaned up after 5 minutes of inactivity.
 */
@Injectable()
export class SseRegistry implements OnModuleDestroy {
  private readonly logger = new Logger(SseRegistry.name);
  private readonly TTL_MS = 5 * 60 * 1000; // 5 min
  private readonly entries = new Map<string, SseEntry>();

  /**
   * Registers (or replaces) an SSE stream for the given user.
   * Returns an Observable the controller can pipe straight into the response.
   */
  register(usuarioId: string): Observable<MessageEvent> {
    this.remove(usuarioId); // close any existing stream

    const subject = new Subject<MessageEvent>();
    const timeoutHandle = setTimeout(() => {
      this.logger.debug(`[SSE] TTL expired for user ${usuarioId}`);
      this.remove(usuarioId);
    }, this.TTL_MS);

    this.entries.set(usuarioId, { subject, timeoutHandle });
    this.logger.log(
      `[SSE] Registered user ${usuarioId} | active: ${this.entries.size}`,
    );

    return subject.asObservable();
  }

  /**
   * Pushes a named event to the user's SSE stream.
   * Silently discarded when the user is not connected.
   */
  sendEvent(usuarioId: string, eventName: string, data: unknown): void {
    const entry = this.entries.get(usuarioId);
    if (!entry) {
      this.logger.debug(
        `[SSE] No active stream for user ${usuarioId} — event '${eventName}' discarded`,
      );
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
    const messageEvent = new MessageEvent(eventName, { data });
    entry.subject.next(messageEvent);
    this.logger.log(`[SSE] Event '${eventName}' sent to user ${usuarioId}`);
  }

  /**
   * Closes and removes the user's SSE stream.
   */
  remove(usuarioId: string): void {
    const entry = this.entries.get(usuarioId);
    if (!entry) return;

    clearTimeout(entry.timeoutHandle);
    entry.subject.complete();
    this.entries.delete(usuarioId);
    this.logger.debug(`[SSE] Removed stream for user ${usuarioId}`);
  }

  activeConnections(): number {
    return this.entries.size;
  }

  onModuleDestroy(): void {
    for (const [id] of this.entries) {
      this.remove(id);
    }
  }
}
