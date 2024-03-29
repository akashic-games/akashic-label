import type * as rt from "./RubyParser";

/**
 * `Label` のコンストラクタに渡すことができるパラメータ。
 */
export interface LabelParameterObject extends g.CacheableEParameterObject {
	/**
	 * 描画する文字列。
	 */
	text: string;

	/**
	 * 描画に利用されるフォント。
	 */
	font: g.Font;

	/**
	 * 横幅。
	 * `lineBreak` が真の場合、描画する文字列はこの幅に収まるよう改行される。
	 */
	width: number;

	/**
	 * フォントサイズ。
	 * 0 以上の数値でなければならない。
	 * これは `LabelParameterObject#font` に与えられたフォントを
	 * `fontSize` フォントサイズ相当で描画するよう指示する値である。
	 * 歴史的経緯によりフォントサイズと説明されているが、実際には拡大縮小率を求めるために用いられている。
	 * 初期値は `LabelParameterObject#font.size` である。
	 */
	fontSize?: number;

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
	 * 初期値は `"left"` である。
	 */
	textAlign?: g.TextAlign | g.TextAlignString;

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
	 * フォントの上端にある余白を描画するかどうか。
	 * 真の場合、文字の描画内容が崩れない範囲で余白を詰めて描画される。
	 * 初期値は偽である。
	 */
	trimMarginTop?: boolean;

	/**
	 * `width` プロパティを `this.text` の描画に必要な幅で自動的に更新するかを表す。
	 * `textAlign` を `"left"` 以外にする場合、この値は `false` にすべきである。
	 * (`textAlign` は `width` を元に描画位置を調整するため、 `true` の場合左寄せで右寄せでも描画結果が変わらなくなる)
	 * 初期値は偽である。
	 */
	widthAutoAdjust?: boolean;

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

	/**
	 * 禁則処理の挙動を指定する関数。
	 *
	 */
	lineBreakRule?: rt.LineBreakRule;
}
