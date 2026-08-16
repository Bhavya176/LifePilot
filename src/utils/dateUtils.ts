export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return dateString;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export function isSameDay(date1Str: string, date2Str: string): boolean {
  return date1Str === date2Str;
}

export function calculateHabitStreak(completedDates: string[]): { currentStreak: number; bestStreak: number } {
  if (!completedDates || completedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const sorted = [...new Set(completedDates)].sort((a, b) => (a > b ? -1 : 1)); // descending
  const today = getTodayString();
  
  // Calculate yesterday date string
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  let currentStreak = 0;
  let checkDate = sorted.includes(today) ? today : sorted.includes(yesterday) ? yesterday : null;

  if (checkDate) {
    let curr = new Date(checkDate);
    while (true) {
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, '0');
      const day = String(curr.getDate()).padStart(2, '0');
      const formatted = `${year}-${month}-${day}`;
      
      if (sorted.includes(formatted)) {
        currentStreak++;
        curr.setDate(curr.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate Best Streak
  const ascSorted = [...new Set(completedDates)].sort();
  let bestStreak = 0;
  let tempStreak = 0;
  let prevTime: number | null = null;

  for (const dateStr of ascSorted) {
    const dateObj = new Date(dateStr);
    const time = dateObj.getTime();
    if (prevTime === null) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((time - prevTime) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    prevTime = time;
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
  }

  return { currentStreak, bestStreak: Math.max(bestStreak, currentStreak) };
}
