import { AdminLogin } from "../pages/AdminLoginPage";
const login = new AdminLogin();
describe("Admin Login Page Test", () => {
  beforeEach("Open Admin Login Page", () => {
    cy.visit("/admin");
  });
  it("Should Be Functional", () => {
    login.isFunctional();
  });
  it("Should Change The Language", () => {
    login.languageChange();
  });
  it.only("Should Check Validation For Empty Fields", () => {
    login.emptyFields();
  });
  it("Should Login To Admin Dashboard With Valid-Credentials", () => {
    login.validCredentials();
  });
  it("Should Not Login To Admin Dashboard With Invalid-Credentials", () => {
    login.invalidCredentials();
  });
});
