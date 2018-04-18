import LabelParameterObject = require("./LabelParameterObject");
import rp = require("./RubyParser");
import fr = require("./FragmentDrawInfo");
import dr = require("./DefaultRubyParser");
import { Fragment } from "./index";
import { RubyFragmentDrawInfo } from "./FragmentDrawInfo";

interface RubyHeightInfo {
	maxRubyFontSize: number;
	maxRubyGlyphHeightWithOffsetY: number;
	minRubyMinusOffsetY: number;
	maxRubyGap: number;
	hasRubyFragmentDrawInfo: boolean;
}

interface CalcLineBreakResult {
	correctLineBreakPosition: number;
	indexPosition: number;
}

/**
 * 描画情報の計算時、作業中の行の状態を管理するインターフェイスの定義。
 */
interface LineDividingState {
	resultLines: fr.LineInfo[];
	currentStringDrawInfo: fr.StringDrawInfo;
	currentLineInfo: fr.LineInfo;
	/** 行幅による自動改行を一時的に抑制するかどうか */
	currentLinePreventLineBreak: boolean;
	/** 処理中のFragment */
	currentFragment: Fragment;
}

/**
 * 複数行のテキストを描画するエンティティ。
 * 文字列内の"\r\n"、"\n"、"\r"を区切りとして改行を行う。
 * また、自動改行が有効な場合はエンティティの幅に合わせて改行を行う。
 * 本クラスの利用にはg.Fontが必要となる。
 */
class Label extends g.CacheableE {
	/**
	 * 描画する文字列。
	 * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
	 */
	text: string;

	/**
	 * 描画に利用されるフォント。
	 * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
	 */
	font: g.Font;

	/**
	 * 文字列の描画位置。
	 * 初期値は `g.TextAlign.Left` である。
	 * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
	 */
	textAlign: g.TextAlign;

	/**
	 * フォントサイズ。
	 * 0 以上の数値でなければならない。
	 * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
	 */
	fontSize: number;

	/**
	 * 行間サイズ。
	 * 初期値は0である。
	 * -1 * fontSize 以上の数値でなければならない。
	 * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
	 */
	lineGap: number;

	/**
	 * 自動改行を行うかどうか。
	 * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
	 */
	lineBreak: boolean;

	/**
	 * 文字列の描画色をCSS Color形式で指定する。
	 * 元の描画色に重ねて表示されるため、アルファ値を指定した場合は元の描画色が透けて表示される。
	 * 初期値は `undefined` となり、 描画色の変更を行わない。
	 * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
	 */
	textColor: string;

	/**
	 * ルビを使うかどうか。
	 * 初期値は真である。
	 * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
	 */
	rubyEnabled: boolean;

	/**
	 * ルビを持つ行と持たない行の行間を統一するかどうか。
	 * 初期値は偽である。
	 * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
	 */
	fixLineGap: boolean;

	/**
	 * フォントの上端にある余白を描画するかどうか。
	 * 真の場合、文字の描画内容が崩れない範囲で余白を詰めて描画される。
	 * 初期値は偽である。
	 * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
	 */
	trimMarginTop: boolean;

	/**
	 * `width` プロパティを `this.text` の描画に必要な幅の値に自動的に更新するかを表す。
	 * `width` プロパティの更新は `this.invalidate()` を呼び出した後のタイミングで行われる。
	 * `textAlign` を `TextAlign.Left` 以外にする場合、この値は `false` にすべきである。
	 * `textAlign` が `TextAlign.Left` 以外かつ、 この値が `true` の場合、描画内容は不定である。
	 * 初期値は偽である。
	 * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
	 */
	widthAutoAdjust: boolean;

	/**
	 * ルビを解釈するパーサ。
	 * 初期値は DefaultRubyParser.ts で定義している parse() 関数である。
	 * 任意の文法でルビを記述する場合、この値に適切な関数を指定する必要がある。
	 * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
	 */
	rubyParser: rp.RubyParser;

	/**
	 * ルビのレイアウト設定。
	 * 個別のルビに `this.rubyOptions` の各プロパティと同名のプロパティが存在する場合、個別のルビの設定が優先される。
	 *
	 * rubyFontSize: ルビのフォントサイズ。初期値は `this.fontSize / 2` である。
	 * rubyFont: ルビのビットマップフォント。初期値は `this.font` である。
	 * rubyGap: ルビと本文の行間。初期値は0である。
	 * rubyAlign: ルビのレイアウト。初期値は `RubyAlign.SpaceAround` である。
	 *
	 * これらの値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
	 */
	rubyOptions: rp.RubyOptions;

	lineBreakRule?: (text: rp.Fragment[], index: number) => number;

