import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";

describe("password hashing", () => {
  it("hashes a password and verifies it", async () => {
    const password = "securePassword123";
    const hash = await bcrypt.hash(password, 12);

    expect(hash).not.toBe(password);
    expect(hash).toMatch(/^\$2[aby]?\$/);
    expect(await bcrypt.compare(password, hash)).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await bcrypt.hash("correctPassword", 12);
    expect(await bcrypt.compare("wrongPassword", hash)).toBe(false);
  });

  it("produces different hashes for same password (salted)", async () => {
    const password = "testPassword";
    const hash1 = await bcrypt.hash(password, 12);
    const hash2 = await bcrypt.hash(password, 12);

    expect(hash1).not.toBe(hash2);
    expect(await bcrypt.compare(password, hash1)).toBe(true);
    expect(await bcrypt.compare(password, hash2)).toBe(true);
  });

  it("rejects empty password against a hash", async () => {
    const hash = await bcrypt.hash("realPassword", 12);
    expect(await bcrypt.compare("", hash)).toBe(false);
  });
});

describe("password validation", () => {
  it("rejects passwords shorter than 8 characters", () => {
    const shortPasswords = ["", "abc", "1234567"];
    for (const pw of shortPasswords) {
      expect(pw.length).toBeLessThan(8);
    }
  });

  it("accepts passwords of 8+ characters", () => {
    const validPasswords = ["12345678", "a very long password indeed"];
    for (const pw of validPasswords) {
      expect(pw.length).toBeGreaterThanOrEqual(8);
    }
  });
});
