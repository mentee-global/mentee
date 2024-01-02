import { I18N_LANGUAGES } from "../../../../frontend/src/utils/consts";
const email = Cypress.env("MENTOR_EMAIL");
const password = Cypress.env("MENTOR_PASSWORD");

export class MentorDashboard {
  selectEnglish(){
    cy.get(
      "#root > section > main > header > div.ant-space.css-wxm1m1.ant-space-horizontal.ant-space-align-center > div:nth-child(3)"
    )
      .trigger("mouseover");

    cy.get('.ant-dropdown-menu-title-content')
      .eq(0)
      .click()
  }
  loginDashboard() {
    cy.get(
      "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(1) > div"
    ).click();
    cy.get("#email").type(email);
    cy.get("#password").type(password);
    cy.get(
      "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.css-1j25lv9 > form > div:nth-child(3) > div > div > div > div > button"
    ).click();
    cy.url().should("include", "/appointments");
    cy.wait(3000)
  }
  dashboardFunctionality() {
    cy.get(
      "#root > section > aside > div.ant-layout-sider-children > a"
    ).should("have.attr", "href", "/appointments");
    cy.get(
      "#root > section > aside > div.ant-layout-sider-children > a > svg"
    ).click();
    cy.url().should("include", "/appointments");
    cy.get(
      "#root > section > aside > div.ant-layout-sider-children > ul > li:nth-child(1)"
    ).click();
    cy.url().should("include", "/messages");
    cy.wait(2000);
    cy.get(
      "#root > section > aside > div.ant-layout-sider-children > ul > li:nth-child(3)"
    ).click();
    cy.url().should("include", "/appointments");
    cy.get(
      "#root > section > aside > div.ant-layout-sider-children > ul > li:nth-child(4)"
    ).click();
    cy.url().should("include", "/event");
    cy.get(
      "#root > section > aside > div.ant-layout-sider-children > ul > li:nth-child(5)"
    ).click();
    cy.url().should("include", "/videos");
    cy.get(
      "#root > section > aside > div.ant-layout-sider-children > ul > li:nth-child(6)"
    ).click();
    cy.url().should("include", "/profile");
    cy.get(
      "#root > section > main > header > div.ant-space.css-wxm1m1.ant-space-horizontal.ant-space-align-center > div:nth-child(1) > div > span > span > svg"
    ).trigger("mouseover");
    cy.get(".ant-tooltip-inner")
      .should("have.attr", "role", "tooltip")
      .and("be.visible");
    cy.get(
      "#root > section > main > header > div.ant-space.css-wxm1m1.ant-space-horizontal.ant-space-align-center > div:nth-child(1) > div > span > span > svg"
    ).trigger("mouseout");
    cy.get(
      "#root > section > main > header > div.ant-space.css-wxm1m1.ant-space-horizontal.ant-space-align-center > div:nth-child(4) > span > svg"
    ).trigger("mouseover");
    cy.get(".ant-tooltip-content").and("be.visible");
  }

  changeLanguage() {
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
          "#root > section > main > header > div.ant-space.css-wxm1m1.ant-space-horizontal.ant-space-align-center > div:nth-child(3) > span"
        ).trigger("mouseover");
        cy.contains(
          previousLanguage.languages[language.value.split("-")[0]]
        ).click();
        // Checking the texts
        cy.get(
          "#root > section > aside > div.ant-layout-sider-children > ul > li:nth-child(1)"
        ).should("contain.text", currentLanguage.common.messages);
        cy.get(
          "#root > section > aside > div.ant-layout-sider-children > ul > li:nth-child(2)"
        )
          .should("contain.text", currentLanguage.sidebars.explore)
          .and("contain.text", currentLanguage.navHeader.findMentee);
        cy.get(
          "#root > section > aside > div.ant-layout-sider-children > ul > li:nth-child(3)"
        ).should("contain.text", currentLanguage.sidebars.appointments);
        cy.get(
          "#root > section > aside > div.ant-layout-sider-children > ul > li:nth-child(4)"
        ).should("contain.text", currentLanguage.sidebars.events);
        cy.get(
          "#root > section > aside > div.ant-layout-sider-children > ul > li:nth-child(5)"
        ).should("contain.text", currentLanguage.sidebars.videos);
        cy.get(
          "#root > section > aside > div.ant-layout-sider-children > ul > li:nth-child(6)"
        ).should("contain.text", currentLanguage.sidebars.profile);
        // Storing previous language details
        previousLanguage = currentLanguage;
      });
    });
  }
}