	_beforeText: string;
	_beforeFont: g.Font;
	_beforeLineBreak: boolean;
	_beforeFontSize: number;
	_beforeTextAlign: g.TextAlign;
	_beforeWidth: number;
	_beforeRubyEnabled: boolean;
	_beforeFixLineGap: boolean;
	_beforeTrimMarginTop: boolean;
	_beforeWidthAutoAdjust: boolean;
	_beforeRubyOptions: rp.RubyOptions;

	private _lines: fr.LineInfo[];

	/**
	 * 自動改行を行う幅。
	 * widthAutoAdjust が有効の場合、`this.width` は値が不定になるため、
	 * 代わりに自動改行の幅を定める。
	 * `this.width` を変更した場合、この値も同じ値に更新される。
	 */
	private _lineBreakWidth: number;

	/**
	 * 各種パラメータを指定して `Label` のインスタンスを生成する。
	 * @param param このエンティティに対するパラメータ
	 */
	constructor(param: LabelParameterObject) {
		super(param);
		this.text = param.text;
		this.font = param.font;
		this.fontSize = param.fontSize;
		this._lineBreakWidth = param.width;
		this.lineBreak = "lineBreak" in param ? param.lineBreak : true;
		this.lineGap = param.lineGap || 0;
		this.textAlign = "textAlign" in param ? param.textAlign : g.TextAlign.Left;
		this.textColor = param.textColor;
		this.trimMarginTop = "trimMarginTop" in param ? param.trimMarginTop : false;
		this.widthAutoAdjust = "widthAutoAdjust" in param ? param.widthAutoAdjust : false;
		this.rubyEnabled = "rubyEnabled" in param ? param.rubyEnabled : true;
		this.fixLineGap = "fixLineGap" in param ? param.fixLineGap : false;
		this.rubyParser = "rubyParser" in param ? param.rubyParser : dr.parse;
		this.lineBreakRule = "lineBreakRule" in param ? param.lineBreakRule : undefined;

		if (!param.rubyOptions) {
			param.rubyOptions = {};
		}
		this.rubyOptions = param.rubyOptions;
		this.rubyOptions.rubyFontSize = "rubyFontSize" in param.rubyOptions ? param.rubyOptions.rubyFontSize : param.fontSize / 2;
		this.rubyOptions.rubyFont = "rubyFont" in param.rubyOptions ? param.rubyOptions.rubyFont : this.font;
		this.rubyOptions.rubyGap = "rubyGap" in param.rubyOptions ? param.rubyOptions.rubyGap : 0;
		this.rubyOptions.rubyAlign = "rubyAlign" in param.rubyOptions ? param.rubyOptions.rubyAlign : rp.RubyAlign.SpaceAround;

		this._lines = [];
		this._beforeText = undefined;
		this._beforeTextAlign = undefined;
		this._beforeFontSize = undefined;
		this._beforeLineBreak = undefined;
		this._beforeFont = undefined;
		this._beforeWidth = undefined;
		this._beforeRubyEnabled = undefined;
		this._beforeFixLineGap = undefined;
		this._beforeTrimMarginTop = undefined;
		this._beforeWidthAutoAdjust = undefined;
		this._beforeRubyOptions = {};

		this._invalidateSelf();
	}

	/**
	 * このエンティティの描画キャッシュ無効化をエンジンに通知する。
	 * このメソッドを呼び出し後、描画キャッシュの再構築が行われ、各 `g.Renderer` に描画内容の変更が反映される。
	 */
	invalidate(): void {
		this._invalidateSelf();
		super.invalidate();
	}

	renderCache(renderer: g.Renderer): void {
		if (!this.rubyEnabled && this.fontSize === 0) return;
		renderer.save();
		var currentLineHeight = 0;
		for (var i = 0; i < this._lines.length; ++i) {
			if (this._lines[i].width > 0 && this._lines[i].height > 0) {
				renderer.drawImage(
					this._lines[i].surface,
					0,
					0,
					this._lines[i].width,
					this._lines[i].height,
					this._offsetX(this._lines[i].width),
					currentLineHeight
				);
			}
			currentLineHeight += this._lines[i].height + this.lineGap;
		}
		if (this.textColor) {
			renderer.setCompositeOperation(g.CompositeOperation.SourceAtop);
			renderer.fillRect(0, 0, this._lineBreakWidth, this.height, this.textColor);
		}
		renderer.restore();
	}

	/**
	 * 利用している `g.Surface` を破棄した上で、このエンティティを破棄する。
	 * 利用している `g.Font` の破棄は行わないため、 `g.Font` の破棄はコンテンツ製作者が明示的に行う必要がある。
	 */
	destroy(): void {
		this._destroyLines();
		super.destroy();
	}

