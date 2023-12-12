import { LoginPage } from "../pages/LoginPage";


const login = new LoginPage();


describe("Testing partner page", () => {
  it("Testing the partner page", () => {
    cy.visit("/login");
    login.loginPartner();

    cy.visit("/profile");

    cy.get('a.mentor-profile-contact-edit').click();

    cy.get("#nest-messages_email")
      .should("exist")
      .should("be.visible")
      .should("have.value", Cypress.env("PARTNER_EMAIL").trim())
      .should("be.enabled");

    cy.get("#nest-messages_email").clear().type("testEmail@gmail.com");

    cy.get('#nest-messages > div.mentor-profile-editing-footer > div.mentor-profile-save-container > div > div > div > div > div > button').click();

    cy.get('a.mentor-profile-contact-edit').click();

    cy.get("#nest-messages_email")
      .clear()
      .type(Cypress.env("PARTNER_EMAIL"));

    cy.get('#nest-messages > div.mentor-profile-editing-footer > div.mentor-profile-save-container > div > div > div > div > div > button').click();

  });

});


describe("Testing partner page details", () => {

  it('Testing the edit profile', () => {
    cy.visit("/login");
    login.loginPartner();

    cy.visit("/profile");
    cy.get('.ant-btn-primary')
      .contains('Edit Profile')
      .click();

    cy.get('#organization') 
    .clear()             
    .type('new briks');
    
    cy.get('#person_name') 
    .clear()
   .type('dantay mentor test');          

   cy.get('#regions').type('{downarrow}{downarrow}{enter}', { force: true });

   cy.get('.ant-btn-primary') 
   .contains('Save').click();        

   cy.get('#root > section > main > div > div > div > div.mentor-profile-info > div > div.mentor-profile-name > div.mentor-profile-decorations')
  .should('have.text', 'new briks');

  cy.get('#root > section > main > div > div > div > div.mentor-profile-info > div > div:nth-child(8) > div:nth-child(2) > div')
  .should('have.text', 'S. America');

  cy.get('#root > section > main > div > div > div > div.mentor-profile-info > div > div:nth-child(12)')
  .should('have.text', 'dantay mentor test');



  })

})


describe("Again adding previo details", () => {

  it('Tesetting the profile', () => {
    cy.visit("/login");
    login.loginPartner();

    cy.visit("/profile");
    cy.get('.ant-btn-primary')
      .contains('Edit Profile')
      .click();

    cy.get('#organization') 
    .clear()             
    .type('Test');
    
    cy.get('#person_name') 
    .clear()
   .type('reberto murer partner as');          


   cy.get('.ant-btn-primary') 
   .contains('Save').click();        

   cy.get('#root > section > main > div > div > div > div.mentor-profile-info > div > div.mentor-profile-name > div.mentor-profile-decorations')
  .should('have.text', 'Test');


  cy.get('#root > section > main > div > div > div > div.mentor-profile-info > div > div:nth-child(12)')
  .should('have.text', 'reberto murer partner as');

  

  })

})