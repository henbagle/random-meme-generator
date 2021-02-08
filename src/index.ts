import {Connection, Model} from "mongoose";
import {Router, Request, Response} from "express";
import {templateSchema, Template, textSchema, MemeText, MemeTextDocument, TemplateDocument} from "./models";

interface RandomMemeOptions {
    textCollectionName: string,
    storeMemesInDB?: boolean,
    templateCollectionName?: string,
    textWildcardsAllowed?: boolean,
    templateWildcard?: string,
    textWildcard?: string
}

class RandomMemeGenerator{
    connection: Connection;
    options: RandomMemeOptions;

    memeModel: Model<TemplateDocument>;
    textModel: Model<MemeTextDocument>;

    constructor(connection: Connection, options: RandomMemeOptions)
    {
        this.connection = connection;
        this.options = options;
        this.memeModel = connection.model(options.templateCollectionName || "memeTemplate", templateSchema);
        this.textModel = connection.model(options.textCollectionName || "memeText", textSchema);
    }

    getRandomMeme() : string
    {
        return '';
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

function sanitizeStringForUrl(input: string) : string {    
    // Replace spacer characters with api replacements
    let output: string = input.replace(/_/g, "__");
    output = output.replace(/-/g, "--");
    output = output.replace(/ /g, "_");
    output = output.replace(/\n/g, "~n");

    // Replace special characters with api replacements
    output = output.replace(/\?/g, "~q");
    output = output.replace(/&/g, "~a");
    output = output.replace(/%/g, "~p");
    output = output.replace(/#/g, "~h");
    output = output.replace(/\//g, "~s");
    output = output.replace(/\\/g, "~b");
    output = output.replace(/"/g, "''");
    return output;
}

export default RandomMemeGenerator;