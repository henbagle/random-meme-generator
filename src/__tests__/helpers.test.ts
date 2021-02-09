import { assert } from "console"
import { textSpanContainsPosition } from "typescript"
import {sanitizeStringForUrl} from "../lib/helpers"

test("Spacer characters get swapped for replacements in string", () => {
    const input1 = "I like rocky-road.";
    const output1 = "I_like_rocky--road.";
    expect(sanitizeStringForUrl(input1)).toBe(output1);
})