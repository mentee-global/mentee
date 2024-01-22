export class FindMentor {
  clickFindMentor() {
    cy.get(".ant-menu-title-content").eq(1).click();
  }
  searchByName() {
    const searchTerm = "robert";
    cy.get(".ant-input").type(searchTerm);
    cy.get(".ant-input").should("have.length.greaterThan", 0);
    cy.get(
      "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > main > div.gallery-container > div.gallery-mentor-container"
    ).each(($result) => {
      cy.wrap($result).should("include.text", searchTerm);
    });
    cy.get(
      ".ant-input-affix-wrapper .ant-input"
    ).clear();
  }
  selectPartner() {
    cy.get(".ant-select-selector").eq(0).click();
    cy.get(".rc-virtual-list")
      .eq(0)
      .click()
      .invoke("text")
      .then((selectedText) => {
        cy.get(
          ".ant-select-selection-item"
        ).each(($result) => {
          cy.wrap($result).should("include.text", selectedText);
        });
      });
    cy.get(".ant-select-clear").click({ force: true });
  }
  selectLanguage() {
    cy.get(".ant-select-selector").eq(1).click();
    cy.get(".ant-select-item-option-content")
      .eq(1)
      .click({ force: true })
      .invoke("text")
      .then((selectedText) => {
        cy.get(
          ":nth-child(6) > .ant-select-selector > .ant-select-selection-overflow"
        ).each(($result) => {
          cy.wrap($result).should("include.text", selectedText);
        });
      });
    cy.get(".ant-select-clear").click({ force: true });
  }
  selectSpecialization() {
    cy.get(".ant-select-selector").eq(2).click();
    cy.get(".ant-select-item-option-content")
      .eq(4)
      .click({ force: true })
      .invoke("text")
      .then((selectedText) => {
        cy.get(
          ":nth-child(1) > .ant-select-selection-item > .ant-select-selection-item-content"
        ).each(($result) => {
          cy.wrap($result).should("include.text", selectedText);
        });
      });
    cy.get(".ant-select-clear").click({ force: true });
  }
}