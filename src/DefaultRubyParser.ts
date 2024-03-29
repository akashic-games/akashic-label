import type * as rp from "./RubyParser";
/**
 * 文字列からルビをパースする。
 * このパーサは、akashic-labelのデフォルトルビ記法のためのパーサである。
 *
 * このパーサを使う場合、ラベルに与える文字列にJSONのオブジェクトを表す文字列を含むことができる。
 * 文字列中のオブジェクトはルビを表す要素として扱われる。
 * オブジェクトのメンバーには、ルビを表す `rt` と、本文を表す `rb` を含む必要がある。
 * これらのメンバー以外に、RubyOptions型が持つメンバーを含むことができる。
 *
 * 入力の例として、
 * 'これは{"rb":"本文","rt":"ルビ", "rubyFontSize": 2}です。'
 * という文字列が与えられた場合、このパーサは
 * ["これは", {rb:"本文", rt: "ルビ", rubyFontSize: 2}, "です。"]
 * という配列を返す。
 * また、 `{` や `}` は `\\` でエスケープする必要がある。
 * 例として、括弧は `\\{` 、 バックスラッシュは `\\` を用いて表現する。
 * 注意すべき点として、オブジェクトのプロパティ名はダブルクォートでくくられている必要がある。
 */
export function parse(text: string): rp.Fragment[] {
	const pattern = /^((?:[^\\{]|\\+.)*?)({(?:[^\\}]|\\+.)*?})([\s\S]*)/;
	// ((?:[^\\{]|\\+.)*?) -> オブジェクトリテラルの直前まで
	// ({(?:[^\\}]|\\+.)*?}) -> 最前のオブジェクトリテラル
	// ([\s\S]*) -> オブジェクトリテラル以降の、改行を含む文字列

	const result: rp.Fragment[] = [];
	while (text.length > 0) {
		const parsedText = text.match(pattern);
		if (parsedText !== null) {
			const headStr = parsedText[1];
			const rubyStr = parsedText[2];
			text = parsedText[3];
			if (headStr.length > 0) {
				result.push(headStr.replace(/\\{/g, "{").replace(/\\}/g, "}"));
			}
			const parseResult = JSON.parse(rubyStr.replace(/\\/g, "\\\\"));
			if (parseResult.hasOwnProperty("rt") && parseResult.hasOwnProperty("rb")) {
				parseResult.rt = parseResult.rt.replace(/\\{/g, "{").replace(/\\}/g, "}");
				parseResult.rb = parseResult.rb.replace(/\\{/g, "{").replace(/\\}/g, "}");
				parseResult.text = rubyStr;
				result.push(parseResult);
			} else {
				throw g.ExceptionFactory.createTypeMismatchError("parse", "RubyFragment");
			}
		} else {
			result.push(text.replace(/\\{/g, "{").replace(/\\}/g, "}"));
			break;
		}
	}
	return result;
}

