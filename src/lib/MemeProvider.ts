import { MemeText, CustomTemplate } from "./models";

export abstract class MemeProvider
{
    abstract getRandomMemeText(count: number) : Promise<MemeText[]>;
    abstract getRandomMemeTemplate() : Promise<CustomTemplate>;

    abstract getAllMemeTemplates() : Promise<CustomTemplate[]>;
    abstract getAllMemeText() : Promise<MemeText[]>;
    abstract addMemeText(text: string) : Promise<any>;
    abstract deleteMemeText(text: string) : Promise<any>;
}