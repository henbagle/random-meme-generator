import {Connection, Model} from "mongoose";
import {Router, Request, Response} from "express";
import {templateSchema, Template, textSchema, MemeText, MemeTextDocument, TemplateDocument} from "./lib/models";
import {loadDefaultTemplatesFromJson, sanitizeStringForUrl, escapeRegex} from "./lib/helpers"

interface RandomMemeOptions {
    textCollectionName: string,
    storeMemesInDB: boolean,
    templateCollectionName: string,
    textWildcardsAllowed: boolean,
    templateWildcard: string,
    textWildcard: string,
    textAlternateWildcard: string,
    apiUrl: string,
}

class RandomMemeGenerator{
    connection: Connection;
    options: RandomMemeOptions;

    memeModel: Model<TemplateDocument> | undefined;
    textModel: Model<MemeTextDocument>;
    localTemplates: Template[];

    constructor(connection: Connection, options: Partial<RandomMemeOptions> = {}, templates?: Template[])
    {
        this.connection = connection;

        // Load Options
        this.options = this.mergeOptionsWithDefaults(options);

        // Setup model
        this.textModel = connection.model(this.options.textCollectionName, textSchema);
        if(options.storeMemesInDB)
        {
            this.memeModel = connection.model(this.options.templateCollectionName, templateSchema);
            this.localTemplates = [];
        }
        else // use local meme templates
        {
            this.memeModel = undefined;
            if(templates)
            {
                this.localTemplates = templates;
            }
            else
            {
                this.localTemplates = loadDefaultTemplatesFromJson();
            }
        }
    }

    private mergeOptionsWithDefaults(options: Partial<RandomMemeOptions>) : RandomMemeOptions
    {
        const defaultOptions : RandomMemeOptions = {
            textCollectionName:"memeText",
            templateCollectionName: "memeTemplate",
            storeMemesInDB: false,
            textWildcardsAllowed: true,
            templateWildcard: '*',
            textWildcard: '*',
            textAlternateWildcard: "",
            apiUrl: 'https://api.memegen.link'
        }
        
        return {...defaultOptions, ...options};
    }

    async getRandomMemeUrl() : Promise<string>
    {
        const memeTemplate : Template = await this.getRandomMemeTemplate();

        // Count how many empty "slots" there are in the template
        const textCount = memeTemplate.lines.reduce((count, line) => {
            if(line == '') return count + 1;
            else return count + (line.match(new RegExp(escapeRegex(this.options.templateWildcard), "g")) || []).length;
        }, 0)

        // Get texts and fill in wildcards within text
        const memeTexts : MemeText[] = await this.getRandomMemeTexts(textCount);
        const finishedTexts : string[] = await this.processTexts(memeTexts);

        const lines = this.applyTextToTemplate(memeTemplate.lines, finishedTexts);

        if(lines.reduce((t, l) => (t+l+"/")).length > 200)
        {
            return this.getRandomMemeUrl();
        }

        // Create url from template
        return this.encodeUrl(lines, memeTemplate);
    }

    async getRandomMemeTemplate() : Promise<Template>
    {
        // Try to get a meme from the database
        const templatesFromDb : TemplateDocument[] | undefined = await this.memeModel?.aggregate([{$sample: {size: 1}}]);
        if(this.options.storeMemesInDB && templatesFromDb === undefined)
        {
            throw new Error("Unable to get template from database");
        }
        else if(this.options.storeMemesInDB && typeof templatesFromDb !== "undefined")
        {
            return templatesFromDb[0];
        }
        else
        {   
            // Get meme from local templates
            const templateId = Math.floor(Math.random() * this.localTemplates.length);
            return this.localTemplates[templateId];
        }
    }

    async getRandomMemeTexts(count: number = 1) : Promise<MemeTextDocument[]>
    {
        return await this.textModel.aggregate([{ $sample: { size: count } }])
    }

    private async processTexts(texts : MemeText[]) : Promise<string[]> 
    {
        return Promise.all(texts.map(async (t) => 
        {
            let text = t.text;
            if(this.options.textWildcardsAllowed)
            {
                // Fill wildcards in memetext with other memetext
                while(text.includes(this.options.textWildcard))
                {
                    const wildcardText : MemeText[] = await this.getRandomMemeTexts();
                    text = text.replace(new RegExp(escapeRegex(this.options.textWildcard), "g"), wildcardText[0].text);
                }

                if(this.options.textAlternateWildcard !== "")
                {
                    while(text.includes(this.options.textAlternateWildcard))
                    {
                        const wildcardText : MemeText[] = await this.getRandomMemeTexts();
                        text = text.replace(new RegExp(escapeRegex(this.options.textAlternateWildcard), "g"), wildcardText[0].text);
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

    encodeUrl(lines: string[], template: Template) : string
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

    // Express Middleware Router
    express() : Router
    {
        const router = Router();
        router.get("/", (req:Request, res:Response) => {
            this.getRandomMemeUrl().then((url) => {
                res.json({url})
            })
        })

        router.get("/memes", async (req:Request, res:Response) => {
            // Send all meme templates, either from database or local file
            if(this.options.storeMemesInDB)
            {
                res.json(await this.memeModel?.find({}));
            }   
            else
            {
                res.json(this.localTemplates);
            }
        })

        router.get("/text", async (req:Request, res:Response) => {
            // Send all possible text responses
            res.json(await this.textModel.find({}));
        })

        router.post("/", async (req:Request, res:Response) => {
            res.json(await this.textModel.create({text: req.body.text}));
        })

        router.delete("/text", async (req:Request, res:Response) => {
            res.json(await this.textModel.deleteOne({text: req.body.text}));
        })
        return router;
    }
}

export default RandomMemeGenerator;