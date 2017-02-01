var gulp = require("gulp");
var del = require("del");
var fs = require("fs-extra");
var shell = require("gulp-shell");
var eventstream = require("event-stream");
var tslint = require("gulp-tslint");
var jasmine = require("gulp-jasmine");
var istanbul = require("gulp-istanbul");
var reporters = require("jasmine-reporters");
var typedoc = require("gulp-typedoc");
var Reporter = require("jasmine-terminal-reporter");
var path = require("path");
var replace = require('gulp-replace');
var rename = require('gulp-rename');
var dts = require("dts-bundle");
var pkg = require("./package.json");

if (!fs.existsSync("tsconfig.json")) {
	throw new Error("tsconfig.json not found");
}
var tsconfig = require("./tsconfig.json");

gulp.task('clean', function(cb) {
	del(['lib'], cb);
});

gulp.task("install:typings", shell.task("typings install"));

gulp.task("tsc", shell.task(["tsc -p ./"]));

gulp.task("compile", ["tsc"], function() {
	dts.bundle({
		name: pkg.name,
		main: "lib/index.d.ts"
	});
});

gulp.task("lint", function(){
	return gulp.src("src/**/*.ts")
		.pipe(tslint())
		.pipe(tslint.report());
});

gulp.task("lint-md", function(){
	return gulp.src(["**/*.md", "!**/node_modules/**/*.md"])
		.pipe(shell(["mdast <%= file.path %> --frail --no-stdout --quiet"]));
});

gulp.task("testCompile", shell.task(["tsc -p ./"], {cwd: "./spec"}));

gulp.task("test", ["compile", "testCompile"], function(cb) {
	var jasmineReporters = [ new Reporter({
			isVerbose: false,
			showColors: true,
			includeStackTrace: true
		}),
		new reporters.JUnitXmlReporter()
	];
	gulp.src(["lib/*.js"])
		.pipe(istanbul())
		.pipe(istanbul.hookRequire())
		.on("finish", function() {
			gulp.src("spec/**/*[sS]pec.js")
				.pipe(jasmine({ reporter: jasmineReporters}))
				.on("error", cb)  // istanbul.writeReports()のpipeより先でないとエラーが握りつぶされる (TODO: gulp-plumber 導入検討)
				.pipe(istanbul.writeReports({ reporters: ["text", "cobertura", "lcov"] }))
				.on("end", cb);
		});
});

gulp.task("typedoc", function() {
	// typedocのexcludeが正しく動けば、tsconfig.filesGlobをsrcに指定して、index.tsをexcludeに指定すればよさそう
	return gulp
		.src([
			"./typings/**/*.ts",
			"./src/Label.ts",
			"./node_modules/@akashic/akashic-engine/lib/main.d.ts",
			"./src/LabelParameterObject.ts",
			"./src/DefaultRubyParser.ts",
			"./src/FragmentDrawInfo.ts",
			"./src/Label.ts",
			"./src/LabelParameterObject.ts",
			"./src/RubyParser.ts",
			"./src/index.ts"])
		.pipe(typedoc({
			module: "commonjs",
			target: "es5",
			out: "doc/",
			name: "akashic-label",
			includeDeclarations: false
		}));
});

gulp.task("default", ["compile"]);
