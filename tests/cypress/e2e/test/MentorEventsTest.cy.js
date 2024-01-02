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
    mentor.selectEnglish()
    event.isFunctional();
  });
  it("Check the Add Event Modal Functionality", () => {
    mentor.selectEnglish()
    event.addEventFunctional();
  });
  it.only("Adding New Event", () => {
    mentor.selectEnglish()
    event.addNewEvent();
  });

  it("checking that event", () => {
    mentor.selectEnglish()
    event.checkCreatedEvent();
  });
});
