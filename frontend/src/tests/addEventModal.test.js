import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import AddEventModal from "components/AddEventModal";
import { ACCOUNT_TYPE } from "utils/consts";

const mockFetchEventAudiencePreview = jest.fn(() =>
  Promise.resolve({ recipient_count: 1, recipient_counts_by_role: {} })
);
const mockSubmitEvent = jest.fn();
const mockUpdateEvent = jest.fn();
let mockAuth;

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock("react-responsive", () => ({
  useMediaQuery: () => false,
}));

jest.mock(
  "antd-img-crop",
  () =>
    ({ children }) =>
      children
);

jest.mock("utils/hooks/useAuth", () => ({
  useAuth: () => mockAuth,
}));

jest.mock("utils/api", () => ({
  createEvent: jest.fn(),
  fetchEventAudiencePreview: (...args) =>
    mockFetchEventAudiencePreview(...args),
  submitEvent: (...args) => mockSubmitEvent(...args),
  updateEvent: (...args) => mockUpdateEvent(...args),
  uploadEventImage: jest.fn(),
}));

const draft = {
  _id: { $oid: "event-id" },
  title: "Community workshop",
  audience_roles: [ACCOUNT_TYPE.MENTOR],
  start_datetime: { $date: "2999-08-31T16:00:00Z" },
  end_datetime: { $date: "2999-08-31T17:00:00Z" },
  description: "Workshop summary",
  status: "draft",
};

beforeEach(() => {
  mockAuth = {
    role: ACCOUNT_TYPE.MENTOR,
    isAdmin: false,
    isMentor: true,
    isMentee: false,
    isPartner: false,
  };
  mockUpdateEvent.mockResolvedValue({
    data: { result: { event: draft } },
  });
  mockFetchEventAudiencePreview.mockResolvedValue({
    recipient_count: 1,
    recipient_counts_by_role: {},
  });
  mockSubmitEvent.mockResolvedValue({
    data: { result: { event: { ...draft, status: "pending_review" } } },
  });
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

test("a mentor saves and submits an event for review in one action", async () => {
  const refresh = jest.fn(() => Promise.resolve());

  render(
    <AddEventModal
      open
      setOpen={jest.fn()}
      event_item={draft}
      refresh={refresh}
    />
  );

  const submitButton = await screen.findByRole("button", {
    name: "events.workflow.submit",
  });
  await waitFor(() => expect(submitButton.disabled).toBe(false));
  fireEvent.click(submitButton);

  await waitFor(() => expect(mockUpdateEvent).toHaveBeenCalledTimes(1));
  expect(mockSubmitEvent).toHaveBeenCalledWith("event-id");
  expect(refresh).toHaveBeenCalledTimes(1);
});

test("a partner save stays on the direct publication path", async () => {
  mockAuth = {
    role: ACCOUNT_TYPE.PARTNER,
    isAdmin: false,
    isMentor: false,
    isMentee: false,
    isPartner: true,
  };

  render(
    <AddEventModal
      open
      setOpen={jest.fn()}
      event_item={draft}
      refresh={jest.fn(() => Promise.resolve())}
    />
  );

  const saveButton = await screen.findByRole("button", {
    name: "events.workflow.saveDraft",
  });
  await waitFor(() => expect(saveButton.disabled).toBe(false));
  fireEvent.click(saveButton);

  await waitFor(() => expect(mockUpdateEvent).toHaveBeenCalledTimes(1));
  expect(mockSubmitEvent).not.toHaveBeenCalled();
});