	_offsetX(width: number): number {
		switch (this.textAlign) {
			case g.TextAlign.Left:
				return 0;
			case g.TextAlign.Right:
				return (this._lineBreakWidth - width);
			case g.TextAlign.Center:
				return ((this._lineBreakWidth - width) / 2);
			default:
				return 0;
		}
	}

	private _destroyLines(): void {
		for (var i = 0; i < this._lines.length; i++) {
			if (this._lines[i].surface && !this._lines[i].surface.destroyed()) {
				this._lines[i].surface.destroy();
			}
		}
		this._lines = undefined;
	}

	private _invalidateSelf(): void {
		if (this.fontSize < 0)
			throw g.ExceptionFactory.createAssertionError("Label#_invalidateSelf: fontSize must not be negative.");

		if (this.lineGap < -1 * this.fontSize)
			throw g.ExceptionFactory.createAssertionError("Label#_invalidateSelf: lineGap must be greater than -1 * fontSize.");

		// this.width がユーザから変更された場合、this._lineBreakWidth は this.width に追従する。
		if (this._beforeWidth !== this.width) this._lineBreakWidth = this.width;

		if (this._beforeText !== this.text
		 || this._beforeFontSize !== this.fontSize
		 || this._beforeFont !== this.font
		 || this._beforeLineBreak !== this.lineBreak
		 || (this._beforeWidth !== this.width && this._beforeLineBreak === true)
		 || this._beforeTextAlign !== this.textAlign
		 || this._beforeRubyEnabled !== this.rubyEnabled
		 || this._beforeFixLineGap !== this.fixLineGap
		 || this._beforeTrimMarginTop !== this.trimMarginTop
		 || this._beforeWidthAutoAdjust !== this.widthAutoAdjust
		 || this._isDifferentRubyOptions(this._beforeRubyOptions, this.rubyOptions)
		 ) {
			this._updateLines();
		}

		if (this.widthAutoAdjust) {
			// this.widthAutoAdjust が真の場合、 this.width は描画幅に応じてトリミングされる。
			this.width = Math.ceil(this._lines.reduce((width: number, line: fr.LineInfo) => Math.max(width, line.width), 0));
		}

		var height = this.lineGap * (this._lines.length - 1);
		for (var i = 0; i < this._lines.length; i++) {
			height += this._lines[i].height;
		}
		this.height = height;

		this._beforeText = this.text;
		this._beforeTextAlign = this.textAlign;
		this._beforeFontSize = this.fontSize;
		this._beforeLineBreak = this.lineBreak;
		this._beforeFont = this.font;
		this._beforeWidth = this.width;
		this._beforeRubyEnabled = this.rubyEnabled;
		this._beforeFixLineGap = this.fixLineGap;
		this._beforeTrimMarginTop = this.trimMarginTop;
		this._beforeWidthAutoAdjust = this.widthAutoAdjust;
		this._beforeRubyOptions.rubyFontSize = this.rubyOptions.rubyFontSize;
		this._beforeRubyOptions.rubyFont = this.rubyOptions.rubyFont;
		this._beforeRubyOptions.rubyGap = this.rubyOptions.rubyGap;
		this._beforeRubyOptions.rubyAlign = this.rubyOptions.rubyAlign;
	}

	private _updateLines(): void {
		var text = this.text.replace(/\r\n|\n/g, "\r");
		var fragments = this.rubyEnabled ? this.rubyParser(text) : [text];
		var undrawnLineInfos = this._divideToLines(fragments);
		var lines: fr.LineInfo[] = [];
		var hasNotChanged = this._beforeFontSize === this.fontSize
			&& this._beforeFont === this.font
			&& !this._isDifferentRubyOptions(this._beforeRubyOptions, this.rubyOptions);

		for (var i = 0; i < undrawnLineInfos.length; i++) {
			var undrawnLineInfo = undrawnLineInfos[i];
			var line = this._lines[i];
			if (hasNotChanged && line !== undefined
				&& undrawnLineInfo.sourceText === line.sourceText
				&& undrawnLineInfo.width === line.width
				&& undrawnLineInfo.height === line.height) {
					lines.push(line);
				} else {
					if (line && line.surface && !line.surface.destroyed()) {
						line.surface.destroy();
					}
					this._drawLineInfoSurface(undrawnLineInfo);
					lines.push(undrawnLineInfo);
				}
		}

		// 行数が減った場合、使われない行のSurfaceをdestroyする。
		for (var i = lines.length; i < this._lines.length; i++) {
			var line = this._lines[i];
			if (line.surface && !line.surface.destroyed()) {
				line.surface.destroy();
			}
		}
		this._lines = lines;
	}


