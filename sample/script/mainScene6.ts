import {Label, RubyAlign, Fragment} from "@akashic-extension/akashic-label";
var game = g.game;

module.exports = function() {
	var scene = new g.Scene({
		game: game,
		assetIds: ["bmpfont", "bmpfont-glyph", "mplus", "mplus-glyph"]
	});
	var rate = game.fps / 2;
	scene.loaded.handle(function() {

		// グリフデータの生成
		var mplusGlyph = JSON.parse((<g.TextAsset>scene.assets["mplus-glyph"]).data);

		// ビットマップフォント画像とグリフ情報からBitmapFontのインスタンスを生成
		var mplusfont = new g.BitmapFont(
			scene.assets["mplus"],
			mplusGlyph.map,
			mplusGlyph.width,
			mplusGlyph.height,
			mplusGlyph.missingGlyph
		);

		// グリフデータの生成
		var glyph = JSON.parse((<g.TextAsset>scene.assets["bmpfont-glyph"]).data);

		// ビットマップフォント画像とグリフ情報からBitmapFontのインスタンスを生成
		var bmpfont = new g.BitmapFont(
			scene.assets["bmpfont"],
			glyph.map,
			glyph.width,
			glyph.height,
			glyph.missingGlyph
		);

		var dhint: g.DynamicFontHint = {
			initialAtlasWidth: 256,
			initialAtlasHeight: 256,
			maxAtlasWidth: 256,
			maxAtlasHeight: 256,
			maxAtlasNum: 8
		}
		var dfont = new g.DynamicFont(g.FontFamily.Monospace, 40, scene.game, dhint);

		var tlabel0 = new Label({
			scene: scene,
			text: "行末の禁則処理",
			font: mplusfont,
			fontSize: 30,
			width: game.width,
			textAlign: g.TextAlign.Center
		});
		tlabel0.x = 0;
		scene.append(tlabel0);

		var counter = 0;

		var text = "「これ」と「それ」と「あれ」と「●●」と「これ」と「それ」と「あれ」と「●●」と「これ」と「それ」と「あれ」と「●●」と「これ」と「それ」と「あれ」と「●●」";
		var sampleRule = function (fragments: Fragment[], index: number) {
			const target = fragments[index];
				if (target === "」") {
					return index + 1;
				} else {
					var before = fragments[index-1];
					if (!!before && before === "」") {
						return index;
					} else if (!!before && before === "「") {
						return index - 1;
					}
					return index;
				}
		}
		var lblabel = new Label({
			scene: scene,
			text: text,
			font: mplusfont,
			fontSize: 15,
			textAlign: g.TextAlign.Left,
			width: game.width / 4,
			lineBreak: true,
			lineBreakRule: sampleRule
		});
		lblabel.y = 40;
		scene.append(lblabel);
		lblabel.update.handle(function() {
			if (game.age % rate === 0) {
				lblabel.width += 5;
				if (lblabel.width > game.width) lblabel.width = 100;
				lblabel.invalidate();
			}
		});

		var text = '「{"rt":"これ","rb":"これ"}」と「{"rt":"それ","rb":"それ"}」と「{"rt":"あれ","rb":"あれ"}」と「{"rt":"●●","rb":"●●"}」と' +
			'「{"rt":"これ","rb":"これ"}」と「{"rt":"それ","rb":"それ"}」と「{"rt":"あれ","rb":"あれ"}」と「{"rt":"●●","rb":"●●"}」と' +
			'「{"rt":"これ","rb":"これ"}」と「{"rt":"それ","rb":"それ"}」と「{"rt":"あれ","rb":"あれ"}」と「{"rt":"●●","rb":"●●"}」と' +
			'「{"rt":"これ","rb":"これ"}」と「{"rt":"それ","rb":"それ"}」と「{"rt":"あれ","rb":"あれ"}」と「{"rt":"●●","rb":"●●"}」';
		var sampleRule = function (fragments: Fragment[], index: number) {
			
			var text = fragments.map((e) => {
				if (e instanceof String) {
					return e;
				} else {
					return "〇";
				}
			});
			var joinedText = text.join("");
			
			const target = fragments[index];
			if (target === "」") {
				return index + 1;
			} else {
				var before = fragments[index-1];
				if (!!before && before === "」") {
					return index;
				} else if (!!before && before === "「") {
					return index - 1;
				}
				return index;
			}
		}
		var lblabel2 = new Label({
			scene: scene,
			text: text,
			font: mplusfont,
			fontSize: 15,
			textAlign: g.TextAlign.Left,
			width: game.width / 4,
			lineBreak: true,
			widthAutoAdjust: true,
			lineBreakRule: sampleRule
		});
		lblabel2.y = 190;
		scene.append(lblabel2);
		lblabel2.update.handle(function() {
			if (game.age % rate === 0) {
				lblabel2.width = counter % 20 * 5 + 120;
				counter++;
				lblabel2.invalidate();
			}
		});

		var nlabel = new Label({
			scene: scene,
			text: "［最初＞＞］",
			font: mplusfont,
			fontSize: 20,
			width: game.width
		});
		nlabel.x = 230;
		nlabel.y = game.height - 20;
		nlabel.touchable = true;
		nlabel.pointDown.handle(function() {
			var scene3 = require("mainScene")();
			game.replaceScene(scene3);
		});
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
		dlabel.pointDown.handle(function(){
			scene.children.forEach((label) => {
				if (label instanceof Label) {
					label.font = dfont;
					label.rubyOptions.rubyFont = dfont;
					label.invalidate();
				}
			});
		});
		scene.append(dlabel);

	});
	return scene;
};