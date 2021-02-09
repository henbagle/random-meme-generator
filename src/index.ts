import {Connection, Model} from "mongoose";
import {Router, Request, Response} from "express";
import {templateSchema, Template, textSchema, MemeText, MemeTextDocument, TemplateDocument} from "./models";
import {loadDefaultTemplatesFromJson, sanitizeStringForUrl} from "./helpers"
import { throws } from "assert";

interface RandomMemeOptions {
    textCollectionName?: string,
    storeMemesInDB?: boolean,
    templateCollectionName?: string,
    textWildcardsAllowed?: boolean,
    templateWildcard?: string,
    textWildcard?: string,
    apiUrl?: string,
}

class RandomMemeGenerator{
    connection: Connection;
    options: RandomMemeOptions;

    memeModel: Model<TemplateDocument> | undefined;
    textModel: Model<MemeTextDocument>;
    localTemplates: Template[];

    constructor(connection: Connection, options: RandomMemeOptions = {}, templates?: Template[])
    {
        this.connection = connection;

        // Load Options
        this.options = this.mergeOptionsWithDefaults(options);

        // Setup model
        this.textModel = connection.model(this.options.textCollectionName as string, textSchema);
        if(options.storeMemesInDB)
        {
            this.memeModel = connection.model(this.options.templateCollectionName as string, templateSchema);
            this.localTemplates = [];
        }
        else
        {
            this.memeModel = undefined;
            // Assign templates
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

    private mergeOptionsWithDefaults(options: RandomMemeOptions) : RandomMemeOptions
    {
        const defaultOptions : RandomMemeOptions = {
            textCollectionName:"memeText",
            templateCollectionName: "memeTemplate",
            storeMemesInDB: false,
            textWildcardsAllowed: true,
            templateWildcard: '*',
            textWildcard: '*',
            apiUrl: ''
        }
        
        return {...defaultOptions, ...options};
    }

    getRandomMeme() : string
    {
        return '';
    }

    private async getRandomMemeTemplate() : Promise<Template>
    {
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

    private async getRandomMemeTexts(count: number = 1) : Promise<MemeTextDocument[]>
    {
        return await this.textModel.aggregate([{ $sample: { size: count } }])
    }

    // Express Middleware Router
    express() : Router
    {
        const router = Router();
        router.get("/", (req:Request, res:Response) => {
            res.json({url: this.getRandomMeme()});
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

        router.post("/text", (req:Request, res:Response)  => {
            
        })

        router.delete("/text", function(req:Request, res:Response) {
            
        })
        return router;
    }
}

export default RandomMemeGenerator;