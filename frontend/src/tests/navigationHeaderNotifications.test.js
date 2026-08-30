import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import NavigationHeader from "components/NavigationHeader";

jest.mock(
  "antd-img-crop",
  () =>
    ({ children }) =>
      children
);

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock("react-responsive", () => ({
  useMediaQuery: () => false,
}));

jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
  useSelector: (selector) =>
    selector({
      user: {
        role: 0,
        user: {
          _id: { $oid: "admin-profile" },
          name: "Administrator",
          timezone: "UTC",
        },
      },
    }),
}));

jest.mock("utils/hooks/useAuth", () => ({
  useAuth: () => ({ resetRoleState: jest.fn() }),
}));

jest.mock("components/AdminEventNotificationBell", () => () => (
  <button type="button" aria-label="admin notifications" />
));

jest.mock("components/NotificationBell", () => () => (
  <button type="button" aria-label="message notifications" />
));

jest.mock("components/BugReportModal", () => () => null);
jest.mock("components/LanguageDropdown", () => () => null);

jest.mock("features/userSlice", () => ({
  collapse: jest.fn(),
  fetchUser: jest.fn(),
  resetUser: jest.fn(),
}));

jest.mock("utils/auth.service", () => ({
  getLoginPath: jest.fn(),
  logout: jest.fn(),
}));

jest.mock("utils/api", () => ({
  uploadAccountImage: jest.fn(),
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
});

test("admins see one consolidated notification bell", () => {
  render(
    <MemoryRouter>
      <NavigationHeader />
    </MemoryRouter>
  );

  expect(
    screen.getByRole("button", { name: "admin notifications" })
  ).not.toBeNull();
  expect(
    screen.queryByRole("button", { name: "message notifications" })
  ).toBeNull();
});
