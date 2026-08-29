import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Events from "components/pages/Events";

const mockFetchEvents = jest.fn(() => Promise.resolve([]));
let mockTranslate = (key) => key;
let mockAuth = {
  isAdmin: false,
  isMentor: true,
  isMentee: false,
  isPartner: false,
  isHub: false,
  profileId: "mentor-profile",
};

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({ t: mockTranslate }),
}));

jest.mock("utils/i18n", () => ({
  __esModule: true,
  default: { t: (key) => key },
}));

jest.mock("utils/hooks/useAuth", () => ({
  useAuth: () => mockAuth,
}));

jest.mock("utils/api", () => ({
  cancelEvent: jest.fn(),
  fetchAccounts: jest.fn(),
  fetchEventPublicationPreview: jest.fn(),
  fetchEvents: (...args) => mockFetchEvents(...args),
  fetchPartners: jest.fn(),
  publishEvent: jest.fn(),
  reviewEvent: jest.fn(),
  submitEvent: jest.fn(),
}));

jest.mock("components/AddEventModal", () => () => null);
jest.mock("components/EventCard", () => ({ event_item }) => (
  <div>{event_item.title}</div>
));
jest.mock("components/EventReviewNotificationSettings", () => () => (
  <div>review notification settings</div>
));

const renderEvents = () =>
  render(
    <MemoryRouter>
      <Events />
    </MemoryRouter>
  );

beforeEach(() => {
  mockTranslate = (key) => key;
  mockAuth = {
    isAdmin: false,
    isMentor: true,
    isMentee: false,
    isPartner: false,
    isHub: false,
    profileId: "mentor-profile",
  };
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
});

test("a translation update does not reload events", async () => {
  mockFetchEvents.mockResolvedValue([]);
  const { rerender } = renderEvents();

  await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(2));

  mockTranslate = (key) => `updated:${key}`;
  rerender(
    <MemoryRouter>
      <Events />
    </MemoryRouter>
  );

  await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(2));
});

test("shows published events without waiting for proposals", async () => {
  let resolveProposals;
  mockFetchEvents.mockImplementation((view) => {
    if (view === "published") {
      return Promise.resolve([
        {
          _id: { $oid: "published-event" },
          title: "Published event ready first",
        },
      ]);
    }
    return new Promise((resolve) => {
      resolveProposals = resolve;
    });
  });

  const { findByText } = renderEvents();

  expect(await findByText("Published event ready first")).not.toBeNull();

  await act(async () => {
    resolveProposals([]);
  });
});

test("explains the approval process in My Proposals", async () => {
  mockFetchEvents.mockResolvedValue([]);
  const { findByRole, findByText } = renderEvents();

  const proposalsTab = await findByRole("tab", {
    name: "events.workflow.proposals",
  });
  fireEvent.click(proposalsTab);

  expect(
    await findByText("events.workflow.proposalApprovalTitle")
  ).not.toBeNull();
  expect(
    await findByText("events.workflow.proposalApprovalDescription")
  ).not.toBeNull();
});

test("explains community events and directs mentors to appointments", async () => {
  mockFetchEvents.mockResolvedValue([]);
  const { findByRole, findByText } = renderEvents();

  expect(await findByText("events.workflow.purposeTitle")).not.toBeNull();
  expect(await findByText("events.workflow.purposeDescription")).not.toBeNull();
  const appointmentsLink = await findByRole("link", {
    name: "events.workflow.goToAppointments",
  });
  expect(appointmentsLink.getAttribute("href")).toBe("/appointments");
});

test("opens the administrator review queue from the notification link", async () => {
  mockAuth = {
    isAdmin: true,
    isMentor: false,
    isMentee: false,
    isPartner: false,
    isHub: false,
    profileId: "admin-profile",
  };
  mockFetchEvents.mockResolvedValue([]);

  render(
    <MemoryRouter initialEntries={["/events?tab=review"]}>
      <Events />
    </MemoryRouter>
  );

  const reviewTab = await screen.findByRole("tab", {
    name: "events.workflow.reviewQueue",
  });
  expect(reviewTab.getAttribute("aria-selected")).toBe("true");
  expect(
    await screen.findByText("review notification settings")
  ).not.toBeNull();
});