	private _drawLineInfoSurface(lineInfo: fr.LineInfo): void {
		var lineDrawInfo = lineInfo.fragmentDrawInfoArray;
		var rhi = this._calcRubyHeightInfo(lineDrawInfo);
		var lineSurface = this.scene.game.resourceFactory.createSurface(Math.ceil(lineInfo.width), Math.ceil(lineInfo.height));
		var lineRenderer = lineSurface.renderer();
		lineRenderer.begin();
		lineRenderer.save();

		var rbOffsetY = (rhi.hasRubyFragmentDrawInfo || this.fixLineGap) ? this.rubyOptions.rubyGap + rhi.maxRubyGlyphHeightWithOffsetY : 0;
		var minMinusOffsetY = lineInfo.minMinusOffsetY;
		for (var i = 0; i < lineDrawInfo.length; i++) {
			var drawInfo = lineDrawInfo[i];

			if (drawInfo instanceof fr.RubyFragmentDrawInfo) {
				this._drawRubyFragmentDrawInfo(lineRenderer, drawInfo, rbOffsetY - minMinusOffsetY, -rhi.minRubyMinusOffsetY);
			} else if (drawInfo instanceof fr.StringDrawInfo) {
				this._drawStringGlyphs(lineRenderer, this.font, drawInfo.glyphs, this.fontSize, 0, rbOffsetY - minMinusOffsetY, 0);
			}
			lineRenderer.translate(drawInfo.width, 0);
		}

		lineRenderer.restore();
		lineRenderer.end();
		lineInfo.surface = lineSurface;
	}

	// 文字列の等幅描画
	private _drawStringGlyphs(renderer: g.Renderer, font: g.Font, glyphs: g.Glyph[], fontSize: number,
	                          offsetX: number, offsetY: number, margin: number = 0): void {
		renderer.save();
		renderer.translate(offsetX, offsetY);
		for (var i = 0; i < glyphs.length; i++) {
			var glyph = glyphs[i];
			var glyphScale = fontSize / font.size;
			var glyphWidth = glyph.advanceWidth * glyphScale;
			renderer.save();
			renderer.transform([glyphScale, 0, 0, glyphScale, 0, 0]);
			if (glyph.width > 0 && glyph.height > 0) {
				renderer.drawImage(glyph.surface, glyph.x, glyph.y, glyph.width, glyph.height, glyph.offsetX, glyph.offsetY);
			}
			renderer.restore();
			renderer.translate(glyphWidth + margin, 0);
		}
		renderer.restore();
	}

	// ルビベースとルビテキストの描画
	private _drawRubyFragmentDrawInfo(renderer: g.Renderer, rubyDrawInfo: fr.RubyFragmentDrawInfo,
	                                  rbOffsetY: number, rtOffsetY: number): void {
		var f = rubyDrawInfo.fragment;
		var rubyFontSize = "rubyFontSize" in f ? f.rubyFontSize : this.rubyOptions.rubyFontSize;
		var rubyAlign = "rubyAlign" in f ? f.rubyAlign : this.rubyOptions.rubyAlign;
		var rubyFont = "rubyFont" in f ? f.rubyFont : this.rubyOptions.rubyFont;
		var isRtWideThanRb = rubyDrawInfo.rtWidth > rubyDrawInfo.rbWidth;
		var width = rubyDrawInfo.width;
		var rtWidth = rubyDrawInfo.rtWidth;
		var rbWidth = rubyDrawInfo.rbWidth;
		var rtStartPositionX: number;
		var rbStartPositionX: number;
		var rtUnitMargin: number;
		var rbUnitMargin: number;

		switch (rubyAlign) {
		case rp.RubyAlign.Center:
			rtUnitMargin = 0;
			rbUnitMargin = 0;
			rtStartPositionX = isRtWideThanRb ? 0 : (width - rtWidth) / 2;
			rbStartPositionX = isRtWideThanRb ? (width - rbWidth) / 2 : 0;
			break;
		case rp.RubyAlign.SpaceAround:
			rtUnitMargin = (rubyDrawInfo.rubyGlyphs.length > 0) ? (width - rtWidth) / rubyDrawInfo.rubyGlyphs.length : 0;
			rbUnitMargin = 0;
			rtStartPositionX = isRtWideThanRb ? 0 : rtUnitMargin / 2;
			rbStartPositionX = isRtWideThanRb ? (width - rbWidth) / 2 : 0;
			break;
		default:
			throw g.ExceptionFactory.createAssertionError("Label#_drawRubyFragmentDrawInfo: unknown rubyAlign.");
		}

		this._drawStringGlyphs(renderer, this.font, rubyDrawInfo.glyphs, this.fontSize, rbStartPositionX, rbOffsetY, rbUnitMargin);
		this._drawStringGlyphs(renderer, rubyFont, rubyDrawInfo.rubyGlyphs, rubyFontSize, rtStartPositionX, rtOffsetY, rtUnitMargin);
	}

