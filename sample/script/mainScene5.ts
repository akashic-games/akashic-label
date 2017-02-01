import {Label} from "@akashic-extension/akashic-label";
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

		// 複数行のルビ機能
		var tlabel0 = new Label({
			scene: scene,
			text: "複数行のルビ機能",
			font: mplusfont,
			fontSize: 30,
			width: game.width,
			textAlign: g.TextAlign.Center
		});
		tlabel0.x = 0;
		scene.append(tlabel0);


		// ルビと改行
		var y0 = 40;

		// ルビの行幅切替
		var label01 = new Label({
			scene: scene,
			text:'ルビのある行と無い行で\rルビによる{"rb": "行間幅設定", "rt": "fixLineGap"}を\r切り替えることができます',
			font: mplusfont,
			fontSize: 20,
			width: game.width,
			fixLineGap: false,
			rubyOptions: {rubyBitmapFont: bmpfont}
		});
		label01.y = y0;
		label01.touchable = true;
		label01.update.handle(label01, function() {
			if (game.age % rate === 0) {
				label01.fixLineGap = !label01.fixLineGap;
				label01.invalidate();
			}
		});
		scene.append(label01);

		// ルビ応用
		var textArray = [].concat('「よろしゅうございます。'.split(/.*?/),
			'{"rb": "南　　", "rt": "　　　　　　　"}',
			30,
			'{"rb": "南十　", "rt": "　　　　　　　"}',
			30,
			'{"rb": "南十字", "rt": "　　　　　　　"}',
			30,
			'{"rb": "南十字", "rt": "サ　　　　　　"}',
			30,
			'{"rb": "南十字", "rt": "サウ　　　　　"}',
			30,
			'{"rb": "南十字", "rt": "サウザ　　　　"}',
			30,
			'{"rb": "南十字", "rt": "サウザン　　　"}',
			30,
			'{"rb": "南十字", "rt": "サウザンク　　"}',
			30,
			'{"rb": "南十字", "rt": "サウザンクロ　"}',
			30,
			'{"rb": "南十字", "rt": "サウザンクロス"}',
			'へ着きますのは、次の第三時ころになります。」\r'.split(/.*?/),
			'{"rb": "車", "rt": "　"}',
			22,
			'{"rb": "車", "rt": "し"}',
			22,
			'{"rb": "車", "rt": "しゃ"}',
			'{"rb": "掌", "rt": "　　　"}',
			24,
			'{"rb": "掌", "rt": "し　　"}',
			24,
			'{"rb": "掌", "rt": "しょ　"}',
			24,
			'{"rb": "掌", "rt": "しょう"}',
			'は紙をジョバンニに渡して向うへ行きました。'.split(/.*?/)
		);
		var counter = 0;
		var mlabel = new Label({
			scene: scene,
			text:"",
			font: mplusfont,
			fontSize: 20,
			lineGap: 0,
			width: 240,
			fixLineGap: true,
			rubyOptions: {rubyGap: 0}
		});
		mlabel.y = 130;
		counter = 0;
		mlabel.textAlign = g.TextAlign.Left;
		scene.append(mlabel);
		mlabel.update.handle(mlabel, function() {
			// 初期化と待機
			if (counter === textArray.length) {
				this.text = "";
				counter = -10;
				return;
			}
			if ( counter < textArray.length && game.age % 2 === 0) {
				if (counter >= 0){
					if (typeof textArray[counter] === "number") {
						var n = textArray[counter];
						this.text = this.text.substring(0, this.text.length - n);
						counter += 1;
						this.text += textArray[counter];

					}else{
						this.text += textArray[counter];
					}
					this.invalidate();
				}
				counter += 1;
			}
		});

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
		dlabel.pointDown.handle(dlabel, function(){
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
