// import { LoginPage } from "../pages/LoginPage";

// const login = new LoginPage();

// describe("Testing partner page", () => {
//   it("Testing the partner page", () => {
//     cy.visit("/login");
//     login.loginPartner();

//     cy.visit("/profile");

//     cy.get("a.mentor-profile-contact-edit",{timeout:10000}).click();

//     cy.get("#nest-messages_email")
//       .should("exist")
//       .should("be.visible")
//       .should("have.value", Cypress.env("PARTNER_EMAIL").trim())
//       .should("be.enabled");

//     cy.get("#nest-messages_email").clear().type("testEmail@gmail.com");

//     cy.get(
//       ".regular-button"
//     ).click();

//     cy.get("a.mentor-profile-contact-edit", {timeout: 10000}).click();

//     cy.get("#nest-messages_email").clear().type(Cypress.env("PARTNER_EMAIL"));

//     cy.get(
//       ".regular-button"
//     ).click();
//   });
// });

// describe("Testing partner page details", () => {
//   it("Testing the edit profile", () => {
//     cy.visit("/login");
//     login.loginPartner();

//     cy.visit("/profile");
//     cy.get(".ant-btn-primary").contains("Edit Profile").click();

//     cy.get("#organization").clear().type("new briks");

//     cy.get("#person_name").clear().type("dantay mentor test");

//     cy.get(".ant-btn-primary").contains("Save").click();

//     cy.get(
//       ".mentor-profile-name"
//     ).should("contain.text", "new briks");

//     cy.get(
//       ".mentor-specialization-tag"
//     ).first().should("have.text", "S. America");

//     cy.get(
//       ".mentor-profile-about"
//     ).eq(1).should("have.text", "dantay mentor test");
//   });
// });

// describe("Again adding previo details", () => {
//   it("Tesetting the profile", () => {
//     cy.visit("/login");
//     login.loginPartner();

//     cy.visit("/profile");
//     cy.get(".ant-btn-primary").contains("Edit Profile").click();

//     cy.get("#organization").clear().type("Test");

//     cy.get("#person_name").clear().type("reberto murer partner as");

//     cy.get(".ant-btn-primary").contains("Save").click();

//     cy.get(
//       ".mentor-profile-name"
//     ).should("contain.text", "Test");

//     cy.get(
//       ".mentor-profile-about"
//     ).eq(1).should("have.text", "reberto murer partner as");
//   });
// });