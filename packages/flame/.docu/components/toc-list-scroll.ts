/** A scrollable list's box, in viewport pixels (from getBoundingClientRect). */
export interface ListBox {
  /** Top edge of the list's content box */
  top: number;
  /** Visible height (clientHeight) */
  height: number;
  scrollTop: number;
  scrollHeight: number;
}

/** An entry's box in the list, in viewport pixels. */
export interface EntryBox {
  top: number;
  height: number;
}

/**
 * Where a scrollable table of contents list should scroll so an entry shows.
 *
 * - "center" puts the entry in the middle of the list. The mobile bar uses
 *   it when the list opens, so a reader near the end of the page lands on
 *   the active heading instead of the top of a long list.
 * - "nearest" moves only as far as needed and returns null when the entry
 *   is already in view. The bar uses it while the list stays open, so it
 *   follows the active heading without fighting the reader's own scrolling.
 *
 * The result is clamped to the list's scroll range.
 *
 * @param margin space kept between the entry and the list's edge for "nearest"
 */
export function revealScrollTop(
  list: ListBox,
  entry: EntryBox,
  align: "center" | "nearest",
  margin = 8
): number | null {
  const max = Math.max(0, list.scrollHeight - list.height);
  // The entry's position in the list's scroll space
  const entryTop = entry.top - list.top + list.scrollTop;
  let target: number;
  if (align === "center") {
    target = entryTop - (list.height - entry.height) / 2;
  } else if (entryTop - margin < list.scrollTop) {
    target = entryTop - margin;
  } else if (entryTop + entry.height + margin > list.scrollTop + list.height) {
    target = entryTop + entry.height + margin - list.height;
  } else {
    return null;
  }
  return Math.min(max, Math.max(0, Math.round(target)));
}
