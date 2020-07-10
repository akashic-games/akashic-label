import { Label, Fragment } from "@akashic-extension/akashic-label";
import { mainScene } from "./mainScene";

var game = g.game;

export function mainScene6(): g.Scene {
	var scene = new g.Scene({
		game: game,
		assetIds: ["bmpfont", "bmpfont-glyph", "mplus", "mplus-glyph"]
	});
	var rate = game.fps / 2;
	scene.loaded.add(() => {

		// グリフデータの生成
		var mPlusGlyphInfo = JSON.parse(scene.asset.getTextById("mplus-glyph").data);
		// ビットマップフォント画像とグリフ情報からBitmapFontのインスタンスを生成
		var mplusfont = new g.BitmapFont({
			src: scene.asset.getImageById("mplus"),
			glyphInfo: mPlusGlyphInfo
		});

		var dhint: g.DynamicFontHint = {
			initialAtlasWidth: 256,
			initialAtlasHeight: 256,
			maxAtlasWidth: 256,
			maxAtlasHeight: 256,
			maxAtlasNum: 8
		};
		var dfont = new g.DynamicFont({
			game: scene.game,
			fontFamily: g.FontFamily.Monospace,
			size: 40,
			hint: dhint
		});

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
		var sampleRule = (fragments: Fragment[], index: number) => {
			const ignoreHead = ["」", "』", "】"];
			const ignoreTail = ["「", "『", "【"];
			const headChar = fragments[index];
			const isHeadCharIgnore = ignoreHead.indexOf(headChar as string) !== -1;
			if (typeof headChar !== "string") return index;
			if (isHeadCharIgnore) {
				return index + 1;
			} else {
				const before = fragments[index - 1];
				const isBeforeIgnore = ignoreHead.indexOf(before as string) !== -1;
				if (!!before && isBeforeIgnore) {
					return index;
				} else if (!!before && ignoreTail.indexOf(before as string) !== -1) {
					return index - 1;
				}
				return index;
			}
		};
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
		lblabel.update.add(() => {
			if (game.age % rate === 0) {
				lblabel.width += 5;
				if (lblabel.width > game.width) lblabel.width = 100;
				lblabel.invalidate();
			}
		}, lblabel);

		var text = `「{"rt":"これ","rb":"これ"}」と「{"rt":"それ","rb":"それ"}」と「{"rt":"あれ","rb":"あれ"}」と「{"rt":"●●","rb":"●●"}」と` +
			`「{"rt":"これ","rb":"これ"}」と「{"rt":"それ","rb":"それ"}」と「{"rt":"あれ","rb":"あれ"}」と「{"rt":"●●","rb":"●●"}」と` +
			`「{"rt":"これ","rb":"これ"}」と「{"rt":"それ","rb":"それ"}」と「{"rt":"あれ","rb":"あれ"}」と「{"rt":"●●","rb":"●●"}」と` +
			`「{"rt":"これ","rb":"これ"}」と「{"rt":"それ","rb":"それ"}」と「{"rt":"あれ","rb":"あれ"}」と「{"rt":"●●","rb":"●●"}」`;
		var sampleRule = (fragments: Fragment[], index: number) => {
			const target = fragments[index];
			if (target === "」") {
				return index + 1;
			} else {
				var before = fragments[index - 1];
				if (!!before && before === "」") {
					return index;
				} else if (!!before && before === "「") {
					return index - 1;
				}
				return index;
			}
		};
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
		lblabel2.update.add(() => {
			if (game.age % rate === 0) {
				lblabel2.width = counter % 20 * 5 + 120;
				counter++;
				lblabel2.invalidate();
			}
		}, lblabel2);

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
		nlabel.pointDown.add(() => {
			var scene3 = mainScene();
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
		dlabel.pointDown.add(() => {
			scene.children.forEach((label) => {
				if (label instanceof Label) {
					label.font = dfont;
					label.rubyOptions.rubyFont = dfont;
					label.invalidate();
				}
			});
		}, dlabel);
		scene.append(dlabel);

	});
	return scene;
}
