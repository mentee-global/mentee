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
    cy.get('.css-jjz8ew').should("contain.text", "Organization");
    cy.contains('Regions').should("contain.text", "Regions");
    cy.contains('Project Topics').should("contain.text", "Project Topics");
    cy.contains('SDGS').should("contain.text", "SDGS");
    cy.get('.gallery-button > .ant-btn > span').first().should("have.text", "View Profile");
    cy.get(':nth-child(2) > .ant-input').should("have.attr", "placeholder", "Search by organization");
  }
  isFunctional() {
    cy.get(':nth-child(2) > .ant-input')
      .type("test")
      .wait(500);
    cy.get(
      "h1.ant-typography"
    ).first().should("have.text", "Test");
  }

  filterByRegion() {
    cy.get(':nth-child(4) > .ant-select-selector > .ant-select-selection-overflow')
      .click()
      .wait(500);
    cy.get("div[title='S. America']").click().wait(500);
    cy.get(':nth-child(3) > div.ant-typography').first().should("have.text", "S. America");
  }
}