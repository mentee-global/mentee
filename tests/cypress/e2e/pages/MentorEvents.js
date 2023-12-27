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
        "body > div:nth-child(4) > div > div.ant-modal-wrap > div > div.ant-modal-content > div.ant-modal-body > form > div:nth-child(1) > div > div.ant-col.ant-form-item-control.css-wxm1m1 > div > div > div > div > div"
      )
        .type("{downarrow}")
        .wait(200)
        .type("{enter}")
        .wait(200);
      cy.get(
        "body > div:nth-child(4) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > form:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1)"
      )
        .click({ force: true })
        .type("Sample Event");
      cy.get(
        "body > div:nth-child(4) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > form:nth-child(1) > div:nth-child(3) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)"
      )
        .click()
        .type("2023-12-07{enter}");
      cy.get(
        "body > div:nth-child(4) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > form:nth-child(1) > div:nth-child(3) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)"
      )
        .click()
        .type("1:00 AM{enter}");
      cy.get(
        "body > div:nth-child(4) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > form:nth-child(1) > div:nth-child(4) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)"
      )
        .click()
        .type("2023-12-08{enter}");
      cy.get(
        "body > div:nth-child(4) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > form:nth-child(1) > div:nth-child(4) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)"
      )
        .click()
        .type("7:06 AM{enter}");
      cy.get(
        "body > div:nth-child(4) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > form:nth-child(1) > div:nth-child(5) > div:nth-child(1) > div:nth-child(2)"
      )
        .click()
        .type("testing the add event{enter}");
      cy.get(
        "body > div:nth-child(4) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > form:nth-child(1) > div:nth-child(6) > div:nth-child(1) > div:nth-child(2)"
      )
        .click()
        .type("http://event@mente.com{enter}");
      cy.get(
        "body > div:nth-child(4) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(4) > button:nth-child(2)"
      ).click();
      cy.wait(2000);
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
