import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Events from "components/pages/Events";

const mockFetchEvents = jest.fn(() => Promise.resolve([]));
const mockReviewEvent = jest.fn(() => Promise.resolve({}));
const translateWithCount = (key, options) =>
  options?.count === undefined ? key : `${key} (${options.count})`;
let mockTranslate = translateWithCount;
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
  reviewEvent: (...args) => mockReviewEvent(...args),
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
  mockTranslate = translateWithCount;
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

test("shows item counters on member event tabs", async () => {
  mockFetchEvents.mockImplementation((view) =>
    Promise.resolve(
      view === "published"
        ? [
            { _id: { $oid: "published-one" }, title: "Published one" },
            { _id: { $oid: "published-two" }, title: "Published two" },
          ]
        : [{ _id: { $oid: "proposal-one" }, title: "Proposal one" }]
    )
  );

  renderEvents();

  expect(
    await screen.findByRole("tab", {
      name: "events.workflow.published (2)",
    })
  ).not.toBeNull();
  expect(
    await screen.findByRole("tab", {
      name: "events.workflow.proposals (1)",
    })
  ).not.toBeNull();
});

test("shows upcoming events by default and lets the user switch to past events", async () => {
  mockFetchEvents.mockImplementation((view) =>
    Promise.resolve(
      view === "published"
        ? [
            {
              _id: { $oid: "future-event" },
              title: "Future community event",
              start_datetime: "2999-09-01T09:00:00Z",
              end_datetime: "2999-09-01T10:00:00Z",
            },
            {
              _id: { $oid: "past-event" },
              title: "Past community event",
              start_datetime: "2000-09-01T09:00:00Z",
              end_datetime: "2000-09-01T10:00:00Z",
            },
          ]
        : []
    )
  );

  renderEvents();

  expect(await screen.findByText("Future community event")).not.toBeNull();
  expect(screen.queryByText("Past community event")).toBeNull();

  fireEvent.mouseDown(
    screen.getByRole("combobox", {
      name: "events.workflow.dateFilterLabel",
    })
  );
  fireEvent.click(await screen.findByText("events.workflow.pastEvents"));

  expect(await screen.findByText("Past community event")).not.toBeNull();
  expect(screen.queryByText("Future community event")).toBeNull();
});

test("explains the approval process in My Proposals", async () => {
  mockFetchEvents.mockResolvedValue([]);
  const { findByRole, findByText } = renderEvents();

  const proposalsTab = await findByRole("tab", {
    name: "events.workflow.proposals (0)",
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
    name: "events.workflow.reviewQueue (0)",
  });
  expect(reviewTab.getAttribute("aria-selected")).toBe("true");
  expect(
    screen.getByRole("tab", { name: "events.workflow.published (0)" })
  ).not.toBeNull();
  expect(
    screen.getByRole("tab", { name: "events.workflow.archive (0)" })
  ).not.toBeNull();
  expect(
    await screen.findByText("review notification settings")
  ).not.toBeNull();
});

test("limits review actions and opens event details from the row", async () => {
  mockAuth = {
    isAdmin: true,
    isMentor: false,
    isMentee: false,
    isPartner: false,
    isHub: false,
    profileId: "admin-profile",
  };
  mockFetchEvents.mockImplementation((view, status) =>
    Promise.resolve(
      view === "review" && status === undefined
        ? [
            {
              _id: { $oid: "review-event" },
              title: "Review this event",
              description: "Full event summary",
              url: "https://example.com/event",
              status: "pending_review",
              scope_type: "global",
              audience_roles: [1, 2],
              creator: { name: "Event creator" },
              created_at: { $date: "2026-08-30T09:00:00Z" },
              start_datetime: { $date: "2026-09-01T09:00:00Z" },
              end_datetime: { $date: "2026-09-01T10:00:00Z" },
              permissions: { publish: true, review: true, cancel: true },
            },
          ]
        : []
    )
  );

  render(
    <MemoryRouter initialEntries={["/events?tab=review"]}>
      <Events />
    </MemoryRouter>
  );

  const reviewRow = (await screen.findByText("Review this event")).closest(
    "tr"
  );
  expect(
    within(reviewRow).getByRole("button", {
      name: "events.workflow.approve",
    })
  ).not.toBeNull();
  expect(
    within(reviewRow).getByRole("button", {
      name: "events.workflow.reject",
    })
  ).not.toBeNull();
  expect(
    within(reviewRow).queryByRole("button", {
      name: "events.workflow.edit",
    })
  ).toBeNull();
  expect(
    within(reviewRow).queryByRole("button", {
      name: "events.workflow.cancel",
    })
  ).toBeNull();
  expect(
    screen.getByRole("columnheader", { name: "events.workflow.created" })
  ).not.toBeNull();
  expect(within(reviewRow).getByText(/08\/30\/2026/)).not.toBeNull();

  fireEvent.click(reviewRow);

  const details = await screen.findByRole("dialog");
  expect(
    within(details).getByText("events.workflow.eventDetails")
  ).not.toBeNull();
  expect(within(details).getByText("Full event summary")).not.toBeNull();
  expect(within(details).getByText("https://example.com/event")).not.toBeNull();

  fireEvent.click(
    within(details).getByRole("button", { name: "events.workflow.close" })
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

  fireEvent.click(
    within(reviewRow).getByRole("button", {
      name: "events.workflow.reject",
    })
  );

  const rejectionDialog = await screen.findByRole("dialog");
  const rejectButton = within(rejectionDialog).getByRole("button", {
    name: "events.workflow.rejectWithFeedback",
  });
  expect(rejectButton.disabled).toBe(true);
  fireEvent.change(within(rejectionDialog).getByRole("textbox"), {
    target: { value: "Please clarify who this session is for." },
  });
  expect(rejectButton.disabled).toBe(false);
  fireEvent.click(rejectButton);

  await waitFor(() =>
    expect(mockReviewEvent).toHaveBeenCalledWith(
      "review-event",
      "reject",
      "Please clarify who this session is for."
    )
  );
});
