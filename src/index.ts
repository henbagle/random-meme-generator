import {Connection, Model} from "mongoose";
import {Router, Request, Response} from "express";
import {templateSchema, Template, textSchema, MemeText, MemeTextDocument, TemplateDocument} from "./models";
import {loadDefaultTemplatesFromJson, sanitizeStringForUrl} from "./helpers"

interface RandomMemeOptions {
    textCollectionName?: string,
    storeMemesInDB?: boolean,
    templateCollectionName?: string,
    textWildcardsAllowed?: boolean,
    templateWildcard?: string,
    textWildcard?: string,
    apiUrl?: string,
    pathToTemplates?: string,
}

class RandomMemeGenerator{
    connection: Connection;
    options: RandomMemeOptions;

    memeModel: Model<TemplateDocument> | undefined;
    textModel: Model<MemeTextDocument>;
    localTemplates: Template[];

    constructor(connection: Connection, options: RandomMemeOptions = {})
    {
        this.connection = connection;
        this.options = options;

        // Set default options
        this.options.apiUrl = options.apiUrl || "https://api.memegen.link/images/";
        this.options.templateWildcard = options.templateWildcard || "*"
        this.options.textWildcard = options.textWildcard || "*"
        this.options.textWildcardsAllowed = options.textWildcardsAllowed || true;

        // Setup model
        this.textModel = connection.model(options.textCollectionName || "memeText", textSchema);
        if(options.storeMemesInDB)
        {
            this.memeModel = connection.model(options.templateCollectionName || "memeTemplate", templateSchema);
            this.localTemplates = [];
        }
        else{
            this.memeModel = undefined;
            this.localTemplates = loadDefaultTemplatesFromJson();
        }
    }

    getRandomMeme() : string
    {
        return '';
    }

    private async getRandomMemeTemplate() : Promise<Template>
    {
        const template : TemplateDocument[] | undefined = await this.memeModel?.aggregate([{$sample: {size: 1}}]);
        if(this.options.storeMemesInDB && template === undefined)
        {
            throw new Error("Unable to get template from database");
        }
        else if(this.options.storeMemesInDB && typeof template !== "undefined")
        {
            return template[0];
        }
        else
        {   
            // Get meme from json file
            return {
                memeTitle: "test",
                urlPrefix: "test",
                lines: [
                    " ",
                    ""
                ]
            };
        }
    }

    private async getRandomMemeTexts(count: number = 1) : Promise<MemeTextDocument[]>
    {
        return await this.textModel.aggregate([{ $sample: { size: count } }])
    }

    express() : Router
    {
        const router = Router();
        router.get("/", (req:Request, res:Response) => {
            res.json({url: this.getRandomMeme()});
        })

        router.get("/memes", function(req:Request, res:Response) {

        })

        router.get("/text", function(req:Request, res:Response) {
            
        })

        router.post("/text", function(req:Request, res:Response) {
            
        })

        router.delete("/text", function(req:Request, res:Response) {
            
        })
        return router;
    }
}

export default RandomMemeGenerator;