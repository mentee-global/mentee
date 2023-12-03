import { LoginPage } from "../pages/LoginPage"


const login = new LoginPage()
describe('Login Page ', ()=>{
    beforeEach('Open Login Page', ()=>{
        cy.visit('/login')
    })
    it.only('Check Existence of Login Pages', ()=>{
        login.componentExist()
    })
    it('Check the functionality of Login Page', ()=>{
        login.isFunctional()
    })
    it('Should Change The Language For Page 1', () => {
        login.changeLanguagePage1()
    })
    it('Should Change The Language For Page 2', () => {
        cy.get('#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(1) > div').click()
        login.changeLanguagePage2()
    })
    it('Mentor - Valid Credentials', () => {
        login.loginMentor()
    })
    it('Mentee - Valid Credentials', () => {
        login.loginMentee()
    })
    it('Partner - Valid Credentials', () => {
        login.loginPartner()
    })
    it.skip('Guest - Valid Credentials', () => {
        login.loginGuest()
    })
    it('Mentor - Invalid Credentials', () => {
        login.invalidCredentialMentor()
    })
    it('Mentee - Invalid Credentials', () => {
        login.invalidCredentialMentee()
    })
    it('Partner - Invalid Credentials', () => {
        login.invalidCredentialPartner()
    })
    it('Guest - Invalid Credentials', () => {
        login.invalidCredentialGuest()
    })
})