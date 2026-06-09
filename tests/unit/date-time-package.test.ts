import { describe, it, expect } from 'vitest';
import { DateTimePackage } from '../../src/index.js';

describe('DateTimePackage', () => {
    it('creates tools without pool', () => {
        const pkg = new DateTimePackage();
        const tools = pkg.tools();
        expect(tools).toHaveLength(2);
        expect(tools[0]!.constructor.name).toBe('GetDateTimeTool');
        expect(tools[1]!.constructor.name).toBe('DiffDateTimeTool');
    });
});
