global.g = require("@akashic/akashic-engine");
const rt = require("../lib/RubyParser");
const parse = require("../lib/DefaultRubyParser").parse;
const Label = require("../lib/Label").Label;
const fr = require("../lib/FragmentDrawInfo");

describe("test Label", function() {
	let runtime;
	let bmpfont;
	let dfont;
	const g = require('../node_modules/@akashic/akashic-engine');
	const mock = require("./helpers/mock");
	const skeletonRuntime = require("./helpers/skeleton");

	beforeEach(function() {
		jasmine.addMatchers(require("./helpers/customMatchers"));
		runtime = skeletonRuntime();
		const width = 512;
		const height = 350;
		const map = {"37564": {"x": 0, "y": 1}};
		const missingGlyph = {"x": 2, "y": 3};
		bmpfont = new g.BitmapFont({
			src: new mock.ResourceFactory().createImageAsset("testId", "testAssetPath", width, height),
			map: map,
			defaultGlyphWidth: 50,
			defaultGlyphHeight: 50,
			missingGlyph: missingGlyph
		});
	});

	afterEach(function() {
	});

	const sampleRule = function (fragments, index) {
		const text = fragments.map((e) => {
			if (e instanceof String) {
				return e;
			} else {
				return "〇";
			}
		});
		const target = fragments[index];
		if (target === "」") {
			return index + 1;
		} else if (target === "「") {
			return index - 1;
		} else {
			const before = fragments[index-1];
			if (!!before && before === "」") {
				return index;
			} else if (!!before && before === "「") {
				return index - 1;
			}
			return index;
		}
	}

	it("初期化", function() {
		const mlabel = new Label({
			scene: runtime.scene,
			text: "foo",
			font: bmpfont,
			fontSize: 20,
			width: 300
		});
		expect(mlabel.text).toBe("foo");
		expect(mlabel.font).toBe(bmpfont);
		expect(mlabel.width).toBe(300);
		expect(mlabel.textAlign).toBe("left");
		expect(mlabel.fontSize).toBe(20);
		expect(mlabel.lineGap).toBe(0);
		expect(mlabel.lineBreak).toBe(true);
		expect(mlabel.textColor).toBeUndefined();
		expect(mlabel.widthAutoAdjust).toBe(false);
		expect(mlabel._lineBreakWidth).toBe(300);
	});

	it("初期化 - default fontSize = font.size", function() {
		const mlabel = new Label({
			scene: runtime.scene,
			text: "foo",
			font: bmpfont,
			width: 300
		});
		expect(mlabel.fontSize).toBe(bmpfont.size);
	});

	it("初期化 - fontSize < 0", function() {
		expect( function() {
			new Label({
				scene: runtime.scene,
				text: "foo",
				font: bmpfont,
				fontSize: -10,
				width: 200,
				lineBreak: false,
				lineGap: 2,
				textAlign: "center"
			});
		}).toThrowError("AssertionError");
	});

	it("初期化 - lineGap < -1 * fontSize", function() {
		expect( function() {
			new Label({
				scene: runtime.scene,
				text: "foo",
				font: bmpfont,
				fontSize: 10,
				width: 200,
				lineBreak: false,
				lineGap: -11,
				textAlign: "right"
			});
		}).toThrowError("AssertionError");
	});

	it("初期化 DynamicFont", function() {
		expect( function() {
			new Label({
				scene: runtime.scene,
				text: "foo",
				fontSize: 10,
				width: 200,
				lineBreak: false,
				lineGap: -11,
				textAlign: "right"
			});
		}).toThrowError("AssertionError");
	});

	it("初期化 - ルビ無効かつ空テキスト", function() {
		expect( function() {
			new Label({
				scene: runtime.scene,
				text: "",
				font: bmpfont,
				fontSize: 20,
				width: 300,
				rubyEnabled: false
			});
		}).not.toThrowError("TypeError");
	});

	it("初期化 - ルビ無効かつ誤ったルビ文法", function() {
		expect( function() {
			new Label({
				scene: runtime.scene,
				text: 'abcdefg[{"rb": "hij", "rt": "hij"]klmn',
				font: bmpfont,
				fontSize: 20,
				width: 300,
				rubyEnabled: true
			});
		}).not.toThrowError("TypeError");
	});

	it("render", function(){
		const mlabel = new Label({
			scene: runtime.scene,
			text: "hoge\nfoo\rbar\r\n\nhogehogehogehoge", // line:5 will break (lineWidth: 16 * 10 = 160 > 100)
			font: bmpfont,
			fontSize: 10,
			width: 100,
			lineBreak: true,
			lineGap: 2
		});

		const r = new mock.Renderer();
		mlabel.render(r);
		const params = mlabel._renderer.methodCallParamsHistory("drawImage");

		expect(params[0].offsetX).toBe(0);
		expect(params[0].offsetY).toBe(0);
		expect(params[0].width).toBe(40);  // fontSize * fontLength
		expect(params[0].height).toBe(10); // fontSize
		expect(params[0].canvasOffsetX).toBe(0);
		expect(params[0].canvasOffsetY).toBe(0);

		expect(params[1].offsetX).toBe(0);
		expect(params[1].offsetY).toBe(0);
		expect(params[1].width).toBe(30);
		expect(params[1].height).toBe(10);
		expect(params[1].canvasOffsetX).toBe(0);
		expect(params[1].canvasOffsetY).toBe(12); // fontSize + lineGap = 10 + 2

		expect(params[2].offsetX).toBe(0);
		expect(params[2].offsetY).toBe(0);
		expect(params[2].width).toBe(30);
		expect(params[2].height).toBe(10);
		expect(params[2].canvasOffsetX).toBe(0);
		expect(params[2].canvasOffsetY).toBe(24); // (10 + 2) * 2

		// line 3 is empty -> no draw
		expect(params[3].offsetX).toBe(0);
		expect(params[3].offsetY).toBe(0);
		expect(params[3].width).toBe(100);
		expect(params[3].height).toBe(10);
		expect(params[3].canvasOffsetX).toBe(0);
		expect(params[3].canvasOffsetY).toBe(48); // (10 + 2) * 4

		expect(params[4].offsetX).toBe(0);
		expect(params[4].offsetY).toBe(0);
		expect(params[4].width).toBe(60);
		expect(params[4].height).toBe(10);
		expect(params[4].canvasOffsetX).toBe(0);
		expect(params[4].canvasOffsetY).toBe(60); // (10 + 2) * 5
	});

	it("render - textColor", function(){
		const mlabel = new Label({
			scene: runtime.scene,
			text: "hoge",
			font: bmpfont,
			fontSize: 10,
			width: 100,
			lineBreak: true,
			lineGap: 2,
			textColor: "blue"
		});

		const r = new mock.Renderer();
		mlabel.render(r);

		const cr = mlabel._cache.createdRenderer;
		expect(cr.methodCallParamsHistory("setCompositeOperation").length).toBe(1);
		expect(cr.methodCallParamsHistory("setCompositeOperation")[0])
			.toEqual({operation: "source-atop"});

		expect(cr.methodCallParamsHistory("fillRect").length).toBe(1);
		expect(cr.methodCallParamsHistory("fillRect")[0])
			.toEqual({x: 0, y:0, width: mlabel.width, height: mlabel.height, cssColor: "blue"});
	});

	it("_offsetX", function(){
		const fontSize = 10;
		const mlabel = new Label({
			scene: runtime.scene,
			text: "a", // width: 10px
			font: bmpfont,
			fontSize: fontSize,
			width: 100,
			lineBreak: true,
			lineGap: 2
		});

		expect(mlabel._offsetX(fontSize)).toBe(0);
		mlabel.textAlign = "center";
		expect(mlabel._offsetX(fontSize)).toBe(45); // (100 - 10) / 2
		mlabel.textAlign = "right";
		expect(mlabel._offsetX(fontSize)).toBe(90); // 100 - 10
	});

	it("_invalidateSelf", function(){
		const mlabel = new Label({
			scene: runtime.scene,
			text: "a",
			font: bmpfont,
			textColor: "black",
			fontSize: 10,
			textAlign: "center",
			width: 100,
			lineBreak: true,
			lineGap: 2
		});
		mlabel.text = "b";
		mlabel.textColor = "red";
		mlabel.fontSize = 15;
		mlabel.textAlign = "right";
		mlabel.width = 200;
		mlabel.lineBreak = false;
		mlabel.lineGap = 3;
		mlabel.rubyOptions = {
			rubyFontSize: 20,
			rubyFont: bmpfont,
			rubyGap: 20,
			rubyAlign: rt.RubyAlign.Center
		};
		mlabel.invalidate();
		const mlabel2 = new Label({
			scene: runtime.scene,
			text: "b",
			textColor: "red",
			font: bmpfont,
			fontSize: 15,
			textAlign: "right",
			width: 200,
			lineBreak: false,
			lineGap: 3,
			rubyOptions: {
				rubyFontSize: 20,
				rubyFont: bmpfont,
				rubyGap: 20,
				rubyAlign: rt.RubyAlign.Center
			}
		});
		expect(mlabel.text).toEqual(mlabel2.text);
		expect(mlabel.textColor).toEqual(mlabel2.textColor);
		expect(mlabel.fontSize).toEqual(mlabel2.fontSize);
		expect(mlabel.textAlign).toEqual(mlabel2.textAlign);
		expect(mlabel.width).toEqual(mlabel2.width);
		expect(mlabel.height).toEqual(mlabel2.height);
		expect(mlabel.lineBreak).toEqual(mlabel2.lineBreak);
		expect(mlabel.lineGap).toEqual(mlabel2.lineGap);
		expect(mlabel.rubyOptions).toEqual(mlabel2.rubyOptions);
	});


	it("_divideToLines", function(){
		const createLabel = function(text){
			const mlabel = new Label({
				scene: runtime.scene,
				text: text,
				font: bmpfont,
				fontSize: 10,
				width: 105,
				rubyOptions: {
				}
			});
			return mlabel;
		};
		const createLineInfo = function(text){
			const label = createLabel(text);
			let fragments = parse(label.text);
			fragments =
				rt.flatmap(fragments, function (f) {
					if (typeof f !== "string")
						return f;
						// サロゲートペア文字を正しく分割する
						return f.replace(/\r\n|\n/g, "\r").match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g);
				});

			return label._divideToLines(fragments);
		};
		const label = createLabel("");

		const text =  "1234567890";
		const lineInfo = createLineInfo(text);
		const glyphs = label._createStringGlyph(text, bmpfont);
		const expectLineInfo = [
			{
				sourceText: text,
				width: 10 * text.length,
				height: 10,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: [new fr.StringDrawInfo(text, 10 * text.length, glyphs)]
			}
		];
		expect(lineInfo).toEqual(expectLineInfo);

		const text2 =  "123456789012345678901234567890";
		const lineInfo2 = createLineInfo(text2);
		const expectLineInfo2 = [
			{
				sourceText: text,
				width: 100,
				height: 10,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: [new fr.StringDrawInfo(text, 100, glyphs)]
			},
			{
				sourceText: text,
				width: 100,
				height: 10,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: [new fr.StringDrawInfo(text, 100, glyphs)]
			},
			{
				sourceText: text,
				width: 100,
				height: 10,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: [new fr.StringDrawInfo(text, 100, glyphs)]
			}
		];
		expect(lineInfo2).toEqual(expectLineInfo2);

		const text3 =  '12345{"rb": "1234567890", "rt": "number"}1234567890';
		const lineInfo3 = createLineInfo(text3);
		const expectLineInfo3 = [
			{
				sourceText: "12345",
				width: 50,
				height: 10,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: [new fr.StringDrawInfo(
					"12345",
					50,
					label._createStringGlyph("12345", bmpfont))]
			},
			{
				sourceText: '{"rb": "1234567890", "rt": "number"}',
				width: 100,
				height: 10 + 5 + 0,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: [new fr.RubyFragmentDrawInfo(
					{
						rb: "1234567890",
						rt: "number",
						text: '{"rb": "1234567890", "rt": "number"}'

					}, 100, 100, 30,
					label._createStringGlyph("1234567890", bmpfont),
					label._createStringGlyph("number", bmpfont)
				)]
			},
			{
				sourceText: "1234567890",
				width: 100,
				height: 10,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: [new fr.StringDrawInfo(
					"1234567890",
					100,
					label._createStringGlyph("1234567890", bmpfont))]
			}
		];
		expect(lineInfo3).toEqual(expectLineInfo3);

		const text4 =  '123{"rb": "45678", "rt": "fiv"}901234567890';
		const lineInfo4 = createLineInfo(text4);
		const expectLineInfo4 = [
			{
				sourceText: '123{"rb": "45678", "rt": "fiv"}90',
				width: 100,
				height: 10 + 5 + 0,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: [
					new fr.StringDrawInfo(
					"123",
					30,
					label._createStringGlyph("123", bmpfont)
					),
					new fr.RubyFragmentDrawInfo(
						{
							rb: "45678",
							rt: "fiv",
							text: '{"rb": "45678", "rt": "fiv"}'

						}, 50, 50, 15,
						label._createStringGlyph("45678", bmpfont),
						label._createStringGlyph("fiv", bmpfont)
					),
					new fr.StringDrawInfo(
						"90",
						20,
						label._createStringGlyph("90", bmpfont)
					)
				]
			},
			{
				sourceText: "1234567890",
				width: 100,
				height: 10,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: [new fr.StringDrawInfo(
					"1234567890",
					100,
					label._createStringGlyph("1234567890", bmpfont))]
			}
		];
		expect(lineInfo4).toEqual(expectLineInfo4);

		const text5 =  '{"rb": "123", "rt": "ruby one"}{"rb": "45", "rt": "ruby two"}6789012';
		const lineInfo5 = createLineInfo(text5);
		const expectLineInfo5 = [
			{
				sourceText: '{"rb": "123", "rt": "ruby one"}{"rb": "45", "rt": "ruby two"}67',
				width: 100,
				height: 10 + 5 + 0,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: [
					new fr.RubyFragmentDrawInfo(
						{
							rb: "123",
							rt: "ruby one",
							text: '{"rb": "123", "rt": "ruby one"}'

						}, 40, 30, 40,
						label._createStringGlyph("123", bmpfont),
						label._createStringGlyph("ruby one", bmpfont)
					),
					new fr.RubyFragmentDrawInfo(
						{
							rb: "45",
							rt: "ruby two",
							text: '{"rb": "45", "rt": "ruby two"}'

						}, 40, 20, 40,
						label._createStringGlyph("45", bmpfont),
						label._createStringGlyph("ruby two", bmpfont)
					),
					new fr.StringDrawInfo(
						"67",
						20,
						label._createStringGlyph("67", bmpfont)
					)
				]
			},
			{
				sourceText: "89012",
				width: 50,
				height: 10,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: [
					new fr.StringDrawInfo(
						"89012",
						50,
						label._createStringGlyph("89012", bmpfont)
					)
				]
			}
		];
		expect(lineInfo5).toEqual(expectLineInfo5);

		const text6 = "01234\r56789\n01234\r\n56789";
		const lineInfo6 = createLineInfo(text6);
		const expectLineInfo6 = [
			{
				sourceText: "01234",
				width: 50,
				height: 10,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: [new fr.StringDrawInfo(
					"01234",
					50,
					label._createStringGlyph("01234", bmpfont))]
			},
			{
				sourceText: "56789",
				width: 50,
				height: 10,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: [new fr.StringDrawInfo(
					"56789",
					50,
					label._createStringGlyph("56789", bmpfont))]
			},
			{
				sourceText: "01234",
				width: 50,
				height: 10,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: [new fr.StringDrawInfo(
					"01234",
					50,
					label._createStringGlyph("01234", bmpfont))]
			},
			{
				sourceText: "56789",
				width: 50,
				height: 10,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: [new fr.StringDrawInfo(
					"56789",
					50,
					label._createStringGlyph("56789", bmpfont))]
			}
		];
		expect(lineInfo6).toEqual(expectLineInfo6);

		const text7 =  "";
		const lineInfo7 = createLineInfo(text7);
		const expectLineInfo7 = [
			{
				sourceText: text7,
				width: 0 * text7.length,
				height: 10,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: []
			}
		];
		expect(lineInfo7).toEqual(expectLineInfo7);

		const text8 =  '{"rb": "", "rt": ""}';
		const lineInfo8 = createLineInfo(text8);
		const expectLineInfo8 = [
			{
				sourceText: '',
				width: 0,
				height: 10 + 0 + 0,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: []
			}
		];
		expect(lineInfo8).toEqual(expectLineInfo8);

		const text9 =  '123{"rb": "", "rt": ""}456';
		const lineInfo9 = createLineInfo(text9);
		const expectLineInfo9 = [
			{
				sourceText: "123456",
				width: 60,
				height: 10,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: [
					new fr.StringDrawInfo(
						"123456",
						60,
						label._createStringGlyph("123456", bmpfont)
					)
				]
			},
		];
		expect(lineInfo9).toEqual(expectLineInfo9);
	});

	it("_divideToLines - options", function(){
		const createLabel = function(text){
			const mlabel = new Label({
				scene: runtime.scene,
				text: text,
				textAlign:  "left",
				font: bmpfont,
				fontSize: 10,
				width: 105,
				lineBreak: false,
				lineGap: 2,
				rubyEnabled: true,
				rubyParser: parse,
				fixLineGap: true,
				rubyOptions: {
					rubyFontSize: 5,
					rubyFont: bmpfont,
					rubyAlign: rt.RubyAlign.Center,
					rubyGap: 2
				}
			});
			return mlabel;
		};
		const createLineInfo = function(text){
			const label = createLabel(text);
			let fragments = parse(label.text);
			fragments =
				rt.flatmap(fragments, function (f) {
					if (typeof f !== "string")
						return f;
						// サロゲートペア文字を正しく分割する
						return f.replace(/\r\n|\n/g, "\r").match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g);
				});
			return label._divideToLines(fragments);
		};
		const label = createLabel("");

		const text =  '12345{"rb": "1234567890", "rt": "number", "rubyFontSize": 5}';
		const lineInfo = createLineInfo(text);
		const expectLineInfo = [
			{
				sourceText:  '12345{"rb": "1234567890", "rt": "number", "rubyFontSize": 5}',
				width: 150,
				height: 10 + 5 + 2,
				surface: undefined,
				minMinusOffsetY: 0,
				fragmentDrawInfoArray: [
				new fr.StringDrawInfo(
					"12345",
					50,
					label._createStringGlyph("12345", bmpfont)
				),
				new fr.RubyFragmentDrawInfo(
					{
						rb: "1234567890",
						rt: "number",
						text: '{"rb": "1234567890", "rt": "number", "rubyFontSize": 5}',
						rubyFontSize: 5

					}, 100, 100, 30,
					label._createStringGlyph("1234567890", bmpfont),
					label._createStringGlyph("number", bmpfont)
				)
				]
			}
		];
		expect(lineInfo).toEqual(expectLineInfo);

	});

	it("widthAutoAdjust - options", function(){
		const createLabel = function(text){
			const mlabel = new Label({
				scene: runtime.scene,
				text: text,
				textAlign: "left",
				font: bmpfont,
				fontSize: 10,
				width: 105,
				lineBreak: true,
				widthAutoAdjust: true
			});
			return mlabel;
		};
		const label = createLabel("thefoxisjumpingoverthelazydog");
		expect(label.width).toBe(100); // 105以下かつfontSize(10)の倍数の値
		expect(label._lineBreakWidth).toBe(105);
		expect(label._lines.length).toBe(3);

		label.text = "thefox";
		label.invalidate();
		expect(label.width).toBe(60); // text幅に応じて調整される
		expect(label._lineBreakWidth).toBe(105); // 変化しない
		expect(label._lines.length).toBe(1);

		label.text = "thefoxisjumpingoverthelazydog";
		label.invalidate();
		expect(label.width).toBe(100); // textを戻した場合描画内容も再現する
		expect(label._lineBreakWidth).toBe(105);
		expect(label._lines.length).toBe(3);

		label.width = 205;
		label.invalidate();
		expect(label.width).toBe(200); // 205以下かつfontSize(10)の倍数の値
		expect(label._lineBreakWidth).toBe(205); // this.widthの更新に追従する
		expect(label._lines.length).toBe(2);
	});

	it("trimMarginTop - options", function(){
		const createLabel = function(text){
			const mlabel = new Label({
				scene: runtime.scene,
				text: text,
				textAlign: "left",
				font: bmpfont,
				fontSize: 10,
				width: 105,
				lineBreak: false,
				lineGap: 2,
				fixLineGap: false,
				widthAutoAdjust: true,
				trimMarginTop: true
			});
			return mlabel;
		};
		const label = createLabel("label");
		// const RubyHeightInfo;
		const state = {
			resultLines: [],
			currentStringDrawInfo: {
				text: "",
				width: 0,
				glyphs: []
			},
			currentLineInfo: {
				sourceText: "",
				width: 0,
				height: 0,
				minMinusOffsetY: 0,
				surface: undefined,
				fragmentDrawInfoArray: [
					{
						text: "a",
						width: 1,
						glyphs: [
							{
								code: 97, // a code
								x: 0,
								y: 0,
								width: 1,
								height: 2,
								surface: undefined,
								offsetX: 3,
								offsetY: -4,
								advanceWidth: 5,
								isSurfaceValid: false,
								_atlas: undefined
							}
						]
					}
				]
			}
		};
		state2 = JSON.parse(JSON.stringify(state));

		label._calcStandardOffsetY = function(font) { return -100; };
		label._feedLine(state);
		// sglyph["97"].height(2) - label.fontsize(10) / label.font.size(50) * _calcStandardOffsetY(-100)
		expect(state.resultLines[0].height).toBe(22);

		label.trimMarginTop = false;
		label._feedLine(state2);
		expect(state2.resultLines[0].height).toBe(2); // glyph["97"].height(2)
	});

	it("line break rules - 初期化", function() {
		expect( function() {
			new Label({
				scene: runtime.scene,
				text: "foobar",
				font: bmpfont,
				fontSize: 10,
				width: 100,
				lineBreak: false,
				lineGap: 2,
				textAlign: "left",
				lineBreakRule: (fragments, index) => index
			});
			expect(mlabel.lineBreakRule).toEqual((fragments, index) => index);
		}).not.toThrowError("AssertionError");
	});

	it("line break rules - before text", function() {
		const label = new Label({
			scene: runtime.scene,
			text: "0123456",
			font: bmpfont,
			fontSize: 10,
			width: 30,
			lineBreak: true,
			lineGap: 2,
			textAlign: "left",
			lineBreakRule: (fragments, index) => {
				if (fragments[index] === "3") {
					return index - 1;
				} else {
					return index;
				}
			}
		});
		label.invalidate();
		expect(label._lines[0].sourceText).toBe("01");
		expect(label._lines[1].sourceText).toBe("234");
	});

	it("line break rules - after text", function() {
		const label = new Label({
			scene: runtime.scene,
			text: "0123456",
			font: bmpfont,
			fontSize: 10,
			width: 30,
			lineBreak: true,
			lineGap: 2,
			textAlign: "left",
			lineBreakRule: (fragments, index) => {
				if (fragments[index] === "3") {
					return index + 1;
				} else {
					return index;
				}
			}
		});
		label.invalidate();
		expect(label._lines[0].sourceText).toBe("0123");
		expect(label._lines[1].sourceText).toBe("456");
	});


	it("line break rules - ruby", function() {
		const label = new Label({
			scene: runtime.scene,
			text: 'abcdefg[{"rb": "hij", "rt": "hij"}]klmn',
			font: bmpfont,
			fontSize: 10,
			width: 80,
			lineBreak: true,
			lineGap: 2,
			textAlign: "left",
			rubyEnabled: true,
			lineBreakRule: (fragments, index) => {
				if (fragments[index] === "]") {
					return index + 1; // 先送り改行
				} else {
					const before = fragments[index - 1];
					if (!!before && before === "]") {
						return index;
					} else if (!!before && before === "[") { // 巻き戻し改行
						return index - 1;
					}
					return index;
				}
			}
		});
		label.invalidate();
		expect(label._lines[0].sourceText).toBe('abcdefg');
		expect(label._lines[1].sourceText).toBe('[{"rb": "hij", "rt": "hij"}]klm');
		label.width = 110;
		label.invalidate();
		expect(label._lines[0].sourceText).toBe('abcdefg[{"rb": "hij", "rt": "hij"}]');
		expect(label._lines[1].sourceText).toBe('klmn');
	});
});
