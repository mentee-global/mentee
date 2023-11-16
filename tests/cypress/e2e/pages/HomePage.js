import { I18N_LANGUAGES } from "../../../../frontend/src/utils/consts"

export class HomePage {
    componentExist() {
        cy.get('.css-mznafe').should('exist').and('have.attr', 'xmlns', 'http://www.w3.org/2000/svg').should('be.visible')

        cy.get('.ant-space-horizontal').should('exist').should('be.visible')
        cy.get('span.anticon.anticon-form.css-15ifzd0').should('exist').and('have.attr', 'aria-label', 'form').should('be.visible')
        cy.get('span.anticon.anticon-global.ant-dropdown-trigger.css-c1sjzn').should('exist').and('have.attr', 'aria-label', 'global').should('be.visible')

        cy.get('span.anticon.anticon-user').should('exist').and('have.attr', 'aria-label', 'user').should('be.visible')
        cy.get('[style=""] > .ant-card').should('have.attr', 'class', 'ant-card ant-card-bordered css-ot64mz css-wxm1m1').and('contain', 'Existing').should('be.visible')
        cy.get('span.anticon.anticon-right-circle').should('exist').and('have.attr', 'aria-label', 'right-circle').should('be.visible')
        cy.get('.ant-card-meta-description').should('contain', 'Platform Login').should('be.visible')

        cy.get('span.anticon.anticon-usergroup-add').should('exist').and('have.attr', 'aria-label', 'usergroup-add').should('be.visible')
        cy.get(':nth-child(2) > .ant-card').should('have.attr', 'class', 'ant-card ant-card-bordered css-ot64mz css-wxm1m1').and('contain', 'New').should('be.visible')
        cy.get('span.anticon.anticon-right-circle').should('exist').and('have.attr', 'aria-label', 'right-circle').should('be.visible')
        cy.get('.ant-card-meta-description').should('exist').and('contain', 'Apply - Train - Build').should('be.visible')

        cy.get('.css-5lbmdi').should('exist').and('be.visible').and('have.attr', 'xmlns', 'http://www.w3.org/2000/svg')
    }
    isClickable() {
        cy.get('.css-mznafe').should('have.css', 'cursor', 'pointer').and('be.visible')
        cy.get('span.anticon.anticon-form.css-15ifzd0').should('have.css', 'cursor', 'pointer')
        cy.get('span.anticon.anticon-global.ant-dropdown-trigger.css-c1sjzn').should('have.css', 'cursor', 'pointer')
        cy.get('.ant-card.ant-card-bordered.css-ot64mz.css-wxm1m1').should('have.css', 'cursor', 'pointer')
        cy.get('.ant-space-item').should('have.css', 'cursor', 'pointer')
    }
    changeLanguage(){
        let previousLanguage = {}
        I18N_LANGUAGES.map((language,index) => {
            // Loading the translation
            const translationPath = `${Cypress.config('rootPath')}/public/locales/${language.value}/translation.json`
            cy.readFile(translationPath).then((currentLanguage) => {
                if (index == 0){
                    previousLanguage = currentLanguage
                }
                // Clicking the language
                cy.get('.anticon.anticon-global.ant-dropdown-trigger.css-c1sjzn').trigger('mouseover')
                cy.contains(previousLanguage.languages[language.value.split("-")[0]]).click()

                // Checking the texts
                cy.get('.css-nnx7y8').should('contain',currentLanguage.homepage.existingAccountTitle).and('contain.text', currentLanguage.homepage.newAccountTitle)
                cy.get('.ant-card-meta-description').should('contain.text', currentLanguage.homepage.existingAccountDesc).and('contain.text', currentLanguage.homepage.newAccountDesc)
                
                // Storing previous language details
                previousLanguage=currentLanguage
            })
    
        })
    }
    clickExisting(){
        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div > div:nth-child(1)').click()
        cy.url().should('include', '/login')
        cy.get('.ant-steps.ant-steps-horizontal.css-wxm1m1.ant-steps-small.ant-steps-label-horizontal').should('be.visible')
        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(1)').should('be.visible')
        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(2)').should('be.visible')
        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(3)').should('be.visible')
        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(4)').should('be.visible')
    }
    clickNew(){
        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div > div:nth-child(2)').click()
        cy.url().should('include', '/apply')
        cy.get('.ant-space.css-wxm1m1.ant-space-horizontal.ant-space-align-center').should('be.visible')
        cy.get('.ant-typography.css-wxm1m1').should('contain', 'Apply').and('be.visible')
        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div > form > div:nth-child(1) > div > div.ant-col.ant-form-item-label.css-wxm1m1 > label').should('have.attr', 'title', 'Email')
        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div > form > div:nth-child(1)').should('be.visible')
        cy.get('#email').should('have.attr', 'type', 'text')
        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div > form > div:nth-child(2) > div > div.ant-col.ant-form-item-label.css-wxm1m1 > label').should('have.attr', 'title', 'Role')
        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div > form > div:nth-child(2)').should('be.visible')
        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div > form > div:nth-child(3)').should('be.visible')
        cy.get('.ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg').should('have.attr', 'type', 'submit')
    }
}