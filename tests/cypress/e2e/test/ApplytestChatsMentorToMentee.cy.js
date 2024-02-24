const MENTEE_PROFILE_ID = Cypress.env("MENTEE_PROFILE_ID");
const MENTOR_PROFILE_ID = Cypress.env("MENTOR_PROFILE_ID");
const MENTOR_EMAIL = Cypress.env("MENTOR_EMAIL");
const MENTOR_PASSWORD = Cypress.env("MENTOR_PASSWORD");
const MENTEE_EMAIL = Cypress.env("MENTEE_EMAIL");
const MENTEE_PASSWORD = Cypress.env("MENTEE_PASSWORD");

describe("Test for chats", () => {
  it.only("Login as a Mentor and send a message to mentee", () => {
    cy.visit(`/login`);
   
    cy.get(':nth-child(1) > .ant-card').click();

    cy.get("#email").clear().type(MENTOR_EMAIL);

    cy.get("#password").clear().type(MENTOR_PASSWORD);

    cy.contains("button", "Login").click();

    cy.wait(10000);

    cy.get('.ant-space-gap-row-middle > :nth-child(3)').trigger("mouseover");


    cy.get(".ant-dropdown-menu-title-content").eq(0).click();
    // cy.contains('span', 'English').click();

    //

    cy.wait(1000);

    cy.url().should("include", "/appointments");

    cy.wait(1000);

    cy.visit(`gallery/2/${MENTEE_PROFILE_ID}`);

    cy.wait(1000);

    cy.contains("button", "Send Message").click();

    cy.get("#message")
      .clear()
      .type("Hey Mentee how are you i hope you will be fine");

    cy.get(".ant-modal-footer > .ant-btn-primary").click();
    // cy.wait(1000);
    cy.get('.ant-message-custom-content > :nth-child(2)').should("contain.text", "successfully sent message");
  });

  it("Login as a mentee and test message is recieved or not or test the text in message ", () => {
    cy.visit(`/login`);

    cy.get(
      "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(2) > div"
    ).click();

    cy.get("#email").clear().type(MENTEE_EMAIL);

    cy.get("#password").clear().type(MENTEE_PASSWORD);

    cy.contains("button", "Login").click();

    cy.wait(2000);

    cy.visit(`messages/${MENTOR_PROFILE_ID}?user_type=1`);

    cy.wait(3000);

    cy.get(
      "#root > section > main > section > aside > div > div.messages-sidebar > div > div > div > div > div.ant-card-meta-detail > div.ant-card-meta-description"
    ).should("have.text", "Hey Mentee how are you i hope you will be fine");
  });
});