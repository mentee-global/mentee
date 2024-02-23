const adminEmail = Cypress.env("ADMIN_EMAIL");
const adminPassword = Cypress.env("ADMIN_PASSWORD");

describe("testing the Application page of Mentor", () => {
  beforeEach("Open Admin Login Page", () => {
    cy.visit("/admin");

    cy.get("#email").type(adminEmail);
    cy.get("#password").type(adminPassword);
    cy.get("#submit").click();
    cy.wait(2000);
    cy.visit("/organizer");
  });

  it("checking the visibility of page elements", () => {
    cy.get("#applicactionstate",{timeout: 10000}).should(
      "have.text",
      "Applications State"
    );

    cy.get("#mentorapplications")
      .should("have.text", "Mentor Appications")
      .should("not.be.disabled");

    cy.get("#menteeapplications")
      .should("have.text", "Mentee Appications")
      .should("not.be.disabled");

    cy.get(
      "#applicationstable thead tr th:first-child"
    ).should("have.text", "Name")
      .click();

    cy.get(
      "#applicationstable thead tr th:nth-child(2)"
    )
      .should("have.text", "Email")
      .click();

    cy.get(
      "#applicationstable thead tr th:nth-child(3)"
    )
      .should("have.text", "Notes")
      .click();

    cy.get(
      "#applicationstable thead tr th:nth-child(4)"
    )
      .should("have.text", "Application State")
      .click();

    cy.get(
      "#applicationstable thead tr th:nth-child(5)"
    )
      .should("have.text", "Full Application")
      .click();

    cy.log("checking does the download files button works or not");

      cy.get(
        "#mentorapplications"
      ).click();
      cy.wait(4000);
      cy.readFile("cypress/downloads/mentor_applications.xlsx");

      cy.get(
        "#menteeapplications"
      ).click();
      cy.wait(4000);
      cy.readFile("cypress/downloads/mentee_applications.xlsx");

  });

  it("Checking the sortig of applications", () => {
    cy.wait(2000);

    cy.get(
      "#applicationssort" ,{timeout: 10000}
    ).click({force:true});

    cy.get(
      "#applicationssort"
    ).type("{downarrow}{downarrow}{downarrow}{enter}",{force:true});

    cy.wait(3000);

    cy.get(".ant-table-tbody")
      .find("tr")
      .then(($rows) => {
        if ($rows.length > 1) {
          cy.log($rows.length)
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
        "#applicationssort"
      ).click({force:true});
  
  
      cy.get(
        "#applicationssort",{timeout: 10000}
      ).type("{downarrow}{enter}",{force:true});
  

    cy.wait(3000);

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

  
});
