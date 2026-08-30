import {
  eventManagementView,
  eventMatchesDateFilter,
  eventSections,
  sortEventsByCreationDate,
  sortEventsForDateFilter,
} from "utils/eventWorkflow";

test("mentors and mentees receive a proposal tab", () => {
  expect(eventSections({ isMentor: true })).toEqual(["published", "mine"]);
  expect(eventSections({ isMentee: true })).toEqual(["published", "mine"]);
});

test("partners and hubs receive a community management tab", () => {
  expect(eventSections({ isPartner: true })).toEqual([
    "published",
    "community",
  ]);
  expect(eventSections({ isHub: true })).toEqual(["published", "community"]);
  expect(eventManagementView({ isPartner: true })).toBe("community");
});

test("admins receive review and archive tabs", () => {
  expect(eventSections({ isAdmin: true })).toEqual([
    "published",
    "review",
    "archive",
  ]);
});

test("published events default cleanly into upcoming and past groups", () => {
  const now = new Date("2026-08-30T12:00:00Z").getTime();
  const ongoing = {
    start_datetime: "2026-08-30T11:00:00Z",
    end_datetime: "2026-08-30T13:00:00Z",
  };
  const past = {
    start_datetime: "2026-08-29T11:00:00Z",
    end_datetime: "2026-08-29T12:00:00Z",
  };

  expect(eventMatchesDateFilter(ongoing, "upcoming", now)).toBe(true);
  expect(eventMatchesDateFilter(ongoing, "past", now)).toBe(false);
  expect(eventMatchesDateFilter(past, "past", now)).toBe(true);
  expect(eventMatchesDateFilter(past, "all", now)).toBe(true);
});

test("upcoming events are sorted nearest first and past events newest first", () => {
  const earlier = { start_datetime: "2026-09-01T09:00:00Z" };
  const later = { start_datetime: "2026-09-02T09:00:00Z" };

  expect(sortEventsForDateFilter([later, earlier], "upcoming")).toEqual([
    earlier,
    later,
  ]);
  expect(sortEventsForDateFilter([earlier, later], "past")).toEqual([
    later,
    earlier,
  ]);
});

test("managed events are sorted by creation date with the latest first", () => {
  const older = { created_at: "2026-08-28T09:00:00Z" };
  const latest = { created_at: { $date: "2026-08-30T09:00:00Z" } };
  const legacy = { date_submitted: "2026-08-29T09:00:00Z" };

  expect(sortEventsByCreationDate([older, latest, legacy])).toEqual([
    latest,
    legacy,
    older,
  ]);
});
