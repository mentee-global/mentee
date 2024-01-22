import { I18N_LANGUAGES } from "../../../../frontend/src/utils/consts";
const role1 = 1;
const role2 = 2;
const role3 = 3;
const role4 = 4;
const validMentorEmail = Cypress.env("MENTOR_EMAIL");
const validMenteeEmail = Cypress.env("MENTEE_EMAIL");
const validPartnerEmail = Cypress.env("PARTNER_EMAIL");
const validGuestEmail = Cypress.env("GUEST_EMAIL");
const validMentorPassword = Cypress.env("MENTOR_PASSWORD");
const validMenteePassword = Cypress.env("MENTEE_PASSWORD");
const validPartnerPassword = Cypress.env("PARTNER_PASSWORD");
const validGuestPassword = Cypress.env("GUEST_PASSWORD");

const invalidEmail = "INVALID_EMAIL";
const invalidPassword = "INVALID_PASSWORD";

export class LoginPage {
  users = ["Mentor", "Mentee", "Partner", "Guest"];

  componentExist() {
    cy.url().should("include", "/login");
    cy.get('.ant-steps-item-process > .ant-steps-item-container > .ant-steps-item-content > .ant-steps-item-title')
    .should("be.visible");
    cy.get('.ant-steps-item-process > .ant-steps-item-container > .ant-steps-item-content > .ant-steps-item-title').should("contain.text", "Role");
    cy.get('.ant-steps-item-wait > .ant-steps-item-container > .ant-steps-item-content > .ant-steps-item-title').should("contain.text", "Login");

    cy.get('.css-1c9mpvn > .ant-space').should("be.visible");
    cy.get(':nth-child(1) > .ant-card').should("contain.text", "Mentor");
    cy.get(
      ".ant-space-vertical > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span:nth-child(2)"
    )
      .should("have.attr", "aria-label", "right-circle")
      .and("be.visible");

    cy.get(
      ".anticon-compass"
    ).should("be.visible");
    cy.get(".anticon-compass")
      .should("have.attr", "aria-label", "compass")
      .and("be.visible");
    cy.get(
      ".ant-space-vertical > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span:nth-child(2)"
    ).should("have.attr", "aria-label", "right-circle");

    // cy.get(
    //   "#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(3)"
    // ).should("be.visible");
    cy.get(".anticon-partition")
      .should("have.attr", "aria-label", "partition")
      .and("be.visible");
    cy.get(
      ".ant-space-vertical > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span:nth-child(2)"
    ).should("have.attr", "aria-label", "right-circle");

    cy.get(".anticon-unlock")
      .should("have.attr", "aria-label", "unlock")
      .and("be.visible");
    cy.get(
      ".ant-space-vertical > div:nth-child(4) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span:nth-child(2)"
    ).should("have.attr", "aria-label", "right-circle");
  }
  isFunctional() {
    let mappedUsers = this.users.map((user, id) => {
      cy.get(
        `:nth-child(${
          id + 1
        }) > .ant-card`
      ).click();
      cy.get(".ant-typography").should("contain", user);
      cy.get(".anticon.anticon-check.ant-steps-finish-icon").should(
        "have.attr",
        "aria-label",
        "check"
      );
      cy.get(':nth-child(1) > .ant-row > .ant-form-item-label > .ant-form-item-required').should("have.attr", "for", "email");
      cy.get("#email")
        .should("have.attr", "type", "text")
        .and("have.attr", "aria-required", "true");
      cy.get("#password")
        .should("have.attr", "type", "password")
        .and("have.attr", "aria-required", "true");
        cy.get('div.ant-steps-item:nth-child(1) > div:nth-child(1)')
        .should("have.attr", "role", "button")
        .click();
    });
  }
  changeLanguagePage1() {
    let previousLanguage = {};
    I18N_LANGUAGES.map((language, index) => {
      // Loading the translation
      const translationPath = `${Cypress.config("rootPath")}/public/locales/${
        language.value
      }/translation.json`;
      cy.readFile(translationPath).then((currentLanguage) => {
        if (index == 0) {
          previousLanguage = currentLanguage;
        }
        // Clicking the language
        cy.get(
          ".anticon.anticon-global.ant-dropdown-trigger.css-c1sjzn"
        ).trigger("mouseover");
        cy.contains(
          previousLanguage.languages[language.value.split("-")[0]]
        ).click();
        // Checking the texts
        cy.get(
          ".ant-steps-item-process > .ant-steps-item-container > .ant-steps-item-content > .ant-steps-item-title"
        ).should("contain.text", currentLanguage.common.role);
        cy.get(
          ":nth-child(1) > .ant-card"
        ).should("contain.text", currentLanguage.common.mentor);
        cy.get(
          ":nth-child(2) > .ant-card"
        ).should("contain.text", currentLanguage.common.mentee);
        cy.get(
          ":nth-child(3) > .ant-card"
        ).should("contain.text", currentLanguage.common.partner);
        cy.get(
          ":nth-child(4) > .ant-card"
        ).should("contain.text", currentLanguage.common.guest);
        // Storing previous language details
        previousLanguage = currentLanguage;
      });
    });
  }
  changeLanguagePage2() {
    let previousLanguage = {};
    I18N_LANGUAGES.map((language, index) => {
      // Loading the translation
      const translationPath = `${Cypress.config("rootPath")}/public/locales/${
        language.value
      }/translation.json`;
      cy.readFile(translationPath).then((currentLanguage) => {
        if (index == 0) {
          previousLanguage = currentLanguage;
        }
        console.log(
          "language translate by ",
          previousLanguage.languages[language.value.split("-")[0]]
        );
        // Clicking the language
        cy.get(
          ".anticon.anticon-global.ant-dropdown-trigger.css-c1sjzn"
        ).trigger("mouseover");
        cy.contains(
          previousLanguage.languages[language.value.split("-")[0]]
        ).click();
        // Checking the texts
        cy.get('.ant-steps-item-finish > .ant-steps-item-container > .ant-steps-item-content > .ant-steps-item-title').should("contain.text", currentLanguage.common.role);
        cy.get('.ant-typography').should("contain.text", currentLanguage.common.mentor);
        cy.get(':nth-child(1) > .ant-row > .ant-form-item-label > .ant-form-item-required').should("contain.text", currentLanguage.common.email);
        cy.get(':nth-child(2) > .ant-row > .ant-form-item-label > .ant-form-item-required').should("contain.text", currentLanguage.common.password);
        cy.get('.ant-btn').should("contain.text", currentLanguage.common.login);
        cy.get('a').should("contain.text", currentLanguage.login.forgotPassword);
        // Storing previous language details
        previousLanguage = currentLanguage;
      });
    });
  }
 
