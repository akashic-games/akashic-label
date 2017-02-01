import rp = require("./RubyParser");

/**
 * 行に含まれる描画要素のうち、1つを表すインターフェース定義。
 */
export type FragmentDrawInfo = StringDrawInfo | RubyFragmentDrawInfo;

/**
 * 行に含まれる文字列要素。
 */
export class StringDrawInfo {
	text: string;
	width: number;
	glyphs: g.Glyph[];
	constructor (text: string, width: number, glyphs: g.Glyph[]) {
		this.text = text;
		this.width = width;
		this.glyphs = glyphs;
	}
}

/**
 * 行に含まれるルビ要素。
 */
export class RubyFragmentDrawInfo {
	text: string;
	fragment: rp.RubyFragment;
	width: number;
	rbWidth: number;
	rtWidth: number;
	glyphs: g.Glyph[];
	rubyGlyphs: g.Glyph[];
	constructor (fragment: rp.RubyFragment, width: number, rbWidth: number, rtWidth: number, glyphs: g.Glyph[], rubyGlyphs: g.Glyph[]) {
		this.text = fragment.text;
		this.fragment = fragment;
		this.width = width;
		this.rbWidth = rbWidth;
		this.rtWidth = rtWidth;
		this.glyphs = glyphs;
		this.rubyGlyphs = rubyGlyphs;
	}
}

/**
 * `Label`の行単位の描画情報を表すインターフェース定義。
 */
export interface LineInfo {
	sourceText: string;
	width: number;
	height: number;
	minMinusOffsetY: number;
	surface: g.Surface;
	fragmentDrawInfoArray: FragmentDrawInfo[];
}
