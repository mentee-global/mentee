

export class HomePage {
    componentExist() {
        cy.url().should('eq', 'https://mentee-dev.herokuapp.com/')
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
        cy.url().should('eq', 'https://mentee-dev.herokuapp.com/')
        cy.get('.css-mznafe').should('have.css', 'cursor', 'pointer').and('be.visible')
        cy.get('span.anticon.anticon-form.css-15ifzd0').should('have.css', 'cursor', 'pointer')
        cy.get('span.anticon.anticon-global.ant-dropdown-trigger.css-c1sjzn').should('have.css', 'cursor', 'pointer')
        cy.get('.ant-card.ant-card-bordered.css-ot64mz.css-wxm1m1').should('have.css', 'cursor', 'pointer')
        cy.get('.ant-space-item').should('have.css', 'cursor', 'pointer')
    }
}