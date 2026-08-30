import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route } from "react-router-dom";

import AdminEventNotificationBell from "components/AdminEventNotificationBell";
import {
  fetchAdminEventNotifications,
  markAllAdminEventNotificationsRead,
} from "utils/api";

const mockTranslate = (key) => key;
const mockDispatch = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: mockTranslate }),
}));

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) =>
    selector({
      notifications: { count: 2 },
      user: { user: { _id: { $oid: "admin-profile" } } },
    }),
}));

jest.mock("features/notificationsSlice", () => ({
  fetchNotificationsCount: (payload) => ({
    type: "notifications/fetch",
    payload,
  }),
}));

jest.mock("utils/hooks/useAuth", () => ({
  useAuth: () => ({ role: 0 }),
}));

jest.mock("utils/api", () => ({
  fetchAdminEventNotifications: jest.fn(),
  markAllAdminEventNotificationsRead: jest.fn(),
}));

beforeEach(() => {
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
  fetchAdminEventNotifications.mockResolvedValue({
    unread_count: 1,
    notifications: [
      {
        id: "notification-1",
        title: "Event proposal needs review",
        message: "Maya submitted Career workshop for review.",
        link: "/events?tab=review",
        read_at: null,
      },
    ],
  });
  markAllAdminEventNotificationsRead.mockResolvedValue({});
});

test("opening notifications clears proposal alerts without a specific heading", async () => {
  render(
    <MemoryRouter>
      <AdminEventNotificationBell />
    </MemoryRouter>
  );

  fireEvent.click(
    await screen.findByRole("button", {
      name: "events.workflow.reviewNotificationsBell",
    })
  );

  await waitFor(() =>
    expect(markAllAdminEventNotificationsRead).toHaveBeenCalledTimes(1)
  );
  expect(
    screen.queryByText("events.workflow.reviewNotificationsTitle")
  ).toBeNull();
});

test("opens a targeted proposal alert and routes to the review queue", async () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <AdminEventNotificationBell />
      <Route
        path="*"
        render={({ location }) => (
          <span data-testid="location">
            {location.pathname}
            {location.search}
          </span>
        )}
      />
    </MemoryRouter>
  );

  fireEvent.click(
    await screen.findByRole("button", {
      name: "events.workflow.reviewNotificationsBell",
    })
  );
  fireEvent.click(await screen.findByText("Event proposal needs review"));

  await waitFor(() =>
    expect(screen.getByTestId("location").textContent).toBe(
      "/events?tab=review"
    )
  );
});

test("keeps message notifications in the consolidated admin menu", async () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <AdminEventNotificationBell />
      <Route
        path="*"
        render={({ location }) => (
          <span data-testid="location">{location.pathname}</span>
        )}
      />
    </MemoryRouter>
  );

  fireEvent.click(
    await screen.findByRole("button", {
      name: "events.workflow.reviewNotificationsBell",
    })
  );
  fireEvent.click(
    await screen.findByRole("button", { name: /common.messages/ })
  );

  await waitFor(() =>
    expect(screen.getByTestId("location").textContent).toBe("/messages/0")
  );
});
