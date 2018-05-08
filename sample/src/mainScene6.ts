import {Label, RubyAlign, Fragment} from "@akashic-extension/akashic-label";
var game = g.game;

module.exports = function() {
	var scene = new g.Scene({
		game: game,
		assetIds: ["bmpfont", "bmpfont-glyph", "mplus", "mplus-glyph"]
	});
	var rate = game.fps / 3;
	scene.loaded.add(function() {

		// グリフデータの生成
		var mplusGlyph = JSON.parse((<g.TextAsset>scene.assets["mplus-glyph"]).data);

		// ビットマップフォント画像とグリフ情報からBitmapFontのインスタンスを生成
		var mplusfont = new g.BitmapFont({
			src: scene.assets["mplus"],
			map: mplusGlyph.map,
			defaultGlyphWidth: mplusGlyph.width,
			defaultGlyphHeight: mplusGlyph.height,
			missingGlyph: mplusGlyph.missingGlyph
		});

		// グリフデータの生成
		var glyph = JSON.parse((<g.TextAsset>scene.assets["bmpfont-glyph"]).data);

		// ビットマップフォント画像とグリフ情報からBitmapFontのインスタンスを生成
		var bmpfont = new g.BitmapFont({
			src: scene.assets["bmpfont"],
			map: glyph.map,
			defaultGlyphWidth: glyph.width,
			defaultGlyphHeight: glyph.height,
			missingGlyph: glyph.missingGlyph
		});

		var dhint: g.DynamicFontHint = {
			initialAtlasWidth: 256,
			initialAtlasHeight: 256,
			maxAtlasWidth: 256,
			maxAtlasHeight: 256,
			maxAtlasNum: 8
		}
		var dfont = new g.DynamicFont({
			game: scene.game,
			fontFamily: g.FontFamily.Monospace,
			size: 40,
			hint: dhint
		});

		var counter = 0;		
		var text = "「これ」と「それ」と「あれ」と「どれ」と「これ」と「それ」と「あれ」と「どれ」と「これ」と「それ」と「あれ」と「どれ」と「これ」と「それ」と「あれ」と「どれ」";
		var sampleRule = function (text: Fragment[], index: number) {
			text = (text as string[]);
			var joinedText = text.join("");
			const target = joinedText[index];
				if (target === "」") {
					return index + 1;
				} else if (target === "「") {
					return index - 1;
				} else {
					return index;
				}
		}
		var lblabel = new Label({
			scene: scene,
			text: text,
			font: mplusfont,
			fontSize: 14,
			textAlign: g.TextAlign.Left,
			width: game.width / 4,
			lineBreak: true,
			widthAutoAdjust: true,
			lineBreakRule: sampleRule
		});
		lblabel.y = 40;
		scene.append(lblabel);
		lblabel.update.add(function() {
			if (game.age % rate === 0) {
				this.width = counter % 20 * 10 + 120;
				counter++;
				this.invalidate();
			}
		}, lblabel);

		var text = '「{"rt":"これ","rb":"これ"}」と「{"rt":"それ","rb":"それ"}」と「{"rt":"あれ","rb":"あれ"}」と「{"rt":"どれ","rb":"どれ"}」と' +
			'「{"rt":"これ","rb":"これ"}」と「{"rt":"それ","rb":"それ"}」と「{"rt":"あれ","rb":"あれ"}」と「{"rt":"どれ","rb":"どれ"}」と' +
			'「{"rt":"これ","rb":"これ"}」と「{"rt":"それ","rb":"それ"}」と「{"rt":"あれ","rb":"あれ"}」と「{"rt":"どれ","rb":"どれ"}」と' +
			'「{"rt":"これ","rb":"これ"}」と「{"rt":"それ","rb":"それ"}」と「{"rt":"あれ","rb":"あれ"}」と「{"rt":"どれ","rb":"どれ"}」と';
		var sampleRule = function (fragments: Fragment[], index: number) {
			/*
			text = text.map((e) => {
				if (e instanceof String) {
					return e;
				} else {
					return "〇";
				}
			});
			var joinedText = text.join("");
			*/
			const target = fragments[index];
				if (target === "」") {
					return index + 1;
				} else if (target === "「") {
					return index - 1;
				} else {
					return index;
				}
		}
		var lblabel2 = new Label({
			scene: scene,
			text: text,
			font: mplusfont,
			fontSize: 14,
			textAlign: g.TextAlign.Left,
			width: game.width / 4,
			lineBreak: true,
			widthAutoAdjust: true,
			lineBreakRule: sampleRule
		});
		lblabel2.y = 160;
		scene.append(lblabel2);
		lblabel2.update.add(function() {
			if (game.age % rate === 0) {
				this.width = counter % 20 * 10 + 120;
				counter++;
				this.invalidate();
			}
		}, lblabel2);

		var nlabel = new Label({
			scene: scene,
			text: "［次＞＞］",
			font: mplusfont,
			fontSize: 20,
			width: game.width
		});
		nlabel.x = 230;
		nlabel.y = game.height - 20;
		nlabel.touchable = true;
		nlabel.pointDown.add(function() {
			var scene3 = require("mainScene")();
			game.replaceScene(scene3);
		}, nlabel);
		scene.append(nlabel);

		var dlabel = new Label({
			scene: scene,
			text: "［フォント切替］",
			font: mplusfont,
			fontSize: 20,
			textAlign: g.TextAlign.Right,
			width: 130
		});
		dlabel.x = 100;
		dlabel.y = game.height - 20;
		dlabel.touchable = true;
		dlabel.pointDown.add(function(){
			scene.children.forEach((child: g.E) => {
				if (child instanceof Label) {
					child.font = dfont;
					child.rubyOptions.rubyFont = dfont;
					child.invalidate();
				}
			});
		}, dlabel);
		scene.append(dlabel);

	});
	return scene;
};