	private _calcRubyHeightInfo(drawInfoArray: fr.FragmentDrawInfo[]): RubyHeightInfo {
		var maxRubyFontSize = this.rubyOptions.rubyFontSize;
		var maxRubyGlyphHeightWithOffsetY = 0;
		var maxRubyGap = this.rubyOptions.rubyGap;
		var hasRubyFragmentDrawInfo = false;
		var maxRealDrawHeight = 0;
		var realOffsetY: number;
		for (var i = 0; i < drawInfoArray.length; i++) {
			var ri = drawInfoArray[i];
			if (ri instanceof fr.RubyFragmentDrawInfo) {
				var f = ri.fragment;
				if (f.rubyFontSize > maxRubyFontSize) {
					maxRubyFontSize = f.rubyFontSize;
				}
				if (f.rubyGap > maxRubyGap) {
					maxRubyGap = f.rubyGap;
				}

				var rubyGlyphScale =
					(f.rubyFontSize ? f.rubyFontSize : this.rubyOptions.rubyFontSize) / (f.rubyFont ? f.rubyFont.size : this.rubyOptions.rubyFont.size);

				var currentMaxRubyGlyphHeightWithOffsetY = Math.max.apply(Math, ri.rubyGlyphs.map(
					(glyph: g.Glyph) => (glyph.offsetY > 0) ? glyph.height + glyph.offsetY : glyph.height)
				);
				var currentMinRubyOffsetY = Math.min.apply(Math, ri.rubyGlyphs.map(
					(glyph: g.Glyph) => (glyph.offsetY > 0) ? glyph.offsetY : 0)
				);

				if (maxRubyGlyphHeightWithOffsetY < currentMaxRubyGlyphHeightWithOffsetY * rubyGlyphScale) {
					maxRubyGlyphHeightWithOffsetY = currentMaxRubyGlyphHeightWithOffsetY * rubyGlyphScale;
				}

				var rubyFont = (f.rubyFont ? f.rubyFont : this.rubyOptions.rubyFont);
				var currentRubyStandardOffsetY = this._calcStandardOffsetY(rubyFont);
				var currentFragmentRealDrawHeight =
					( currentMaxRubyGlyphHeightWithOffsetY - Math.min(currentMinRubyOffsetY, currentRubyStandardOffsetY) ) * rubyGlyphScale;
				if (maxRealDrawHeight < currentFragmentRealDrawHeight) {
					maxRealDrawHeight = currentFragmentRealDrawHeight;
					// その行で描画されるルビのうち、もっとも実描画高さが高い文字が持つoffsetYを求める
					realOffsetY = Math.min(currentMinRubyOffsetY, currentRubyStandardOffsetY) * rubyGlyphScale;
				}

				hasRubyFragmentDrawInfo = true;
			}
		}
		// ルビが無い行でもfixLineGapが真の場合ルビの高さを使う
		if (maxRubyGlyphHeightWithOffsetY === 0) {
			maxRubyGlyphHeightWithOffsetY = this.rubyOptions.rubyFontSize;
		}

		var minRubyMinusOffsetY = this.trimMarginTop ? realOffsetY : 0;

		return {
			maxRubyFontSize: maxRubyFontSize,
			maxRubyGlyphHeightWithOffsetY: maxRubyGlyphHeightWithOffsetY,
			minRubyMinusOffsetY: minRubyMinusOffsetY,
			maxRubyGap: maxRubyGap,
			hasRubyFragmentDrawInfo: hasRubyFragmentDrawInfo
		};
	}

	private _divideToLines(fragmentArray: rp.Fragment[]): fr.LineInfo[] {
		var state: LineDividingState = {
			resultLines : [],
			currentStringDrawInfo: new fr.StringDrawInfo("", 0, []),
			currentLineInfo: {
				sourceText: "",
				fragmentDrawInfoArray: [],
				width: 0,
				height: 0,
				minMinusOffsetY: 0,
				surface: undefined
			},
			currentLinePreventLineBreak: false,
			currentFragment: undefined
		};

		for (var i = 0; i < fragmentArray.length; i++) {
			state.currentFragment = fragmentArray[i];
			this._addFragmentToState(state, true);
		}
		this._feedLine(state); // 行末ではないが、状態をflushするため改行処理を呼ぶ
		return state.resultLines;
	}

