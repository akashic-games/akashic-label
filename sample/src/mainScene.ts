import { Label } from "@akashic-extension/akashic-label";
import { mainScene2 } from "./mainScene2";

export function mainScene(): g.Scene {
	var game = g.game;
	var scene = new g.Scene({
		game: game,
		assetIds: ["bmpfont", "bmpfont-glyph", "mplus", "mplus-glyph"]
	});
	var rate = game.fps / 3;
	scene.onLoad.add(() => {

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
			fontFamily: "monospace",
			size: 40,
			hint: dhint
		});

		// ラベル基本機能
		var tlabel0 = new Label({
			scene: scene,
			text: "ラベル基本機能",
			font: mplusfont,
			fontSize: 30,
			width: game.width,
			textAlign: "center"
		});
		tlabel0.x = 0;
		scene.append(tlabel0);

		var y0 = 40;

		// ラベルの最小機能の利用
		var label01 = new Label({
			scene: scene,
			text: "最小構成",
			font: mplusfont,
			fontSize: 20,
			width: 100
		});
		label01.y = y0;
		scene.append(label01);

		// 色つきラベル
		var counter02 = 0;
		var colors = ["red", "black", "green", "blue"];
		var label02 = new Label({
			scene: scene,
			text: "ラベル色",
			font: mplusfont,
			fontSize: 20,
			width: 100,
			textColor: "red"
		});
		label02.x = game.width / 4;
		label02.y = y0;
		label02.touchable = true;
		label02.onUpdate.add(() => {
			if (game.age % rate === 0) {
				label02.textColor = colors[counter02 % colors.length];
				counter02++;
				label02.invalidate();
			}
		}, label02);
		scene.append(label02);

		// フォントサイズの変更
		var counter03 = 2;
		var label03 = new Label({
			scene: scene,
			text: "フォントサイズ",
			font: mplusfont,
			fontSize: 30,
			width: 200
		});
		label03.x = game.width / 4 * 2;
		label03.y = y0;
		label03.touchable = true;
		label03.onUpdate.add(() => {
			if (game.age % rate === 0) {
				label03.fontSize = (counter03 % 6) * 3 + 5;
				counter03++;
				label03.invalidate();
			}
		}, label03);
		scene.append(label03);

		// テキスト位置の調整
		var y1 = 90;

		// 左揃え
		var label11 = new Label({
			scene: scene,
			text: "左寄せ",
			font: mplusfont,
			fontSize: 20,
			width: game.width,
			textAlign: "left"
		});
		label11.y = y1;
		scene.append(label11);

		// 中央揃え
		var label12 = new Label({
			scene: scene,
			text: "中央寄せ",
			font: mplusfont,
			fontSize: 20,
			width: game.width,
			textAlign: "center"
		});
		label12.y = y1;
		scene.append(label12);

		// 中央揃え
		var label12 = new Label({
			scene: scene,
			text: "右寄せ",
			font: mplusfont,
			fontSize: 20,
			width: game.width,
			textAlign: "right"
		});
		label12.y = y1;
		scene.append(label12);

		// 改行
		var y2 = 130;

		// 複数行のラベル
		var counter21 = 0;
		var aligns21: g.TextAlignString[] =  ["left", "center", "right"];
		var label21 = new Label({
			scene: scene,
			text: "改行記号（￥ｒ・￥ｎ・￥ｒ￥ｎ）\rで改行できます",
			font: mplusfont,
			fontSize: 20,
			width: game.width
		});
		label21.y = y2;
		scene.append(label21);
		label21.onUpdate.add(() => {
			if (game.age % rate === 0) {
				label21.textAlign = aligns21[counter21 % 3];
				counter21++;
				label21.invalidate();
			}
		}, label21);

		// lineGapを使った行間調整
		var counter22 = 0;
		var label22 = new Label({
			scene: scene,
			text: "行間幅は\r指定\rできます",
			font: mplusfont,
			fontSize: 20,
			width: 100,
			lineGap: -8
		});
		label22.y = y2 + 50;
		label22.touchable = true;
		label22.onUpdate.add(() => {
			if (game.age % rate === 0) {
				label22.lineGap = Math.round(counter22 % 10) - 5;
				counter22++;
				label22.invalidate();
			}
		}, label22);
		scene.append(label22);

		// width基準による自動改行
		var counter23 = 0;
		var label23 = new Label({
			scene: scene,
			text: "改行記号を使わなくてもｗｉｄｔｈを超えると自動で折り返します",
			font: mplusfont,
			fontSize: 20,
			width: 100
		});
		label23.x = 150;
		label23.y = y2 + 50;
		scene.append(label23);
		label23.onUpdate.add(() => {
			if (game.age % rate === 0) {
				label23.width = counter23 % 10 * 10 + 100;
				counter23++;
				label23.invalidate();
			}
		}, label23);

		// 自動改行オフ
		var label24 = new Label({
			scene: scene,
			text: "自動折り返し機能は有効・無効を切り替えることができます",
			font: mplusfont,
			fontSize: 20,
			width: game.width,
			lineBreak: false
		});
		label24.y = y2 + 150;
		label24.touchable = true;
		label24.onUpdate.add(() => {
			if (game.age % rate === 0) {
				label24.lineBreak = !label24.lineBreak;
				label24.invalidate();
			}
		}, label24);
		scene.append(label24);

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
		nlabel.onPointDown.add(() => {
			var scene2 = mainScene2();
			game.replaceScene(scene2);
		}, nlabel);
		scene.append(nlabel);

		var dlabel = new Label({
			scene: scene,
			text: "［フォント切替］",
			font: mplusfont,
			fontSize: 20,
			textAlign: "right",
			width: 130
		});
		dlabel.x = 100;
		dlabel.y = game.height - 20;
		dlabel.touchable = true;
		dlabel.onPointDown.add(() => {
			scene.children.forEach((label) => {
				if (label instanceof Label) {
					label.font = dfont;
					label.rubyOptions.rubyFont = new g.DynamicFont({
						game: scene.game,
						fontFamily: "monospace",
						size: 40
					});
					label.invalidate();
				}
			});
		}, dlabel);

		scene.append(dlabel);
	});

	return scene;
}
