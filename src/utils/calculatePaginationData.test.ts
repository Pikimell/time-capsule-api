import { describe, expect, it } from "vitest";

import { calculatePaginationData } from "./calculatePaginationData";

describe("calculatePaginationData", () => {
  it("returns pagination metadata for the first page", () => {
    expect(calculatePaginationData(25, 1, 10)).toEqual({
      page: 1,
      perPage: 10,
      totalPages: 3,
      totalItems: 25,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it("returns pagination metadata for the last page", () => {
    expect(calculatePaginationData(20, 2, 10)).toEqual({
      page: 2,
      perPage: 10,
      totalPages: 2,
      totalItems: 20,
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });

  it("handles an empty result set", () => {
    expect(calculatePaginationData(0, 1, 10)).toEqual({
      page: 1,
      perPage: 10,
      totalPages: 0,
      totalItems: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });
});
