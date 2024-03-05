import { LoginPage } from "../pages/LoginPage";
import { ProfilePage } from "../pages/ProfilePage";

const profile = new ProfilePage();
const login = new LoginPage();
describe("Profile Page Test Correct", () => {
  it("should get content of mentor profile div", () => {
    cy.visit("/login");
    login.loginMentor();
    profile.visit();
    profile.getProfileDecorations().should("not.be.empty");
    profile.getContactInfo().should("not.be.empty");
    profile.getEditButton().should("exist").should("be.visible");

    profile
      .getEmailElement()
      .should("exist")
      .should("be.visible")
      .invoke("text")
      .then((text) => {
        expect(text.trim()).to.equal(Cypress.env("MENTOR_EMAIL").trim());
      });
  });
});

describe("Profile Page Test Edit Contact", () => {
  it("should get content of mentor profile div", () => {
    cy.visit("/login");
    login.loginMentor();
    profile.visit();

    cy.get(".mentor-profile-contact-edit")
      .should("exist")
      .should("be.visible")
      .click();

    cy.get("#nest-messages_email")
      .should("exist")
      .should("be.visible")
      .should("have.value", Cypress.env("MENTOR_EMAIL").trim())
      .should("be.enabled");

    cy.get("#nest-messages_phone")
      .should("exist")
      .should("be.visible");

    cy.get("#nest-messages_email_notifications")
      .should("exist")
      .should("be.visible")
      .should("be.enabled");

    cy.get("#nest-messages_text_notifications")
      .should("exist")
      .should("be.visible")
      .should("be.enabled");

    cy.get(
      "#nest-messages > div.mentor-profile-editing-footer > div.mentor-profile-save-container > div > div > div > div > div > button"
    )
      .should("exist")
      .should("be.visible")
      .should("be.enabled")
      .click()
      .wait(2000);
  });
});

describe("Edit Profile Input Tests", () => {
  it("should get content of mentor profile div", () => {
    cy.visit("/login");
    login.loginMentor();
    cy.visit("/profile");

    cy.get(".mentor-profile-button > .ant-btn")
      .should("exist")
      .should("be.visible")
      .should("be.enabled")
      .click();

    cy.get(".ant-upload > .ant-btn")
      .should("exist")
      .should("be.visible")
      .should("be.enabled");

    cy.get("#name").should("exist").should("be.visible").should("be.enabled");

    cy.get("#professional_title")
      .should("exist")
      .should("be.visible")
      .should("be.enabled");

    cy.get("#biography")
      .should("exist")
      .should("be.visible")
      .should("be.enabled");

    cy.get("#offers_in_person")
      .should("exist")
      .should("be.visible");

    cy.get("#offers_group_appointments")
      .should("exist")
      .should("be.visible");

    cy.get("#location")
      .scrollIntoView()
      .should("exist")
      .should("be.visible")
      .should("be.enabled");

    cy.get("#website")
      .should("exist")
      .should("be.visible")
      .should("be.enabled");

    cy.get("#linkedin")
      .should("exist")
      .should("be.visible")
      .should("be.enabled");
  });
});

describe("Edit Profile Save Tests", () => {
  it("should get content of mentor profile div", () => {
    cy.visit("/login");
    login.loginMentor();
    cy.visit("/profile");

    cy.get(".mentor-profile-button > .ant-btn")
      .should("exist")
      .should("be.visible")
      .should("be.enabled")
      .click();

    cy.get("#name").clear().type("Test Name");

    cy.get("#professional_title").clear().type("Test Title");

    cy.get("#biography").clear().type("Test Biography");

    cy.get("#offers_in_person").invoke("attr", "aria-checked", "false");

    cy.get("#offers_group_appointments").invoke(
      "attr",
      "aria-checked",
      "false"
    );

    cy.get("#location").clear().type("Test Location");

    cy.get("#website").clear().type("https://www.youtube.com");

    cy.get("#linkedin").clear().type("https://www.linkedin.com");

    cy.get(
      ":nth-child(14) > .ant-row > .ant-col > .ant-form-item-control-input > .ant-form-item-control-input-content > .ant-btn"
    ).click();

    cy.wait(2000);

    cy.get(
      ".mentor-profile-decorations"
    ).should("have.text", "Test Name");

    cy.get(
      ".mentor-profile-tags-container > :nth-child(1) > :nth-child(2)"
    ).should("have.text", " Test Location ");

    cy.get(
      ".mentor-profile-about"
    ).should("have.text", "Test Biography");

    cy.get(
      ":nth-child(3) > a"
    )
      .should("exist")
      .should("be.visible")
      .should("have.attr", "href", "https://www.youtube.com");

    cy.get(
      ":nth-child(4) > a"
    )
      .should("exist")
      .should("be.visible")
      .should("have.attr", "href", "https://www.linkedin.com");

    cy.get(".mentor-profile-button > .ant-btn").click();

    cy.get("#name").clear().type(Cypress.env("MENTOR_NAME"));

    cy.get("#professional_title").clear().type("IT sdfs");

    cy.get("#biography").clear().type("aaaaa");

    cy.get("#offers_in_person").invoke("attr", "aria-checked", "true");

    cy.get("#offers_group_appointments").invoke("attr", "aria-checked", "true");

    cy.get("#location").clear();

    cy.get("#website").clear().type("http://www.google.com");

    cy.get("#linkedin").clear();

    cy.get(
      ":nth-child(14) > .ant-row > .ant-col > .ant-form-item-control-input > .ant-form-item-control-input-content > .ant-btn"
    ).click();
  });
});
