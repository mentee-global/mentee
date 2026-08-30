import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import EventReviewNotificationSettings from "components/EventReviewNotificationSettings";
import {
  fetchEventReviewRecipients,
  updateEventReviewRecipients,
} from "utils/api";

const mockTranslate = (key) => key;

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: mockTranslate }),
}));

jest.mock("utils/api", () => ({
  fetchEventReviewRecipients: jest.fn(),
  updateEventReviewRecipients: jest.fn(),
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
  fetchEventReviewRecipients.mockResolvedValue({
    admins: [
      { id: "admin-1", name: "Ava Admin", email: "ava@example.org" },
      { id: "admin-2", name: "Ben Admin", email: "ben@example.org" },
    ],
    selected_admin_ids: ["admin-1", "admin-2"],
  });
  updateEventReviewRecipients.mockResolvedValue({
    selected_admin_ids: ["admin-1"],
  });
});

test("lets an administrator choose who receives proposal alerts", async () => {
  render(<EventReviewNotificationSettings />);

  const selector = await screen.findByRole("combobox", {
    name: "events.workflow.reviewRecipientsLabel",
  });
  const benSelection = selector
    .closest(".ant-select")
    .querySelector(
      '.ant-select-selection-item[title="Ben Admin (ben@example.org)"]'
    );
  const removeBen = benSelection.querySelector(
    ".ant-select-selection-item-remove"
  );
  fireEvent.mouseDown(removeBen);
  fireEvent.click(removeBen);
  await waitFor(() =>
    expect(
      selector
        .closest(".ant-select")
        .querySelector(
          '.ant-select-selection-item[title="Ben Admin (ben@example.org)"]'
        )
    ).toBeNull()
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "events.workflow.saveReviewRecipients",
    })
  );

  await waitFor(() =>
    expect(updateEventReviewRecipients).toHaveBeenCalledWith(["admin-1"])
  );
});
