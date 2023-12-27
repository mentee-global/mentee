import { AdminLogin } from "../pages/AdminLoginPage"
import { FindMentee } from "../pages/AdminFindMenteePage"
const loginAdmin = new AdminLogin()
const findMentee = new FindMentee()
describe('Find Mentee Page', () => {
    beforeEach('Login To Admin', () => {
        cy.visit('/admin')
        loginAdmin.validCredentials()
    })
    it('Test Filter By Seacrh', () => {
        findMentee.clickFindMentee()
        findMentee.searchByName()
    })
    it(('Test Filter By Partner'), ()=>{
        findMentee.clickFindMentee()
        findMentee.selectPartner()
    })
    it(('Test Filter By Language'), ()=>{
        findMentee.clickFindMentee()
        findMentee.selectLanguage()
    })
    it(('Test Filter By Interest'), ()=>{
        findMentee.clickFindMentee()
        findMentee.selectInterests()
    })
})