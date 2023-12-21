//import { describe } from "mocha";

describe("Apply Page", () => {
  beforeEach("Open Apply Page", () => {
    cy.visit("/apply");
  });

  it("should navigate to the correct URL on clicking the anchor tag", () => {
    cy.get(
      "a .ant-space.css-wxm1m1.ant-space-horizontal.ant-space-align-center"
    ).click();

    cy.url().should("include", "/");
  });

  it("Is the apply page Elements visible", () => {
    cy.get("h2.ant-typography").should("have.text", "Apply");
    cy.get("div.css-18xafax.css-wxm1m1").should("be.visible");

    cy.get('label[for="email"][title="Email"]').should("have.text", "Email");
    cy.get('label[for="role"][title="Role"]').should("have.text", "Role");

    cy.get(".ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg").should(
      "have.text",
      "Submit"
    );
  });

  it("Is countunue button and steps are correct", () => {
    const userEmail = "test2@example.com";
    cy.get(".ant-input.ant-input-lg.css-wxm1m1").type(userEmail);
    //checking select fro Mentee
    cy.get(".ant-select-selection-search-input").click();
    cy.contains("Mentee").click();
    cy.get(".ant-select-selection-item").should("have.attr", "title", "Mentee");
    // click submit button
    cy.get(".ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg").click();
    cy.get(".ant-form-item.css-wxm1m1").should("be.visible");
    cy.get(".ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg").contains(
      "Continue"
    );

    cy.get(
      "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div > form > div:nth-child(3) > div > div > div > div > div > div.ant-steps-item.ant-steps-item-process.ant-steps-item-active > div > div.ant-steps-item-content > div"
    ).should("have.text", "Apply");

    cy.get(
      "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div > form > div:nth-child(3) > div > div > div > div > div > div:nth-child(2) > div > div.ant-steps-item-content > div"
    ).should("have.text", "Training");

    cy.get(
      "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div > form > div:nth-child(3) > div > div > div > div > div > div:nth-child(3) > div > div.ant-steps-item-content > div"
    ).should("have.text", "Build Profile");

    cy.get(".ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg").click({
      force: true,
    });

    cy.url().should("include", "/application-form");
  });

  it("testing Apply for Mentor", () => {
    const userEmail = "test2@example.com";
    cy.get(".ant-input.ant-input-lg.css-wxm1m1").type(userEmail);
    //checking select fro Mentee
    cy.get(".ant-select-selection-search-input").click();
    cy.contains("Mentor").click();
    cy.get(".ant-select-selection-item").should("have.attr", "title", "Mentor");
    // click submit button
    cy.get(".ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg").click();

    cy.get(".ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg").contains(
      "Continue"
    );

    cy.get(".ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg").click({
      force: true,
    });
  });

  it("If email is improper", () => {
    const userEmail = "testxample.com";
    cy.get(".ant-input.ant-input-lg.css-wxm1m1").type(userEmail);
    //checking select fro Mentee
    cy.get(".ant-select-selection-search-input").click();
    cy.contains("Mentor").click();
    cy.get(".ant-select-selection-item").should("have.attr", "title", "Mentor");
    // click submit button
    cy.get(".ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg").click();

    cy.get(
      'span[role="img"][aria-label="close-circle"].anticon.anticon-close-circle'
    ).should("exist");
  });
});
