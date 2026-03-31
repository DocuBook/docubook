import type { ComponentType } from "react";
import Outlet from "./Outlet";

export const customMdxComponents: Record<string, ComponentType<any>> = {
    Outlet,
};
