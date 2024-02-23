describe("Registration for mentee", () => {
  it("Check validations ", () => {
    cy.visit("/apply");

    const userEmail = "testa24@example.com";
    cy.get("#email").type(userEmail);
    //checking select fro Mentee
    cy.get("#role").click();
    cy.wait(1000);
    cy.contains("Mentee").click();
    // click submit button
    cy.get("#submit").click();
    cy.wait(1000);
    cy.get("#select_mentee").click({
      force: true,
    });
    cy.wait(1000);
    //////  now checking the validations on input fields

    cy.get('#submit').click();
    cy.wait(1000);
    cy.get('#submit').click();

    cy.get("#firstName").should("be.visible");
    cy.get("#firstName").type("John Doe");
    cy.get("#firstName").clear();
    cy.get("label[for='firstName']").should(
      "have.text",
      "First Name"
    );
    cy.get("label[for='immigrantStatus']").should("be.visible");
    cy.get("label[for='immigrantStatus']").should(
      "have.text",
      "Let us know more about you. Check ALL of the boxes that apply. When filling out other, please be very specific."
    );
    cy.get("label[for='country']").should("be.visible");
    cy.get("label[for='country']").should(
      "have.text",
      "Country"
    );
    cy.get("label[for='genderIdentification']").should("be.visible");
    cy.get("label[for='genderIdentification']").should(
      "have.text",
      "What do you identify as?"
    );

    cy.get("label[for='language']").should("be.visible");
    cy.get("label[for='language']").should(
      "have.text",
      "Preferred Language(s)"
    );
    
    cy.get("label[for='topics']").should("be.visible");
    cy.get("label[for='topics']").should(
      "have.text",
      "What special topics would you be interested in? If one is not on the list please add it in other:"
    );
    
    cy.get("label[for='workstate']").should('be.visible');
    cy.get("label[for='workstate']").should('have.text', "What do you currently do? Please check ALL the options that apply to you. If you select ''other'', please be specific:");
    
    cy.get("label[for='socialMedia']").should("be.visible");
    cy.get("label[for='socialMedia']").should(
      "have.text",
      "Would you be interested in being highlighted as one of our mentees on social media?"
    );
        // Check if the first radio button option contains the text 'Yes!'
        cy.get("#socialMedia > :nth-child(1) > :nth-child(2)")
        .eq(0)
        .should("contain.text", "Yes!");
  
      // Check if the second radio button option contains the text 'No, thank you'
      cy.get('#socialMedia > :nth-child(2) > :nth-child(2)')
      .should("contain.text", "No, thank you");
  
  
      // Check if the third radio button option contains the text 'Other'
      cy.get("#socialMedia > :nth-child(3) > :nth-child(2)")
        .should("contain.text", "Other");

        cy.get("label[for='questions']").should("be.visible");
        cy.get("label[for='questions']").should(
          "have.text",
          "Do you have any questions?"
        );
        cy.get("label[for='partner']").should("be.visible");
        cy.get("label[for='partner']").should(
          "have.text",
          "If you are currently affiliated to a partner organization, please select it from the below list, or select no-affiliation."
        );
  });

  it("Allow a user to Register as a Mentee", () => {
    cy.visit("/apply");

    const userEmail = "testa43@example.com";
    cy.get("#email").type(userEmail);
    //checking select fro Mentee
    cy.get(".ant-select-selection-search-input").click();
    cy.contains("Mentee").click();
    // click submit button
    cy.get(".ant-btn").click();
    cy.wait(1000);
    cy.get(".ant-select-selection-item").click({
      force: true,
    });

    cy.get("body").then(($body) => {
      // Check if the element exists
      if ($body.find("#firstName").length) {
        // Now check if it's visible
        cy.get("#firstName").then(($el) => {
          if ($el.is(":visible")) {
            cy.get("#firstName").type("alex");
            cy.get("#lastName").type("john");
            cy.get("#organization").type("capregsoft");
            cy.get("#age").click();
            cy.contains("I am 27-30").click();
            cy.get("#immigrantStatus").click();
            cy.get("#immigrantStatus").type("{downarrow}{downarrow}{enter}");
            cy.get("#immigrantStatus").click();
            cy.get("#country").type("Italy", { force: true });
            cy.get("#genderIdentification").click();
            cy.contains("as a man").click();
            cy.get("#language").click();
            cy.contains("English").click();
            cy.get("#topics").click();
            cy.get("#topics").type("{downarrow}{downarrow}{enter}");
            cy.get("#workstate").click({ force: true });
            cy.get("#workstate").type("{downarrow}{downarrow}{enter}");
            cy.get('input[value="yes"]').click({ force: true });
            cy.get("#questions").type("Will this give me desired income?");
            cy.get('button.ant-btn[type="submit"]').click();
          } else {
            // If not visible, log a message
            cy.log("User Already exists");
          }
        });
      } else {
        // If the element does not exist, log a message
        cy.log("User Already exixts.");
      }
    });
  });
});
