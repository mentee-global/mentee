const waitTime = 500;
export class ExplorePage {
  constructor(role) {
    this.role = role;
  }
  selectEnglish(){
    cy.get(
      "#root > section > main > header > div.ant-space.css-wxm1m1.ant-space-horizontal.ant-space-align-center > div:nth-child(3)"
    )
      .trigger("mouseover");

    cy.get('.ant-dropdown-menu-title-content')
      .eq(0)
      .click()
  }
  componnentExists() {
    cy.url().should(
      "include",
      this.role === "mentor" ? "/mentee-gallery" : "/gallery"
    );

    cy.get(
      "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > h4.ant-typography.css-jjz8ew.css-wxm1m1"
    ).should("contain.text", "Filter by:");
    cy.get(
      "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > h4.ant-typography.css-ia5ipz.css-wxm1m1"
    ).should("contain.text", "Partner");
    cy.get(
      "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > h4:nth-child(5)"
    ).should("contain.text", "Languages");
    cy.get(
      "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > h4:nth-child(7)"
    ).should(
      "contain.text",
      this.role === "mentor" ? "Mentee Interests" : "Specializations"
    );
    cy.get("#root > section > main > div.gallery-container").should(
      "be.visible"
    );
    cy.get(
      "#root > section > main > div.gallery-container > div.gallery-mentor-container > div:nth-child(1) > div.css-132mkms > a > div > button > span"
    ).should("have.text", "View Profile");
    cy.get(
      "#root > section > main > div.gallery-container > div:nth-child(1) > div > div"
    ).should("be.visible");
    cy.get(
      "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > span > input"
    ).should("have.attr", "placeholder", "Search by name");
  }

  isFunctional() {
    if (this.role === "mentor") {
      const sampleValues = ["roberto", "ber"];
      sampleValues.forEach((value, index) => {
        cy.get(
          "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > span > input"
        )
          .type(value)
          .wait(waitTime);
        cy.get(
          "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > span > input"
        ).should("have.attr", "value", value);
        cy.get(
          "#root > section > main > div.gallery-container > div.gallery-mentor-container > div:nth-child(1) > div.gallery-card-body > div.gallery-card-header > div > h1"
        ).invoke('text')
          .then((text) => {
            const val = text.toLowerCase()
            expect(val).to.include(value)
          })
        cy.get(
          "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > span > input"
        ).clear();
      });
    } else {
      const sampleValues = ["xeh", "ber", "roberto"];
      sampleValues.forEach((value, index) => {
        cy.get(
          "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > span > input"
        )
          .type(value)
          .wait(waitTime);
        cy.get(
          "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > span > input"
        ).should("have.attr", "value", value);
        cy.get(
          "#root > section > main > div.gallery-container > div.gallery-mentor-container > div:nth-child(1) > div.gallery-card-body > div.gallery-card-header > div > h1"
        )
          .invoke('text')
          .then((text) => {
            const val = text.toLowerCase()
            expect(val).to.include(value)
          })
        cy.get(
          "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > span > input"
        ).clear();
      });
    }
  }

  filterByLanguage() {
    cy.get(
      "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > div:nth-child(6)"
    )
      .click()
      .wait(waitTime);
    cy.get("div[title='Bengali']").click();
    cy.get(
      "#root > section > main > div.gallery-container > div.gallery-mentor-container > div > div.gallery-card-body > article > div > span"
    ).should("include.text", "Bengali");
  }
  filterBySpecializations() {
    cy.get(
      "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > div:nth-child(8)"
    )
      .click()
      .wait(waitTime);
    cy.get("div[title='Citizenship']").click();
    cy.get(
      "#root > section > main > div.gallery-container > div.gallery-mentor-container > div > div.gallery-card-body > article > div"
    ).should("include.text", "Citizenship");
  }
}
