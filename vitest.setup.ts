import { configure } from "@testing-library/react";

// Testing Library waits 1s by default for something to appear (findBy*,
// waitFor). The component tests with animated step changes and mocked network
// delays take well under that on a quiet machine, but not when the whole suite
// runs at once on a busy one, which made the pre-commit hook fail at random on
// different tests. A real failure still fails, just a few seconds later.
configure({ asyncUtilTimeout: 5000 });
