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
    cy.get(
      ".ant-steps.ant-steps-horizontal.css-wxm1m1.ant-steps-small.ant-steps-label-horizontal"
    ).should("be.visible");
    cy.get(
      "#root > section > main > div > div > div.css-1c9mpvn > div.ant-steps.ant-steps-horizontal.css-wxm1m1.ant-steps-small.ant-steps-label-horizontal > div.ant-steps-item.ant-steps-item-process.ant-steps-item-active > div > div.ant-steps-item-content > div"
    ).should("contain.text", "Role");
    cy.get(
      "#root > section > main > div > div > div.css-1c9mpvn > div.ant-steps.ant-steps-horizontal.css-wxm1m1.ant-steps-small.ant-steps-label-horizontal > div.ant-steps-item.ant-steps-item-wait > div > div.ant-steps-item-content > div"
    ).should("contain.text", "Login");

    cy.get(
      "#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(1)"
    ).should("be.visible");
    cy.get(".anticon.anticon-tool")
      .should("have.attr", "aria-label", "tool")
      .and("be.visible");
    cy.get(
      "#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(1) > div > div > div > div.ant-card-meta-detail > div > div"
    ).should("contain.text", "Mentor");
    cy.get(
      "#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(1) > div > div > div > div.ant-card-meta-detail > div > div > span"
    )
      .should("have.attr", "aria-label", "right-circle")
      .and("be.visible");

    cy.get(
      "#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(2)"
    ).should("be.visible");
    cy.get(".anticon.anticon-compass")
      .should("have.attr", "aria-label", "compass")
      .and("be.visible");
    cy.get(
      "#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(2) > div > div > div > div.ant-card-meta-detail > div > div > span"
    ).should("have.attr", "aria-label", "right-circle");

    cy.get(
      "#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(3)"
    ).should("be.visible");
    cy.get(".anticon.anticon-partition")
      .should("have.attr", "aria-label", "partition")
      .and("be.visible");
    cy.get(
      "#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(3) > div > div > div > div.ant-card-meta-detail > div > div > span"
    ).should("have.attr", "aria-label", "right-circle");

    cy.get(
      "#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(4)"
    ).should("be.visible");
    cy.get(".anticon.anticon-unlock")
      .should("have.attr", "aria-label", "unlock")
      .and("be.visible");
    cy.get(
      "#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(4) > div > div > div > div.ant-card-meta-detail > div > div > span"
    ).should("have.attr", "aria-label", "right-circle");
  }
  isFunctional() {
    let mappedUsers = this.users.map((user, id) => {
      cy.get(
        `#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(${id + 1
        }) > div`
      ).click();
      cy.get(".ant-typography.css-wxm1m1").should("contain", user);
      cy.get(".anticon.anticon-check.ant-steps-finish-icon").should(
        "have.attr",
        "aria-label",
        "check"
      );
      cy.get(
        "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.css-1j25lv9 > form > div:nth-child(1) > div > div.ant-col.ant-form-item-label.css-wxm1m1 > label"
      ).should("have.attr", "for", "email");
      cy.get("#email")
        .should("have.attr", "type", "text")
        .and("have.attr", "aria-required", "true");
      cy.get("#password")
        .should("have.attr", "type", "password")
        .and("have.attr", "aria-required", "true");
      cy.get(
        "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-steps.ant-steps-horizontal.css-wxm1m1.ant-steps-small.ant-steps-label-horizontal > div.ant-steps-item.ant-steps-item-finish > div"
      )
        .should("have.attr", "role", "button")
        .click();
    });
  }
  changeLanguagePage1() {
    let previousLanguage = {};
    I18N_LANGUAGES.map((language, index) => {
      // Loading the translation
      const translationPath = `${Cypress.config("rootPath")}/public/locales/${language.value
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
          "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-steps.ant-steps-horizontal.css-wxm1m1.ant-steps-small.ant-steps-label-horizontal > div.ant-steps-item.ant-steps-item-process.ant-steps-item-active > div > div.ant-steps-item-content > div"
        ).should("contain.text", currentLanguage.common.role);
        cy.get(
          "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(1) > div > div > div > div.ant-card-meta-detail > div > div"
        ).should("contain.text", currentLanguage.common.mentor);
        cy.get(
          "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(2) > div > div > div > div.ant-card-meta-detail > div > div"
        ).should("contain.text", currentLanguage.common.mentee);
        cy.get(
          "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(3) > div > div > div > div.ant-card-meta-detail > div > div"
        ).should("contain.text", currentLanguage.common.partner);
        cy.get(
          "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(4) > div > div > div > div.ant-card-meta-detail > div > div"
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
      const translationPath = `${Cypress.config("rootPath")}/public/locales/${language.value
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
        cy.get(
          "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-steps.ant-steps-horizontal.css-wxm1m1.ant-steps-small.ant-steps-label-horizontal > div.ant-steps-item.ant-steps-item-finish > div > div.ant-steps-item-content > div"
        ).should("contain.text", currentLanguage.common.role);
        cy.get(
          "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.css-1j25lv9 > h2"
        ).should("contain.text", currentLanguage.common.mentor);
        cy.get(
          "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.css-1j25lv9 > form > div:nth-child(1) > div > div.ant-col.ant-form-item-label.css-wxm1m1 > label"
        ).should("contain.text", currentLanguage.common.email);
        cy.get(
          "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.css-1j25lv9 > form > div:nth-child(2) > div > div.ant-col.ant-form-item-label.css-wxm1m1 > label"
        ).should("contain.text", currentLanguage.common.password);
        cy.get(
          "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.css-1j25lv9 > form > div:nth-child(3) > div > div > div > div > button"
        ).should("contain.text", currentLanguage.common.login);
        cy.get(
          "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.css-1j25lv9 > form > div:nth-child(3) > div > div > div > div > a"
        ).should("contain.text", currentLanguage.login.forgotPassword);
        // Storing previous language details
        previousLanguage = currentLanguage;
      });
    });
  }
  selectUserRole(userRole) {
    const userRoleSelector = `#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(${userRole}) > div`;
    cy.get(userRoleSelector).click();
  }
  fillLoginForm(email, password) {
    cy.get("#email").type(email);
    cy.get("#password").type(password);
  }
  clickLoginButton() {
    cy.get(".ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg").click();
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
    this.login(
      role1,
      validMentorEmail,
      validMentorPassword,
      "/appointments");
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
    this.login(role4,
      validGuestEmail,
      validGuestPassword,
      "/gallery");
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
