export class LoginPage {
    users = ["Mentor", "Mentee", "Partner", "Guest"];
    componentExist() {
        cy.url().should('include', '/login')
        cy.get('.ant-steps.ant-steps-horizontal.css-wxm1m1.ant-steps-small.ant-steps-label-horizontal').should('be.visible')
        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div.ant-steps.ant-steps-horizontal.css-wxm1m1.ant-steps-small.ant-steps-label-horizontal > div.ant-steps-item.ant-steps-item-process.ant-steps-item-active > div > div.ant-steps-item-content > div').should('contain.text', 'Role')
        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div.ant-steps.ant-steps-horizontal.css-wxm1m1.ant-steps-small.ant-steps-label-horizontal > div.ant-steps-item.ant-steps-item-wait > div > div.ant-steps-item-content > div').should('contain.text', 'Login')

        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(1)').should('be.visible')
        cy.get('.anticon.anticon-tool').should('have.attr', 'aria-label', 'tool').and('be.visible')
        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(1) > div > div > div > div.ant-card-meta-detail > div > div').should('contain.text', 'Mentor')
        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(1) > div > div > div > div.ant-card-meta-detail > div > div > span').should('have.attr', 'aria-label', 'right-circle').and('be.visible')

        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(2)').should('be.visible')
        cy.get('.anticon.anticon-compass').should('have.attr', 'aria-label', 'compass').and('be.visible')
        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(2) > div > div > div > div.ant-card-meta-detail > div > div > span').should('have.attr', 'aria-label', 'right-circle')

        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(3)').should('be.visible')
        cy.get('.anticon.anticon-partition').should('have.attr', 'aria-label', 'partition').and('be.visible')
        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(3) > div > div > div > div.ant-card-meta-detail > div > div > span').should('have.attr', 'aria-label', 'right-circle')

        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(4)').should('be.visible')
        cy.get('.anticon.anticon-unlock').should('have.attr', 'aria-label', 'unlock').and('be.visible')
        cy.get('#root > section > main > div > div > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(4) > div > div > div > div.ant-card-meta-detail > div > div > span').should('have.attr', 'aria-label', 'right-circle')
    }
    isFunctional() {
        let mappedUsers = this.users.map((user,id) => {
            cy.get(`#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(${id+1}) > div`).click()
            cy.get('.ant-typography.css-wxm1m1').should('contain', user)
            cy.get('.anticon.anticon-check.ant-steps-finish-icon').should('have.attr', 'aria-label', 'check')
            cy.get('#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.css-1j25lv9 > form > div:nth-child(1) > div > div.ant-col.ant-form-item-label.css-wxm1m1 > label').should('have.attr', 'for', 'email')
            cy.get('#email').should('have.attr', 'type', 'text').and('have.attr', 'aria-required', 'true')
            cy.get('#password').should('have.attr', 'type', 'password').and('have.attr', 'aria-required', 'true')
            cy.get('#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-steps.ant-steps-horizontal.css-wxm1m1.ant-steps-small.ant-steps-label-horizontal > div.ant-steps-item.ant-steps-item-finish > div').should('have.attr', 'role', 'button').click()
        });
        
    }
}
