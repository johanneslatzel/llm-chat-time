import {
    PartialToolResult,
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import prettyMilliseconds from 'pretty-ms';

/** Tool that calculates the difference between two ISO 8601 datetime strings. */
export class DiffDateTimeTool extends Tool {
    constructor() {
        super(
            'diff_datetime',
            'Calculates the difference between two ISO 8601 datetime strings (a - b) and returns the result as a human-readable duration (e.g. "1h 30m").',
            new ToolParameters(
                {
                    a: new ToolParameterProperty(
                        'First datetime (ISO 8601 string, e.g. "2025-01-15T10:30:00.000Z").'
                    ),
                    b: new ToolParameterProperty(
                        'Second datetime (ISO 8601 string). Result is a - b.'
                    )
                },
                ['a', 'b']
            )
        );
    }

    /** @inheritdoc */
    protected async onExecute(args: Record<string, unknown>): Promise<PartialToolResult> {
        const a = args.a;
        if (typeof a !== 'string' || !a.trim()) {
            return { result: 'a must be a non-empty ISO 8601 string.', status: ResultStatus.Error };
        }
        const b = args.b;
        if (typeof b !== 'string' || !b.trim()) {
            return { result: 'b must be a non-empty ISO 8601 string.', status: ResultStatus.Error };
        }

        const dateA = new Date(a);
        const dateB = new Date(b);
        if (isNaN(dateA.getTime())) {
            return {
                result: `'${a}' is not a valid ISO 8601 datetime.`,
                status: ResultStatus.Error
            };
        }
        if (isNaN(dateB.getTime())) {
            return {
                result: `'${b}' is not a valid ISO 8601 datetime.`,
                status: ResultStatus.Error
            };
        }

        const diff = dateA.getTime() - dateB.getTime();
        return {
            result: JSON.stringify({ a, b, difference: prettyMilliseconds(diff) }, null, 2),
            status: ResultStatus.Success
        };
    }
}
