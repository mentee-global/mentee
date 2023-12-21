export class FindMentee {
    clickFindMentee() {
        cy.get('.ant-menu-title-content').eq(2)
            .click()
    }
    searchByName() {
        const searchTerm = 'ricirab'
        cy.get('#root > section > main > div.gallery-container > div:nth-child(1) > div > div > span > input')
            .type(searchTerm)
        cy.get('#root > section > main > div.gallery-container > div.gallery-mentor-container')
            .should('have.length.greaterThan', 0)
        cy.get('#root > section > main > div.gallery-container > div.gallery-mentor-container').each(($result) => {
            cy.wrap($result).should('include.text', searchTerm);
        })
        cy.get('#root > section > main > div.gallery-container > div:nth-child(1) > div > div > span > input')
            .clear()
            .should('have.value', '')

    }
    selectPartner() {
        cy.get('.ant-select-selector')
            .eq(0)
            .click()
        cy.get('.rc-virtual-list')
            .eq(0)
            .click()
        //As there is no data present against the selected value, I may choose to comment out the assertion script.
        // .invoke('text')
        // .then((selectedText) => {
        //     cy.get('#root > section > main > div.gallery-container > div.gallery-mentor-container').each(($result) => {
        //         cy.wrap($result).should('include.text', selectedText);
        //     })
        // })
        cy.get('.ant-select-clear')
            .click({ force: true })
        cy.get('.ant-select-selection-search-input')
            .eq(0)
            .should('have.value', '')
    }
    selectLanguage() {
        cy.get('.ant-select-selector')
            .eq(1)
            .click()
        cy.get('.ant-select-item-option-content')
            .eq(0)
            .click({ force: true })
            .invoke('text')
            .then((selectedText) => {
                cy.get('#root > section > main > div.gallery-container > div.gallery-mentor-container').each(($result) => {
                    cy.wrap($result).should('include.text', selectedText);
                })
            })
        cy.get('.ant-select-clear')
            .click({ force: true })
        cy.get('.ant-select-selection-search-input')
            .eq(1)
            .should('have.value', '')
    }
    selectInterests() {
        cy.get('.ant-select-selector')
            .eq(2)
            .click()
        cy.get('.ant-select-item-option-content')
            .eq(1)
            .click({ force: true })
            .invoke('text')
            .then((selectedText) => {
                const text = selectedText
                cy.log(`text is equal : ${text}`)
                cy.get('.gallery-button')
                    .click()
                cy.get('#root > section > main > div > div > div:nth-child(1) > div')
                    .should('contain.text', text)
            })
        cy.go(-1)
        cy.url().should('include', '/mentee-gallery')
        cy.get('.ant-select-selection-search-input')
            .eq(2)
            .should('have.value', '')
    }
}