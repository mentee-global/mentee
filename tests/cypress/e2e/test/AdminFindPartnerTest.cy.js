import { AdminLogin } from "../pages/AdminLoginPage";
import { FindPartner } from "../pages/AdminFindPartnerPage";
const loginAdmin = new AdminLogin();
const findPartner = new FindPartner();
describe("Find Mentor Page Suite", () => {
  beforeEach("Login To Admin", () => {
    cy.visit("/admin");
    loginAdmin.validCredentials();
  });
  it("Test Filter By Organization", () => {
    findPartner.clickFindPartner();
    findPartner.selectOrganization();
  });
  it("Test Filter By Regions", () => {
    findPartner.clickFindPartner();
    findPartner.selectRegions();
  });
  it("Test Filter By Project Topics", () => {
    findPartner.clickFindPartner();
    findPartner.selectProjectTopics();
  });
  it("Test Filter By SDGS", () => {
    findPartner.clickFindPartner();
    findPartner.selectSDGS();
  });
});
