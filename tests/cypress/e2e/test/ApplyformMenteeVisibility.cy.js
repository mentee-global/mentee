describe("Apply Form fot Mentee visibility", () => {
  it("should navigate to the correct URL on clicking the anchor tag", () => {
    cy.visit("/apply");

    const userEmail = "test6@example.com";
    cy.get(".ant-input.ant-input-lg.css-wxm1m1").type(userEmail);
    //checking select fro Mentee
    cy.get(".ant-select-selection-search-input").click();
    cy.contains("Mentee").click();
    // click submit button
    cy.get(".ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg").click();
    cy.wait(1000);
    cy.get(".ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg").click({
      force: true,
    });

    cy.get(
      "a .ant-space.css-wxm1m1.ant-space-horizontal.ant-space-align-center"
    ).click();

    cy.url().should("include", "/");
  });

  it("check the visibilty of form for mentee", () => {
    cy.visit("/apply");

    const userEmail = "testa@example.com";
    cy.get(".ant-input.ant-input-lg.css-wxm1m1").type(userEmail);
    //checking select fro Mentee
    cy.get(".ant-select-selection-search-input").click();
    cy.contains("Mentee").click();
    // click submit button
    cy.get(".ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg").click();
    cy.wait(1000);
    cy.get(".ant-btn.css-wxm1m1.ant-btn-primary.ant-btn-lg").click({
      force: true,
    });

    cy.get("#root > section > main > div > div > article > h2")
      .invoke("text")
      .then((text) => {
        const trimmedText = text.trim();
        expect(trimmedText).to.equal("Welcome to MENTEE!");
      });

    cy.get('label[for="firstName"].ant-form-item-required').should(
      "have.text",
      "First Name"
    );

    cy.get('label[for="lastName"].ant-form-item-required').should(
      "have.text",
      "Last Name"
    );

    cy.get('label[for="organization"].ant-form-item-required').should(
      "have.text",
      "What organization is supporting you locally or what organization are you affiliated with?"
    );

    cy.get('label[for="age"].ant-form-item-required').should(
      "have.text",
      "Let us know more about you"
    );

    cy.get(
      'div.ant-col.ant-form-item-label.css-wxm1m1 label[for="immigrantStatus"]'
    ).should(
      "have.text",
      "Let us know more about you. Check ALL of the boxes that apply. When filling out other, please be very specific."
    );

    cy.get('label[for="country"]').should(
      "have.text",
      "What country are you or your family originally from, if you are a refugee or immigrant?"
    );

    cy.get(
      'div.ant-col.ant-form-item-label.css-wxm1m1 label[for="genderIdentification"]'
    ).should("have.text", "What do you identify as?");

    cy.get(
      'div.ant-col.ant-form-item-label.css-wxm1m1 label[for="language"]'
    ).should("have.text", "What is your native language?");

    cy.get(
      'div.ant-col.ant-form-item-label.css-wxm1m1 label[for="topics"]'
    ).should(
      "have.text",
      "What special topics would you be interested in? If one is not on the list please add it in other:"
    );

    // Check if the label for 'workstate' contains the expected text
    cy.get('label[for="workstate"]').should(
      "have.text",
      "What do you currently do? Please check ALL the options that apply to you. If you select ''other'', please be specific:"
    );

    // Check if the label for 'socialMedia' contains the expected text
    cy.get(
      'div.ant-col.ant-form-item-label.css-wxm1m1 label[for="socialMedia"]'
    ).should(
      "have.text",
      "Would you be interested in being highlighted as one of our mentees on social media?"
    );

    // Check if the first radio button option contains the text 'Yes!'
    cy.get("#socialMedia .ant-radio-wrapper")
      .eq(0)
      .should("contain.text", "Yes!");

    // Check if the second radio button option contains the text 'No, thank you'
    cy.get("#socialMedia .ant-radio-wrapper")
      .eq(1)
      .should("contain.text", "No, thank you");

    // Check if the third radio button option contains the text 'Other'
    cy.get("#socialMedia .ant-radio-wrapper")
      .eq(2)
      .should("contain.text", "Other");

    // Check if the label for 'questions' contains the text 'Do you have any questions?'
    cy.get(
      'div.ant-col.ant-form-item-label.css-wxm1m1 label[for="questions"]'
    ).should("have.text", "Do you have any questions?");
  });
});
