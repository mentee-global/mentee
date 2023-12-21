import { MentorDashboard } from "../pages/MentorDashboard";
import { MentorEvent } from "../pages/MentorEvents";
const mentor = new MentorDashboard();
const event = new MentorEvent();
describe("Mentor Dashboard", () => {
  beforeEach("Open Mentor Dashboard", () => {
    cy.visit("/login");
    mentor.loginDashboard();
  });
  it("Check the Event Page Functionality", () => {
    event.isFunctional();
  });
  it("Check the Add Event Modal Functionality", () => {
    event.addEventFunctional();
  });
  it("Adding New Event", () => {
    event.addNewEvent();
  });

  it("checking that event", () => {
    event.checkCreatedEvent();
  });
});
