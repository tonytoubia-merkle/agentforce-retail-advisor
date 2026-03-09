import type { EventUrgency } from '@/types/customer';

interface ParsedDate {
  date: Date | null;
  relativeText: string;
  urgency: EventUrgency;
}

/**
 * Parse relative time expressions from natural language into actual dates.
 * Supports phrases like "in two weeks", "next month", "tomorrow", etc.
 *
 * @param text The text containing the relative time expression
 * @returns ParsedDate with the calculated date, original text, and urgency
 */
export function parseRelativeDate(text: string): ParsedDate {
  const lowerText = text.toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let date: Date | null = null;
  let relativeText = '';

  // Match patterns for relative time expressions

  // "tomorrow"
  if (/\btomorrow\b/.test(lowerText)) {
    date = new Date(today);
    date.setDate(date.getDate() + 1);
    relativeText = 'tomorrow';
  }

  // "next week" / "in a week"
  else if (/\b(next week|in a week)\b/.test(lowerText)) {
    date = new Date(today);
    date.setDate(date.getDate() + 7);
    relativeText = 'next week';
  }

  // "in X days"
  else if (/\bin (\d+|a|one|two|three|four|five|six|seven) days?\b/.test(lowerText)) {
    const match = lowerText.match(/\bin (\d+|a|one|two|three|four|five|six|seven) days?\b/);
    if (match) {
      const numText = match[1];
      const days = parseNumber(numText);
      date = new Date(today);
      date.setDate(date.getDate() + days);
      relativeText = `in ${numText} day${days > 1 ? 's' : ''}`;
    }
  }

  // "in X weeks" / "X weeks from now"
  else if (/\b(?:in )?(\d+|a|one|two|three|four|five|six) weeks?\b/.test(lowerText)) {
    const match = lowerText.match(/\b(?:in )?(\d+|a|one|two|three|four|five|six) weeks?\b/);
    if (match) {
      const numText = match[1];
      const weeks = parseNumber(numText);
      date = new Date(today);
      date.setDate(date.getDate() + weeks * 7);
      relativeText = `in ${numText} week${weeks > 1 ? 's' : ''}`;
    }
  }

  // "next month" / "in a month"
  else if (/\b(next month|in a month)\b/.test(lowerText)) {
    date = new Date(today);
    date.setMonth(date.getMonth() + 1);
    relativeText = 'next month';
  }

  // "in X months"
  else if (/\bin (\d+|a|one|two|three|four|five|six) months?\b/.test(lowerText)) {
    const match = lowerText.match(/\bin (\d+|a|one|two|three|four|five|six) months?\b/);
    if (match) {
      const numText = match[1];
      const months = parseNumber(numText);
      date = new Date(today);
      date.setMonth(date.getMonth() + months);
      relativeText = `in ${numText} month${months > 1 ? 's' : ''}`;
    }
  }

  // "this weekend"
  else if (/\bthis weekend\b/.test(lowerText)) {
    date = new Date(today);
    const dayOfWeek = date.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
    date.setDate(date.getDate() + daysUntilSaturday);
    relativeText = 'this weekend';
  }

  // "next weekend"
  else if (/\bnext weekend\b/.test(lowerText)) {
    date = new Date(today);
    const dayOfWeek = date.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
    date.setDate(date.getDate() + daysUntilSaturday + 7);
    relativeText = 'next weekend';
  }

  // Calculate urgency based on days until event
  const urgency = calculateUrgency(date);

  return {
    date,
    relativeText,
    urgency,
  };
}

/**
 * Parse number words to integers
 */
function parseNumber(text: string): number {
  const numberWords: Record<string, number> = {
    'a': 1,
    'one': 1,
    'two': 2,
    'three': 3,
    'four': 4,
    'five': 5,
    'six': 6,
    'seven': 7,
  };

  const parsed = numberWords[text.toLowerCase()];
  if (parsed !== undefined) return parsed;

  const num = parseInt(text, 10);
  return isNaN(num) ? 1 : num;
}

/**
 * Calculate urgency bucket based on days until event
 */
function calculateUrgency(date: Date | null): EventUrgency {
  if (!date) return 'No Date';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Immediate';
  if (diffDays <= 7) return 'This Week';
  if (diffDays <= 30) return 'This Month';
  return 'Future';
}

/**
 * Format a Date to ISO date string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Convenience function to extract date info from event description
 * and enrich a MeaningfulEvent with temporal fields
 */
export function enrichEventWithDate(description: string): {
  relativeTimeText?: string;
  eventDate?: string;
  urgency: EventUrgency;
} {
  const parsed = parseRelativeDate(description);

  return {
    relativeTimeText: parsed.relativeText || undefined,
    eventDate: parsed.date ? formatDateISO(parsed.date) : undefined,
    urgency: parsed.urgency,
  };
}
