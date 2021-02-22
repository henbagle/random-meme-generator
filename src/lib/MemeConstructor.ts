import {Template, MemeText} from "./models";
import {sanitizeStringForUrl, escapeRegex} from "./helpers";

interface ConstructionOptions {
    textWildcardsAllowed: boolean,
    templateWildcard: string,
    textWildcard: string[],
    apiUrl: string,
}

class MemeConstructor
{
    // Function provided by owner to collect a number of random meme texts
    getRandomTexts : (this: void, count:number) => Promise<MemeText[]>;
    options: ConstructionOptions;

    constructor(textFunction: (this: void, count:number) => Promise<MemeText[]>, options: ConstructionOptions)
    {
        this.options = options;
        this.getRandomTexts = textFunction;
    }

    // Create a random meme url from an input template
    async getRandomMemeUrl(memeTemplate: Template) : Promise<string>
    {
        // Count how many empty "slots" there are in the template
        const textCount = memeTemplate.lines.reduce((count, line) => {
            if(line == '') return count + 1;
            else return count + (line.match(new RegExp(escapeRegex(this.options.templateWildcard), "g")) || []).length;
        }, 0)

        let lines: string[] = [];

        // Ensure meme is not too long
        do
        {
            // Get texts and fill in wildcards within text
            const memeTexts : MemeText[] = await this.getRandomTexts(textCount);
            const finishedTexts : string[] = await this.processTexts(memeTexts);
    
            lines = this.applyTextToTemplate(memeTemplate.lines, finishedTexts);
        }
        while (lines.reduce((t, l) => (t+l+"/")).length > 200)

        // Create url from template
        return this.encodeUrl(lines, memeTemplate);
    }

    // Extract texts and fill in any text wildcards
    private async processTexts(texts : MemeText[]) : Promise<string[]> 
    {
        return Promise.all(texts.map(async (t) => 
        {
            let text = t.text;
            if(this.options.textWildcardsAllowed)
            {
                // Fill wildcards in memetext with other memetext, iterating over all wildcards
                for(let wildcard in this.options.textWildcard)
                {
                    const regExp = new RegExp(escapeRegex(wildcard), "g")
                    while(text.includes(wildcard))
                    {
                        const fillerMemeTexts : MemeText[] = await this.getRandomTexts(1);
                        const fillerText = fillerMemeTexts[0].text;
                        text = text.replace(regExp, fillerText);
                    }
                }
            }
            return text
        }));
    }

    private applyTextToTemplate(templateLines: string[], texts: string[]) : string[] {
        const iterator = texts[Symbol.iterator]();

        // Enumerate over all template lines
        return templateLines.map((line) => {
            // Insert meme text if line is empty
            if(line === "") {
                let t = iterator.next();
                return (t.done ? " " : t.value);
            }
            else {
                // Insert meme text into wildcards otherwise
                while(line.includes(this.options.templateWildcard)) {
                    // Handle specifying the index of the text with *_1
                    if(line.includes(this.options.templateWildcard + "_")){
                        const i = parseInt(line[line.indexOf(this.options.templateWildcard + "_")+2])
                        line = line.replace(this.options.templateWildcard+"_"+i, texts[i]);
                    }
                    // Normal wildcard
                    else{
                        let t = iterator.next();
                        if(t.done) break;
                        else line = line.replace(this.options.templateWildcard, t.value);
                    }
                }
                return line;
            }
        })
    }

    private encodeUrl(lines: string[], template: Template) : string
    {
        let url = `${this.options.apiUrl}/images/${template.urlPrefix}`;
        if(template.customImg)
        {
            url = `${this.options.apiUrl}/images/custom`;
        }
        const slug = lines.reduce((acc, next) => {
            return acc + '/' + sanitizeStringForUrl(next);
        }, "")
        url = url + slug + ".png";

        if(template.customImg)
        {
            url = url + `?background=${template.customImg}`;
        }

        return url;
    }
}

export default MemeConstructor;