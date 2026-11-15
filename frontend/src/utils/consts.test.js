const originalEnvironment = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnvironment };
  delete process.env.REACT_APP_BASE_URL;
});

afterEach(() => {
  process.env = originalEnvironment;
});

test.each([
  ["production", "production", "https://app.menteeglobal.org/"],
  ["production", "development", "https://mentee-dev.herokuapp.com/"],
  ["development", "development", "http://localhost:8000/"],
])("preserves existing %s/%s API origin", (nodeEnv, appEnv, expected) => {
  process.env.NODE_ENV = nodeEnv;
  process.env.REACT_APP_ENV = appEnv;

  expect(require("./consts").BASE_URL).toBe(expected);
});

test("preview uses its browser origin for HTTP and generated links", () => {
  process.env.NODE_ENV = "production";
  process.env.REACT_APP_BASE_URL = "auto";
  const { BASE_URL, API_URL, FRONT_BASE_URL } = require("./consts");

  expect(BASE_URL).toBe(`${window.location.origin}/`);
  expect(API_URL).toBe(`${window.location.origin}/api/`);
  expect(FRONT_BASE_URL).toBe(BASE_URL);
});

test("normalizes an explicit API origin", () => {
  process.env.REACT_APP_BASE_URL = "https://preview.example.org///";

  expect(require("./consts").BASE_URL).toBe("https://preview.example.org/");
});
