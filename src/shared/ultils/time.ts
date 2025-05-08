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
        let month = 4;
        let year = 2025;
        let tz = 'America/Toronto';

        // let date = new Date(year, month - 1);
        // let day = dayjs(date);
        // console.log(day.startOf('month').toDate())

        // let day2 = day.tz(tz);
        // console.log(day2.startOf('month').toDate())

        let day3 = dayjs().quarter(2).year(2025).tz(tz, true);
        console.log(day3)
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
}