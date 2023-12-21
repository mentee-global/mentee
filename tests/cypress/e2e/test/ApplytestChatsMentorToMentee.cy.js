const MENTEE_PROFILE_ID = Cypress.env("MENTEE_PROFILE_ID");
const MENTOR_PROFILE_ID = Cypress.env("MENTOR_PROFILE_ID");
const MENTOR_EMAIL = Cypress.env("MENTOR_EMAIL");
const MENTOR_PASSWORD = Cypress.env("MENTOR_PASSWORD");
const MENTEE_EMAIL = Cypress.env("MENTEE_EMAIL");
const MENTEE_PASSWORD = Cypress.env("MENTEE_PASSWORD");

describe("Test for chats", () => {
  it("Login as a Mentor and send a message to mentee", () => {
    cy.visit(`/login`);

    cy.get(
      "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(1) > div"
    ).click();

    cy.get("#email").clear().type(MENTOR_EMAIL);

    cy.get("#password").clear().type(MENTOR_PASSWORD);

    cy.wait(3000);

    cy.get(
      ".anticon.anticon-global.ant-dropdown-trigger.css-c1sjzn"
    ).trigger("mouseover");

    cy.contains('span', 'English').click();

    cy.contains("button", "Login").click();

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
    cy.wait(1000);
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
    cy.wait(2000);

    cy.get(
      "#root > section > main > section > aside > div > div.messages-sidebar > div"
    ).click();

    cy.wait(4000);

    cy.get(
      "#root > section > main > section > section > div > div.conversation-content > div.ant-spin-nested-loading.css-wxm1m1 > div > div:nth-child(46) > div > div > div > div"
    ).should("contain", "Hey Mentee how are you i hope you will be fine");

  });
});
