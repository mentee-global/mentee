import { LoginPage } from "../pages/LoginPage"
const login = new LoginPage()
describe('Login Page ', ()=>{
    beforeEach('Open Login Page', ()=>{
        cy.visit('/login')
    })
    it('Check Existence of Login Pages', ()=>{
        login.componentExist()
    })
    it.only('Check the functionality of Login Page', ()=>{
        login.isFunctional()
    })
})