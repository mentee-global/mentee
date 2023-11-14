import { HomePage } from "../pages/HomePage"

const homePage = new HomePage()

describe('HomePage', () => {
    beforeEach('Open Home Page', () => {
        cy.visit('https://mentee-dev.herokuapp.com/')
    })

    it('Existance of Home Page Components', () => {
        homePage.componentExist()
    })

    it('Clickable components at Home Page ', () => {
        homePage.isClickable()
    })

    it('should check the behavior upon click Mentee Logo', () => {
        cy.url().should('eq', 'https://mentee-dev.herokuapp.com/')
        cy.get('.css-mznafe').click()
        cy.url().should('include', '/mentee-dev.herokuapp.com');
        cy.get('.css-5lbmdi').should('be.visible');
    })

    it('should check the behavior upon Hover on "Report A Bug" Icon', () => {
        cy.url().should('eq', 'https://mentee-dev.herokuapp.com/')
        cy.get('.anticon.anticon-form.css-15ifzd0').trigger('mouseover')
        cy.get('.ant-tooltip-inner').should('be.visible')
    })

    it('should check the behavior upon Hover or click on "Global" Icon', () => {
        cy.url().should('eq', 'https://mentee-dev.herokuapp.com/')
        cy.get('.anticon.anticon-global.ant-dropdown-trigger.css-c1sjzn').click()
        cy.get('.anticon.anticon-global.ant-dropdown-trigger.css-c1sjzn').trigger('mouseover')
        cy.get('.ant-dropdown-menu.ant-dropdown-menu-root.ant-dropdown-menu-vertical.ant-dropdown-menu-light.css-wxm1m1').should('be.visible')
        cy.url().should('include', '/mentee-dev.herokuapp.com')
    })
})