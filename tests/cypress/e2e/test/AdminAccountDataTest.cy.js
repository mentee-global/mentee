import { AdminLogin } from "../pages/AdminLoginPage";
import { AdminAccountData } from "../pages/AdminAccountDataPage";
const loginAdmin = new AdminLogin();
const data = new AdminAccountData();

describe("Admin Account Data Page Test", () => {
  beforeEach("Login To Admin", () => {
    cy.visit("/admin");
    loginAdmin.validCredentials();
  });
  it("Filter By Search Field ", () => {
    data.clickAccountData();
    data.searchByName();
  });
  it("Filter By Role", () => {
    data.filterByRole();
  });
});