	private _addFragmentToState(state: LineDividingState, useLineBreakRule: boolean): void {
		if (typeof state.currentFragment === "string") {
			for (var i = 0; i < state.currentFragment.length; i++) {
				this._addCharacterToCurrentStringDrawInfo(i, state, useLineBreakRule);
			}
			this._tryPushCurrentStringDrawInfo(state);
		} else {
			var ri = this._createRubyFragmentDrawInfo(state.currentFragment);
			this._addRubyToCurrentLineInfo(state, ri, useLineBreakRule);

		}
	}

	private _addRubyToCurrentLineInfo(state: LineDividingState, ri: RubyFragmentDrawInfo, useLineBreakRule: boolean) {
		if (typeof state.currentFragment === "string") return; // 型合わせ
		if (ri.width <= 0) {
			return;
		}


		const needLineBreak = this._needLineBreak(state, ri.width) && !state.currentLinePreventLineBreak;
		if (this._needLineBreak(state, ri.width) && !state.currentLinePreventLineBreak) {
			this._feedLine(state);
		}
		state.currentLineInfo.fragmentDrawInfoArray.push(ri);
		state.currentLineInfo.width += ri.width;
		state.currentLineInfo.sourceText += state.currentFragment.text;
	};

	private _createStringGlyph(text: string, font: g.Font): g.Glyph[] {
		var glyphs: g.Glyph[] = [];
		for (var i = 0; i < text.length; i++) {
			var code = g.Util.charCodeAt(text, i);
			if (! code) continue;

			var glyph = this.font.glyphForCharacter(code);
			if (! glyph) {
				var str = (code & 0xFFFF0000) ? String.fromCharCode((code & 0xFFFF0000) >>> 16, code & 0xFFFF) : String.fromCharCode(code);
				this.game().logger.warn(
					"Label#_invalidateSelf(): failed to get a glyph for '" + str + "' " +
					"(BitmapFont might not have the glyph or DynamicFont might create a glyph larger than its atlas)."
				);
				continue;
			}
			glyphs.push(glyph);
		}
		return glyphs;
	}

	private _createRubyFragmentDrawInfo(fragment: rp.RubyFragment): fr.RubyFragmentDrawInfo {
		var glyphs = this._createStringGlyph(fragment.rb, this.font);
		var rubyGlyphs = this._createStringGlyph(fragment.rt, this.rubyOptions.rubyFont);
		var rubyFont = "rubyFont" in fragment ? fragment.rubyFont : this.rubyOptions.rubyFont;
		var rubyFontSize = "rubyFontSize" in fragment ? fragment.rubyFontSize : this.rubyOptions.rubyFontSize;
		var glyphScale = this.fontSize / this.font.size;
		var rubyGlyphScale = rubyFontSize / rubyFont.size;
		var rbWidth = glyphs.length > 0 ?
			glyphs.map((glyph: g.Glyph) => glyph.advanceWidth).reduce((pre: number, cu: number) => pre + cu) * glyphScale :
			0;
		var rtWidth = rubyGlyphs.length > 0 ?
			rubyGlyphs.map((glyph: g.Glyph) => glyph.advanceWidth).reduce((pre: number, cu: number) => pre + cu) * rubyGlyphScale :
			0;
		var width = rbWidth > rtWidth ? rbWidth : rtWidth;
		return new fr.RubyFragmentDrawInfo(
			 fragment,
			 width,
			 rbWidth,
			 rtWidth,
			 glyphs,
			 rubyGlyphs
		);
	}

	private _tryPushCurrentStringDrawInfo(state: LineDividingState): void {
		if (state.currentStringDrawInfo.width > 0) {
			state.currentLineInfo.fragmentDrawInfoArray.push(state.currentStringDrawInfo);
			state.currentLineInfo.width += state.currentStringDrawInfo.width;
			state.currentLineInfo.sourceText += state.currentStringDrawInfo.text;
		}
		state.currentStringDrawInfo = new fr.StringDrawInfo("", 0, []);
	}

