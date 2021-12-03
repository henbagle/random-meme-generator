import {Connection, Model, PromiseProvider} from "mongoose";
import {Router, Request, Response, NextFunction} from "express";
import {
    templateSchema,
    CustomTemplate,
    textSchema,
    ConstructionOptions,
    MemeTextDocument,
    TemplateDocument,
} from "./lib/models";
import {loadDefaultTemplatesFromJson} from "./lib/helpers"
import MemeConstructor from "./lib/MemeConstructor";
import { MemeProvider } from "./lib/MemeProvider";

interface RandomMemeOptions {
    textCollectionName: string;
    storeMemesInDB: boolean;
    templateCollectionName: string;
    textWildcardsAllowed: boolean;
    templateWildcard: string;
    textWildcard: string[] | string;
    apiUrl: string;
    expressMiddleware: (
        req: Request,
        res: Response,
        next: NextFunction
    ) => void;
}

class RandomMemeGenerator{
    options: RandomMemeOptions;
    provider: MemeProvider;
    localMemeTexts: string[] = [];

    memeConstructor: MemeConstructor;

    constructor(options: Partial<RandomMemeOptions> = {}, provider?: MemeProvider)
    {

        // Load Options
        this.options = this.mergeOptionsWithDefaults(options);
        this.provider = provider ?? this.getDefaultProvider();

        // Initialize meme constructor
        this.memeConstructor = new MemeConstructor(this.provider, this.options as ConstructionOptions);
    }

    async getRandomMemeUrl() : Promise<string>
    {
        const memeTemplate : CustomTemplate = await this.provider.getRandomMemeTemplate();
        return this.memeConstructor.getRandomMemeUrl(memeTemplate);
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

        if (typeof options.textWildcard === "string")
            options.textWildcard = [options.textWildcard];
        return {...defaultOptions, ...options};
    }

    private getDefaultProvider(): MemeProvider {
        throw new Error("Function not implemented.");
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
            res.json(await this.provider.getAllMemeTemplates());
        })

        router.get("/text", this.options.expressMiddleware, async (req:Request, res:Response) => {
            // Send all possible text responses
            res.json(await this.provider.getAllMemeText());
        })

        router.post("/text", this.options.expressMiddleware, async (req:Request, res:Response) => {
            res.json(await this.provider.addMemeText(req.body.text));
        })

        router.delete("/text", this.options.expressMiddleware, async (req:Request, res:Response) => {
            res.json(await this.provider.deleteMemeText(req.body.text));
        })
        return router;
    }
}

export default RandomMemeGenerator;

