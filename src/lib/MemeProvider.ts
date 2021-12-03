import {MemeTemplate, MemeText} from "./memeUnits";

export default abstract class MemeProvider
{
    abstract getRandomMemeText(count: number) : Promise<MemeText[]>;
    abstract getRandomMemeTemplate() : Promise<MemeTemplate>;

    abstract getAllMemeTemplates() : Promise<MemeTemplate[]>;
    abstract getAllMemeText() : Promise<MemeText[]>;
    abstract addMemeText(text: string) : Promise<any>;
    abstract deleteMemeText(text: string) : Promise<any>;
}