// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFetch } from "@/lib/hooks";

describe("useFetch", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      )
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in loading state with null data", () => {
    const { result } = renderHook(() => useFetch<string[]>("/api/test"));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it("returns loading=false and data after fetch resolves with items", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(["a", "b"]),
        })
      )
    );

    const { result } = renderHook(() => useFetch<string[]>("/api/test"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(["a", "b"]);
    expect(result.current.error).toBeNull();
  });

  it("returns loading=false and empty array when API returns []", async () => {
    const { result } = renderHook(() => useFetch<string[]>("/api/test"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("distinguishes loading (null data) from loaded-empty ([] data)", async () => {
    let resolveFetch!: (v: unknown) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          })
      )
    );

    const { result } = renderHook(() => useFetch<string[]>("/api/test"));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    resolveFetch({ ok: true, json: () => Promise.resolve([]) });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([]);
  });
});
