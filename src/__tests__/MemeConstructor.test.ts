import { triggerAsyncId } from "async_hooks";
import MemeConstructor from "../lib/MemeConstructor";
import { MemeText } from "../lib/models";

const options = {
    textWildcardsAllowed: true,
    templateWildcard: "*",
    textWildcard: ["*", "+"],
    apiUrl: "https://api.memegen.link",
};

const testTemplates = {
    ants: {
        memeTitle: "Do you want ants?",
        urlPrefix: "ants",
        lines: ["Do you want *?", "because that's how you get *"],
    },
    cmm: {
        memeTitle: "Change My Mind",
        urlPrefix: "cmm",
        lines: [""],
    },
    custom: {
        memeTitle: "Test Custom Meme - phoetograph",
        urlPrefix: "",
        customImg:
            "https://broumvirate.s3.amazonaws.com/bhotm/Oct20/Oct20Kai.jpg",
        lines: [" ", ""],
    },
    gru: {
        memeTitle: "Gru's plan",
        urlPrefix: "gru",
        lines: ["", "", "", "*_2"],
    },
    drake: {
        memeTitle: "drake",
        urlPrefix: "drake",
        lines: ["", ""],
    },
};

test("Blank template lines are correctly filled", async () => {
    const memeText1 = [{ text: "Alden Sucks" }];
    const template = testTemplates.cmm; // Stephen Crowder change my mind

    const mockCallback = jest.fn((count) => {
        return new Promise<MemeText[]>((resolve, reject) => {
            resolve(memeText1);
        });
    });

    const memeGen = new MemeConstructor(mockCallback, options);

    const url = await memeGen.getRandomMemeUrl(template);
    const urlOut = `${options.apiUrl}/images/${template.urlPrefix}/Alden_Sucks.png`;
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
    expect(url).toBe(urlOut);
});

test("Wildcards in template lines are correctly filled", async () => {
    const memeText1 = [{ text: "Bears" }, { text: "Rats" }];
    const template = testTemplates.ants; // Do you want ants? meme

    const mockCallback = jest.fn((count) => {
        return new Promise<MemeText[]>((resolve, reject) => {
            resolve(memeText1);
        });
    });

    const memeGen = new MemeConstructor(mockCallback, options);

    const url = await memeGen.getRandomMemeUrl(template);
    const urlOut = `${options.apiUrl}/images/${template.urlPrefix}/Do_you_want_Bears~q/because_that's_how_you_get_Rats.png`;
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(2);
    expect(url).toBe(urlOut);
});

test("Custom image templates produce correct url", async () => {
    const memeText1 = [{ text: "Phoetograph" }];
    const template = testTemplates.custom; // Do you want ants? meme

    const mockCallback = jest.fn((count) => {
        return new Promise<MemeText[]>((resolve, reject) => {
            resolve(memeText1);
        });
    });

    const memeGen = new MemeConstructor(mockCallback, options);

    const url = await memeGen.getRandomMemeUrl(template);
    const urlOut = `${options.apiUrl}/images/custom/_/Phoetograph.png?background=${template.customImg}`;
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
    expect(url).toBe(urlOut);
});

test("Memes with indexing wildcards work", async () => {
    const memeText1 = [
        { text: "Kai" },
        { text: "Alden" },
        { text: "Frog" },
        { text: "We never see this, but the code depends on it :(" },
    ];
    const template = testTemplates.gru; // Do you want ants? meme

    const mockCallback = jest.fn((count) => {
        return new Promise<MemeText[]>((resolve, reject) => {
            resolve(memeText1);
        });
    });

    const memeGen = new MemeConstructor(mockCallback, options);

    const url = await memeGen.getRandomMemeUrl(template);
    const urlOut = `${options.apiUrl}/images/${template.urlPrefix}/Kai/Alden/Frog/Frog.png`;
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(4);
    expect(url).toBe(urlOut);
});

test("Memes that exceed the maximum length get rejected", async () => {
    const memeText1 = [
        {
            text:
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        },
        {
            text:
                "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        },
    ];
    const memeText2 = [{ text: "Bears" }, { text: "Rats" }];
    const template = testTemplates.ants; // Do you want ants? meme

    const mockCallback = jest
        .fn()
        .mockImplementationOnce((count) => {
            return new Promise<MemeText[]>((resolve, reject) => {
                resolve(memeText1); // First call with super long memetext
            });
        })
        .mockImplementationOnce((count) => {
            return new Promise<MemeText[]>((resolve, reject) => {
                resolve(memeText2); // Should be called when first meme gets rejected
            });
        });

    const memeGen = new MemeConstructor(mockCallback, options);

    const url = await memeGen.getRandomMemeUrl(template);
    const urlOut = `${options.apiUrl}/images/${template.urlPrefix}/Do_you_want_Bears~q/because_that's_how_you_get_Rats.png`;
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenLastCalledWith(2);
    expect(url).toBe(urlOut);
});

test("Wildcards within memetext work", async () => {
    const memeText1 = [{ text: "Hello *" }, { text: "Howdy" }];
    const memeText2 = [{ text: "Alden" }];
    const template = testTemplates.drake; // Do you want ants? meme

    const mockCallback = jest
        .fn()
        .mockImplementationOnce((count) => {
            return new Promise<MemeText[]>((resolve, reject) => {
                resolve(memeText1); // First call with super long memetext
            });
        })
        .mockImplementationOnce((count) => {
            return new Promise<MemeText[]>((resolve, reject) => {
                resolve(memeText2); // Should be called when first meme gets rejected
            });
        });

    const memeGen = new MemeConstructor(mockCallback, options);

    const url = await memeGen.getRandomMemeUrl(template);
    const urlOut = `${options.apiUrl}/images/${template.urlPrefix}/Hello_Alden/Howdy.png`;
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenLastCalledWith(1);
    expect(url).toBe(urlOut);
});

test("Nested wildcards within memetext work", async () => {
    const memeTexts = [
        [{ text: "H*" }, { text: "Howdy" }], // Initial memetext based on template lines
        [{ text: "ald* + +" }], // Subsequent memetext wildcards
        [{ text: "or" }],
        [{ text: "frog" }],
    ];
    const template = testTemplates.drake; // Do you want ants? meme

    let i = 0;
    const mockCallback = jest.fn((count) => {
        i++;
        return new Promise<MemeText[]>((resolve, reject) => {
            resolve(memeTexts[i - 1]); // First call with super long memetext
        });
    });

    const memeGen = new MemeConstructor(mockCallback, options);

    const url = await memeGen.getRandomMemeUrl(template);
    const urlOut = `${options.apiUrl}/images/${template.urlPrefix}/Haldor_frog_frog/Howdy.png`;
    expect(mockCallback).toHaveBeenCalledTimes(4);
    expect(mockCallback).toHaveBeenLastCalledWith(1);
    expect(url).toBe(urlOut);
});