	private _feedLine(state: LineDividingState): void {
		var glyphScale = this.fontSize / this.font.size;

		var minOffsetY = Infinity;
		var minMinusOffsetY = 0;
		var maxGlyphHeightWithOffsetY = 0;
		state.currentLineInfo.fragmentDrawInfoArray.forEach(
			(fragmentDrawInfo: fr.FragmentDrawInfo) => {
				fragmentDrawInfo.glyphs.forEach(
					(glyph: g.Glyph) => {
						if (minMinusOffsetY > glyph.offsetY) {
							minMinusOffsetY = glyph.offsetY;
						}
						// offsetYの一番小さな値を探す
						if (minOffsetY > glyph.offsetY) minOffsetY = glyph.offsetY;

						const heightWithOffsetY = (glyph.offsetY > 0) ? glyph.height + glyph.offsetY : glyph.height;
						if (maxGlyphHeightWithOffsetY < heightWithOffsetY) {
							maxGlyphHeightWithOffsetY = heightWithOffsetY;
						}
					}
				);
			}
		);
		minMinusOffsetY = minMinusOffsetY * glyphScale;
		maxGlyphHeightWithOffsetY =
			(state.currentLineInfo.fragmentDrawInfoArray.length > 0) ?
			maxGlyphHeightWithOffsetY * glyphScale - minMinusOffsetY :
			this.fontSize;
		maxGlyphHeightWithOffsetY = Math.ceil(maxGlyphHeightWithOffsetY);

		var rhi = this._calcRubyHeightInfo(state.currentLineInfo.fragmentDrawInfoArray);
		state.currentLineInfo.height =
			rhi.hasRubyFragmentDrawInfo || this.fixLineGap ?
			maxGlyphHeightWithOffsetY + rhi.maxRubyGlyphHeightWithOffsetY + rhi.maxRubyGap :
			maxGlyphHeightWithOffsetY;
		state.currentLineInfo.minMinusOffsetY = minMinusOffsetY;
		if (this.trimMarginTop) {
			var minOffsetYInRange = Math.min(minOffsetY, this._calcStandardOffsetY(this.font)) * glyphScale;
			state.currentLineInfo.height -= minOffsetYInRange;
			state.currentLineInfo.minMinusOffsetY += minOffsetYInRange;
		}
		state.resultLines.push(state.currentLineInfo);
		state.currentLineInfo = {
			sourceText: "",
			fragmentDrawInfoArray: [],
			width: 0,
			height: 0,
			minMinusOffsetY: 0,
			surface: undefined
		};
		state.currentLinePreventLineBreak = false;
	}

	private _addToCurrentStringDrawInfo(state: LineDividingState, width: number, glyph: g.Glyph, character: string): void {
		state.currentStringDrawInfo.width += width;
		state.currentStringDrawInfo.glyphs.push(glyph);
		state.currentStringDrawInfo.text += character;
	}

	private _needLineBreak(state: LineDividingState, width: number): boolean {
		const result = (this.lineBreak && width > 0 &&
		              state.currentLineInfo.width + state.currentStringDrawInfo.width + width > this._lineBreakWidth &&
					  state.currentLineInfo.width + state.currentStringDrawInfo.width > 0); // 行頭文字の場合は改行しない
		return result;
	}

	private _isDifferentRubyOptions(ro0: rp.RubyOptions, ro1: rp.RubyOptions): boolean {
		return (ro0.rubyFontSize !== ro1.rubyFontSize
				   || ro0.rubyFont !== ro1.rubyFont
				   || ro0.rubyGap !== ro1.rubyGap
				   || ro0.rubyAlign !== ro1.rubyAlign
		);
	}

	private _calcStandardOffsetY(font: g.Font): number {
		// 標準的な高さを持つグリフとして `M` を利用するが明確な根拠は無い
		var text = "M";
		var glyphM = font.glyphForCharacter(text.charCodeAt(0));
		return glyphM.offsetY;
	}

	private _addCharacterToCurrentStringDrawInfo(index: number, state: LineDividingState, useLineBreakRule: boolean): void {
		var currentText = (state.currentFragment as string).replace(/\r\n|\n/g, "\r");
		if (currentText[index] === "\r") {
			if (this._needLineBreak(state, 0) && !state.currentLinePreventLineBreak &&
				!!this.lineBreakRule && useLineBreakRule && this._needFixLineBreakByRule(state)) {
				this._applyLineBreakRule(index, state);
				return;
			} else if (!state.currentLinePreventLineBreak && this._needFixLineBreakByRule(state)) { // この行で改行はないはずなのでcurrentLinePreventLineBreakを見る
				let result = this._calcLineBreakPosition(state);
				let diff = result.correctLineBreakPosition - result.indexPosition;
				let diffWidth = diff + this._calcStandardOffsetY(this.font);
				this._applyLineBreakRule(index, state);
				return;
			}

			this._tryPushCurrentStringDrawInfo(state);
			this._feedLine(state);

			state.currentLinePreventLineBreak = false;
		} else {
			var code = g.Util.charCodeAt(currentText, index);
			if (! code) return;

			var glyph = this.font.glyphForCharacter(code);
			if (! glyph) {
				var str = (code & 0xFFFF0000) ? String.fromCharCode((code & 0xFFFF0000) >>> 16, code & 0xFFFF) : String.fromCharCode(code);
				this.game().logger.warn(
					"Label#_invalidateSelf(): failed to get a glyph for '" + str + "' " +
					"(BitmapFont might not have the glyph or DynamicFont might create a glyph larger than its atlas)."
				);
				return;
			}

			var glyphScale = this.fontSize / this.font.size;
			var glyphWidth = glyph.advanceWidth * glyphScale;
			if (glyphWidth <= 0) {
				return;
			}
			if (this._needLineBreak(state, glyphWidth) && !state.currentLinePreventLineBreak) {
				if (!!this.lineBreakRule && useLineBreakRule && this._needFixLineBreakByRule(state)) {
					this._applyLineBreakRule(index, state);
					this._addToCurrentStringDrawInfo(state, glyphWidth, glyph, currentText[index]);
					return;
				} else {
					this._tryPushCurrentStringDrawInfo(state);
					this._feedLine(state);
				}
			}
			this._addToCurrentStringDrawInfo(state, glyphWidth, glyph, currentText[index]);
		}
	}

