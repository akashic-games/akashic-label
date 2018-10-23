import graphemeSplitter = require("grapheme-splitter");

var splitter = new graphemeSplitter();

export function splitToGraphemes(str: string): string[] {
	return splitter.splitGraphemes(str);
}
