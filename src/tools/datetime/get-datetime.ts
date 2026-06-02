import { PartialToolResult, ResultStatus, Tool, ToolParameters } from '@johannes.latzel/llm-chat';

export class GetDateTimeTool extends Tool {
    constructor() {
        super(
            'get_datetime',
            'Returns the current date, time, and timezone. Use this when you need to know what time it is or what day it is.',
            new ToolParameters({})
        );
    }

    protected async onExecute(_args: Record<string, unknown>): Promise<PartialToolResult> {
        const now = new Date();
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor(
            (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
        );
        const dayNames = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday'
        ];
        const monthNames = [
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
                    month_name: monthNames[now.getMonth()],
                    day_of_month: now.getDate(),
                    day_of_week: now.getDay(),
                    day_of_week_name: dayNames[now.getDay()],
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
