import { triggerAsyncId } from "async_hooks";
import MemeConstructor from "../lib/MemeConstructor";
import MemeProvider from "../lib/MemeProvider";
import { MemeTemplate, MemeText } from "../lib/memeUnits";

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
    const template = testTemplates.cmm;

    const [memeGen, mock] = makeConstructorReturningMemes(memeText1);

    const url = await memeGen.getRandomMemeUrl(template);
    const urlOut = `${options.apiUrl}/images/${template.urlPrefix}/Alden_Sucks.png`;

    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(1);
    expect(url).toBe(urlOut);
});

test("Wildcards in template lines are correctly filled", async () => {
    const memeText1 = [{ text: "Bears" }, { text: "Rats" }];
    const template = testTemplates.ants;

    const [memeGen, mock] = makeConstructorReturningMemes(memeText1);

    const url = await memeGen.getRandomMemeUrl(template);
    const urlOut = `${options.apiUrl}/images/${template.urlPrefix}/Do_you_want_Bears~q/because_that's_how_you_get_Rats.png`;

    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(2);
    expect(url).toBe(urlOut);
});

test("Custom image templates produce correct url", async () => {
    const memeText1 = [{ text: "Phoetograph" }];
    const template = testTemplates.custom;

    const [memeGen, mock] = makeConstructorReturningMemes(memeText1);

    const url = await memeGen.getRandomMemeUrl(template);
    const urlOut = `${options.apiUrl}/images/custom/_/Phoetograph.png?background=${template.customImg}`;
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(1);
    expect(url).toBe(urlOut);
});

test("Memes with indexing wildcards work", async () => {
    const memeText1 = [
        { text: "Kai" },
        { text: "Alden" },
        { text: "Frog" },
        { text: "We never see this, but the code depends on it :(" },
    ];
    const template = testTemplates.gru;

    const [memeGen, mock] = makeConstructorReturningMemes(memeText1);

    const url = await memeGen.getRandomMemeUrl(template);
    const urlOut = `${options.apiUrl}/images/${template.urlPrefix}/Kai/Alden/Frog/Frog.png`;
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(4);
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
    ];;
    const memeText2 = [{ text: "Bears" }, { text: "Rats" }];
    const template = testTemplates.ants;

    const mockCallback = jest.fn()
        .mockImplementationOnce(createMockFn(memeText1)) // First memetext with super long length
        .mockImplementationOnce(createMockFn(memeText2)); // Should be called when first memetext gets rejected

    const memeGen = makeConstructorWithMock(mockCallback);

    const url = await memeGen.getRandomMemeUrl(template);
    const urlOut = `${options.apiUrl}/images/${template.urlPrefix}/Do_you_want_Bears~q/because_that's_how_you_get_Rats.png`;;;
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenLastCalledWith(2);
    expect(url).toBe(urlOut);
});

test("Wildcards within memetext work", async () => {
    const memeText1 = [{ text: "Hello *" }, { text: "Howdy" }];
    const memeText2 = [{ text: "Alden" }];
    const template = testTemplates.drake;

    const mockCallback = jest.fn()
        .mockImplementationOnce(createMockFn(memeText1)) // First call containing wildcards
        .mockImplementationOnce(createMockFn(memeText2)); // Call to fill in the wildcards

    const memeGen = makeConstructorWithMock(mockCallback);

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

    const memeGen = makeConstructorWithMock(mockCallback);

    const url = await memeGen.getRandomMemeUrl(template);
    const urlOut = `${options.apiUrl}/images/${template.urlPrefix}/Haldor_frog_frog/Howdy.png`;
    expect(mockCallback).toHaveBeenCalledTimes(4);
    expect(mockCallback).toHaveBeenLastCalledWith(1);
    expect(url).toBe(urlOut);
});

type textResolverMock = jest.Mock<Promise<MemeText[]>, [count: number]>;

const makeConstructorWithMock = (mock : textResolverMock) => new MemeConstructor(new FakeMemeProvider(mock), options);

const makeConstructorReturningMemes = (memes : MemeText[]) : [MemeConstructor, textResolverMock] => {
    const mock = jest.fn(createMockFn(memes));
    const mc = makeConstructorWithMock(mock);
    return [mc, mock];
}

const createMockFn = (memes: MemeText[]) => {
    return (count: number) => {
        return new Promise<MemeText[]>((resolve, reject) => {
            resolve(memes);
        });
    };
};

class FakeMemeProvider extends MemeProvider
{
    mock;
    constructor(mock : textResolverMock) {
        super();
        this.mock = mock;
    }
    getRandomMemeText(count: number): Promise<MemeText[]> {
        return this.mock(count);
    }
    getRandomMemeTemplate(): Promise<MemeTemplate> {
        throw new Error("Method not implemented.");
    }
    getAllMemeTemplates(): Promise<MemeTemplate[]> {
        throw new Error("Method not implemented.");
    }
    getAllMemeText(): Promise<MemeText[]> {
        throw new Error("Method not implemented.");
    }
    addMemeText(text: string): Promise<any> {
        throw new Error("Method not implemented.");
    }
    deleteMemeText(text: string): Promise<any> {
        throw new Error("Method not implemented.");
    }
}
