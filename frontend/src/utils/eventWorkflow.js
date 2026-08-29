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
