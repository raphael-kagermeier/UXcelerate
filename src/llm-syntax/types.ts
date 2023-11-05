export interface StyleProperties {
    shortAttribute: string;
    default?: string;
    valuesToExclude?: string[]
    isNumeric?: boolean
}

export type StylesToInclude = {
    [key: string]: StyleProperties;
}

export type PreviousStyles = {
    [Key in keyof StylesToInclude]?: string;
}

export type ComputedStyles = {
    [Key in keyof StylesToInclude]?: string;
}