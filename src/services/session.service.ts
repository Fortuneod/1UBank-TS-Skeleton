// src/services/session.service.ts
import { UserSession } from '../types/ussd.types';

export class SessionService {
  private sessions: Map<string, UserSession> = new Map();
  private readonly SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  createSession(sessionId: string, phoneNumber: string): UserSession {
    const session: UserSession = {
      sessionId,
      phoneNumber,
      currentMenu: 'main',
      previousMenu: '',
      data: {},
      createdAt: new Date(),
      lastUpdated: new Date()
    };
    
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): UserSession | undefined {
    const session = this.sessions.get(sessionId);
    
    // Clean up expired sessions
    this.cleanupExpiredSessions();
    
    return session;
  }

  updateSession(sessionId: string, updates: Partial<UserSession>): UserSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates, { lastUpdated: new Date() });
      return session;
    }
    return undefined;
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now.getTime() - session.lastUpdated.getTime() > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
      }
    }
  }
}