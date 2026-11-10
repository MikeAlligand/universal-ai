import { describe, expect, it } from "vitest";
import { chatbotEndpoint } from "./deployment";
describe("chatbotEndpoint", () => {
  it("normalizes the API URL and encodes the slug", () => {
    expect(chatbotEndpoint(" https://api.example/ ", "my bot"))
      .toBe("https://api.example/b/my%20bot/chat");
  });
  it("rejects missing configuration", () => {
    expect(() => chatbotEndpoint("", "slug")).toThrow();
  });
});
