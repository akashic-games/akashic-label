import {Label} from "@akashic-extension/akashic-label";
import graphemeSplitter = require("grapheme-splitter");
var splitter = new graphemeSplitter();

var game = g.game;

export = function() {
	var scene = new g.Scene({
		game: game,
		assetIds: ["bmpfont", "bmpfont-glyph", "mplus", "mplus-glyph"]
	});
	var rate = game.fps / 3;
	scene.loaded.add(function() {

		var labels: Label[] = [];

		// グリフデータの生成
		var glyph = JSON.parse((<g.TextAsset>scene.assets["mplus-glyph"]).data);

		// ビットマップフォント画像とグリフ情報からBitmapFontのインスタンスを生成
		var mplusfont = new g.BitmapFont({
			src: scene.assets["mplus"],
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

		// ラベル基本機能
		var tlabel0 = new Label({
			scene: scene,
			text: "ラベル基本機能",
			font: mplusfont,
			fontSize: 30,
			width: game.width,
			textAlign: g.TextAlign.Center
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
		label02.update.add(function(){
			if (game.age % rate === 0) {
				this.textColor = colors[counter02 % colors.length];
				counter02++;
				this.invalidate();
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
		label03.update.add(function(){
			if (game.age % rate === 0) {
				this.fontSize = (counter03 % 6) * 3 + 5;
				counter03++;
				this.invalidate();
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
			textAlign: g.TextAlign.Left
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
			textAlign: g.TextAlign.Center
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
			textAlign: g.TextAlign.Right
		});
		label12.y = y1;
		scene.append(label12);

		// 改行
		var y2 = 130;

		// 複数行のラベル
		var counter21 = 0;
		var aligns21 =  [g.TextAlign.Left, g.TextAlign.Center, g.TextAlign.Right];
		var label21 = new Label({
			scene: scene,
			text: "改行記号（￥ｒ・￥ｎ・￥ｒ￥ｎ）\rで改行できます",
			font: mplusfont,
			fontSize: 20,
			width: game.width
		});
		label21.y = y2;
		scene.append(label21);
		label21.update.add(function(){
			if (game.age % rate === 0) {
				this.textAlign = aligns21[counter21 % 3];
				counter21++;
				this.invalidate();
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
		label22.update.add(function(){
			if (game.age % rate === 0) {
				this.lineGap = Math.round(counter22 % 10) - 5;
				counter22++;
				this.invalidate();
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
		label23.x = 100;
		label23.y = y2 + 50;;
		scene.append(label23);
		label23.update.add(function(){
			if (game.age % rate === 0) {
				this.width = counter23 % 10 * 10 + 100;
				counter23;
				this.invalidate();
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
		label24.update.add(function(){
			if (game.age % rate === 0) {
				this.lineBreak = !this.lineBreak;
				this.invalidate();
			}
		}, label24);
		scene.append(label24);

		// grapheme clusterの利用
		var counter25 = 0;
		var label25 = new Label({
			scene: scene,
			text: "unicode😭\r👨🏿‍👩‍👧‍👦",
			font: mplusfont,
			fontSize: 20,
			width: 100,
			textSplitter: splitter.splitGraphemes.bind(splitter)
		});
		label25.x = 210;
		label25.y = y2 + 50;;
		scene.append(label25);

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
		nlabel.pointDown.add(function(){
			var scene2 = require("mainScene2")();
			game.replaceScene(scene2);
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
			scene.children.forEach((label) => {
				if (label instanceof Label) {
					label.font = dfont;
					label.rubyOptions.rubyFont = new g.DynamicFont({
						game: scene.game,
						fontFamily: g.FontFamily.Monospace,
						size: 40
					});
					label.invalidate();
				}
			});
		}, dlabel);

		scene.append(dlabel);
	});

	return scene;
};
