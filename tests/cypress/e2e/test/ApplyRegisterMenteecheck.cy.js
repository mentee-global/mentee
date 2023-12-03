describe('Registration for mentee', () => {

  it('Check validations ', () => {

    cy.visit('/apply')

    const userEmail = 'testa24@example.com';
    cy.get('.ant-input.ant-input-lg.css-wxm1m1').type(userEmail);
    //checking select fro Mentee
    cy.get('.ant-select-selection-search-input').click();
    cy.contains('Mentee').click();
    // click submit button
    cy.get('.ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg').click();
    cy.wait(1000);
    cy.get('.ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg').click({ force: true });


    //////  now checking the validations on input fields 

    cy.get('button.ant-btn[type="submit"]').click();

    cy.get('#firstName_help > div').should('be.visible');
    cy.get('#firstName_help > div').should('have.text', 'Please enter First Name');


    cy.get('#organization_help > div').should('be.visible');
    cy.get('#organization_help > div').should('have.text', 'Please enter What organization is supporting you locally or what organization are you affiliated with?');

    cy.get('#age_help > div').should('be.visible');
    cy.get('#age_help > div').should('have.text', 'Please enter Let us know more about you');

    cy.get('#immigrantStatus_help > div').should('be.visible');
    cy.get('#immigrantStatus_help > div').should('have.text', 'Please enter Let us know more about you. Check ALL of the boxes that apply. When filling out other, please be very specific.');

    cy.get('#genderIdentification_help > div').should('be.visible');
    cy.get('#genderIdentification_help > div').should('have.text', 'Please enter What do you identify as?');

    cy.get('#language_help > div').should('be.visible');
    cy.get('#language_help > div').should('have.text', 'Please enter What is your native language?');

    cy.get('#topics_help > div').should('be.visible');
    cy.get('#topics_help > div').should('have.text', 'Please enter What special topics would you be interested in? If one is not on the list please add it in other:');


    // cy.get('#workstate_help > div').should('be.visible');
    // cy.get('#workstate_help > div').should("have.text', 'Please enter What do you currently do? Please check ALL the options that apply to you. If you select 'other' , please be specific:");

    cy.get('#socialMedia_help > div').should('be.visible');
    cy.get('#socialMedia_help > div').should('have.text', 'Please enter Would you be interested in being highlighted as one of our mentees on social media?');



  });


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