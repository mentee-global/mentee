const mentorEmail = Cypress.env("MENTOR_EMAIL");
const mentorPassword = Cypress.env("MENTOR_PASSWORD");

describe("chceking the video page of mentor", () => {
  it("checking page elements visibility", () => {
    cy.visit("/login");

    cy.get(
      "#root > section > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-wxm1m1 > div.css-1c9mpvn > div.ant-space.css-wxm1m1.ant-space-vertical.css-3w4dbw > div:nth-child(1) > div"
    ).click();

    cy.get("#email").type(mentorEmail);
    cy.get("#password").type(mentorPassword);

    cy.get("button.ant-btn-primary").contains("Login").click();
    
    cy.get(
      ".anticon.anticon-global.ant-dropdown-trigger.css-c1sjzn"
    ).trigger("mouseover");

    cy.contains('span', 'English').click();
    
    cy.wait(3000);

    cy.visit('/videos');

    cy.get("h2.ant-typography.css-wxm1m1").should("have.text", "Your Videos");

    cy.get(
      "#root > section > main > div > div > div > div > div > div > div > table > thead > tr > th:nth-child(1)"
    ).should("have.text", "Title");

    cy.get(
      "#root > section > main > div > div > div > div > div > div > div > table > thead > tr > th:nth-child(2)"
    ).should("have.text", "Specializations Tag");

    cy.get(
      "#root > section > main > div > div > div > div > div > div > div > table > thead > tr > th:nth-child(3)"
    ).should("be.visible");

    cy.get('button.ant-btn-primary span:contains("Add Video")').should(
      "be.visible"
    );

    cy.get('button.ant-btn-primary span:contains("Add Video")').should(
      "have.text",
      "Add Video"
    );
   
    cy.get('button.ant-btn-primary span:contains("Add Video")').click();

    cy.get("#video-submit_title").type("my skills intro");

    cy.get("#video-submit_url").type(
      "https://www.youtube.com/watch?v=Gjnup-PuquQ"
    );

    cy.get("#video-submit_tag").click();
    cy.get("#video-submit_tag").type('{downarrow}{downarrow}{enter}',{force: true});

    // cy.contains(".ant-select-item-option-content", "Computer Science").click();

    cy.get('button.ant-btn-primary span:contains("Submit")').click();


    cy.get('.ant-table-tbody').should('contain.text', 'my skills intro');

    cy.get('#root > section > main > div > div > div > div > div > div > div > table > tbody > tr:nth-child(1) > td:nth-child(3) > div > div:nth-child(2) > button')
    .click();
    
    cy.contains("span", "Yes").click();

  
  });
});
