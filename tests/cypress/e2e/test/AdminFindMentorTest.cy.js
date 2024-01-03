import { AdminLogin } from "../pages/AdminLoginPage";
import { FindMentor } from "../pages/AdminFindMentorPage";
const loginAdmin = new AdminLogin();
const findMentor = new FindMentor();
describe("Find Mentor Page Suite", () => {
  beforeEach("Login To Admin", () => {
    cy.visit("/admin");
    loginAdmin.validCredentials();
  });
  it("Test Filter By Seacrh", () => {
    findMentor.clickFindMentor();
    findMentor.searchByName();
  });
  it("Test Filter By Partner", () => {
    findMentor.clickFindMentor();
    findMentor.selectPartner();
  });
  it("Test Filter By Language", () => {
    findMentor.clickFindMentor();
    findMentor.selectLanguage();
  });
  it("Test Filter By Specialization", () => {
    findMentor.clickFindMentor();
    findMentor.selectSpecialization();
  });
});
