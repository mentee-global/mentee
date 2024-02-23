const translationPath = `${Cypress.config(
  "rootPath"
)}/public/locales/en-US/translation.json`;
export class MentorEvent {
  isFunctional() {
    cy.readFile(translationPath).then((currentLanguage) => {
      cy.get(
        "li.ant-menu-item"
      ).eq(4).click();
      cy.get(
        ".gallery-container .ant-btn-primary",{timeout:10000}
      )
        .should("contain.text", currentLanguage.events.addEvent);
      cy.get(
        "input.ant-input"
      )
        .and("have.attr", "placeholder", currentLanguage.gallery.searchByName);
      cy.get(
        ".ant-checkbox-input"
      ).should("have.attr", "type", "checkbox");
      cy.get(
        ".ant-checkbox-input"
      ).should("have.attr", "type", "checkbox");
    });
  }
  addEventFunctional() {
    cy.readFile(translationPath).then((currentLanguage) => {
      cy.get(
        "li.ant-menu-item"
      ).eq(4).click();
      cy.get(
        ".gallery-container .ant-btn-primary",{timeout:10000}
      ).click();
      cy.get(".ant-select-arrow").should("have.attr", "unselectable", "on");
      cy.get(".anticon.anticon-down.ant-select-suffix")
        .should("have.attr", "aria-label", "down")
        .and("have.attr", "role", "img");
      cy.get("#title")
        .should("have.attr", "type", "text")
        .and("have.attr", "placeholder", currentLanguage.events.eventTitle);
      cy.get("#start_date")
        .should("have.attr", "aria-required", "true")
        .and("have.attr", "autocomplete", "off")
        .and("have.attr", "placeholder", currentLanguage.events.startDate);
      cy.get("#start_time")
        .should("have.attr", "aria-required", "true")
        .and("have.attr", "autocomplete", "off")
        .and("have.attr", "placeholder", currentLanguage.events.startTime);
      cy.get("#end_date")
        .should("have.attr", "aria-required", "true")
        .and("have.attr", "autocomplete", "off")
        .and("have.attr", "placeholder", currentLanguage.events.endDate);
      cy.get("#end_time")
        .should("have.attr", "aria-required", "true")
        .and("have.attr", "autocomplete", "off")
        .and("have.attr", "placeholder", currentLanguage.events.endTime);
      cy.get("#description").should("exist");
      cy.get("#url").should("have.attr", "type", "text");
    });
  }
  addNewEvent() {
    cy.readFile(translationPath).then((currentLanguage) => {
      cy.get(
        "li.ant-menu-item"
      ).eq(4).click();
      cy.get(
        ".gallery-container .ant-btn-primary",{timeout:10000}
      ).click();
      cy.get(
        ".ant-select-selector" 
      ).eq(1).click();
      cy.wait(500);
      cy.get(
        ".ant-select-item-option-content"
      ).eq(0).click({force: true});
      cy.wait(1000);
      cy.get(
        ".ant-select-item-option-content"
      ).eq(1).click({force: true});
      cy.wait(3000);
      cy.get('input#title').last().type('Sample Event');


      cy.get(
        ':nth-child(5) > .ant-modal-root > .ant-modal-wrap > .ant-modal > .ant-modal-content > .ant-modal-body > .ant-form > :nth-child(3) > :nth-child(1) > :nth-child(2) > :nth-child(1) > :nth-child(1) > [style="display: inline-block; margin-right: 1em; margin-bottom: 0px;"] > .ant-row > .ant-col > .ant-form-item-control-input > .ant-form-item-control-input-content > .ant-picker'
      )
        .click()
        .type("2023-12-07{enter}");
      cy.get(
        ':nth-child(5) > .ant-modal-root > .ant-modal-wrap > .ant-modal > .ant-modal-content > .ant-modal-body > .ant-form > :nth-child(3) > :nth-child(1) > :nth-child(2) > :nth-child(1) > :nth-child(1) > [style="display: inline-block; margin-bottom: 0px;"] > .ant-row > .ant-col > .ant-form-item-control-input > .ant-form-item-control-input-content > .ant-picker > .ant-picker-input > #start_time'
      )
        .click()
        .type("1:00 AM{enter}");
      cy.get(
        ':nth-child(5) > .ant-modal-root > .ant-modal-wrap > .ant-modal > .ant-modal-content > .ant-modal-body > .ant-form > :nth-child(4) > :nth-child(1) > :nth-child(2) > :nth-child(1) > :nth-child(1) > [style="display: inline-block; margin-right: 1em; margin-bottom: 0px;"] > .ant-row > .ant-col > .ant-form-item-control-input > .ant-form-item-control-input-content > .ant-picker > .ant-picker-input > #end_date'
      )
        .click()
        .type("2023-12-08{enter}");
      cy.get(
        ':nth-child(5) > .ant-modal-root > .ant-modal-wrap > .ant-modal > .ant-modal-content > .ant-modal-body > .ant-form > :nth-child(4) > :nth-child(1) > :nth-child(2) > :nth-child(1) > :nth-child(1) > [style="display: inline-block; margin-bottom: 0px;"] > .ant-row > .ant-col > .ant-form-item-control-input > .ant-form-item-control-input-content > .ant-picker > .ant-picker-input > #end_time'
      )
        .click()
        .type("7:06 AM{enter}");
      cy.get(
        ':nth-child(5) > .ant-modal-root > .ant-modal-wrap > .ant-modal > .ant-modal-content > .ant-modal-body > .ant-form > [style="margin-top: 1em;"] > .ant-row > .ant-form-item-control > .ant-form-item-control-input > .ant-form-item-control-input-content > #description'
      )
        .click()
        .type("testing the add event{enter}");
      cy.get(
        ":nth-child(5) > .ant-modal-root > .ant-modal-wrap > .ant-modal > .ant-modal-content > .ant-modal-body > .ant-form > :nth-child(6) > .ant-row > .ant-form-item-control > .ant-form-item-control-input > .ant-form-item-control-input-content > #url"
      )
        .click()
        .type("http://event@mente.com{enter}");
      cy.get(
        ":nth-child(5) > .ant-modal-root > .ant-modal-wrap > .ant-modal > .ant-modal-content > .ant-modal-footer > .ant-btn-primary"
      ).click();
    });
  }

  checkCreatedEvent() {
    cy.get(
      "li.ant-menu-item"
    ).eq(4).click();

    cy.get(".gallery-header-text > .ant-typography",{timeout:10000})
      .contains("Sample Event")
      .should("exist");

    cy.contains("testing the add event")
      .should("exist");

    cy.get(".css-1jsjdag").each(($div) => {
      cy.wrap($div)
        .find('.ant-btn-primary:contains("Delete")') // Adjust the text content if needed
        .as("deleteButton")
        .click();

      cy.get('.ant-btn-primary.ant-btn-sm:contains("Yes")') // Adjust the text content if needed
        .as("confirmButton")
        .click();
    });
  }
}
