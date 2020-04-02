import { Label, RubyAlign } from "@akashic-extension/akashic-label";
import { mainScene4 } from "./mainScene4";

export function mainScene3() {
	var game = g.game;
	var scene = new g.Scene({
		game: game,
		assetIds: ["bmpfont", "bmpfont-glyph", "mplus", "mplus-glyph"]
	});
	scene.loaded.add(function() {

		// グリフデータの生成
		var mPlusGlyphInfo = JSON.parse((<g.TextAsset>scene.assets["mplus-glyph"]).data);
		// ビットマップフォント画像とグリフ情報からBitmapFontのインスタンスを生成
		var mplusfont = new g.BitmapFont({
			src: scene.assets["mplus"] as g.ImageAssetLike,
			glyphInfo: mPlusGlyphInfo
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

		// ルビ機能2
		var tlabel0 = new Label({
			scene: scene,
			text: "ルビ機能２",
			font: mplusfont,
			fontSize: 31,
			width: game.width,
			textAlign: g.TextAlign.Center
		});
		tlabel0.x = 0;
		scene.append(tlabel0);

		// ルビを持つラベルの改行
		var y0 = 40;
		var label01 = new Label({
			scene: scene,
			text:'ルビの途中でｗｉｄｔｈを超える場合、{"rb": "ｗｉｄｔｈ", "rt": "横幅"}、ルビ内の手前で改行されます',
			font: mplusfont,
			fontSize: 20,
			width: game.width
		});
		label01.y = y0;
		scene.append(label01);

		// ルビの幅
		var label02 = new Label({
			scene: scene,
			text:'本文より{"rb": "ルビ", "rt": "とてもながいルビ"}の幅が広い場合、ルビの幅に合わせて余白が設けられます',
			font: mplusfont,
			fontSize: 20,
			width: game.width
		});
		label02.y = y0 + 70;
		scene.append(label02);

		var y1 = 160;

		// ルビ位置の調整とルビ幅の組み合わせ
		var text11 = '{"rb": "Ａｌｉｇｎ．", "rt": "ルビ", "rubyAlign":' + RubyAlign.Center + '}' +
					 '{"rb": "Ａｌｉｇｎ．", "rt": "ルビ", "rubyAlign":' + RubyAlign.Center + '}' +
					 '{"rb": "Ａｒｏｕｎｄ．", "rt": "ルビ", "rubyAlign":' + RubyAlign.SpaceAround + '}' +
					 '{"rb": "Ａｒｏｕｎｄ．", "rt": "ルビ", "rubyAlign":' + RubyAlign.SpaceAround + '}';
		var label11 = new Label({scene: scene, text: text11, font: mplusfont, fontSize: 15, width: game.width, rubyOptions: {rubyFontSize: 10}});
		label11.y = y1;
		scene.append(label11);

		var text12 = '{"rt": "Ａｌｉｇｎ．", "rb": "ルビ", "rubyAlign":' + RubyAlign.Center + '}' +
					 '{"rt": "Ａｌｉｇｎ．", "rb": "ルビ", "rubyAlign":' + RubyAlign.Center + '}' +
					 '{"rt": "Ａｒｏｕｎｄ．", "rb": "ルビ", "rubyAlign":' + RubyAlign.SpaceAround + '}' +
					 '{"rt": "Ａｒｏｕｎｄ．", "rb": "ルビ", "rubyAlign":' + RubyAlign.SpaceAround + '}';
		var label12 = new Label({scene: scene, text: text12, font: mplusfont, fontSize: 15, width: game.width, rubyOptions: {rubyFontSize: 10}});
		label12.y = y1 + 40;
		scene.append(label12);

		var text13 = '{"rb": "Ａｌｉｇｎ．", "rt": "ルビ", "rubyAlign":' + RubyAlign.Center + '}' +
					 '{"rb": "Ａｒｏｕｎｄ．", "rt": "ルビ", "rubyAlign":' + RubyAlign.SpaceAround + '}' +
					 '{"rb": "Ａｌｉｇｎ．", "rt": "ルビ", "rubyAlign":' + RubyAlign.Center + '}' +
					 '{"rb": "Ａｒｏｕｎｄ．", "rt": "ルビ", "rubyAlign":' + RubyAlign.SpaceAround + '}';
		var label13 = new Label({scene: scene, text: text13, font: mplusfont, fontSize: 15, width: game.width, rubyOptions: {rubyFontSize: 10}});
		label13.y = y1 + 70;
		scene.append(label13);

		var text14 = '{"rt": "Ａｌｉｇｎ．", "rb": "ルビ", "rubyAlign":' + RubyAlign.Center + '}' +
					 '{"rt": "Ａｒｏｕｎｄ．", "rb": "ルビ", "rubyAlign":' + RubyAlign.SpaceAround + '}' +
					 '{"rt": "Ａｌｉｇｎ．", "rb": "ルビ", "rubyAlign":' + RubyAlign.Center + '}' +
					 '{"rt": "Ａｒｏｕｎｄ．", "rb": "ルビ", "rubyAlign":' + RubyAlign.SpaceAround + '}';
		var label14 = new Label({scene: scene, text: text14, font: mplusfont, fontSize: 15, width: game.width, rubyOptions: {rubyFontSize: 10}});
		label14.y = y1 + 100;
		scene.append(label14);

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
			var scene3 = mainScene4();
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
};
