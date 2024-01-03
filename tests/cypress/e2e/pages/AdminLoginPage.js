import { I18N_LANGUAGES } from "../../../../frontend/src/utils/consts";
const validEmail = Cypress.env("ADMIN_EMAIL");
const validPassword = Cypress.env("ADMIN_PASSWORD");
const invalidEmail = "invalidemail@gmail.com";
const invalidPassword = "INVALID_PASSWORD";
const translationPath = `${Cypress.config(
  "rootPath"
)}/public/locales/en-US/translation.json`;
export class AdminLogin {
  isFunctional() {
    cy.readFile(translationPath).then((currentLanguage) => {
      cy.get("#email")
        .should("have.attr", "type", "text")
        .and("have.attr", "aria-required", "true");
      cy.get("#password")
        .should("have.attr", "type", "password")
        .and("have.attr", "aria-required", "true");
      cy.get(
        "#root > section > main > div > div > div.css-1c9mpvn > div > form > div:nth-child(3) > div > div > div > div > button"
      )
        .should("be.enabled")
        .and("have.attr", "type", "submit")
        .and("contain.text", currentLanguage.common.login);
      cy.get(
        "#root > section > main > div > div > div.css-1c9mpvn > div > form > div:nth-child(3) > div > div > div > div > a"
      )
        .should("have.attr", "href", "/forgot-password")
        .and("contain.text", currentLanguage.login.forgotPassword);
    });
  }
  languageChange() {
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
        // Checking The Text
        cy.get(
          "#root > section > main > div > div > div.css-1c9mpvn > div > h2"
        ).should("contain.text", currentLanguage.common.admin);
        cy.get(
          "#root > section > main > div > div > div.css-1c9mpvn > div > form > div:nth-child(1) > div > div.ant-col.ant-form-item-label.css-wxm1m1 > label"
        ).should("have.attr", "title", currentLanguage.common.email);
        cy.get(
          "#root > section > main > div > div > div.css-1c9mpvn > div > form > div:nth-child(2) > div > div.ant-col.ant-form-item-label.css-wxm1m1 > label"
        ).should("have.attr", "title", currentLanguage.common.password);
        cy.get(
          "#root > section > main > div > div > div.css-1c9mpvn > div > form > div:nth-child(3) > div > div > div > div > button"
        ).should("contain.text", currentLanguage.common.login);
        cy.get(
          "#root > section > main > div > div > div.css-1c9mpvn > div > form > div:nth-child(3) > div > div > div > div > a"
        ).should("contain.text", currentLanguage.login.forgotPassword);
        // Storing previous language details
        previousLanguage = currentLanguage;
      });
    });
  }
  loginAdmin(email, password) {
    cy.get("#email").type(email);
    cy.get("#password").type(password);
    cy.get(
      "#root > section > main > div > div > div.css-1c9mpvn > div > form > div:nth-child(3) > div > div > div > div > button"
    ).click();
  }
  emptyFields() {
    cy.get(
      "#root > section > main > div > div > div.css-1c9mpvn > div > form > div:nth-child(3) > div > div > div > div > button"
    ).click();
    cy.get("#email_help > div")
      .should("be.visible")
      .and("contain.text", "Please enter email");
    cy.get("#password_help > div")
      .should("be.visible")
      .and("contain.text", "Please enter password");
  }
  validCredentials() {
    this.loginAdmin(validEmail, validPassword);
    cy.url().should("include", "/account-data");
  }
  invalidCredentials() {
    cy.readFile(translationPath).then((currentLanguage) => {
      this.loginAdmin(invalidEmail, invalidPassword);
      cy.url().should("include", "/admin");
      cy.get("div > div > div > span:nth-child(2)").should(
        "contain.text",
        currentLanguage.loginErrors.incorrectCredentials
      );
    });
  }
}
