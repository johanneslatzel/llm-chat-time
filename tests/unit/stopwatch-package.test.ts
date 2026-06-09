import { describe, it, expect } from 'vitest';
import { StopwatchPackage } from '../../src/index.js';

describe('StopwatchPackage', () => {
    it('creates tools without pool', () => {
        const pkg = new StopwatchPackage();
        const tools = pkg.tools();
        expect(tools).toHaveLength(7);
        expect(tools[0]!.constructor.name).toBe('CreateStopwatchTool');
        expect(tools[6]!.constructor.name).toBe('RemoveStopwatchTool');
    });
});
