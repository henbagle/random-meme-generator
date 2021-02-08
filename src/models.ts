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

export interface Template{
    memeTitle: String,
    urlPrefix: String,
    customImg?: String,
    lines: String[]
}

export interface TemplateDocument extends Template, Document
{
    lines: Types.Array<String>
}

export interface MemeTextDocument extends MemeText, Document
{ };

export interface MemeText{
    text: String
}