	/** 禁則処理から正しい改行位置を導出する */
	private _calcLineBreakPosition (state: LineDividingState): CalcLineBreakResult {
		var tmpFragments = state.currentLineInfo.fragmentDrawInfoArray.map((fragment) => {
			if (fragment instanceof fr.StringDrawInfo) {
				return fragment.text.split("");
			} else {
				return (fragment as fr.RubyFragmentDrawInfo).fragment;
			}
		});
		var currentLineFragments: Fragment[] = Array.prototype.concat.apply([], tmpFragments);
		var currentLineFragmentsLength = currentLineFragments.length; // currentLineに登録された文字とルビの配列
		var currentLineFragmentsWithCurrentFragment = currentLineFragments.concat(state.currentStringDrawInfo.text.split("")); // 今の行のtext
		var indexPosition = currentLineFragmentsLength + state.currentStringDrawInfo.text.length - 1; // 予定している改行位置
		var correctLineBreakPosition = this.lineBreakRule(currentLineFragmentsWithCurrentFragment, indexPosition); // 外部ルールが期待する改行位置
		return {
			correctLineBreakPosition,
			indexPosition
		};
	}

	/** 禁則処理に応じた修正が必要か判定する */
	private _needFixLineBreakByRule(state: LineDividingState): boolean {
		if (!this.lineBreakRule) return false;
		var result = this._calcLineBreakPosition(state);
		return result.correctLineBreakPosition !== result.indexPosition;
	}

	/** stateのcurrent系プロパティを禁則処理的に正しい構造に再構築する */
	private _applyLineBreakRule(index: number, state: LineDividingState): void {
		var pos = this._calcLineBreakPosition(state);
		var diff = pos.correctLineBreakPosition - pos.indexPosition;
		console.log(state.currentFragment);
		if (diff === 0) {
			// do nothing
		} else if (diff > 0) {
			// 先送り改行
			var tmpCurrentFragmentArray: any[] = (() => {
				if (typeof state.currentFragment === "string") return state.currentFragment.split("");
				return [{}];
			})();
			var insertPosition = index + diff;
			tmpCurrentFragmentArray.splice(insertPosition, 0, "\r");
			state.currentFragment =  tmpCurrentFragmentArray.join("");
			state.currentLinePreventLineBreak = true;
		} else {
			// 巻き戻し改行
			var servedCurrentFragment = state.currentFragment;

			// currentLineInfoからcurrentStringDrawInfoまで含めたFragmentsを生成する
			this._tryPushCurrentStringDrawInfo(state);
			var tmpFragments = state.currentLineInfo.fragmentDrawInfoArray.map((fragment) => {
				if (fragment instanceof fr.StringDrawInfo) {
					return fragment.text.split("");
				} else {
					return (fragment as fr.RubyFragmentDrawInfo).fragment;
				}
			});
			var newCurrentLineFragments: Fragment[] = Array.prototype.concat.apply([], tmpFragments);
			newCurrentLineFragments.splice(pos.correctLineBreakPosition + 1, 0, "\r");
			state.currentLinePreventLineBreak = true;

			// currentLineInfoを再構築する
			state.currentLineInfo = {
				sourceText: "",
				fragmentDrawInfoArray: [],
				width: 0,
				height: 0,
				minMinusOffsetY: 0,
				surface: undefined
			};
			// currentStringDrawInfo は初期化済
			for (var i = 0; i < newCurrentLineFragments.length; i++) {
				state.currentFragment = newCurrentLineFragments[i];
				this._addFragmentToState(state, false);
			}
			state.currentFragment = servedCurrentFragment;
		}
	}
}

export = Label;
