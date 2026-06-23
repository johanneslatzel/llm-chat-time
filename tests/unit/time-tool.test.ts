import { describe, it, expect } from 'vitest';
import { TimeTool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

describe('TimeTool', () => {
    it('returns current datetime when no params given', async () => {
        const tool = new TimeTool();
        const result = (await tool.execute({}))[0]!;
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('time');

        const data = JSON.parse(result.result);
        expect(data.iso).toBeTruthy();
        expect(data.timezone).toBeTruthy();
        expect(typeof data.unix_ms).toBe('number');
        expect(data.year).toBe(new Date().getFullYear());
        expect(data.month).toBeGreaterThanOrEqual(1);
        expect(data.month).toBeLessThanOrEqual(12);
        expect(data.month_name).toBeTruthy();
        expect(data.day_of_week_name).toBeTruthy();
        expect(data.day_of_year).toBeGreaterThanOrEqual(1);
    });

    it('returns consistent date fields without params', async () => {
        const tool = new TimeTool();
        const result = (await tool.execute({}))[0]!;
        const data = JSON.parse(result.result);
        const now = new Date();
        expect(data.hours).toBe(now.getHours());
        expect(data.minutes).toBe(now.getMinutes());
        expect(data.day_of_month).toBe(now.getDate());
        expect(data.day_of_week).toBe(now.getDay());
    });

    it('returns elapsed from given from date to now', async () => {
        const tool = new TimeTool();
        const from = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
        const result = (await tool.execute({ from }))[0]!;
        expect(result.status).toBe(ResultStatus.Success);

        const data = JSON.parse(result.result);
        expect(data.from).toBe(from);
        expect(data.now).toBeTruthy();
        expect(data.elapsed).toMatch(/\d+(\.\d+)?(ms|s|m|h|d)/);
    });

    it('returns timespan when both from and to given', async () => {
        const tool = new TimeTool();
        const result = (await tool.execute({
            from: '2025-01-14T10:30:00.000Z',
            to: '2025-01-15T10:30:00.000Z'
        }))[0]!;
        expect(result.status).toBe(ResultStatus.Success);

        const data = JSON.parse(result.result);
        expect(data.from).toBe('2025-01-14T10:30:00.000Z');
        expect(data.to).toBe('2025-01-15T10:30:00.000Z');
        expect(data.timespan).toBe('1d');
    });

    it('returns error when to given without from', async () => {
        const tool = new TimeTool();
        const result = (await tool.execute({ to: '2025-01-15T10:30:00.000Z' }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toContain('to requires from');
    });

    it('returns error for invalid from', async () => {
        const tool = new TimeTool();
        const result = (await tool.execute({ from: 'invalid' }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for invalid to', async () => {
        const tool = new TimeTool();
        const result = (await tool.execute({ from: '2025-01-14T10:30:00.000Z', to: 'invalid' }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error when from is not a string', async () => {
        const tool = new TimeTool();
        const result = (await tool.execute({ from: 123 }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error when to is not a string', async () => {
        const tool = new TimeTool();
        const result = (await tool.execute({ from: '2025-01-14T10:30:00.000Z', to: 123 }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
    });
});
