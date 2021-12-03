import { Connection, Model } from "mongoose";
import { MemeProvider } from "./MemeProvider";
import { CustomTemplate, MemeText, MemeTextDocument, TemplateDocument, templateSchema, textSchema } from "./models";

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

    async getRandomMemeTemplate(): Promise<CustomTemplate> {
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

    async getAllMemeTemplates(): Promise<CustomTemplate[]> {
        return await this.templateModel.find({});
    }

}