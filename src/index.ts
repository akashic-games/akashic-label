export import Label = require("./Label");
export import LabelParameterObject = require("./LabelParameterObject");
export import FragmentDrawInfo = require("./FragmentDrawInfo");
export import RubyParser = require("./RubyParser");
export import Fragment = RubyParser.Fragment;
export import RubyFragment = RubyParser.RubyFragment;
export import RubyAlign = RubyParser.RubyAlign;
export import RubyOptions = RubyParser.RubyOptions;
// tslintが誤動作するので一時的に無効化する
/* tslint:disable: no-unused-variable */
import DRP = require("./DefaultRubyParser");
export import defaultRubyParser = DRP.parse;
/* tslint:enable: no-unused-variable */
