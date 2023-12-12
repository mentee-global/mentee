const mentorEmail = Cypress.env('MENTOR_EMAIL') 
const mentorPassword = Cypress.env('MENTOR_PASSWORD') 


describe("chceking the video page of mentor",()=>{

    it("checking page elements visibility",()=>{

        cy.visit('/login')
        
        cy.get('#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(1) > div').click();
        
        cy.get('#email').type(mentorEmail);
        cy.get('#password').type(mentorPassword);
        
        cy.get('button.ant-btn-primary').contains('Login').click();
        cy.wait(1000)
        
        cy.get('span[role="img"][aria-label="video-camera"].anticon-video-camera').click();

        //for multiple languages


        let previousLanguage = {}
        I18N_LANGUAGES.map((language, index) => {
            // Loading the translation
            const translationPath = `${Cypress.config('rootPath')}/public/locales/${language.value}/translation.json`
            cy.readFile(translationPath).then((currentLanguage) => {
                if (index == 0) {
                    previousLanguage = currentLanguage
                }
                // Clicking the language
                cy.get('#root > section > main > header > div.ant-space.css-wxm1m1.ant-space-horizontal.ant-space-align-center > div:nth-child(3) > span').trigger('mouseover')
                cy.contains(previousLanguage.languages[language.value.split("-")[0]]).click()
                // Checking the texts

                cy.get('h2.ant-typography.css-wxm1m1').should('have.text', previousLanguage.sidebars.videos);

                cy.get('#root > section > main > div > div > div > div > div > div > div > table > thead > tr > th:nth-child(1)')
                    .should('have.text', previousLanguage.common.title);

                cy.get('#root > section > main > div > div > div > div > div > div > div > table > thead > tr > th:nth-child(2)')
                    .should('have.text', previousLanguage.mentorVideoPage.specializationTag );

            

                cy.get('button.ant-btn-primary').should('have.text', previousLanguage.mentorVideoPage.addVideo);

                // Storing previous language details
                previousLanguage = currentLanguage
            })
        })


        ///no checking for english

        cy.get('h2.ant-typography.css-wxm1m1').should('have.text', 'Your Videos');

        cy.get('#root > section > main > div > div > div > div > div > div > div > table > thead > tr > th:nth-child(1)')
        .should('have.text', 'Title');

        cy.get('#root > section > main > div > div > div > div > div > div > div > table > thead > tr > th:nth-child(2)')
       .should('have.text' , 'Specializations Tag' );
 
       cy.get('#root > section > main > div > div > div > div > div > div > div > table > thead > tr > th:nth-child(3)')
       .should('be.visible');

       cy.get('button.ant-btn-primary span:contains("Add Video")').should('be.visible');

       cy.get('button.ant-btn-primary span:contains("Add Video")').should('have.text','Add Video');

       cy.get('button.ant-btn-primary span:contains("Add Video")').click();

       cy.get('#video-submit_title').type('my skills intro');

       cy.get('#video-submit_url').type('https://www.youtube.com/watch?v=Gjnup-PuquQ');

       cy.get('#video-submit_tag').click();

       cy.contains('.ant-select-item-option-content', 'Computer Science').click();

       cy.get('button.ant-btn-primary span:contains("Submit")').click();

       cy.get('#root > section > main > div > div > div > div > div > div > div > table > tbody > tr:nth-child(3) > td:nth-child(3) > div > div:nth-child(1)').click();

       cy.get('#root > section > main > div > div > div > div > div > div > div > table > tbody > tr:nth-child(1) > td:nth-child(1)').should('have.text', 'my skills intro');
       
       cy.get('#root > section > main > div > div > div > div > div > div > div > table > tbody > tr:nth-child(1) > td:nth-child(3) > div > div:nth-child(2)').click();
      
       cy.contains('span', 'Yes').click();


       cy.get('#root > section > main > div > div > div > div > div > div > div > table > tbody > tr:nth-child(1) > td:nth-child(1)').should('not.have.text', 'my skills intro');

    })
})