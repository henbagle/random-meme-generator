import {Types, Schema, Model, Document} from "mongoose";

export const templateSchema = new Schema<TemplateDocument, Model<TemplateDocument>>({
    memeTitle: String,
    urlPrefix: String,
    customImg: {type: String, required: false},
    lines: [{  type: String  }],
});

export const textSchema = new Schema<MemeTextDocument, Model<MemeTextDocument>>({
    text: String,
});

export interface CustomTemplate{
    memeTitle: string,
    urlPrefix: string,
    customImg?: string,
    lines: string[]
}

export interface TemplateDocument extends CustomTemplate, Document
{
    lines: Types.Array<string>
}

export interface MemeTextDocument extends MemeText, Document
{ };

export interface MemeText{
    text: string
}

export interface ConstructionOptions {
    textWildcardsAllowed: boolean;
    templateWildcard: string;
    textWildcard: string[];
    apiUrl: string;
}
