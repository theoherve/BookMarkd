const relativeTimeFormatter = new Intl.RelativeTimeFormat("fr", {
  numeric: "auto",
});

const getRelativeTimeUnit = (seconds: number) => {
  const divisions = [
    { amount: 60, unit: "second" as const },
    { amount: 60, unit: "minute" as const },
    { amount: 24, unit: "hour" as const },
    { amount: 7, unit: "day" as const },
    { amount: 4.34524, unit: "week" as const },
    { amount: 12, unit: "month" as const },
    { amount: Number.POSITIVE_INFINITY, unit: "year" as const },
  ];

  let duration = Math.abs(seconds);
  for (const division of divisions) {
    if (duration < division.amount) {
      return {
        value: Math.sign(seconds) * duration,
        unit: division.unit,
      };
    }
    duration /= division.amount;
  }

  return {
    value: Math.sign(seconds) * duration,
    unit: "year" as const,
  };
};

export const formatRelativeTimeFromNow = (dateInput: string | Date) => {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const seconds = (date.getTime() - now.getTime()) / 1000;

  const { value, unit } = getRelativeTimeUnit(seconds);

  return relativeTimeFormatter.format(Math.round(value), unit);
};

