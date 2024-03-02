import { GuestLogin } from "../pages/GuestLogin";
import { LoginPage } from "../pages/LoginPage";

const login = new LoginPage();
const guest = new GuestLogin();
describe("Guest Page", () => {
  beforeEach("Log In As Guest", () => {
    cy.visit("/login");
    login.loginGuest();
  });
  it("Find Mentor", () => {
    guest.findMentor();
  });
  it("Find Mentee", () => {
    cy.visit("/mentee-gallery");
    guest.findMentee();
  });
  it("Find Partner", () => {
    cy.visit("/partner-gallery");
    guest.findPartner();
  });
});