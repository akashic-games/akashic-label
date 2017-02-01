export interface RubyOptions {
	/**
	 * ルビのフォントサイズ。
	 */
	rubyFontSize?: number;

	/**
	 * ルビのビットマップフォント。
	 * @deprecated このプロパティは非推奨であり、後方互換性のために存在する。代わりに`rubyFont`プロパティを用いるべきである。
	 */
	rubyBitmapFont?: g.BitmapFont;

	/**
	 * ルビのフォント。
	 */
	rubyFont?: g.Font;

	/**
	 * rtとrbの行間。
	 */
	rubyGap?: number;

	/**
	 * rtとrbの描画幅が短い要素を、長い要素に合わせてどのようにレイアウトするか。
	 */
	rubyAlign?: RubyAlign;
}
export interface RubyFragment extends RubyOptions {

	/**
	 * ベーステキスト（ruby base）。
	 */
	rb: string;

	/**
	 * ルビ（ruby text）。
	 */
	rt: string;

	/**
	 * コンストラクタに与えられた文字列。
	 */
	text: string;
}

export type Fragment = string | RubyFragment;

export type RubyParser = (text: string) => Fragment[];

export enum RubyAlign {
	/**
	 * rtの字間は固定で中央に揃える。
	 */
	Center,
	/**
	 * rb幅に合わせてrtの字間を揃える。
	 */
	SpaceAround
}
