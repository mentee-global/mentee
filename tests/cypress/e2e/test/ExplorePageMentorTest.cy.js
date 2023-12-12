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
  it.only("Check existance of Explore Page", () => {
    explore.componnentExists();
  });
  it.only("Check the functionality of Explore Page", () => {
    explore.isFunctional();
  });
  it.only("Check Filter By Language", () => {
    explore.filterByLanguage();
  });
});
