"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
class SessionService {
    constructor() {
        this.sessions = new Map();
        this.SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    }
    createSession(sessionId, phoneNumber) {
        const session = {
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
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        // Clean up expired sessions
        this.cleanupExpiredSessions();
        return session;
    }
    updateSession(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        if (session) {
            Object.assign(session, updates, { lastUpdated: new Date() });
            return session;
        }
        return undefined;
    }
    deleteSession(sessionId) {
        return this.sessions.delete(sessionId);
    }
    cleanupExpiredSessions() {
        const now = new Date();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now.getTime() - session.lastUpdated.getTime() > this.SESSION_TIMEOUT) {
                this.sessions.delete(sessionId);
            }
        }
    }
}
exports.SessionService = SessionService;
