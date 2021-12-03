import { Connection, Model } from "mongoose";
import MemeProvider from "./MemeProvider";
import { MemeTextDocument, TemplateDocument, templateSchema, textSchema } from "./models";
import { MemeTemplate, MemeText } from "./memeUnits";

export interface MongoProviderOptions{
    textCollectionName: string,
    templateCollectionName: string
}

export class MongoMemeProvider extends MemeProvider{
    connection: Connection;
    options: MongoProviderOptions;
    templateModel: Model<TemplateDocument>;
    textModel: Model<MemeTextDocument>;

    constructor(connection: Connection, options: MongoProviderOptions)
    {
        super();
        this.connection = connection;
        this.options = options;
        this.textModel = connection.model(this.options.textCollectionName, textSchema);
        this.templateModel = connection.model(this.options.templateCollectionName, templateSchema);
    }

    async getRandomMemeText(count: number): Promise<MemeText[]> {
        return await this.textModel.aggregate([{ $sample: { size: count } }])
    }

    async getRandomMemeTemplate(): Promise<MemeTemplate> {
        // Try to get a meme from the database
        const templatesFromDb : TemplateDocument[] = await this.templateModel.aggregate([{$sample: {size: 1}}]);
        if(templatesFromDb === undefined || templatesFromDb.length == 0)
        {
            throw new Error("Unable to get template from database");
        }
        else
        {
            return templatesFromDb[0];
        }
    }

    async getAllMemeTemplates(): Promise<MemeTemplate[]> {
        return await this.templateModel.find({});
    }

    async getAllMemeText(): Promise<MemeText[]> {
        return await this.textModel.find({});
    }

    async addMemeText(text: string): Promise<any> {
        return await this.textModel.create({text});
    }

    async deleteMemeText(text: string): Promise<any> {
        return await this.textModel.deleteOne({text})
    }

}