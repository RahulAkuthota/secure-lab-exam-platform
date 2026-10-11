export function toApiDateTime(localDateTime) {
  if (!localDateTime) return "";

  const date = new Date(localDateTime);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function toLocalDateTimeInput(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}
