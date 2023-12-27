import { ExplorePage } from "../pages/ExplorePage";
import { LoginPage } from "../pages/LoginPage";

const explore = new ExplorePage("mentor");
const login = new LoginPage();

describe("Explore Page", () => {
  beforeEach("Open Explore Page", () => {
    cy.visit("/login");
    login.loginMentor();
    cy.visit("/mentee-gallery");
  });
  it("Check existance of Explore Page", () => {
    explore.componnentExists();
  });
  it("Check the functionality of Explore Page", () => {
    explore.isFunctional();
  });
  it("Check Filter By Language", () => {
    explore.filterByLanguage();
  });
});