  selectUserRole(userRole) {
    const userRoleSelector = `#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-1axsfu3 > div.css-1c9mpvn > div.ant-space.css-1axsfu3.ant-space-vertical.ant-space-gap-row-middle.ant-space-gap-col-middle.css-3w4dbw > div:nth-child(${userRole}) > div`;
    cy.get(userRoleSelector).click();
  }
  fillLoginForm(email, password) {
    cy.get("#email").type(email);
    cy.get("#password").type(password);
  }
  clickLoginButton() {
    cy.get("#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-1axsfu3 > div.css-1c9mpvn > div.css-1j25lv9 > form > div:nth-child(3) > div > div > div > div > button").click();
  }
  verifyUrlContains(expectedUrl) {
    cy.url().should("include", expectedUrl);
  }
  login(userRole, email, password, expectedUrl) {
    this.selectUserRole(userRole);
    this.fillLoginForm(email, password);
    this.clickLoginButton();
    this.verifyUrlContains(expectedUrl);
  }
  loginMentor() {
    this.login(role1, validMentorEmail, validMentorPassword, "/appointments");
  }
  loginMentee() {
    this.login(
      role2,
      validMenteeEmail,
      validMenteePassword,
      "/mentee-appointments"
    );
  }
  loginPartner() {
    this.login(
      role3,
      validPartnerEmail,
      validPartnerPassword,
      "/partner-gallery"
    );
  }
  loginGuest() {
    this.login(role4, validGuestEmail, validGuestPassword, "/gallery");
  }
  invalidCredentialMentor() {
    this.login(role1, invalidEmail, invalidPassword, "/login");
  }
  invalidCredentialMentee() {
    this.login(role2, invalidEmail, invalidPassword, "/login");
  }
  invalidCredentialPartner() {
    this.login(role3, invalidEmail, invalidPassword, "/login");
  }
  invalidCredentialGuest() {
    this.login(role4, invalidEmail, invalidPassword, "/login");
  }
}
