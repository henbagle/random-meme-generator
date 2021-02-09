import { Template } from "./models"; 
import * as defaultTemplates from "./templates.json";

export function loadDefaultTemplatesFromJson() : Template[]
{
    return defaultTemplates.templates;
}

export function sanitizeStringForUrl(input: string) : string {    
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