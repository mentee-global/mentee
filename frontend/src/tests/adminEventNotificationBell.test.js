import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route } from "react-router-dom";

import AdminEventNotificationBell from "components/AdminEventNotificationBell";
import {
  fetchAdminEventNotifications,
  markAdminEventNotificationRead,
} from "utils/api";

const mockTranslate = (key) => key;

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: mockTranslate }),
}));

jest.mock("utils/api", () => ({
  fetchAdminEventNotifications: jest.fn(),
  markAdminEventNotificationRead: jest.fn(),
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
  markAdminEventNotificationRead.mockResolvedValue({});
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
    expect(markAdminEventNotificationRead).toHaveBeenCalledWith(
      "notification-1"
    )
  );
  await waitFor(() =>
    expect(screen.getByTestId("location").textContent).toBe(
      "/events?tab=review"
    )
  );
});
