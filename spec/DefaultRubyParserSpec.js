// NOTE: スクリプトアセットとして実行される環境をエミュレーションするためにglobal.gを生成する
global.g = require("@akashic/akashic-engine");
var parse = require("../lib/DefaultRubyParser").parse;

describe("test Label Parser - 正常系", function() {
	it("ルビのない文字列", function() {
		var text = '文字列';
		var result = parse(text);
		var obj = ["文字列"];
		expect(result).toEqual(obj);
		var text2 = '\\}は閉じ括弧';
		var result2 = parse(text2);
		var obj2 = [
			"}は閉じ括弧",
		];
		expect(result2).toEqual(obj2);
		var text3 = '\\{は開き括弧';
		var result3 = parse(text3);
		var obj3 = [
			"{は開き括弧"
		];
		expect(result3).toEqual(obj3);

		var text4 = '開き括弧\\{';
		var result4 = parse(text4);
		var obj4 = [
			"開き括弧{",
		];
		expect(result4).toEqual(obj4);
		var text5 = '閉じ括弧\\}';
		var result5 = parse(text5);
		var obj5 = [
			"閉じ括弧}"
		];
		expect(result5).toEqual(obj5);
	});

	it("ルビ変換", function() {
		var text = '{"rb": "漢字", "rt": "ルビ"}';
		var result = parse(text);
		var obj = [
			{rb: "漢字", rt: "ルビ", text: text}
		];
		expect(result).toEqual(obj);
		var text2 = 'これは{"rb": "漢字", "rt": "ルビ"}';
		var result2 = parse(text2);
		var obj2 = [
			"これは",
			{rb: "漢字", rt: "ルビ", text: '{"rb": "漢字", "rt": "ルビ"}'}
		];
		expect(result2).toEqual(obj2);
		var text3 = '{"rb": "漢字", "rt": "ルビ"}です';
		var result3 = parse(text3);
		var obj3 = [
			{rb: "漢字", rt: "ルビ", text: '{"rb": "漢字", "rt": "ルビ"}'},
			"です"
		];
		expect(result3).toEqual(obj3);
	});

	it("連続したルビ変換", function() {
		var text = '{"rb": "車", "rt": "しゃ"}{"rb": "掌", "rt": "しょう"}{"rb": "室", "rt": "しつ"}';
		var result = parse(text);
		var obj = [
			{rb: "車", rt: "しゃ", text:'{"rb": "車", "rt": "しゃ"}'},
			{rb: "掌", rt: "しょう", text: '{"rb": "掌", "rt": "しょう"}'},
			{rb: "室", rt: "しつ", text: '{"rb": "室", "rt": "しつ"}'}
		];
		expect(result).toEqual(obj);
	});

	it("前後を含むルビ変換", function() {
		var text = 'これは{"rb": "漢字", "rt": "ルビ"}です。あれも{"rb": "漢字", "rt": "ルビ"}です';
		var result = parse(text);
		var obj = [
			"これは",
			{rb: "漢字", rt: "ルビ", text: '{"rb": "漢字", "rt": "ルビ"}'},
			"です。あれも",
			{rb: "漢字", rt: "ルビ", text: '{"rb": "漢字", "rt": "ルビ"}'},
			"です"
		];
		expect(result).toEqual(obj);
	});

	it("エスケープ文字", function() {
		var text = '1: 括弧は{、または\\{、エスケープ括弧は\\\\{、バックスラッシュは\\、バックスラッシュ2つは\\\\';
		var result = parse(text);
		var obj = [
			"1: 括弧は{、または{、エスケープ括弧は\\{、バックスラッシュは\\、バックスラッシュ2つは\\\\"
		];
		expect(result).toEqual(obj);
	});

	it("エスケープ文字を含むルビ変換", function() {
		var text = '\\{エスケープ記号\\}が{"rb": "漢字", "rt": "ルビ"}の前';
		var result = parse(text);
		var obj = [
			"{エスケープ記号}が",	{rb: "漢字", rt: "ルビ", text: '{"rb": "漢字", "rt": "ルビ"}'}, "の前"
		];
		expect(result).toEqual(obj);
		var text2 = 'これは{"rb": "漢字", "rt": "ルビ"}の後に\\{エスケープ記号\\}';
		var result2 = parse(text2);
		var obj2 = [
			"これは", {rb: "漢字", rt: "ルビ", text: '{"rb": "漢字", "rt": "ルビ"}'}, "の後に{エスケープ記号}"
		];
		expect(result2).toEqual(obj2);
		var text3 = '\\\\{エスケープ記号\\}が{"rb": "漢字", "rt": "ルビ"}の前';
		var result3 = parse(text3);
		var obj3 = [
			"\\{エスケープ記号}が",	{rb: "漢字", rt: "ルビ", text: '{"rb": "漢字", "rt": "ルビ"}'}, "の前"
		];
		expect(result3).toEqual(obj3);
	});

	it("エスケープ文字をルビに含むルビ変換", function() {
		var text = 'これは{"rb": "ルビベース内\\}esc\\}カッコ\\{", "rt": "ルビ"}です';
		var result = parse(text);
		var obj = [
			"これは",
			{
				rb: "ルビベース内}esc}カッコ{",
				rt: "ルビ",
				text: '{"rb": "ルビベース内\\}esc\\}カッコ\\{", "rt": "ルビ"}'
			},
			"です"
		];
		expect(result).toEqual(obj);
		var text2 = 'これは{"rb": "ルビベース内\\{esc\\}カッコ\\}", "rt": "ルビ"}です';
		var result2 = parse(text2);
		var obj2 = [
			"これは",
			{
				rb: "ルビベース内{esc}カッコ}",
				rt: "ルビ",
				text: '{"rb": "ルビベース内\\{esc\\}カッコ\\}", "rt": "ルビ"}'
			},
			"です"
		];
		expect(result2).toEqual(obj2);
		var text3 = 'これは{"rb": "ルビベース内\\{esc\\}カッコ\\{", "rt": "ルビ"}です';
		var result3 = parse(text3);
		var obj3 = [
			"これは",
			{
				rb: "ルビベース内{esc}カッコ{",
				rt: "ルビ",
				text: '{"rb": "ルビベース内\\{esc\\}カッコ\\{", "rt": "ルビ"}'
			},
			"です"
		];
		expect(result3).toEqual(obj3);
		var text4 = 'これは{"rb": "漢\\字", "rt": "ルビ"}と\\{エスケープ記号\\}です';
		var result4 = parse(text4);
		var obj4 = [
			"これは",
			{
				rb: "漢\\字",
				rt: "ルビ",
				text: '{"rb": "漢\\字", "rt": "ルビ"}'},
			"と{エスケープ記号}です"
		];
		expect(result4).toEqual(obj4);
		var text5 = 'これは{"rb": "ルビベース内\\{esc\\\\}カッコ\\{", "rt": "ルビ"}です';
		var result5 = parse(text5);
		var obj5 = [
			"これは",
			{
				rb: "ルビベース内{esc\\}カッコ{",
				rt: "ルビ",
				text: '{"rb": "ルビベース内\\{esc\\\\}カッコ\\{", "rt": "ルビ"}'
			},
			"です"
		];
		expect(result5).toEqual(obj5);
	});

	it("エスケープ文字とルビ変換", function() {
		var text = 'これは{"rb": "ルビベース内\\}esc\\}カッコ\\{", "rt": "ルビ"}です';
		var result = parse(text);
		var obj = [
			"これは",
			{
				rb: "ルビベース内}esc}カッコ{",
				rt: "ルビ",
				text: '{"rb": "ルビベース内\\}esc\\}カッコ\\{", "rt": "ルビ"}'
			},
			"です"
		];
		expect(result).toEqual(obj);
		var text2 = 'これは{"rb": "ルビベース内\\{esc\\}カッコ\\}", "rt": "ルビ"}です';
		var result2 = parse(text2);
		var obj2 = [
			"これは",
			{
				rb: "ルビベース内{esc}カッコ}",
				rt: "ルビ",
				text: '{"rb": "ルビベース内\\{esc\\}カッコ\\}", "rt": "ルビ"}'
			},
			"です"
		];
		expect(result2).toEqual(obj2);
		var text3 = 'これは{"rb": "ルビベース内\\{esc\\}カッコ\\{", "rt": "ルビ"}です';
		var result3 = parse(text3);
		var obj3 = [
			"これは",
			{
				rb: "ルビベース内{esc}カッコ{",
				rt: "ルビ",
				text: '{"rb": "ルビベース内\\{esc\\}カッコ\\{", "rt": "ルビ"}'
			},
			"です"
		];
		expect(result3).toEqual(obj3);
		var text4 = 'これは{"rb": "漢字", "rt": "ルビ"}と\\{エスケープ記号\\}です';
		var result4 = parse(text4);
		var obj4 = [
			"これは",
			{
				rb: "漢字",
				rt: "ルビ",
				text: '{"rb": "漢字", "rt": "ルビ"}'
			},
			"と{エスケープ記号}です"
		];
		expect(result4).toEqual(obj4);
	});
});
describe("test Label Parser - 異常系", function() {

	it("ルビ構造が不適切", function() {
		var text = 'これは{"rb": "漢字", rt": "ルビ"}のメンバー前にダブルクォーテーションが無い';
		expect(function(){parse(text);}).toThrow();

		var text2 = 'これは{"rb": "漢字", "rt: "ルビ"}のメンバー後にダブルクォーテーションが無い';
		expect(function(){parse(text2);}).toThrow();

		var text3 = 'これは{"rb": "漢字", "rt": ルビ"}のプロパティ前にダブルクォーテーションが無い';
		expect(function(){parse(text3);}).toThrow();

		var text4 = 'これは{"rb": "漢字", "rt": "ルビ}のプロパティ後にダブルクォーテーションが無い';
		expect(function(){parse(text4);}).toThrow();

		var text5 = 'これは{{"rb": "漢字", "rt": "ルビ}の括弧が間違っている';
		expect(function(){parse(text5);}).toThrow();

		var text6 = 'これは}{"rb": "漢字", "rt": "ルビ}の括弧が間違っている';
		expect(function(){parse(text6);}).toThrow();

		var text7 = 'これは{"rb": "漢字", "rt": "ルビ}}の括弧が間違っている';
		expect(function(){parse(text7);}).toThrow();

		var text8 = 'これは{"rb": "漢字", "rt": "ルビ}{の括弧が間違っている';
		expect(function(){parse(text8);}).toThrow();
	});

	it("ルビ情報が不十分", function() {
		var text = '';
		var result = parse(text);
		var obj = [];
		expect(result).toEqual(obj);

		var text2 = '{}{}{}';
		expect(function(){parse(text2);}).toThrow(g.ExceptionFactory.createTypeMismatchError("parse", "RubyFragment"));

		var text3 = '{"rt": "ルビ"}のみ';
		expect(function(){parse(text3);}).toThrow(g.ExceptionFactory.createTypeMismatchError("parse", "RubyFragment"));

		var text4 = '{"rb": "漢字"}のみ';
		expect(function(){parse(text4);}).toThrow(g.ExceptionFactory.createTypeMismatchError("parse", "RubyFragment"));

		var text5 = '{"rb": "漢字", "text": "ルビ"}';
		expect(function(){parse(text5);}).toThrow(g.ExceptionFactory.createTypeMismatchError("parse", "RubyFragment"));
	});

});
