import { MentorDashboard } from "../pages/MentorDashboard";
import { MentorEvent } from "../pages/MentorEvents";
const mentor = new MentorDashboard();
const event = new MentorEvent();
describe("Mentor Dashboard", () => {
  beforeEach("Open Mentor Dashboard", () => {
    cy.visit("/login");
    mentor.loginDashboard();
    cy.wait(3000);
  });
  it("Check the Event Page Functionality", () => {
    mentor.selectEnglish();
    event.isFunctional();
  });
  it("Check the Add Event Modal Functionality", () => {
    mentor.selectEnglish();
    event.addEventFunctional();
  });
  it("Adding New Event", () => {
    mentor.selectEnglish()
    event.addNewEvent();
    cy.wait(2000);
  });

  it("checking that event", () => {
    mentor.selectEnglish()
    event.checkCreatedEvent();
  });
});