import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import EventCard from "components/EventCard";

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({ t: (key) => key }),
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

test("keeps event actions inside the card layout", () => {
  const { container } = render(
    <MemoryRouter>
      <EventCard
        event_item={{
          _id: { $oid: "event-id" },
          title: "Community event",
          creator: { name: "Creator" },
        }}
      />
    </MemoryRouter>
  );

  const card = container.querySelector(".event-card");
  const actions = container.querySelector(".event-card__actions");

  expect(card.contains(actions)).toBe(true);
  expect(
    actions.contains(screen.getByRole("button", { name: "events.view" }))
  ).toBe(true);
});
