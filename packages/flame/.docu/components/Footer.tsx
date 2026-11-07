import { getSocialLinks } from "../node/helpers";
import Social from "./Social";

export function Footer() {
  if (!getSocialLinks().length) return null;

  return (
    <footer className="text-muted-foreground mt-auto flex w-full items-center py-6">
      <Social />
    </footer>
  );
}
