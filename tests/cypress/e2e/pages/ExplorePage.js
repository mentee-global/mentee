const waitTime = 500;
export class ExplorePage {
  constructor(role) {
    this.role = role;
  }
  selectEnglish() {
    cy.get(
      "span.ant-dropdown-trigger"
    ).trigger("mouseover");

    cy.get(".ant-dropdown-menu-title-content").eq(0).click();
  }
  componnentExists() {
    cy.url().should(
      "include",
      this.role === "mentor" ? "/mentee-gallery" : "/gallery"
    );

    cy.get(
      ".ant-typography"
    ).eq(0).should("contain.text", "Filter by:");
    cy.get(
      ".ant-typography"
    ).eq(1).should("contain.text", "Partner");
    cy.get(
      ".ant-typography"
    ).eq(2).should("contain.text", "Languages");
    cy.get(
      ".ant-typography"
    ).eq(3).should(
      "contain.text",
      this.role === "mentor" ? "Mentee Interests" : "Specializations"
    );
    cy.get("div.gallery-container").should(
      "be.visible"
    );
    cy.get('.gallery-button', {timeout: 20000}).eq(0).should('have.text', 'View Profile');
    cy.get(
      "input.ant-input"
    ).should("have.attr", "placeholder", "Search by name");
  }

  isFunctional() {
    if (this.role === "mentor") {
      const sampleValues = ["roberto", "ber"];
      sampleValues.forEach((value, index) => {
        cy.get(
          "input.ant-input"
        )
          .type(value)
          .wait(waitTime);
        cy.get(
          "input.ant-input"
        ).should("have.attr", "value", value);
        cy.get(
          ".gallery-card-header"
        ).eq(0).find('.gallery-title-text')
          .invoke("text")
          .then((text) => {
            const val = text.toLowerCase();
            expect(val).to.include(value);
          });
        cy.get(
          "input.ant-input"
        ).clear();
      });
    } else {
      const sampleValues = ["xeh", "ber", "roberto"];
      sampleValues.forEach((value, index) => {
        cy.get(
          ".ant-input"
        )
          .type(value)
          .wait(waitTime);
        cy.get(
          ".ant-input"
        ).should("have.attr", "value", value);
        cy.get(".ant-input").invoke("val").then((inputValue) => {
          const val = inputValue.toLowerCase();
          expect(val).to.include(value.toLowerCase());
        });
      
        cy.get(".ant-input").clear();
      });
    }
  }

  filterByLanguage() {
    cy.get(
      ".ant-select-selector"
    ).eq(1)
      .click()
      .wait(waitTime);
    cy.get("div[title='Bengali']").click();
    cy.get(
      ".gallery-card-body"
    ).eq(0).should("include.text", "Bengali");
  }
  filterBySpecializations() {
    cy.get(
      ".ant-select-selector"
    ).eq(2)
      .click()
      .wait(waitTime);
    cy.get("div.ant-select-item-option[title='Citizenship']", {timeout: 20000}).click();
    cy.get(
      ".gallery-card-body"
    ).eq(0).should("include.text", "Citizenship");
  }
}
