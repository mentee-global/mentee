describe('Registration for mentor', () => {

  it('Allow a user to Register as a Mentor', () => {

    cy.visit('/apply')

    const userEmail = 'teta4@example.com';
    cy.get('.ant-input.ant-input-lg.css-wxm1m1').type(userEmail);
    //checking select fro Mentor
    cy.get('.ant-select-selection-search-input').click();
    cy.contains('Mentor').click();
    // click submit button
    cy.get('.ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg').click();
    cy.wait(1000);
    cy.get('.ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg').click({ force: true });




    //// now after clickint the countinue buton sytem moved to next window
    cy.get('#firstName').type('alex');
    cy.get('#lastName').type('john');
   
    cy.get('#phoneNumber').type('+44 318 540229872');

    cy.get('#hearAboutUs').type('From My company');

    cy.get('#knowledgeLocation')
  .should('have.attr', 'rows', '3')
  .should('have.attr', 'placeholder', 'Please share which region(s), country(s), state(s), cities your knowledge is based in')
  .should('have.attr', 'aria-required', 'true')
  .should('have.class', 'ant-input')
  .type('i have knowledge of new yourk state city baffelo country is america')

  cy.get('#previousLocations')
  .should('have.attr', 'rows', '3')
  .should('have.attr', 'placeholder', 'Where have you lived in your life besides where you live now?')
  .should('have.attr', 'aria-required', 'true')
  .should('have.class', 'ant-input')
  .type('I lived in america new yourk and now i am live from UK');

  cy.get('#employerName')
  .should('have.attr', 'placeholder', 'Full name of your company/employer')
  .should('have.attr', 'aria-required', 'true')
  .should('have.class', 'ant-input')
  .type('I lived in america new yourk and now i am live from UK');

  cy.get('#jobDescription')
  .should('have.attr', 'placeholder', 'Your full title and a brief description of your role')
  .should('have.attr', 'aria-required', 'true')
  .should('have.class', 'ant-input')
  .type('I am working as a tester');

  cy.get('#jobDuration')
  .should('have.attr', 'type', 'search')
  .should('have.attr', 'autocomplete', 'off')
  .should('have.class', 'ant-select-selection-search-input')
  .should('have.attr', 'role', 'combobox')
  .should('have.attr', 'aria-expanded', 'false')
  .should('have.attr', 'aria-haspopup', 'listbox')
  .should('have.attr', 'aria-owns', 'jobDuration_list')
  .should('have.attr', 'aria-autocomplete', 'list')
  .should('have.attr', 'aria-controls', 'jobDuration_list')
  .should('have.attr', 'aria-activedescendant', 'jobDuration_list_0')
  .should('have.attr', 'aria-required', 'true')
  .click()

  cy.get('body > div:nth-child(3) > div > div > div.rc-virtual-list > div.rc-virtual-list-holder > div > div > div.ant-select-item.ant-select-item-option.ant-select-item-option-active > div').click();

  cy.get('#commitDuration')
  .should('have.attr', 'type', 'search')
  .should('have.attr', 'autocomplete', 'off')
  .should('have.class', 'ant-select-selection-search-input')
  .should('have.attr', 'role', 'combobox')
  .should('have.attr', 'aria-expanded', 'false')
  .should('have.attr', 'aria-haspopup', 'listbox')
  .should('have.attr', 'aria-owns', 'commitDuration_list')
  .should('have.attr', 'aria-autocomplete', 'list')
  .should('have.attr', 'aria-controls', 'commitDuration_list')
  .should('have.attr', 'aria-activedescendant', 'commitDuration_list_0')
  .should('have.attr', 'aria-required', 'true')
  .click()
  
  cy.get('body > div:nth-child(4) > div > div > div.rc-virtual-list > div.rc-virtual-list-holder > div > div > div.ant-select-item.ant-select-item-option.ant-select-item-option-active > div').click();

  cy.get('#immigrationStatus > label:nth-child(1) > span.ant-radio').click();
  
  cy.get('#communityStatus > label:nth-child(1) > span.ant-radio').click();
  
  cy.get('#economicBackground  > label:nth-child(1) > span.ant-radio').click();

  cy.get('#isPersonOfColor  > label:nth-child(1) > span.ant-radio').click();
  
  cy.get('#isPersonOfColor  > label:nth-child(1) > span.ant-radio').click();
  
  cy.get('#isPersonOfColor  > label:nth-child(1) > span.ant-radio').click();
  
  cy.get('#genderIdentification')
  .should('have.attr', 'type', 'search')
  .should('have.attr', 'autocomplete', 'off')
  .should('have.class', 'ant-select-selection-search-input')
  .should('have.attr', 'role', 'combobox')
  .should('have.attr', 'aria-expanded', 'false')
  .should('have.attr', 'aria-haspopup', 'listbox')
  .should('have.attr', 'aria-owns', 'genderIdentification_list')
  .should('have.attr', 'aria-autocomplete', 'list')
  .should('have.attr', 'aria-controls', 'genderIdentification_list')
  .should('have.attr', 'aria-required', 'true')
  .should('have.attr', 'unselectable', 'on')
  .should('have.value', '')
  .click();

  cy.contains('as a man').click();

  cy.get('#isMarginalized > label:nth-child(1) > span:nth-child(2)').click();


  cy.get('#languageBackground')
  .should('have.attr', 'placeholder', 'Do you speak a language(s) other than English? If yes, please write the language(s) below and include your fluency level (conversational, fluent, native)')
  .should('have.attr', 'aria-required', 'true')
  .should('have.class', 'ant-input')
  .should('have.attr', 'type', 'text')
  .type('No i can speak only english no other language i can speak')

  cy.get('#referral')
  .should('have.attr', 'placeholder', 'If you know someone who would be a great global mentor, please share their name, email, and we\'ll contact them!')
  .should('have.attr', 'aria-required', 'true')
  .should('have.class', 'ant-input')
  .should('have.attr', 'type', 'text')
  .type( 'No i do not know nay one');

  cy.get('#canDonate > label:nth-child(3) > span:nth-child(2)').click()
  cy.get('button.ant-btn[type="submit"]').click();

  cy.url().should('include', '/application-form');
  
});



})