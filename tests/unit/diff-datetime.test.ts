import { describe, it, expect } from 'vitest';
import { DiffDateTimeTool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

describe('DiffDateTimeTool', () => {
    it('returns difference in days:HH:mm:ss.ms format', async () => {
        const tool = new DiffDateTimeTool();
        const result = await tool.execute({
            a: '2025-01-15T10:30:00.000Z',
            b: '2025-01-14T10:30:00.000Z'
        });
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('diff_datetime');

        const data = JSON.parse(result.result);
        expect(data.a).toBe('2025-01-15T10:30:00.000Z');
        expect(data.b).toBe('2025-01-14T10:30:00.000Z');
        expect(data.difference).toMatch(/^-?\d+(\.\d+)?(ms|s|m|h|d)(\s+\d+(\.\d+)?(ms|s|m|h|d))*$/);
    });

    it('returns positive difference for a > b', async () => {
        const tool = new DiffDateTimeTool();
        const result = await tool.execute({
            a: '2025-01-15T10:30:00.000Z',
            b: '2025-01-14T10:30:00.000Z'
        });
        const data = JSON.parse(result.result);
        expect(data.difference).toBe('1d');
    });

    it('returns negative difference for a < b', async () => {
        const tool = new DiffDateTimeTool();
        const result = await tool.execute({
            a: '2025-01-14T10:30:00.000Z',
            b: '2025-01-15T10:30:00.000Z'
        });
        const data = JSON.parse(result.result);
        expect(data.difference).toBe('-1d');
    });

    it('returns error for missing a', async () => {
        const tool = new DiffDateTimeTool();
        const result = await tool.execute({ b: '2025-01-15T10:30:00.000Z' });
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for missing b', async () => {
        const tool = new DiffDateTimeTool();
        const result = await tool.execute({ a: '2025-01-15T10:30:00.000Z' });
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for invalid a', async () => {
        const tool = new DiffDateTimeTool();
        const result = await tool.execute({ a: 'invalid', b: '2025-01-15T10:30:00.000Z' });
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for invalid b', async () => {
        const tool = new DiffDateTimeTool();
        const result = await tool.execute({ a: '2025-01-15T10:30:00.000Z', b: 'invalid' });
        expect(result.status).toBe(ResultStatus.Error);
    });
});
