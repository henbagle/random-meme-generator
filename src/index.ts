import {Connection, Model} from "mongoose";
import {Router, Request, Response, NextFunction} from "express";
import {templateSchema, Template, textSchema, MemeText, MemeTextDocument, TemplateDocument} from "./lib/models";
import {loadDefaultTemplatesFromJson} from "./lib/helpers"
import MemeConstructor from "./lib/MemeConstructor";

interface RandomMemeOptions {
    textCollectionName: string,
    storeMemesInDB: boolean,
    templateCollectionName: string,
    textWildcardsAllowed: boolean,
    templateWildcard: string,
    textWildcard: string[],
    apiUrl: string,
    expressMiddleware: (req: Request, res: Response, next: NextFunction) => void
}

class RandomMemeGenerator{
    connection: Connection;
    options: RandomMemeOptions;

    memeModel: Model<TemplateDocument> | undefined;
    textModel: Model<MemeTextDocument>;
    localTemplates: Template[];
    localMemeTexts: string[] = [];

    memeConstructor: MemeConstructor;

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

        // Initialize meme constructor
        this.memeConstructor = new MemeConstructor((count) => {
            return this.getRandomMemeTexts(count);
        }, this.options);
    }

    private mergeOptionsWithDefaults(options: Partial<RandomMemeOptions>) : RandomMemeOptions
    {
        const defaultOptions : RandomMemeOptions = {
            textCollectionName:"memeText",
            templateCollectionName: "memeTemplate",
            storeMemesInDB: false,
            textWildcardsAllowed: true,
            templateWildcard: '*',
            textWildcard: ['*'],
            apiUrl: 'https://api.memegen.link',
            expressMiddleware: function (req, res, next) {
                next();
            }
        }
        
        return {...defaultOptions, ...options};
    }

    async getRandomMemeUrl() : Promise<string>
    {
        const memeTemplate : Template = await this.getRandomMemeTemplate();
        return this.memeConstructor.getRandomMemeUrl(memeTemplate);
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

    async getRandomMemeTexts(count: number) : Promise<MemeTextDocument[]>
    {
        return await this.textModel.aggregate([{ $sample: { size: count } }])
    }

    // Express Middleware Router
    express() : Router
    {
        const router = Router();
        router.get("/", this.options.expressMiddleware, (req:Request, res:Response) => {
            this.getRandomMemeUrl().then((url) => {
                res.json({url})
            })
        })

        router.get("/memes", this.options.expressMiddleware, async (req:Request, res:Response) => {
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

        router.get("/text", this.options.expressMiddleware, async (req:Request, res:Response) => {
            // Send all possible text responses
            res.json(await this.textModel.find({}));
        })

        router.post("/text", this.options.expressMiddleware, async (req:Request, res:Response) => {
            res.json(await this.textModel.create({text: req.body.text}));
        })

        router.delete("/text", this.options.expressMiddleware, async (req:Request, res:Response) => {
            res.json(await this.textModel.deleteOne({text: req.body.text}));
        })
        return router;
    }
}

export default RandomMemeGenerator;