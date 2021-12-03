import {Types, Schema, Model, Document} from "mongoose";
import { CustomTemplate, MemeText } from "./memeUnits";

export const templateSchema = new Schema<TemplateDocument, Model<TemplateDocument>>({
    memeTitle: String,
    urlPrefix: String,
    customImg: {type: String, required: false},
    lines: [{  type: String  }],
});

export const textSchema = new Schema<MemeTextDocument, Model<MemeTextDocument>>({
    text: String,
});

export interface TemplateDocument extends CustomTemplate, Document
{
    lines: Types.Array<string>
}

export interface MemeTextDocument extends MemeText, Document
{ };