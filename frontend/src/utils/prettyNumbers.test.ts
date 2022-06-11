import { pn } from "./prettyNumbers";

describe("prettyNumbers", () => {
  test("pn()", () => {
    [
      {input: null, output: undefined},
      {input: undefined, output: undefined},
      {input: 0, output: "0"},
      {input: 1, output: "1"},
      {input: 2, output: "2"},
      {input: 10, output: "10"},
      {input: 11, output: "11"},
      {input: 11.0, output: "11"},
      {input: 12.0, output: "12"},
      {input: 100.50, output: "100.5"},
      {input: 224.56, output: "224.56"},
      {input: 1567, output: "1,567"},
      {input: 15678, output: "15,678"},
      {input: 2984.99, output: "2,984.99"},
      {input: 100000.00, output: "100,000"},
    ].forEach((it) => {
      const response = pn(it.input);
      expect(response).toBe(it.output);
    });
  });
})
