import { Label, RubyAlign } from "@akashic-extension/akashic-label";
import { mainScene3 } from "./mainScene3";

export function mainScene2(): g.Scene {
	var game = g.game;
	var scene = new g.Scene({
		game: game,
		assetIds: ["bmpfont", "bmpfont-glyph", "mplus", "mplus-glyph"]
	});
	var rate = game.fps / 6;
	scene.loaded.add(() => {

		// グリフデータの生成
		var mPlusGlyphInfo = JSON.parse(scene.asset.getTextById("mplus-glyph").data);
		// ビットマップフォント画像とグリフ情報からBitmapFontのインスタンスを生成
		var mplusfont = new g.BitmapFont({
			src: scene.asset.getImageById("mplus"),
			glyphInfo: mPlusGlyphInfo
		});

		var bmpGlyphInfo = JSON.parse(scene.asset.getTextById("bmpfont-glyph").data);
		var bmpfont = new g.BitmapFont({
			src: scene.asset.getImageById("bmpfont"),
			glyphInfo: bmpGlyphInfo
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

		// ラベルのルビ基本機能
		var tlabel0 = new Label({
			scene: scene,
			text: "ルビ機能",
			font: mplusfont,
			fontSize: 30,
			width: game.width,
			textAlign: g.TextAlign.Center
		});
		tlabel0.x = 0;
		scene.append(tlabel0);

		var y0 = 40;

		// ルビの利用
		var label01 = new Label({
			scene: scene,
			text: `use {"rt":"ruby","rb":"ruby"}.`,
			font: bmpfont,
			fontSize: 20,
			width: 180
		});
		label01.y = y0;
		scene.append(label01);

		// ルビを使わない
		var label02 = new Label({
			scene: scene,
			text: `unuse {"rt":"ruby","rb":"ruby"}.`,
			font: bmpfont,
			fontSize: 20,
			width: game.width,
			rubyEnabled: false
		});
		label02.y = y0 + 40;
		scene.append(label02);

		// ルビと本文の行間
		var counter03 = 0;
		var label03 = new Label({
			scene: scene,
			text: `{"rt":"るび","rb":"ルビ"}の行間`,
			font: mplusfont,
			fontSize: 20,
			width: 100,
			rubyOptions: {rubyGap: -5}
		});
		label03.x = 0;
		label03.y = y0 + 90;
		label03.touchable = true;
		label03.update.add(() => {
			if (game.age % rate === 0) {
				label03.rubyOptions.rubyGap = counter03 % 4 - 5;
				counter03++;
				label03.invalidate();
			}
		}, label03);
		scene.append(label03);

		// ルビのフォントサイズ
		var counter04 = 0;
		var label04 = new Label({
			scene: scene,
			text: `{"rt":"るび","rb":"ルビ"}サイズ`,
			font: mplusfont,
			fontSize: 20,
			width: game.width,
			rubyOptions: {rubyFontSize: 15, rubyGap: -5}
		});
		label04.x = 100;
		label04.y = y0 + 90;
		label04.touchable = true;
		scene.append(label04);
		label04.update.add(() => {
			if (game.age % rate === 0) {
				label04.rubyOptions.rubyFontSize = counter04 % 5 + 15;
				counter04++;
				label04.invalidate();
			}
		}, label04);

		// ルビフォントの指定
		var label05 = new Label({
			scene: scene,
			text: `{"rt":"rubyfont","rb":"ルビフォント"}`,
			font: mplusfont,
			fontSize: 20,
			width: game.width,
			rubyOptions: {rubyFont: bmpfont}
		});
		label05.x = 200;
		label05.y = y0 + 90;
		label05.touchable = true;
		scene.append(label05);
		label05.update.add(() => {
			if (game.age % rate === 0) {
				if (label05.rubyOptions.rubyFont === bmpfont) {
					label05.rubyOptions.rubyFont = mplusfont;
				} else {
					label05.rubyOptions.rubyFont = bmpfont;
				}
				label05.invalidate();
			}
		}, label05);

		// ルビ位置の調整 SpaceAround
		var y1 = 170;
		var label11 = new Label({
			scene: scene,
			text: `{"rt":"ルビアライン","rb":"ＲｕｂｙＡｌｉｇｎ＝ＳｐａｃｅＡｒｏｕｎｄ"}`,
			font: mplusfont,
			fontSize: 20,
			width: game.width
		});
		label11.y = y1;
		scene.append(label11);

		// ルビ位置の調整 Center
		var label12 = new Label({
			scene: scene,
			text: `{"rt":"ルビアライン","rb":"ＲｕｂｙＡｌｉｇｎ＝Ｃｅｎｔｅｒ"}`,
			font: mplusfont,
			fontSize: 20,
			width: game.width,
			rubyOptions:
			{rubyAlign: RubyAlign.Center}
		});
		label12.y = y1 + 50;
		scene.append(label12);

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
		nlabel.pointDown.add(() => {
			var scene3 = mainScene3();
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
