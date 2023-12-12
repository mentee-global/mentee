import { ExplorePage } from "./ExplorePage";

export class GuestLogin extends ExplorePage {
  constructor() {
    super();
    this.Mentee = new ExplorePage();
    this.Mentor = new ExplorePage("mentor");
    this.partner = new PartnerComponent();
  }
  findMentee() {
    this.Mentor.componnentExists();
    this.Mentor.isFunctional();
    this.Mentor.filterByLanguage();
  }
  findMentor() {
    this.Mentee.componnentExists();
    this.Mentor.isFunctional();
    this.Mentee.filterBySpecializations();
  }
  findPartner() {
    this.partner.componnentExists();
    this.partner.isFunctional();
    this.partner.filterByRegion();
  }
}

class PartnerComponent {
  componnentExists() {
    cy.url().should("include", "partner-gallery");
    cy.get(
      "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > h4.ant-typography.css-jjz8ew.css-wxm1m1"
    ).should("contain.text", "Organization");
    cy.get(
      "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > h4:nth-child(3)"
    ).should("contain.text", "Regions");
    cy.get(
      "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > h4:nth-child(5)"
    ).should("contain.text", "Project Topics");
    cy.get(
      "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > h4:nth-child(7)"
    ).should("contain.text", "SDGS");
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
    ).should("have.attr", "placeholder", "Search by organization");
  }
  isFunctional() {
    cy.get(
      "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > span:nth-child(2) > input"
    )
      .type("test")
      .wait(500);
    cy.get(
      "#root > section > main > div.gallery-container > div.gallery-mentor-container > div > div.gallery-card-body > div.gallery-card-header > div > h1"
    ).should("have.text", "Test");
  }

  filterByRegion() {
    cy.get(
      "#root > section > main > div.gallery-container > div:nth-child(1) > div > div > div:nth-child(4) > div"
    )
      .click()
      .wait(500);
    cy.get("div[title='S. America']").click().wait(500);
    cy.get(
      "#root > section > main > div.gallery-container > div.gallery-mentor-container > div > div.gallery-card-body > article > div"
    ).should("have.text", "S. America");
  }
}
