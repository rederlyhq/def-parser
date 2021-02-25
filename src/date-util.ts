import logger from "./sharedLogger";

// Tested with:
// moment().tz('Asia/Tokyo').format('MM/DD/YYYY [at] hh:mma [GMT]ZZ')
// Result: "02/26/2021 at 04:14am GMT+0900"
// moment().tz('America/New_York').format('MM/DD/YYYY [at] hh:mma [GMT]ZZ')
// Result: "02/25/2021 at 02:14pm GMT-0500"

// Tried an identity operation as well: moment("02/25/2021 at 02:14pm GMT-0500", 'MM/DD/YYYY [at] hh:mma [GMT]ZZ').format('MM/DD/YYYY [at] hh:mma [GMT]ZZ') and input matched output
export const webworkDateFormat = 'MM/DD/YYYY [at] hh:mma [GMT]ZZ';

const annexZeros = (n: number, zeroCount: number): string => {
    let result = n.toString();
    if (result.length < zeroCount) result = `0${result}`;
    return result;
}

const adjustHoursForMilitary = (h: number) => {
    if (h > 12) h -= 12;
    return h;
}

const getNoonAbbreviation = (h: number): string => {
    if (h > 12) return 'pm';
    return 'am';
}

const getTimezone = (timezoneOffset: number): string => {
    const offsetString = annexZeros((Math.abs(timezoneOffset) / 60) * 100, 4);
    return `GMT${timezoneOffset < 0 ? '-' : '+'}${offsetString}`
};

export const formatDateForWebwork = (date: Date) => {
    const day = annexZeros(date.getDate(), 2);
    const month = annexZeros(date.getMonth() + 1, 2);
    const year = date.getFullYear();
    const hours = annexZeros(adjustHoursForMilitary(date.getHours()), 2);
    const minutes = annexZeros(date.getMinutes(), 2);
    const noonAbbreviation = getNoonAbbreviation(date.getHours());
    const timezone = getTimezone(date.getTimezoneOffset());

    return `${month}/${day}/${year} at ${hours}:${minutes}${noonAbbreviation} ${timezone}`;
}

const dateRegex = /(\d\d)\/(\d\d)\/(\d\d\d\d) at (\d\d):(\d\d)(am|pm)\s(.*)\s*/;
const timezoneRegex = /GMT([-+])(\d\d)(\d\d)/;
export const parseWebworkDate = (s: string): Date | null => {
    const regexResult = dateRegex.exec(s);
    if (regexResult !== null) {
        let date = new Date(0);

        // Adjust hours for am/pm
        const ampm = regexResult[6];
        let hours = parseInt(regexResult[4], 10);
        if (ampm === 'pm') {
            hours += 12;
        }

        // Month is 0 based, have to handle underflow
        let month = parseInt(regexResult[1], 10) - 1;
        if (month < 0) month += 12;
        
        date.setMonth(month);
        date.setDate(parseInt(regexResult[2], 10));        
        date.setFullYear(parseInt(regexResult[3], 10));
        date.setHours(hours);        
        date.setMinutes(parseInt(regexResult[5], 10));
        
        const timezone = regexResult[7];
        const timezoneRegexResult = timezoneRegex.exec(timezone);
        if (timezoneRegexResult !== null) {
            const negativeMultiplier = timezoneRegexResult[1] === '-' ? -1 : 1;
            const hourOffset = parseInt(timezoneRegexResult[2], 10);
            const minuteOffset = parseInt(timezoneRegexResult[3], 10);

            const totalMillisOffset = (60 * 1000) * (minuteOffset + (hourOffset * 60)) * negativeMultiplier;
            // Add timezone offset
            date = new Date(date.getTime() + totalMillisOffset);
        } else {
            logger.debug(`Couldn't figure timezone adjustment from ${timezone}, using local timezone`);
        }
        return date;
    }
    return null;
}