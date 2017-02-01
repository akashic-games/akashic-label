import rt = require("./RubyParser");
/**
 * `Label` のコンストラクタに渡すことができるパラメータ。
 * 各メンバの詳細は `Label` の同名メンバの説明を参照すること。
 */
interface LabelParameterObject extends g.CacheableEParameterObject {
	/**
	 * 描画する文字列。
	 */
	text: string;

	/**
	 * 描画に利用されるフォント。
	 * @deprecated このプロパティは非推奨であり、後方互換性のために存在する。代わりに`font`プロパティを用いるべきである。
	 */
	bitmapFont?: g.BitmapFont;

	/**
	 * 描画に利用されるフォント。
	 * この値または`bitmapFont`が指定されなければならない。
	 */
	font?: g.Font;

	/**
	 * フォントサイズ。
	 * 0 以上の数値でなければならない。
	 * これは `LabelParameterObject#font` または `LabelParameterObject#bitmapFont` で
	 * 与えられたフォントを `fontSize` フォントサイズ相当で描画するよう指示する値である。
	 * 歴史的経緯によりフォントサイズと説明されているが、実際には拡大縮小率を求めるため
	 * に用いられている。
	 */
	fontSize: number;

	/**
	 * 横幅。
	 * `lineBreak` が真の場合、描画する文字列はこの幅に収まるよう改行される。
	 */
	width: number;

	/**
	 * 自動改行を行うかどうか。
	 */
	lineBreak?: boolean;

	/**
	 * 行間サイズ。
	 * 初期値は0である。
	 * -1 * fontSize 以上の数値でなければならない。
	 */
	lineGap?: number;

	/**
	 * 文字列の描画位置。
	 * 初期値は `g.TextAlign.Left` である。
	 */
	textAlign?: g.TextAlign;

	/**
	 * 文字列の描画色をCSS Color形式で指定する。
	 * 元の描画色に重ねて表示されるため、アルファ値を指定した場合は元の描画色が透けて表示される。
	 * 初期値は `undefined` となり、 描画色の変更を行わない。
	 */
	textColor?: string;

	/**
	 * ルビを使うかどうか。
	 * 初期値は真である。
	 */
	rubyEnabled?: boolean;

	/**
	 * ルビを持つ行と持たない行の行間を統一するかどうか。
	 * 初期値は偽である。
	 */
	fixLineGap?: boolean;

	/**
	 * ルビを解釈するパーサ。
	 * 初期値は DefaultRubyParser.ts で定義している parse() 関数である。
	 * 任意の文法でルビを記述する場合、この値に適切な関数を指定する必要がある。
	 */
	rubyParser?: rt.RubyParser;

	/**
	 * ルビのレイアウト設定。
	 */
	rubyOptions?: rt.RubyOptions;
}

export = LabelParameterObject;
