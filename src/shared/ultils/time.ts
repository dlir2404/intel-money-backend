import { Request } from "express";
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import * as quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(quarterOfYear);

export class Time {
    static test() {
        
    }

    static getUserTimeZone(req: Request){
        let timezone = req.headers["x-timezone"];
        if (!timezone) {
            return 'UTC';
        }

        if (Array.isArray(timezone)) {
            return timezone[0];
        }

        return timezone;
    }

    //Todo: review this function later
    static convertToUserTimeZone(date: string, timezone: string): Date {
        return dayjs(date).tz(timezone).toDate();
    }

    static nowWithUserTimeZone(timezone: string) : dayjs.Dayjs {
        return dayjs().tz(timezone);
    }

    static startOfDayWithUserTimeZone(timezone: string) : dayjs.Dayjs {
        return dayjs().tz(timezone).startOf('day');
    }

    static endOfDayWithUserTimeZone(timezone: string) : dayjs.Dayjs {
        return dayjs().tz(timezone).endOf('day');
    }

    static startOfWeekWithUserTimeZone(timezone: string) : dayjs.Dayjs {
        return dayjs().tz(timezone).startOf('week');
    }

    static endOfWeekWithUserTimeZone(timezone: string) : dayjs.Dayjs {
        return dayjs().tz(timezone).endOf('week');
    }

    static startOfMonthWithUserTimeZone(timezone: string) : dayjs.Dayjs {
        return dayjs().tz(timezone).startOf('month');
    }

    static endOfMonthWithUserTimeZone(timezone: string) : dayjs.Dayjs {
        return dayjs().tz(timezone).endOf('month');
    }

    static startOfQuarterWithUserTimeZone(timezone: string) : dayjs.Dayjs {
        return dayjs().tz(timezone).startOf('quarter');
    }

    static endOfQuarterWithUserTimeZone(timezone: string) : dayjs.Dayjs {
        return dayjs().tz(timezone).endOf('quarter');
    }

    static startOfYearWithUserTimeZone(timezone: string) : dayjs.Dayjs {
        return dayjs().tz(timezone).startOf('year');
    }

    static endOfYearWithUserTimeZone(timezone: string) : dayjs.Dayjs {
        return dayjs().tz(timezone).endOf('year');
    }

    //get days between two dates, not include start and end date
    static daysBetween(start: dayjs.Dayjs, end: dayjs.Dayjs): dayjs.Dayjs[] {
        let days: dayjs.Dayjs[] = [];

        for (let i = start.add(1, 'day'); i.isBefore(end); i = i.add(1, 'day')) {
            days.push(i);
        }

        return days;
    }

    static getMonthsRange(start: dayjs.Dayjs, end: dayjs.Dayjs): dayjs.Dayjs[] {
        let months: dayjs.Dayjs[] = [];

        for (let i = start; i.month() <= end.month(); i = i.add(1, 'month')) {
            months.push(i);
        }

        return months;
    }
}