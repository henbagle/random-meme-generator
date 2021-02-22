import {sanitizeStringForUrl, loadDefaultTemplatesFromJson, escapeRegex} from "../lib/helpers"

test("Default templates get loaded from file", () => {
    const templates = loadDefaultTemplatesFromJson();

    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0].urlPrefix).toBeTruthy();
})

test("Spacer characters get swapped for replacements in string", () => {
    const input1 = "I like rocky-road.";
    const output1 = "I_like_rocky--road.";
    expect(sanitizeStringForUrl(input1)).toBe(output1);

    const input2 = `And I said: \\n "40/40% unsatisfied"` // Newline gets weird
    const output2 = "And_I_said:_~n_''40~s40~p_unsatisfied''";
    expect(sanitizeStringForUrl(input2)).toBe(output2);
})

test("EscapeRegex properly escapes common wildcard characters", () => {
    const wildcards = ["*", "#", "+"];
    const inputStrings = ["I'm still *", "I'm still #", "I'm still +"];
    const fill = "Alden";
    const outputString = "I'm still Alden";

    for(let i = 0; i < wildcards.length; i++)
    {
        const regexp = new RegExp(escapeRegex(wildcards[i]), "g");
        expect(inputStrings[i].replace(regexp, fill)).toBe(outputString);
    }
})