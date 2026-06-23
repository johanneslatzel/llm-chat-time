import { describe, it, expect } from 'vitest';
import { StopwatchPackage } from '../../src/index.js';

describe('StopwatchPackage', () => {
    it('creates 3 tools without pool', () => {
        const pkg = new StopwatchPackage();
        const tools = pkg.tools();
        expect(tools).toHaveLength(3);
        expect(tools[0]!.constructor.name).toBe('StartStopwatchTool');
        expect(tools[1]!.constructor.name).toBe('StopStopwatchTool');
        expect(tools[2]!.constructor.name).toBe('ListStopwatchesTool');
    });
});
