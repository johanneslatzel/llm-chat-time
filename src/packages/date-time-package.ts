import { type ToolPackage, type Tool } from '@johannes.latzel/llm-chat';
import { GetDateTimeTool } from '../tools/datetime/get-datetime.js';
import { DiffDateTimeTool } from '../tools/datetime/diff-datetime.js';

/**
 * {@link ToolPackage} that bundles {@link GetDateTimeTool} and {@link DiffDateTimeTool}.
 * No pools required and no {@link ToolPackage.dispose} implementation.
 */
export class DateTimePackage implements ToolPackage {
    private _tools: Tool[];

    constructor() {
        this._tools = [new GetDateTimeTool(), new DiffDateTimeTool()];
    }

    tools(): Tool[] {
        return this._tools;
    }
}
