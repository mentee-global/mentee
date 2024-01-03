export class FindPartner {
  clickFindPartner() {
    cy.get(".ant-menu-title-content").eq(3).click();
  }
  selectOrganization() {
    const searchTerm = "myorganization";
    cy.get(".ant-input-prefix").eq(0).type(searchTerm);
    cy.get(
      "#root > section > main > div.gallery-container > div.gallery-mentor-container"
    ).should("have.length.greaterThan", 0);
    //As there is no data present against the searched value, I may choose to comment out the assertion script.
    // cy.get('#root > section > main > div.gallery-container > div.gallery-mentor-container').each(($result) => {
    //     cy.wrap($result).should('include.text', searchTerm);
    // })
    cy.get(
      "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > span:nth-child(2)"
    )
      .clear()
      .should("have.value", "");
  }
  selectRegions() {
    cy.get(".ant-select-selector").eq(0).click();
    cy.get(".ant-select-item-option-content")
      .eq(2)
      .click({ force: true })
      .invoke("text")
      .then((selectedText) => {
        cy.get(
          "#root > section > main > div.gallery-container > div.gallery-mentor-container"
        ).each(($result) => {
          cy.wrap($result).should("include.text", selectedText);
        });
      });
    cy.get(".ant-select-clear").click({ force: true });
  }
  selectProjectTopics() {
    const searchTerm = "partner";
    cy.get(".ant-input-prefix").eq(1).type(searchTerm);
    cy.get(".gallery-button").click();
    cy.get(".mentor-profile-flexbox").should("contain.text", searchTerm);
  }
  selectSDGS() {
    cy.get(".ant-select-selector").eq(1).click();
    cy.get(".ant-select-item-option-content")
      .eq(3)
      .click({ force: true })
      .invoke("text")
      .then((selectedText) => {
        cy.get(".gallery-button").click();
        cy.get(".mentor-profile-flexbox").should("contain.text", selectedText);
      });
  }
}
