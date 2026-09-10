import { hydrateRoot } from "react-dom/client";
import React from "react";
import { ThemeToggle } from "../components/Theme";

const root = document.getElementById("theme-toggle-island");
if (root) hydrateRoot(root, React.createElement(ThemeToggle));
