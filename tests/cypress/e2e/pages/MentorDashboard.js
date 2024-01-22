import { I18N_LANGUAGES } from "../../../../frontend/src/utils/consts";
const email = Cypress.env("MENTOR_EMAIL");
const password = Cypress.env("MENTOR_PASSWORD");

export class MentorDashboard {
  selectEnglish() {
    cy.get(
      "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > main > header > div.ant-space.css-1axsfu3.ant-space-horizontal.ant-space-align-center.ant-space-gap-row-middle.ant-space-gap-col-middle > div:nth-child(3)"
    ).trigger("mouseover");

    cy.get(".ant-dropdown-menu-title-content").eq(0).click();
  }
  loginDashboard() {
    cy.get(
      ':nth-child(1) > .ant-card'
    ).click();
    cy.get("#email").type(email);
    cy.get("#password").type(password);
    cy.get(
      ".ant-btn"
    ).click();
    cy.url().should("include", "/appointments");
    cy.wait(3000);
  }
  dashboardFunctionality() {
    // cy.get(
    //   "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > aside > div.ant-layout-sider-children > ul > li.ant-menu-item.ant-menu-item-selected" //issue here
    // ).should("have.attr", "href", "/appointments");
    cy.get(
      ".css-rbnp0o"
    ).click();
    cy.url().should("include", "/appointments");
    cy.get(
      "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > aside > div.ant-layout-sider-children > ul > li:nth-child(1)"
    ).click();
    cy.url().should("include", "/messages");
    cy.wait(2000);
    // cy.get(
    //   ".css-rbnp0o"
    // ).click();
    // cy.url().should("include", "/appointments");
    cy.get(
      "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > aside > div.ant-layout-sider-children > ul > li:nth-child(4)"
    ).click();
    cy.url().should("include", "/event");
    cy.get(
      "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > aside > div.ant-layout-sider-children > ul > li:nth-child(5)"
    ).click();
    cy.url().should("include", "/videos");
    cy.get(
      "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > aside > div.ant-layout-sider-children > ul > li:nth-child(6)"
    ).click();
    cy.url().should("include", "/profile");
    cy.get(
      "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > main > header > div.ant-space.css-1axsfu3.ant-space-horizontal.ant-space-align-center.ant-space-gap-row-middle.ant-space-gap-col-middle > div:nth-child(1)"
    ).trigger("mouseover");
    cy.get(".ant-tooltip-inner")
      .should("have.attr", "role", "tooltip")
      .and("be.visible");
    cy.get(
      "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > main > header > div.ant-space.css-1axsfu3.ant-space-horizontal.ant-space-align-center.ant-space-gap-row-middle.ant-space-gap-col-middle > div:nth-child(1)"
    ).trigger("mouseout");
    cy.get(
      "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > main > header > div.ant-space.css-1axsfu3.ant-space-horizontal.ant-space-align-center.ant-space-gap-row-middle.ant-space-gap-col-middle > div:nth-child(4)"
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
          "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > main > header > div.ant-space.css-1axsfu3.ant-space-horizontal.ant-space-align-center.ant-space-gap-row-middle.ant-space-gap-col-middle > div:nth-child(3) > span > svg"
        ).trigger("mouseover");
        cy.contains(
          previousLanguage.languages[language.value.split("-")[0]]
        ).click();
        // Checking the texts
        cy.get(
          "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > aside > div.ant-layout-sider-children > ul > li:nth-child(1) > span.ant-menu-title-content"
        ).should("contain.text", currentLanguage.common.messages);
        cy.get(
          ".ant-menu-submenu"
        )
          .should("contain.text", currentLanguage.sidebars.explore)
          .and("contain.text", currentLanguage.navHeader.findMentee);
        cy.get(
          "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > aside > div.ant-layout-sider-children > ul > li.ant-menu-item.ant-menu-item-selected > span.ant-menu-title-content"
        ).should("contain.text", currentLanguage.sidebars.appointments);
        cy.get(
          "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > aside > div.ant-layout-sider-children > ul > li:nth-child(4) > span.ant-menu-title-content"
        ).should("contain.text", currentLanguage.sidebars.events);
        cy.get(
          "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > aside > div.ant-layout-sider-children > ul > li:nth-child(5) > span.ant-menu-title-content"
        ).should("contain.text", currentLanguage.sidebars.videos);
        cy.get(
          "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > aside > div.ant-layout-sider-children > ul > li:nth-child(6) > span.ant-menu-title-content"
        ).should("contain.text", currentLanguage.sidebars.profile);
        // Storing previous language details
        previousLanguage = currentLanguage;
      });
    });
  }
}
