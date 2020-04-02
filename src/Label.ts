import LabelParameterObject = require("./LabelParameterObject");
import rp = require("./RubyParser");
import fr = require("./FragmentDrawInfo");
import dr = require("./DefaultRubyParser");

interface RubyHeightInfo {
	maxRubyFontSize: number;
	maxRubyGlyphHeightWithOffsetY: number;
	minRubyMinusOffsetY: number;
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
	/** 改行挿入を先延ばしにする場合、その位置 */
	reservedLineBreakPosition: number;
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

	/**
	 * 禁則処理の挙動を指定する関数。
	 */
	lineBreakRule: rp.LineBreakRule;

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

	/**
	 * 禁則処理によって行幅が this.width を超える場合があるため、 `g.CacheableE` のメソッドをオーバーライドする
	 */
	calculateCacheSize(): g.CommonSize {
		// TODO: 最大値の候補に this.width を使用するのは textAlign が g.Center か g.Right の場合に描画に必要なキャッシュサイズを確保するためであり、
		// 最大行幅に対して this.width が大きい場合、余分なキャッシュ領域を確保することになる。
		// これは g.CacheableE にキャッシュ描画位置を調整する cacheOffsetX を導入することで解決される。
		const maxWidth = Math.ceil(this._lines.reduce((width: number, line: fr.LineInfo) => Math.max(width, line.width), this.width));
		return {
			width: maxWidth,
			height: this.height
		};
	}

	/**
	 * 描画内容の行数を返す
	 */
	get lineCount(): number {
		return this._lines.length;
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
		 // ユーザのパーサを適用した後にも揃えるが、渡す前に改行記号を replace して統一する
		var fragments = this.rubyEnabled ? this.rubyParser(this.text.replace(/\r\n|\n/g, "\r")) : [this.text];
		// Fragment のうち文字列のものを一文字ずつに分解する
		fragments =
			rp.flatmap<rp.Fragment, rp.Fragment>(fragments, (f) => {
				if (typeof f !== "string") return f;
				// サロゲートペア文字を正しく分割する
				return f.replace(/\r\n|\n/g, "\r").match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g) || [];
			});

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
	private _drawStringGlyphs(renderer: g.Renderer, font: g.Font, glyphs: g.GlyphLike[], fontSize: number,
	                          offsetX: number, offsetY: number, margin: number = 0): void {
		renderer.save();
		renderer.translate(offsetX, offsetY);
		for (var i = 0; i < glyphs.length; i++) {
			var glyph = glyphs[i];
			var glyphScale = fontSize / font.size;
			var glyphWidth = glyph.advanceWidth * glyphScale;

			if (! glyph.isSurfaceValid) {
				glyph = this._createGlyph(glyph.code, font);
				if (! glyph) continue;
			}

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
					(glyph: g.GlyphLike) => (glyph.offsetY > 0) ? glyph.height + glyph.offsetY : glyph.height)
				);
				var currentMinRubyOffsetY = Math.min.apply(Math, ri.rubyGlyphs.map(
					(glyph: g.GlyphLike) => (glyph.offsetY > 0) ? glyph.offsetY : 0)
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
			reservedLineBreakPosition: null
		};

