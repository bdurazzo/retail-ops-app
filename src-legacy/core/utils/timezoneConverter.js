import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(timezone);
dayjs.extend(utc);

export function convertEDTtoPDT(edtTimeString) {
  if (!edtTimeString) return edtTimeString;
  
  try {
    // Manual parsing to avoid dayjs AM/PM issues
    const match = edtTimeString.match(/^(\d{4}-\d{2}-\d{2}) (\d{1,2}):(\d{2})(am|pm)$/i);
    if (!match) return edtTimeString;
    
    const [, datePart, hourStr, minute, ampm] = match;
    let hour = parseInt(hourStr);
    
    // Convert to 24-hour format
    if (ampm.toLowerCase() === 'pm' && hour !== 12) {
      hour += 12;
    } else if (ampm.toLowerCase() === 'am' && hour === 12) {
      hour = 0;
    }
    
    // Create EDT time in 24-hour format
    const edtDateTime = `${datePart} ${hour.toString().padStart(2, '0')}:${minute}`;
    const edtTime = dayjs.tz(edtDateTime, "America/New_York");
    
    if (!edtTime.isValid()) return edtTimeString;
    
    // Convert to PDT and format back to 12-hour
    const pdtTime = edtTime.tz("America/Los_Angeles");
    return pdtTime.format("MMM, D h:mm A");
    
  } catch (e) {
    console.warn('Failed to convert timezone for:', edtTimeString, e);
    return edtTimeString;
  }
}