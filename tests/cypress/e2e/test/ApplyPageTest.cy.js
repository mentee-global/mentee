//import { describe } from "mocha";

describe('Apply Page', () => {
    beforeEach('Open Apply Page', () => {

        cy.visit('/apply')

    })

    it('Existance of Apply Page Components ', () => {

        cy.get('.ant-typography.css-wxm1m1').should('be.visible')

    })
})  