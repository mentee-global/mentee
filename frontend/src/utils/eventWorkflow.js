export function eventId(event) {
  return event._id.$oid;
}

export function eventSections({
  isAdmin,
  isMentor,
  isMentee,
  isPartner,
  isHub,
}) {
  if (isAdmin) return ["published", "review", "archive"];
  if (isPartner || isHub) return ["published", "community"];
  if (isMentor || isMentee) return ["published", "mine"];
  return ["published"];
}

export function eventManagementView({ isPartner, isHub }) {
  return isPartner || isHub ? "community" : "mine";
}

function eventTime(event, field) {
  const value = event[field];
  const timestamp = new Date(value?.$date || value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function eventMatchesDateFilter(event, dateFilter, now = Date.now()) {
  if (dateFilter === "all") return true;
  const endTime = eventTime(event, "end_datetime");
  const startTime = eventTime(event, "start_datetime");
  const comparisonTime = endTime ?? startTime;
  if (comparisonTime === null) return dateFilter === "upcoming";
  return dateFilter === "past" ? comparisonTime < now : comparisonTime >= now;
}

export function sortEventsForDateFilter(events, dateFilter) {
  const direction = dateFilter === "upcoming" ? 1 : -1;
  return [...events].sort((first, second) => {
    const firstTime = eventTime(first, "start_datetime");
    const secondTime = eventTime(second, "start_datetime");
    if (firstTime === null) return 1;
    if (secondTime === null) return -1;
    return (firstTime - secondTime) * direction;
  });
}

export function sortEventsByCreationDate(events) {
  return [...events].sort((first, second) => {
    const firstTime =
      eventTime(first, "created_at") ?? eventTime(first, "date_submitted") ?? 0;
    const secondTime =
      eventTime(second, "created_at") ??
      eventTime(second, "date_submitted") ??
      0;
    return secondTime - firstTime;
  });
}
