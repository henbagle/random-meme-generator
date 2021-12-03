export interface CustomTemplate{
    memeTitle: string,
    urlPrefix: string,
    customImg?: string,
    lines: string[]
}

export interface OfficialTemplate{

}

export type MemeTemplate = CustomTemplate | OfficialTemplate;

export interface MemeText{
    text: string
}
