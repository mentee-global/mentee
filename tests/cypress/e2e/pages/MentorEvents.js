const translationPath = `${Cypress.config(
  "rootPath"
)}/public/locales/en-US/translation.json`;
export class MentorEvent {
  isFunctional() {
    cy.readFile(translationPath).then((currentLanguage) => {
      cy.get(
        "#root > section > aside > div.ant-layout-sider-children > ul > li:nth-child(4)"
      ).click();
      cy.get(
        "#root > section > main > div.gallery-container > div:nth-child(1) > div > button"
      )
        .should("have.attr", "type", "button")
        .and("contain.text", currentLanguage.events.addEvent);
      cy.get(
        "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > span > input"
      )
        .should("have.attr", "type", "text")
        .and("have.attr", "placeholder", currentLanguage.gallery.searchByName);
      cy.get(
        "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > div > label:nth-child(1) > span.ant-checkbox.css-wxm1m1 > input"
      ).should("have.attr", "type", "checkbox");
      cy.get(
        "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > div > label:nth-child(2) > span.ant-checkbox.css-wxm1m1 > input"
      ).should("have.attr", "type", "checkbox");
    });
  }
  addEventFunctional() {
    cy.readFile(translationPath).then((currentLanguage) => {
      cy.get(
        "#root > section > aside > div.ant-layout-sider-children > ul > li:nth-child(4)"
      ).click();
      cy.get(
        "#root > section > main > div.gallery-container > div:nth-child(1) > div > button"
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
        "#root > section > aside > div.ant-layout-sider-children > ul > li:nth-child(4)"
      )
        .click()
      cy.get(
        "#root > section > main > div.gallery-container > div:nth-child(1) > div > button"
      )
        .click()
      cy.get(
        ':nth-child(5) > .ant-modal-root > .ant-modal-wrap > .ant-modal > .ant-modal-content > .ant-modal-body > .ant-form > :nth-child(1) > .ant-row > .ant-form-item-control > .ant-form-item-control-input > .ant-form-item-control-input-content > .ant-select > .ant-select-selector > .ant-select-selection-overflow'
      )
        .click()
      cy.wait(500)
      cy.get(
        'body > div:nth-child(6) > div > div > div.rc-virtual-list > div.rc-virtual-list-holder > div > div > div.ant-select-item.ant-select-item-option.ant-select-item-option-active > div'
      )
        .click()
      cy.wait(1000)
      cy.get(
        "body > div:nth-child(5) > div > div.ant-modal-wrap > div > div.ant-modal-content > div.ant-modal-body > form > div.ant-form-item.css-wxm1m1.ant-form-item-has-success > div > div.ant-col.ant-form-item-control.css-wxm1m1 > div > div > div > div > div"
      )
        .click()
      cy.get(
        'body > div:nth-child(5) > div > div.ant-modal-wrap > div > div.ant-modal-content > div.ant-modal-body > form > div:nth-child(2) > div > div.ant-col.ant-form-item-control.css-wxm1m1 > div > div'
      )
        .click()
        .type("Sample Event");
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
        ':nth-child(5) > .ant-modal-root > .ant-modal-wrap > .ant-modal > .ant-modal-content > .ant-modal-body > .ant-form > :nth-child(6) > .ant-row > .ant-form-item-control > .ant-form-item-control-input > .ant-form-item-control-input-content > #url'
      )
        .click()
        .type("http://event@mente.com{enter}");
      cy.get(
        ':nth-child(5) > .ant-modal-root > .ant-modal-wrap > .ant-modal > .ant-modal-content > .ant-modal-footer > .ant-btn-primary'
      )
        .click();
    });
  }

  checkCreatedEvent() {
    cy.get(
      "#root > section > aside > div.ant-layout-sider-children > ul > li:nth-child(4)"
    ).click();

    cy.get(".gallery-header-text > .ant-typography")
      .contains("Sample Event")
      .should("exist");

    cy.get(
      "#root > section > main > div.gallery-container > div.gallery-mentor-container > div > div.gallery-card-body > div.gallery-info-section.flex > article > div:nth-child(2)"
    )
      .contains("testing the add event")
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
