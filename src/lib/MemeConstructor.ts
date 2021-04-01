import { Template, MemeText, ConstructionOptions } from "./models";
import {sanitizeStringForUrl, escapeRegex} from "./helpers";

const MAXITERATIONS = 20;

class MemeConstructor {
    // Function provided by owner to collect a number of random meme texts
    getRandomTexts: (this: void, count: number) => Promise<MemeText[]>;
    options: ConstructionOptions;

    constructor(
        textFunction: (this: void, count: number) => Promise<MemeText[]>,
        options: ConstructionOptions
    ) {
        this.options = options;
        this.getRandomTexts = textFunction;
    }

    // Create a random meme url from an input template
    async getRandomMemeUrl(memeTemplate: Template): Promise<string> {
        
        // Count how many empty "slots" there are in the template
        const textCount = memeTemplate.lines.reduce((count, line) => {
            if (line == "") return count + 1;
            else
            {
                const regExp = new RegExp(escapeRegex(this.options.templateWildcard),"g");
                return (count + (line.match(regExp) || []).length);
            }
        }, 0);

        let lines: string[] = [];

        // Ensure meme is not too long
        do {
            // Get texts and fill in wildcards within text
            const memeTexts: MemeText[] = await this.getRandomTexts(textCount);
            const finishedTexts: string[] = await this.processTexts(memeTexts);

            lines = this.applyTextToTemplate(memeTemplate.lines, finishedTexts);
        } while (lines.reduce((t, l) => t + l + "/").length > 200);

        // Create url from template
        return this.encodeUrl(lines, memeTemplate);
    }

    // Extract texts and fill in any text wildcards
    private async processTexts(texts: MemeText[]): Promise<string[]> {
        return Promise.all(
            // Asynchronously iterate over all texts
            texts.map(async (t) => {
                let text = t.text;

                if (this.options.textWildcardsAllowed) {
                    // Fill wildcards in memetext with other memetext, iterating over all wildcards
                    for (let wildcard of this.options.textWildcard) {
                        const regExp = new RegExp(escapeRegex(wildcard), "g");
                        while (text.includes(wildcard)) {
                            const fillerMemeTexts = await this.getRandomTexts(1);
                            const fillerText = fillerMemeTexts[0].text;
                            text = text.replace(regExp, fillerText);
                        }
                    }
                }
                
                return text;
            })
        );
    }

    private applyTextToTemplate(templateLines: string[], texts: string[]): string[] {
        
        const iterator = texts[Symbol.iterator]();
        const wc = this.options.templateWildcard;

        // Enumerate over all template lines
        return templateLines.map((line) => {
            // Insert meme text if line is empty
            if (line === "") {
                let t = iterator.next();
                return t.done ? " " : t.value;
            } 
            // Otherwise, try to insert meme text into wildcards
            else {
                let iterations = 0;
                while (line.includes(wc) && iterations < MAXITERATIONS) {
                    iterations++;

                    // Handle specifying the index of the text with *_ indexing
                    if (line.includes(wc + "_")) {
                        const targetIndex = parseInt(
                            line[line.indexOf(wc + "_") + 2]
                        );
                        const replacementSymbol = wc + "_" + targetIndex;
                        line = line.replace(
                            replacementSymbol,
                            texts[targetIndex]
                        );
                    }

                    // Normal wildcard
                    else {
                        let t = iterator.next();
                        if (t.done) break;
                        else line = line.replace(wc, t.value);
                    }
                }
                return line;
            }
        });
    }

    private encodeUrl(lines: string[], template: Template): string {
        const url = new URL(this.options.apiUrl);

        const memeId = template.customImg ? "custom" : template.urlPrefix;
        const slug = lines.reduce((acc, el) => {
            return acc + "/" + sanitizeStringForUrl(el);
        }, "");
        url.pathname = `images/${memeId}${slug}.png`;

        // TODO: Make this use URLSearchParams
        url.search = template.customImg
            ? `?background=${template.customImg}`
            : "";

        return url.toString();
    }
}

export default MemeConstructor;