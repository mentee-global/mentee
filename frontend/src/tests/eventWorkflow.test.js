import { eventManagementView, eventSections } from "utils/eventWorkflow";

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
