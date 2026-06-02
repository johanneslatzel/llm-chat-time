import { describe, it, expect } from 'vitest';
import { GetDateTimeTool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

describe('GetDateTimeTool', () => {
    it('returns JSON with all date/time fields', async () => {
        const tool = new GetDateTimeTool();
        const result = await tool.execute({});
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('get_datetime');

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

    it('returns a reasonable current time', async () => {
        const tool = new GetDateTimeTool();
        const before = Date.now();
        const result = await tool.execute({});
        const after = Date.now();
        const data = JSON.parse(result.result);
        expect(data.unix_ms).toBeGreaterThanOrEqual(before);
        expect(data.unix_ms).toBeLessThanOrEqual(after);
    });

    it('returns consistent date fields', async () => {
        const tool = new GetDateTimeTool();
        const result = await tool.execute({});
        const data = JSON.parse(result.result);
        const now = new Date();
        expect(data.hours).toBe(now.getHours());
        expect(data.minutes).toBe(now.getMinutes());
        expect(data.day_of_month).toBe(now.getDate());
        expect(data.day_of_week).toBe(now.getDay());
    });
});
