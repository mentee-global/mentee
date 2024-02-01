import { ExplorePage } from "../pages/ExplorePage";
import { LoginPage } from "../pages/LoginPage";

const explore = new ExplorePage("mentee");
const login = new LoginPage();

describe("Explore Page", () => {
  beforeEach("Open Explore Page", () => {
    cy.visit("/login");
    login.loginMentee();
    cy.visit("/gallery");
  });
  it("Check existance of Explore Page", () => {
    explore.componnentExists();
  });
  it("Check the functionality of Explore Page", () => {
    explore.isFunctional();
  });
  it("Check Filter By Specialization", () => {
    explore.filterBySpecializations();
  });
});
