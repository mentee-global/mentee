import { HomePage } from "../pages/HomePage"
import { I18N_LANGUAGES } from "../../../../frontend/src/utils/consts"
// import { eq, isEqual } from "cypress/types/lodash"
const homePage = new HomePage()
describe('HomePage', () => {
    beforeEach('Open Home Page', () => {
        cy.visit('/')
    })
    it('Existance of Home Page Components', () => {
        homePage.componentExist()
    })
    it('Clickable components at Home Page ', () => {
        homePage.isClickable()
    })
    it('should check the behavior upon click Mentee Logo', () => {
        cy.get('.css-mznafe').click()
        cy.get('.css-5lbmdi').should('be.visible');
    })
    it('should check the behavior upon Hover on "Report A Bug" Icon', () => {
        cy.get('.anticon.anticon-form.css-15ifzd0').trigger('mouseover')
        cy.get('.ant-tooltip-inner').should('be.visible')
    })
    it('should check the behavior upon Hover or click on "Global" Icon', () => {
        cy.get('.anticon.anticon-global.ant-dropdown-trigger.css-c1sjzn').click()
        cy.get('.anticon.anticon-global.ant-dropdown-trigger.css-c1sjzn').trigger('mouseover')
        cy.get('.ant-dropdown-menu.ant-dropdown-menu-root.ant-dropdown-menu-vertical.ant-dropdown-menu-light.css-wxm1m1')
            .should('be.visible')
        cy.get('span.ant-dropdown-menu-title-content').should('contain.text', 'English')
            .and('contain.text', 'Español').and('contain.text', 'العربية').and('contain.text', 'Português').and('contain.text', 'فارسی')
        cy.get('span.ant-dropdown-menu-title-content').should('have.length', 5)
    })
    it.only('should change the language', () => {
       homePage.changeLanguage()
    })
    it('should change the language', () => {
        I18N_LANGUAGES.map((item) => {
            // alert(item.value+" "+item.label)
            cy.get('.anticon.anticon-global.ant-dropdown-trigger.css-c1sjzn').trigger('mouseover')
            cy.get('.ant-dropdown-menu-item.ant-dropdown-menu-item-only-child').each(($option, index) => {
                const language = I18N_LANGUAGES[index];
                cy.wrap($option).should('contain.text', language.label)
                // cy.wrap($option).should('have.attr','data-menu-id').and('contain', item.value)
            })
        })
    })
    it('should check the behavior upon click on "Existing" Card', ()=>{
        homePage.clickExisting()
    })
    it('should check the behavior upon click on "New" Card', ()=>{
        homePage.clickNew()
    })
})