describe('Registration for mentee', () => {

  it('Allow a user to Register as a Mentee', () => {

    cy.visit('/apply')

    const userEmail = 'testa4@example.com';
    cy.get('.ant-input.ant-input-lg.css-wxm1m1').type(userEmail);
    //checking select fro Mentee
    cy.get('.ant-select-selection-search-input').click();
    cy.contains('Mentee').click();
    // click submit button
    cy.get('.ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg').click();
    cy.wait(1000);
    cy.get('.ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg').click({ force: true });




    //// now after clickint the countinue buton sytem moved to next window
    cy.get('#firstName').type('alex');
    cy.get('#lastName').type('john');
    cy.get('#organization').type('capregsoft');
    cy.get('#age').click();
    cy.contains('I am 27-30').click();
    cy.get('#immigrantStatus').click();
    cy.get('#immigrantStatus').type('{downarrow}{downarrow}{enter}');
    cy.get('#immigrantStatus').click();
    cy.get('#country').type('Italy', { force: true });
    cy.get('#genderIdentification').click();
    cy.contains('as a man').click();
    cy.get('#language').click();
    cy.contains('English').click();
    cy.get('#topics').click();
    cy.get('#topics').type('{downarrow}{downarrow}{enter}');
    cy.get('#workstate').click({ force: true });
    cy.get('#workstate').type('{downarrow}{downarrow}{enter}');
    cy.get('input[value="yes"]').click({ force: true });
    cy.get('#questions').type('Will this give me desired income?');
    cy.get('button.ant-btn[type="submit"]').click();



});




})