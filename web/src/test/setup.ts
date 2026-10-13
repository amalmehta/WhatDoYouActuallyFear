import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

// jsdom doesn't implement scrolling.
window.scrollTo = () => {};
