//import { describe } from "mocha";

describe("Apply Page", () => {
  beforeEach("Open Apply Page", () => {
    cy.visit("/apply");
  });

  it("should navigate to the correct URL on clicking the anchor tag", () => {
    cy.get(
      "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-1axsfu3 > div.css-1c9mpvn > div > a > div > div:nth-child(2)"
    ).click();

    cy.url().should("include", "/");
  });

  it("Is the apply page Elements visible", () => {
    cy.get("h2.ant-typography").should("have.text", "Apply");
    cy.get("h2.ant-typography").should("be.visible");

    cy.get(':nth-child(1) > .ant-row > .ant-form-item-label > .ant-form-item-required').should("have.text", "Email");
    cy.get('label[for="role"][title="Role"]').should("have.text", "Role");

    cy.get(".ant-btn").should(
      "have.text",
      "Submit"
    );
  });

  it("Is countunue button and steps are correct", () => {
    const userEmail = "test2@example.com";
    cy.get("#email").type(userEmail);
    //checking select fro Mentee
    cy.get(".ant-select-selection-search-input").click();
    cy.contains("Mentee").click();
    cy.get(".ant-select-selection-item").should("have.attr", "title", "Mentee");
    // click submit button
    cy.get(".ant-btn").click();
    cy.get(".ant-select-selection-item").should("be.visible");
    cy.get(".ant-btn").contains(
      "Continue"
    );

    cy.get(
      ".ant-typography"
      ).should("have.text", "Apply");

    cy.get(
      "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-1axsfu3 > div.css-1c9mpvn > div > form > div:nth-child(3) > div > div > div > div > div > div:nth-child(2) > div > div.ant-steps-item-content > div"
      ).should("have.text", "Training");

    cy.get(
      "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-1axsfu3 > div.css-1c9mpvn > div > form > div:nth-child(3) > div > div > div > div > div > div:nth-child(3) > div > div.ant-steps-item-content > div").should("have.text", "Build Profile");

    cy.get(".ant-btn").click({
      force: true,
    });

    cy.url().should("include", "/application-form");
  });

  it("testing Apply for Mentor", () => {
    const userEmail = "test2@example.com";
    cy.get("#email").type(userEmail);
    //checking select fro Mentee
    cy.get(".ant-select-selection-search-input").click();
    cy.contains("Mentor").click();
    cy.get(".ant-select-selection-item").should("have.attr", "title", "Mentor");
    // click submit button
    cy.get(".ant-btn").click();

    cy.get(".ant-btn").contains(
      "Continue"
    );

    cy.get(".ant-btn").click({
      force: true,
    });
  });

  it("If email is improper", () => {
    const userEmail = "testxample.com";
    cy.get("#email").type(userEmail);
    //checking select fro Mentee
    cy.get(".ant-select-selection-search-input").click();
    cy.contains("Mentor").click();
    cy.get(".ant-select-selection-item").should("have.attr", "title", "Mentor");
    // click submit button
    cy.get(".ant-btn").click();

    cy.get(
      'span[role="img"][aria-label="close-circle"].anticon.anticon-close-circle'
    ).should("exist");
  });
});
