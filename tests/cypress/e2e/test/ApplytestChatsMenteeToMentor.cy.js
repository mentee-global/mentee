const MENTEE_PROFILE_ID= Cypress.env('MENTEE_PROFILE_ID')
const MENTOR_PROFILE_ID= Cypress.env('MENTOR_PROFILE_ID')
const MENTOR_EMAIL= Cypress.env('MENTOR_EMAIL')
const MENTOR_PASSWORD= Cypress.env('MENTOR_PASSWORD')
const MENTEE_EMAIL= Cypress.env('MENTEE_EMAIL')
const MENTEE_PASSWORD= Cypress.env('MENTEE_PASSWORD')


describe('test chat between mentee to mentor',()=>{

    it('Login as a Mentee and send a message to metor', () => {
       
        cy.visit(`/login`);

        cy.get('#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(2) > div').click();

        cy.get('#email').clear().type(MENTEE_EMAIL);

        cy.get('#password').clear().type(MENTEE_PASSWORD);
 
        cy.contains('button', 'Login').click();
      
        cy.wait(2000);

        cy.visit(`gallery/1/${MENTOR_PROFILE_ID}`);
        
        cy.wait(2000);

        cy.get('button.ant-btn.ant-btn-primary').contains('Contact Me').click();

        cy.get('#Choose\\ Interest\\ Areas').type('Engineering');

        cy.get('#Choose\\ Interest\\ Areas').type('{enter}');

        cy.get('textarea.ant-input').clear().type('I want metorship on the domain of computer scineces');

        cy.get('button.contact-me-submit-button').contains('Submit').click();
       
    });


    it('Login as a Mentor and send a message to mentee', () => {
       
        cy.visit(`/login`);

        cy.get('#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(1) > div').click();

        cy.get('#email').clear().type(MENTOR_EMAIL);

        cy.get('#password').clear().type(MENTOR_PASSWORD);
 
        cy.contains('button', 'Login').click();
        cy.wait(2000);
        cy.get('#root > section > aside > div.ant-layout-sider-children > ul > li:nth-child(1)').click();
        cy.wait(2000);
        cy.get('#root > section > main > section > aside > div > div.messages-sidebar > div.ant-card.ant-card-bordered.css-umxe2r.css-wxm1m1').click();
        cy.wait(4000);
        cy.get('#root > section > main > section > section > div > div.conversation-content > div.ant-spin-nested-loading.css-wxm1m1 > div > div:nth-child(62) > div > div > div > div') .should('contain', 'I want metorship on the domain of computer scineces');
      
       
    });



})