		for (var i = 0; i < fragmentArray.length; i++) {
			this._addFragmentToState(state, fragmentArray, i);
		}
		this._flushCurrentStringDrawInfo(state);
		this._feedLine(state); // 行末ではないが、状態をflushするため改行処理を呼ぶ
		return state.resultLines;
	}

	private _addFragmentToState(state: LineDividingState, fragments: rp.Fragment[], index: number): void {
		var fragment = fragments[index];

		if (state.reservedLineBreakPosition !== null) {
			state.reservedLineBreakPosition--;
		}
		if (state.reservedLineBreakPosition === 0) {
			this._flushCurrentStringDrawInfo(state);
			this._feedLine(state);
			state.reservedLineBreakPosition = null;
		}

		if (typeof fragment === "string" && fragment === "\r") {
			/*
			// 行末に改行記号が来た場合、禁則処理によって改行すべきかは判断を保留し、一旦禁則処理による改行はしないことにする
			if (this._needFixLineBreakByRule(state)) {
				this._applyLineBreakRule(index, state);
			}
			*/

			this._flushCurrentStringDrawInfo(state);
			this._feedLine(state);

		} else if (typeof fragment === "string") {
			var code = g.Util.charCodeAt(fragment, 0);
			if (! code) return;
			var glyph = this._createGlyph(code, this.font);
			if (! glyph) return;

			var glyphScale = this.fontSize / this.font.size;
			var glyphWidth = glyph.advanceWidth * glyphScale;

			if (this._needBreakLine(state, glyphWidth)) {
				this._breakLine(state, fragments, index);
			}
			state.currentStringDrawInfo.width += glyphWidth;
			state.currentStringDrawInfo.glyphs.push(glyph);
			state.currentStringDrawInfo.text += fragment;
		} else {
			var ri = this._createRubyFragmentDrawInfo(fragment);
			if (ri.width <= 0) return;

			this._flushCurrentStringDrawInfo(state);

			if (this._needBreakLine(state, ri.width)) {
				this._breakLine(state, fragments, index);
			}
			state.currentLineInfo.width += ri.width;
			state.currentLineInfo.fragmentDrawInfoArray.push(ri);
			state.currentLineInfo.sourceText += fragment.text;
		}
	}

	private _createStringGlyph(text: string, font: g.Font): g.GlyphLike[] {
		var glyphs: g.GlyphLike[] = [];
		for (var i = 0; i < text.length; i++) {
			var code = g.Util.charCodeAt(text, i);
			if (! code) continue;
			var glyph = this._createGlyph(code, font);
			if (! glyph) continue;

			glyphs.push(glyph);
		}
		return glyphs;
	}

	private _createGlyph(code: number, font: g.Font): g.GlyphLike | null {
		var glyph = font.glyphForCharacter(code);
		if (! glyph) {
			var str = (code & 0xFFFF0000) ? String.fromCharCode((code & 0xFFFF0000) >>> 16, code & 0xFFFF) : String.fromCharCode(code);
			console.warn(
				"Label#_invalidateSelf(): failed to get a glyph for '" + str + "' " +
				"(BitmapFont might not have the glyph or DynamicFont might create a glyph larger than its atlas)."
			);
		}
		return glyph;
	}

	private _createRubyFragmentDrawInfo(fragment: rp.RubyFragment): fr.RubyFragmentDrawInfo {
		var glyphs = this._createStringGlyph(fragment.rb, this.font);
		var rubyGlyphs = this._createStringGlyph(fragment.rt, this.rubyOptions.rubyFont);
		var rubyFont = "rubyFont" in fragment ? fragment.rubyFont : this.rubyOptions.rubyFont;
		var rubyFontSize = "rubyFontSize" in fragment ? fragment.rubyFontSize : this.rubyOptions.rubyFontSize;
		var glyphScale = this.fontSize / this.font.size;
		var rubyGlyphScale = rubyFontSize / rubyFont.size;
		var rbWidth = glyphs.length > 0 ?
			glyphs.map((glyph: g.GlyphLike) => glyph.advanceWidth).reduce((pre: number, cu: number) => pre + cu) * glyphScale :
			0;
		var rtWidth = rubyGlyphs.length > 0 ?
			rubyGlyphs.map((glyph: g.GlyphLike) => glyph.advanceWidth).reduce((pre: number, cu: number) => pre + cu) * rubyGlyphScale :
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

	private _flushCurrentStringDrawInfo(state: LineDividingState): void {
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
					(glyph: g.GlyphLike) => {
						if (minMinusOffsetY > glyph.offsetY) {
							minMinusOffsetY = glyph.offsetY;
						}
						// offsetYの一番小さな値を探す
						if (minOffsetY > glyph.offsetY) minOffsetY = glyph.offsetY;

						var heightWithOffsetY = (glyph.offsetY > 0) ? glyph.height + glyph.offsetY : glyph.height;
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
	}

	private _needBreakLine(state: LineDividingState, width: number): boolean {
		return (this.lineBreak && width > 0 && state.reservedLineBreakPosition === null &&
			state.currentLineInfo.width + state.currentStringDrawInfo.width + width > this._lineBreakWidth &&
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

	/** stateのcurrent系プロパティを禁則処理的に正しい構造に再構築する */
	private _breakLine(state: LineDividingState, fragments: rp.Fragment[], index: number): void {
		if (!this.lineBreakRule) {
			this._flushCurrentStringDrawInfo(state);
			this._feedLine(state);
			return;
		}

		var correctLineBreakPosition = this.lineBreakRule(fragments, index); // 外部ルールが期待する改行位置
		var diff = correctLineBreakPosition - index;
		if (diff === 0) {
			this._flushCurrentStringDrawInfo(state);
			this._feedLine(state);
		} else if (diff > 0) {
			// 先送り改行
			state.reservedLineBreakPosition = diff;
		} else {
			// 巻き戻し改行
			this._flushCurrentStringDrawInfo(state);

			var droppedFragmentDrawInfoArray: fr.FragmentDrawInfo[] = [];

			// currentLineInfoのfragmentDrawInfoArrayを巻き戻す
			while (diff < 0) {
				var fragmentDrawInfoArray = state.currentLineInfo.fragmentDrawInfoArray;
				var lastDrawInfo = fragmentDrawInfoArray[fragmentDrawInfoArray.length - 1];
				if (lastDrawInfo instanceof fr.RubyFragmentDrawInfo) {
					diff++;
					droppedFragmentDrawInfoArray.push(lastDrawInfo);
					fragmentDrawInfoArray.pop();
				} else {
					if (-diff >= lastDrawInfo.text.length) {
						diff += lastDrawInfo.text.length;
						droppedFragmentDrawInfoArray.push(lastDrawInfo);
						fragmentDrawInfoArray.pop();
					} else {
						var droppedGlyphs = lastDrawInfo.glyphs.splice(diff);
						var glyphScale = this.fontSize / this.font.size;
						var droppedDrawInfoWidth = droppedGlyphs.reduce((acc, glyph) => (glyph.advanceWidth * glyphScale + acc), 0);
						lastDrawInfo.width -= droppedDrawInfoWidth;
						var droppedDrawInfoText = lastDrawInfo.text.substring(lastDrawInfo.text.length + diff);
						lastDrawInfo.text = lastDrawInfo.text.substring(0, lastDrawInfo.text.length + diff);

						droppedFragmentDrawInfoArray.push(new fr.StringDrawInfo(
							droppedDrawInfoText, droppedDrawInfoWidth, droppedGlyphs
						));
						diff = 0;
					}
				}
			}

			// currentLineInfoのその他を更新する
			var droppedWidth = 0;
			var droppedSourceText = "";

			droppedFragmentDrawInfoArray.forEach((fragment) => {
				droppedWidth += fragment.width;
				droppedSourceText += fragment.text;
			});
			state.currentLineInfo.width -= droppedWidth;

			var sourceText = state.currentLineInfo.sourceText;
			state.currentLineInfo.sourceText = sourceText.substr(0, sourceText.length - droppedSourceText.length);

			this._feedLine(state);

			state.currentLineInfo.fragmentDrawInfoArray = droppedFragmentDrawInfoArray;
			state.currentLineInfo.width = droppedWidth;
			state.currentLineInfo.sourceText = droppedSourceText;
		}
	}
}

export = Label;
