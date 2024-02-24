const MENTEE_PROFILE_ID = Cypress.env("MENTEE_PROFILE_ID");
const MENTOR_PROFILE_ID = Cypress.env("MENTOR_PROFILE_ID");
const MENTOR_EMAIL = Cypress.env("MENTOR_EMAIL");
const MENTOR_PASSWORD = Cypress.env("MENTOR_PASSWORD");
const MENTEE_EMAIL = Cypress.env("MENTEE_EMAIL");
const MENTEE_PASSWORD = Cypress.env("MENTEE_PASSWORD");

describe("test chat between mentee to mentor", () => {
  it("Login as a Mentee and send a message to metor", () => {
    cy.visit(`/login`);

    cy.get(':nth-child(2) > .ant-card').click();

    cy.get("#email").clear().type(MENTEE_EMAIL);

    cy.get("#password").clear().type(MENTEE_PASSWORD);

    cy.contains("button", "Login").click();

    cy.wait(3000);

    cy.visit(`gallery/1/${MENTOR_PROFILE_ID}`);

    cy.wait(2000);

    cy.get("button.ant-btn.ant-btn-primary").contains("Contact Me").click();

    cy.get("textarea.ant-input")
      .clear()
      .type("I want metorship on the domain of computer scineces");

    cy.get("#Choose\\ Interest\\ Areas").type("Engineering");

    cy.get("#Choose\\ Interest\\ Areas").type("{enter}");

    cy.get("button.contact-me-submit-button").contains("Submit").click();
  });

  // it("Login as a Mentor and send a message to mentee", () => {
  //   cy.visit(`/login`);

  //   cy.get(':nth-child(1) > .ant-card').click();

  //   cy.get("#email").clear().type(MENTOR_EMAIL);

  //   cy.get("#password").clear().type(MENTOR_PASSWORD);

  //   cy.contains("button", "Login").click();
  //   cy.wait(3000);
  //   cy.get(".notifications-section").click();
  //   cy.wait(20000);
  //   cy.get(':nth-child(1) .ant-card-meta-description')
  //   .first().should("contain", "Hey Mentee how are you i hope you will be fine");
  // });
});
