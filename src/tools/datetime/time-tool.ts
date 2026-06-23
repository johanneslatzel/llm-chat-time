import {
    PartialToolResult,
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import prettyMilliseconds from 'pretty-ms';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

export class TimeTool extends Tool {
    constructor() {
        super(
            'time',
            'Returns the current date/time information or calculates a timespan between two ISO 8601 datetimes. ' +
                'With no parameters, returns the current date and time. ' +
                'With "from" only, returns the elapsed time from that datetime until now. ' +
                'With both "from" and "to", returns the timespan between them.',
            new ToolParameters(
                {
                    from: ToolParameterProperty.string(
                        'Start datetime (ISO 8601). Required if "to" is given.'
                    ),
                    to: ToolParameterProperty.string('End datetime (ISO 8601). Requires "from".')
                },
                []
            )
        );
    }

    protected async onExecute(args: Record<string, unknown>): Promise<PartialToolResult> {
        const from = args.from;
        const to = args.to;

        if (from !== undefined && typeof from !== 'string') {
            return { result: 'from must be a string.', status: ResultStatus.Error };
        }
        if (to !== undefined && typeof to !== 'string') {
            return { result: 'to must be a string.', status: ResultStatus.Error };
        }

        if (to !== undefined && from === undefined) {
            return {
                result: 'to requires from to be specified.',
                status: ResultStatus.Error
            };
        }

        if (from !== undefined) {
            const fromDate = new Date(from as string);
            if (isNaN(fromDate.getTime())) {
                return {
                    result: `'${from}' is not a valid ISO 8601 datetime.`,
                    status: ResultStatus.Error
                };
            }

            if (to !== undefined) {
                const toDate = new Date(to as string);
                if (isNaN(toDate.getTime())) {
                    return {
                        result: `'${to}' is not a valid ISO 8601 datetime.`,
                        status: ResultStatus.Error
                    };
                }
                const diff = toDate.getTime() - fromDate.getTime();
                return {
                    result: JSON.stringify(
                        {
                            from: from as string,
                            to: to as string,
                            timespan: prettyMilliseconds(diff)
                        },
                        null,
                        2
                    ),
                    status: ResultStatus.Success
                };
            }

            const elapsed = Date.now() - fromDate.getTime();
            return {
                result: JSON.stringify(
                    {
                        from: from as string,
                        now: new Date().toISOString(),
                        elapsed: prettyMilliseconds(elapsed)
                    },
                    null,
                    2
                ),
                status: ResultStatus.Success
            };
        }

        const now = new Date();
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor(
            (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
            result: JSON.stringify(
                {
                    iso: now.toISOString(),
                    locale: now.toLocaleString(),
                    date: now.toLocaleDateString(),
                    time: now.toLocaleTimeString(),
                    timezone: tz,
                    unix_ms: now.getTime(),
                    year: now.getFullYear(),
                    month: now.getMonth() + 1,
                    month_name: MONTH_NAMES[now.getMonth()],
                    day_of_month: now.getDate(),
                    day_of_week: now.getDay(),
                    day_of_week_name: DAY_NAMES[now.getDay()],
                    day_of_year: dayOfYear,
                    hours: now.getHours(),
                    minutes: now.getMinutes(),
                    seconds: now.getSeconds(),
                    milliseconds: now.getMilliseconds()
                },
                null,
                2
            ),
            status: ResultStatus.Success
        };
    }
}
