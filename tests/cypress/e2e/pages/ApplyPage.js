export class ApplyPage {
  url() {
    cy.url().then((url) => {
      const extendedURL = url + "/apply";
      cy.visit(extendedURL);
    });
    cy.url().should("include", "/apply");
  }
}
