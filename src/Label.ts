import LabelParameterObject = require("./LabelParameterObject");
import rp = require("./RubyParser");
import fr = require("./FragmentDrawInfo");
import dr = require("./DefaultRubyParser");

interface RubyHeightInfo {
	maxRubyFontSize: number;
	maxRubyGlyphHeightWithOffsetY: number;
	minRubyMinusOffsetY: number,
	maxRubyGap: number;
	hasRubyFragmentDrawInfo: boolean;
}

/**
 * 描画情報の計算時、作業中の行の状態を管理するインターフェイスの定義。
 */
interface LineDividingState {
	resultLines: fr.LineInfo[];
	currentStringDrawInfo: fr.StringDrawInfo;
	currentLineInfo: fr.LineInfo;
}

/**
 * 複数行のテキストを描画するエンティティ。
 * 文字列内の"\r\n"、"\n"、"\r"を区切りとして改行を行う。
 * また、自動改行が有効な場合はエンティティの幅に合わせて改行を行う。
 * 本クラスの利用にはg.BitmapFontが必要となる。
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
	 * @deprecated このプロパティは非推奨であり、後方互換性のために存在する。代わりに`font`プロパティを用いるべきである。
	 */
	bitmapFont: g.BitmapFont;

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
	fixMarginTop: boolean;

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
	 * rubyBitmapFont: ルビのビットマップフォント。初期値は `this.bitmapFont` である。
	 * rubyGap: ルビと本文の行間。初期値は0である。
	 * rubyAlign: ルビのレイアウト。初期値は `RubyAlign.SpaceAround` である。
	 *
	 * これらの値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
	 */
	rubyOptions: rp.RubyOptions;

	_beforeText: string;
	_beforeFont: g.Font;
	_beforeLineBreak: boolean;
	_beforeFontSize: number;
	_beforeTextAlign: g.TextAlign;
	_beforeWidth: number;
	_beforeRubyEnabled: boolean;
	_beforeFixLineGap: boolean;
	_beforeRubyOptions: rp.RubyOptions;

	private _lines: fr.LineInfo[];

	/**
	 * 各種パラメータを指定して `Label` のインスタンスを生成する。
	 * @param param このエンティティに対するパラメータ
	 */
	constructor(param: LabelParameterObject) {
		if (!param.font && !param.bitmapFont) {
			throw g.ExceptionFactory.createAssertionError("Label#constructor: 'font' or 'bitmapFont' must be given to LabelParameterObject");
		}
		super(param);
		this.text = param.text;
		this.bitmapFont = param.bitmapFont;
		this.font = param.font ? param.font : param.bitmapFont;
		this.fontSize = param.fontSize;
		this.width = param.width;
		this.lineBreak = "lineBreak" in param ? param.lineBreak : true;
		this.lineGap = param.lineGap || 0;
		this.textAlign = "textAlign" in param ? param.textAlign : g.TextAlign.Left;
		this.textColor = param.textColor;
		this.fixMarginTop = "fixMarginTop" in param ? param.fixMarginTop : false;
		this.rubyEnabled = "rubyEnabled" in param ? param.rubyEnabled : true;
		this.fixLineGap = "fixLineGap" in param ? param.fixLineGap : false;
		this.rubyParser = "rubyParser" in param ? param.rubyParser : dr.parse;

		if (!param.rubyOptions) {
			param.rubyOptions = {};
		}
		this.rubyOptions = param.rubyOptions;
		this.rubyOptions.rubyFontSize = "rubyFontSize" in param.rubyOptions ? param.rubyOptions.rubyFontSize : param.fontSize / 2;
		this.rubyOptions.rubyBitmapFont = "rubyBitmapFont" in param.rubyOptions ? param.rubyOptions.rubyBitmapFont : this.bitmapFont;
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
			renderer.fillRect(0, 0, this.width, this.height, this.textColor);
		}
		renderer.restore();
	}

	/**
	 * 利用している `g.Surface` を破棄した上で、このエンティティを破棄する。
	 * 利用している `g.BitmapFont` の破棄は行わないため、 `g.BitmapFont` の破棄はコンテンツ製作者が明示的に行う必要がある。
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
				return (this.width - width);
			case g.TextAlign.Center:
				return ((this.width - width) / 2);
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

		// bitmapFontが定義されている場合、bitmapfontを利用する。
		if (this.bitmapFont !== undefined) {
			this.font = this.bitmapFont;
		}

		if (this.rubyOptions.rubyBitmapFont !== undefined) {
			this.rubyOptions.rubyFont = this.rubyOptions.rubyBitmapFont;
		}

		if (this._beforeText !== this.text
		 || this._beforeFontSize !== this.fontSize
		 || this._beforeFont !== this.font
		 || this._beforeLineBreak !== this.lineBreak
		 || (this._beforeWidth !== this.width && this._beforeLineBreak === true)
		 || this._beforeTextAlign !== this.textAlign
		 || this._beforeRubyEnabled !== this.rubyEnabled
		 || this._beforeFixLineGap !== this.fixLineGap
		 || this._isDifferentRubyOptions(this._beforeRubyOptions, this.rubyOptions)
		 ) {
			this._updateLines();
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
		this._beforeRubyOptions.rubyFontSize = this.rubyOptions.rubyFontSize;
		this._beforeRubyOptions.rubyFont = this.rubyOptions.rubyFont;
		this._beforeRubyOptions.rubyGap = this.rubyOptions.rubyGap;
		this._beforeRubyOptions.rubyAlign = this.rubyOptions.rubyAlign;
	}

	private _updateLines(): void {
		var fragments = this.rubyEnabled ? this.rubyParser(this.text) : [this.text];
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
		offsetX: number, offsetY: number, margin: number = 0) {
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
	private _drawRubyFragmentDrawInfo(renderer: g.Renderer, rubyDrawInfo: fr.RubyFragmentDrawInfo, rbOffsetY: number, rtOffsetY: number) {
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
				var currentFragmentEssentialDrawHeight =
					( currentMaxRubyGlyphHeightWithOffsetY - Math.min(currentMinRubyOffsetY, currentRubyStandardOffsetY) ) * rubyGlyphScale;
				if (maxRealDrawHeight < currentFragmentEssentialDrawHeight) {
					maxRealDrawHeight = currentFragmentEssentialDrawHeight;
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

		var minRubyMinusOffsetY = this.fixMarginTop ? realOffsetY : 0;

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
			}
		};

		for (var i = 0; i < fragmentArray.length; i++) {
			var fragment = fragmentArray[i];
			if (typeof fragment === "string") {
				var text = fragment.replace(/\r\n|\n/g, "\r");

				for (var j = 0; j < text.length; j++) {
					if (text[j] === "\r") {
						this._tryPushCurrentStringDrawInfo(state);
						this._feedLine(state);
					} else {
						var glyph = this.font.glyphForCharacter(text[j].charCodeAt(0));
						var glyphScale = this.fontSize / this.font.size;
						var glyphWidth = glyph.advanceWidth * glyphScale;
						if (glyphWidth <= 0) {
							continue;
						}
						if (this._needLineBreak(state, glyphWidth)) {
							this._tryPushCurrentStringDrawInfo(state);
							this._feedLine(state);
						}
						this._addToCurrentStringDrawInfo(state, glyphWidth, glyph, text[j]);
					}
				}
				this._tryPushCurrentStringDrawInfo(state);
			} else {
				var ri = this._createRubyFragmentDrawInfo(fragment);
				if (ri.width <= 0) {
					continue;
				}
				if (this._needLineBreak(state, ri.width)) {
					this._feedLine(state);
				};
				state.currentLineInfo.fragmentDrawInfoArray.push(ri);
				state.currentLineInfo.width += ri.width;
				state.currentLineInfo.sourceText += fragment.text;
			}
		}
		this._feedLine(state); // 行末ではないが、状態をflushするため改行処理を呼ぶ
		return state.resultLines;
	}

	private _createStringGlyph(text: string, font: g.Font): g.Glyph[] {
		return Array.prototype.map.call(text,
			(e: string, index: number, text: string) => {
				return font.glyphForCharacter(text.charCodeAt(index));
		});
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

		var minOffsetY: number;
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
						if (!minOffsetY) minOffsetY = glyph.offsetY;
						if (minOffsetY > glyph.offsetY) {
							minOffsetY = glyph.offsetY;
						}
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
		if (this.fixMarginTop) {
			minOffsetY = Math.min(minOffsetY, this._calcStandardOffsetY(this.font)) * glyphScale;
			state.currentLineInfo.height -= minOffsetY;
			state.currentLineInfo.minMinusOffsetY += minOffsetY;
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
	}

	private _addToCurrentStringDrawInfo(state: LineDividingState, width: number, glyph: g.Glyph, character: string): void {
		state.currentStringDrawInfo.width += width;
		state.currentStringDrawInfo.glyphs.push(glyph);
		state.currentStringDrawInfo.text += character;
	}

	private _needLineBreak(state: LineDividingState, width: number): boolean {
		return (this.lineBreak && width > 0 &&
		              state.currentLineInfo.width + state.currentStringDrawInfo.width + width > this.width &&
		              state.currentLineInfo.width + state.currentStringDrawInfo.width > 0); // 行頭文字の場合は改行しない
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
}

export = Label;
