import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  TableMdx,
  TableHeaderMdx,
  TableBodyMdx,
  TableFooterMdx,
  TableRowMdx,
  TableHeadMdx,
  TableCellMdx,
} from "../components/TableMdx.js";

describe("TableMdx", () => {
  it("renders full table structure", () => {
    const { container } = render(
      <TableMdx>
        <TableHeaderMdx>
          <TableRowMdx>
            <TableHeadMdx>Name</TableHeadMdx>
            <TableHeadMdx>Type</TableHeadMdx>
          </TableRowMdx>
        </TableHeaderMdx>
        <TableBodyMdx>
          <TableRowMdx>
            <TableCellMdx>title</TableCellMdx>
            <TableCellMdx>string</TableCellMdx>
          </TableRowMdx>
        </TableBodyMdx>
        <TableFooterMdx>
          <TableRowMdx>
            <TableCellMdx colSpan={2}>Footer</TableCellMdx>
          </TableRowMdx>
        </TableFooterMdx>
      </TableMdx>
    );
    expect(container.querySelector("table")).not.toBeNull();
    expect(container.querySelectorAll("th")).toHaveLength(2);
    expect(container.querySelectorAll("td")).toHaveLength(3);
  });

  it("passes style prop", () => {
    const { container } = render(
      <TableMdx style={{ color: "red" }}>
        <tbody>
          <tr>
            <td>x</td>
          </tr>
        </tbody>
      </TableMdx>
    );
    expect(container.querySelector("table")?.style.color).toBe("red");
  });

  it("TableHeadMdx defaults scope to col", () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <TableHeadMdx>H</TableHeadMdx>
          </tr>
        </thead>
      </table>
    );
    expect(container.querySelector("th")?.getAttribute("scope")).toBe("col");
  });

  it("TableHeadMdx accepts custom scope", () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <TableHeadMdx scope="row">H</TableHeadMdx>
          </tr>
        </thead>
      </table>
    );
    expect(container.querySelector("th")?.getAttribute("scope")).toBe("row");
  });
});
