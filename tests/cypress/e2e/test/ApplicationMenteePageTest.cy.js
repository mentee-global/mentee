const adminEmail = Cypress.env("ADMIN_EMAIL");
const adminPassword = Cypress.env("ADMIN_PASSWORD");

describe("testing the Application page of Mentor", () => {
  beforeEach("Open Admin Login Page", () => {
    cy.visit("/admin");

    cy.get("#email").type(adminEmail);
    cy.get("#password").type(adminPassword);
    cy.get(
      "#root > section > main > div > div > div.css-1c9mpvn > div > form > div:nth-child(3) > div > div > div > div > button"
    ).click();
    cy.wait(2000);
    cy.visit("/menteeOrganizer");
  });

  it("checking the visibility of page elements", () => {
    cy.get("#root > section > main > div > div:nth-child(2)").should(
      "have.text",
      "Applications State"
    );

    cy.get("#root > section > main > div > div.btn-dc > button:nth-child(1)")
      .should("have.text", "Mentor Appications")
      .should("not.be.disabled");

    cy.get("#root > section > main > div > div.btn-dc > button:nth-child(2)")
      .should("have.text", "Mentee Appications")
      .should("not.be.disabled");

    cy.get(
      "#root > section > main > div > div:nth-child(4) > div > div > div > div > div > div > table > thead > tr > th:nth-child(1)"
    )
      .should("have.text", "Name")
      .click();

    cy.get(
      "#root > section > main > div > div:nth-child(4) > div > div > div > div > div > div > table > thead > tr > th:nth-child(2)"
    )
      .should("have.text", "Email")
      .click();

    cy.get(
      "#root > section > main > div > div:nth-child(4) > div > div > div > div > div > div > table > thead > tr > th:nth-child(3)"
    )
      .should("have.text", "Notes")
      .click();

    cy.get(
      "#root > section > main > div > div:nth-child(4) > div > div > div > div > div > div > table > thead > tr > th:nth-child(4)"
    )
      .should("have.text", "Application State")
      .click();

    cy.get(
      "#root > section > main > div > div:nth-child(4) > div > div > div > div > div > div > table > thead > tr > th:nth-child(5)"
    )
      .should("have.text", "Full Application")
      .click();

    cy.log("checking does the download files button works or not");

    cy.get(
      "#root > section > main > div > div.btn-dc > button:nth-child(1)"
    ).click();
    cy.wait(2000);
    cy.readFile("cypress/downloads/mentor_applications.xlsx");

    cy.get(
      "#root > section > main > div > div.btn-dc > button:nth-child(2)"
    ).click();
    cy.wait(2000);
    cy.readFile("cypress/downloads/mentee_applications.xlsx");
  });

  it("Checking the sortig of applications", () => {
    cy.wait(2000);

    cy.get(
      " #root > section > main > div > div.ant-select.css-wxm1m1.ant-select-single.ant-select-show-arrow > div > span.ant-select-selection-item"
    ).click();

    cy.get(
      " #root > section > main > div > div.ant-select.css-wxm1m1.ant-select-single.ant-select-show-arrow > div > span.ant-select-selection-item"
    ).type("{downarrow}{downarrow}{downarrow}{downarrow}{enter}");

    cy.wait(1000);

    cy.get(".ant-table-tbody")
      .find("tr")
      .then(($rows) => {
        if ($rows.length > 0) {
          cy.get(".ant-table-tbody")
            .find("tr")
            .each((row, rowIndex) => {
              cy.wrap(row)
                .find("td:eq(3)")
                .find(".ant-select-selection-item")
                .should("have.text", "BuildProfile");
            });
        } else {
          cy.log("Table is empty");
        }
      });

    cy.get(
      " #root > section > main > div > div.ant-select.css-wxm1m1.ant-select-single.ant-select-show-arrow > div > span.ant-select-selection-item"
    ).click();

    cy.get(
      " #root > section > main > div > div.ant-select.css-wxm1m1.ant-select-single.ant-select-show-arrow > div > span.ant-select-selection-item"
    ).type("{downarrow}{downarrow}{enter}");

    cy.wait(1000);

    cy.get(".ant-table-tbody")
      .find("tr")
      .then(($rows) => {
        if ($rows.length > 1) {
          cy.log($rows.length);
          cy.get(".ant-table-tbody")
          .each((row, rowIndex) => {
            cy.wrap(row)
              .find("td:eq(3)")
              .find(".ant-select-selection-item")
              .should("have.text", "COMPLETED");
          });
        } else {
          cy.log("Table is empty.");
        }
      });
  });

  // it('now check change status work or not', () => {

  //     cy.wait(2000);
  //     cy.get('.ant-table-tbody')
  //         .find('tr')
  //         .then(($rows) => {

  //             if ($rows.length > 1) {

  //                 cy.get('.ant-table-tbody')
  //                     .find('tr')
  //                     .first().then(($row) => {
  //                         cy.get('#root > section > main > div > div:nth-child(4) > div > div > div > div > div > div > table > tbody > tr:nth-child(1) > td:nth-child(4) > div > div:nth-child(2) > div').click();

  //                         cy.get('.ant-select-item[title="BuildProfile"]').click();

  //                         cy.wrap($row).find('td:eq(3)').find('.ant-select-selection-item').should('have.text', 'BuildProfile');
  //                     })

  //             } else {
  //                 cy.log('Table is empty.');
  //             }
  //         });

  // })
});
