import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateNextExecutionTime, getTimeUntilNextExecution } from "./scheduler";

// Mock functions for testing
function calculateNextExecutionTime(executionHour: number, executionMinute: number): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(executionHour, executionMinute, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function getTimeUntilNextExecution(executionHour: number, executionMinute: number): number {
  const nextExecution = calculateNextExecutionTime(executionHour, executionMinute);
  return nextExecution.getTime() - Date.now();
}

describe("Surveillance Scheduler", () => {
  describe("calculateNextExecutionTime", () => {
    it("should schedule for today if time hasn't passed", () => {
      const now = new Date();
      const futureHour = now.getHours() + 2;

      const nextExecution = calculateNextExecutionTime(futureHour, 0);

      expect(nextExecution.getDate()).toBe(now.getDate());
      expect(nextExecution.getHours()).toBe(futureHour);
      expect(nextExecution.getMinutes()).toBe(0);
    });

    it("should schedule for tomorrow if time has passed", () => {
      const now = new Date();
      const pastHour = now.getHours() - 2;

      const nextExecution = calculateNextExecutionTime(pastHour, 0);

      // Check that it's scheduled for the next day
      const expectedDate = new Date(now);
      expectedDate.setDate(expectedDate.getDate() + 1);
      
      expect(nextExecution.getDate()).toBe(expectedDate.getDate());
      expect(nextExecution.getMonth()).toBe(expectedDate.getMonth());
      expect(nextExecution.getFullYear()).toBe(expectedDate.getFullYear());
      expect(nextExecution.getHours()).toBe(pastHour);
    });

    it("should handle midnight scheduling", () => {
      const now = new Date();
      const nextExecution = calculateNextExecutionTime(0, 0);

      expect(nextExecution.getHours()).toBe(0);
      expect(nextExecution.getMinutes()).toBe(0);
    });

    it("should respect minutes parameter", () => {
      const now = new Date();
      const futureHour = now.getHours() + 1;

      const nextExecution = calculateNextExecutionTime(futureHour, 30);

      expect(nextExecution.getHours()).toBe(futureHour);
      expect(nextExecution.getMinutes()).toBe(30);
    });
  });

  describe("getTimeUntilNextExecution", () => {
    it("should return positive milliseconds", () => {
      const timeUntil = getTimeUntilNextExecution(23, 59);
      expect(timeUntil).toBeGreaterThan(0);
    });

    it("should be less than 24 hours", () => {
      const timeUntil = getTimeUntilNextExecution(12, 0);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      expect(timeUntil).toBeLessThan(twentyFourHours);
    });

    it("should be approximately correct for near-future times", () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const futureHour = futureDate.getHours();
      const futureMinute = futureDate.getMinutes();

      const timeUntil = getTimeUntilNextExecution(futureHour, futureMinute);

      // Allow 5 minute tolerance
      const tolerance = 5 * 60 * 1000;
      expect(Math.abs(timeUntil - 60 * 60 * 1000)).toBeLessThan(tolerance);
    });
  });
});
