import g = require("../../node_modules/@akashic/akashic-engine");
import { AudioSystem } from "@akashic/pdi-types";
export class Renderer implements g.Renderer {
	methodCallHistoryWithParams: {
		methodName: string;
		params?: {}
	}[];

	constructor() {
		this.methodCallHistoryWithParams = [];
	}
	begin(): void {
		// do nothing
	}
	end(): void {
		// do nothing
	}

	clearMethodCallHistory(): void {
		this.methodCallHistoryWithParams = [];
	}

	clear(): void {
		this.methodCallHistoryWithParams.push({
			methodName: "clear"
		});
	}

	get methodCallHistory(): string[] {
		const ret: string[] = [];
		for (let i = 0; i < this.methodCallHistoryWithParams.length; ++i)
			ret.push(this.methodCallHistoryWithParams[i].methodName);
		return ret;
	}

	// 指定したメソッド名のパラメータを配列にして返す
	methodCallParamsHistory(name: string): any[] {
		const params: any[] = [];
		for (let i = 0; i < this.methodCallHistoryWithParams.length; ++i) {
			if (this.methodCallHistoryWithParams[i].methodName === name) params.push(this.methodCallHistoryWithParams[i].params);
		}
		return params;
	}

	drawImage(
		surface: g.Surface,
		offsetX: number,
		offsetY: number,
		width: number,
		height: number,
		canvasOffsetX: number,
		canvasOffsetY: number
	): void {
		this.methodCallHistoryWithParams.push({
			methodName: "drawImage",
			params: {
				surface: surface,
				offsetX: offsetX,
				offsetY: offsetY,
				width: width,
				height: height,
				canvasOffsetX: canvasOffsetX,
				canvasOffsetY: canvasOffsetY
			}
		});
	}

	translate(x: number, y: number): void {
		this.methodCallHistoryWithParams.push({
			methodName: "translate",
			params: {
				x: x,
				y: y
			}
		});
	}

	transform(matrix: number[]): void {
		this.methodCallHistoryWithParams.push({
			methodName: "transform",
			params: {
				matrix: matrix
			}
		});
	}

	opacity(opacity: number): void {
		this.methodCallHistoryWithParams.push({
			methodName: "opacity",
			params: {
				opacity: opacity
			}
		});
	}

	setCompositeOperation(operation: g.CompositeOperationString): void {
		this.methodCallHistoryWithParams.push({
			methodName: "setCompositeOperation",
			params: {
				operation: operation
			}
		});
	}

	fillRect(x: number, y: number, width: number, height: number, cssColor: string): void {
		this.methodCallHistoryWithParams.push({
			methodName: "fillRect",
			params: {
				x: x,
				y: y,
				width: width,
				height: height,
				cssColor: cssColor
			}
		});
	}

	save(): void {
		this.methodCallHistoryWithParams.push({
			methodName: "save"
		});
	}

	restore(): void {
		this.methodCallHistoryWithParams.push({
			methodName: "restore"
		});
	}

	drawSprites(
		surface: g.Surface,
		offsetX: number[],
		offsetY: number[],
		width: number[],
		height: number[],
		canvasOffsetX: number[],
		canvasOffsetY: number[],
		count: number
	): void {
		this.methodCallHistoryWithParams.push({
			methodName: "drawSprites",
			params: {
				surface: surface,
				offsetX: offsetX,
				offsetY: offsetY,
				width: width,
				height: height,
				canvasOffsetX: canvasOffsetX,
				canvasOffsetY: canvasOffsetY,
				count: count
			}
		});
	}

	setTransform(matrix: number[]): void {
		this.methodCallHistoryWithParams.push({
			methodName: "setTransform",
			params: { matrix }
		});
	}

	setOpacity(opacity: number): void {
		this.methodCallHistoryWithParams.push({
			methodName: "setOpacity",
			params: { opacity }
		});
	}

	isSupportedShaderProgram(): boolean {
		return false;
	}

	setShaderProgram(shaderProgram: g.ShaderProgram | null): void {
		throw g.ExceptionFactory.createAssertionError("mock Renderer#setShaderProgram() is not implemented");
	}

	_getImageData(sx: number, sy: number, sw: number, sh: number): g.ImageData {
		this.methodCallHistoryWithParams.push({
			methodName: "_getImageData"
		});
		return null;
	}

	_putImageData(
		_imageData: ImageData,
		_dx: number,
		_dy: number,
		_dirtyX?: number,
		_dirtyY?: number,
		_dirtyWidth?: number,
		_dirtyHeight?: number
	): void {
		this.methodCallHistoryWithParams.push({
			methodName: "_putImageData"
		});
	}
}

class Surface implements g.Surface {
	width: number;
	height: number;
	_drawable: any;
	createdRenderer: g.Renderer;

	constructor(width: number, height: number, drawable?: any) {
		this.width = width;
		this.height = height;
		this._drawable = drawable;
	}
	destroy(): void {
		// do nothing
	}
	destroyed(): boolean {
		return false;
	}

	renderer(): g.Renderer {
		const r = new Renderer();
		this.createdRenderer = r;
		return r;
	}

	isPlaying(): boolean {
		return false;
	}
}

class LoadFailureController {
	necessaryRetryCount: number;
	failureCount: number;

	constructor(necessaryRetryCount: number) {
		this.necessaryRetryCount = necessaryRetryCount;
		this.failureCount = 0;
	}

	tryLoad(asset: g.Asset, loader: g.AssetLoadHandler): boolean {
		if (this.necessaryRetryCount < 0) {
			setTimeout(() => {
				if (!asset.destroyed())
					loader._onAssetError(asset, g.ExceptionFactory.createAssetLoadError("FatalErrorForAssetLoad", false));
			}, 0);
			return false;
		}
		if (this.failureCount++ < this.necessaryRetryCount) {
			setTimeout(() => {
				if (!asset.destroyed())
					loader._onAssetError(asset, g.ExceptionFactory.createAssetLoadError("RetriableErrorForAssetLoad"));
			}, 0);
			return false;
		}
		return true;
	}
}

export class ImageAsset implements g.ImageAsset {
	type: "image" = "image";
	width: number;
	height: number;
	hint: g.ImageAssetHint;
	id: string;
	path: string;
	originalPath: string;
	onDestroyed: g.Trigger<g.Asset>;
	_failureController: LoadFailureController;

	constructor(necessaryRetryCount: number, id: string, assetPath: string, width: number, height: number) {
		this.width = width;
		this.height = height;
		this.id = id;
		this.originalPath = assetPath;
		this.path = this._assetPathFilter(assetPath);
		this.onDestroyed = new g.Trigger<g.Asset>();
		this._failureController = new LoadFailureController(necessaryRetryCount);
	}
	initialize(hint: g.ImageAssetHint): void {
		// do nothing
	}
	inUse(): boolean {
		return false;
	}
	destroy(): void {
		// do nothing
	}
	destroyed(): boolean {
		return false;
	}
	_assetPathFilter(path: string): string {
		return path;
	}

	_load(loader: g.AssetLoadHandler): void {
		if (this._failureController.tryLoad(this, loader)) {
			setTimeout(() => {
				if (!this.destroyed())
					loader._onAssetLoad(this);
			}, 0);
		}
	}

	asSurface(): g.Surface {
		return new Surface(0, 0);
	}
}

export interface DelayedAsset {
	undelay(): void;
}

export class DelayedImageAsset extends ImageAsset implements DelayedAsset {
	_delaying: boolean;
	_lastGivenLoader: g.AssetLoadHandler;
	_isError: boolean;
	_loadingResult: any;

	constructor(necessaryRetryCount: number, id: string, assetPath: string, width: number, height: number) {
		super(necessaryRetryCount, id, assetPath, width, height);
		this._delaying = true;
		this._lastGivenLoader = undefined;
		this._isError = undefined;
		this._loadingResult = undefined;
	}

	undelay(): void {
		this._delaying = false;
		this._flushDelayed();
	}

	_load(loader: g.AssetLoadHandler): void {
		if (this._delaying) {
			// 遅延が要求されている状態で _load() が呼ばれた: loaderを自分に差し替えて _onAssetLoad, _onAssetError の通知を遅延する
			this._lastGivenLoader = loader;
			super._load(this);
		} else {
			// 遅延が解除された状態で _load() が呼ばれた: 普通のAsset同様に _load() を実行
			super._load(loader);
		}
	}

	_onAssetError(asset: g.Asset, error: g.AssetLoadError): void {
		this._isError = true;
		this._loadingResult = arguments;
		this._flushDelayed();
	}
	_onAssetLoad(asset: g.Asset): void {
		this._isError = false;
		this._loadingResult = arguments;
		this._flushDelayed();
	}

	_flushDelayed(): void {
		if (this._delaying || !this._loadingResult)
			return;
		if (this.destroyed())
			return;
		const loader = this._lastGivenLoader;
		if (this._isError) {
			loader._onAssetError.apply(loader, this._loadingResult);
		} else {
			loader._onAssetLoad.apply(loader, this._loadingResult);
		}
	}
}

class AudioAsset implements g.AudioAsset {
	type: "audio" = "audio";
	data: any;
	duration: number;
	loop: boolean;
	hint: g.AudioAssetHint;
	_system: AudioSystem;
	id: string;
	path: string;
	originalPath: string;
	onDestroyed: g.Trigger<g.Asset>;
	_failureController: LoadFailureController;

	constructor(necessaryRetryCount: number, id: string, assetPath: string, duration: number,
	            system: g.AudioSystem, loop: boolean, hint: g.AudioAssetHint) {
		this.duration = duration;
		this.loop = loop;
		this.hint = hint;
		this._system = system;
		this.data = undefined;
		this._failureController = new LoadFailureController(necessaryRetryCount);
	}
	play(): g.AudioPlayer {
		return null;
	}
	stop(): void {
		// do nothing
	}
	inUse(): boolean {
		return false;
	}

	destroy(): void {
		// do nothing
	}
	destroyed(): boolean {
		return false;
	}
	_assetPathFilter(path: string): string {
		return path;
	}

	_load(loader: g.AssetLoadHandler): void {
		if (this._failureController.tryLoad(this, loader)) {
			setTimeout(() => {
				if (!this.destroyed())
					loader._onAssetLoad(this);
			}, 0);
		}
	}
}

class TextAsset implements g.TextAsset {
	game: g.Game;
	type: "text" = "text";
	data: string;
	id: string;
	path: string;
	originalPath: string;
	onDestroyed: g.Trigger<g.Asset>;
	_failureController: LoadFailureController;

	constructor(game: g.Game, necessaryRetryCount: number, id: string, assetPath: string) {
		this.data = undefined!;
		this.id = id;
		this.originalPath = assetPath;
		this.path = this._assetPathFilter(assetPath);
		this.onDestroyed = new g.Trigger<g.Asset>();
		this.game = game;
		this._failureController = new LoadFailureController(necessaryRetryCount);
	}

	inUse(): boolean {
		return false;
	}
	destroy(): void {
		// do nothing
	}
	destroyed(): boolean {
		return false;
	}
	_assetPathFilter(path: string): string {
		return path;
	}

	_load(loader: g.AssetLoadHandler): void {
		if (this._failureController.tryLoad(this, loader)) {
			setTimeout(() => {
				// if ((<ResourceFactory>this.game.resourceFactory).scriptContents.hasOwnProperty(this.path)) {
				if ((<ResourceFactory>this.game.resourceFactory).scriptContents.hasOwnProperty(this.path)) {
					this.data = (<ResourceFactory>this.game.resourceFactory).scriptContents[this.path];
				} else {
					this.data = "";
				}
				if (!this.destroyed())
					loader._onAssetLoad(this);
			}, 0);
		}
	}
}

class ScriptAsset implements g.ScriptAsset {
	game: g.Game;
	type: "script" = "script";
	script: string;
	id: string;
	path: string;
	originalPath: string;
	onDestroyed: g.Trigger<g.Asset>;
	_failureController: LoadFailureController;

	constructor(game: g.Game, necessaryRetryCount: number, id: string, assetPath: string) {
		this.game = game;
		this.id = id;
		this.originalPath = assetPath;
		this.path = this._assetPathFilter(assetPath);
		this.onDestroyed = new g.Trigger<g.Asset>();

		this._failureController = new LoadFailureController(necessaryRetryCount);
	}
	inUse(): boolean {
		return false;
	}
	destroy(): void {
		// do nothing
	}
	destroyed(): boolean {
		return false;
	}
	_assetPathFilter(path: string): string {
		return path;
	}

	_load(loader: g.AssetLoadHandler): void {
		if (this._failureController.tryLoad(this, loader)) {
			setTimeout(() => {
				if (!this.destroyed())
					loader._onAssetLoad(this);
			}, 0);
		}
	}

	execute(env: g.ScriptAssetRuntimeValue): any {
		if (!(<ResourceFactory>this.game.resourceFactory).scriptContents.hasOwnProperty(env.module.filename)) {
			// 特にスクリプトの内容指定がないケース:
			// ScriptAssetは任意の値を返してよいが、シーンを記述したスクリプトは
			// シーンを返す関数を返すことを期待するのでここでは関数を返しておく
			return env.module.exports =  () => { return new g.Scene({ game: env.game }); };

		} else {
			const prefix = "(function(exports, require, module, __filename, __dirname) {";
			const suffix = "})(g.module.exports, g.module.require, g.module, g.filename, g.dirname);";
			const content = (<ResourceFactory>this.game.resourceFactory).scriptContents[env.module.filename];
			const f = new Function("g", prefix + content + suffix);
			f(env);
			return env.module.exports;
		}
	}
}

export class ResourceFactory implements g.ResourceFactory {
	game: g.Game;
	scriptContents: {[key: string]: string};

	// 真である限り createXXAsset() が DelayedAsset を生成する(現在は createImageAsset() のみ)。
	// DelayedAsset は、flushDelayedAssets() 呼び出しまで読み込み完了(またはエラー)通知を遅延するアセットである。
	// コード重複を避けるため、現在は createImageAsset() のみこのフラグに対応している。
	createsDelayedAsset: boolean;

	_necessaryRetryCount: number;
	_delayedAssets: DelayedAsset[];

	constructor() {
		this.scriptContents = {};
		this.createsDelayedAsset = false;
		this._necessaryRetryCount = 0;
		this._delayedAssets = [];
	}

	init(game: g.Game): void {
		this.game = game;
	}

	// func が呼び出されている間だけ this._necessaryRetryCount を変更する。
	// func() とその呼び出し先で生成されたアセットは、指定回数だけロードに失敗したのち成功する。
	// -1を指定した場合、ロードは retriable が偽に設定された AssetLoadFatalError で失敗する。
	withNecessaryRetryCount(necessaryRetryCount: number, func: () => void): void {
		const originalValue = this._necessaryRetryCount;
		try {
			this._necessaryRetryCount = necessaryRetryCount;
			func();
		} finally {
			this._necessaryRetryCount = originalValue;
		}
	}

	// createsDelayedAsset が真である間に生成されたアセット(ただし現時点はImageAssetのみ) の、
	// 遅延された読み込み完了通知を実行する。このメソッドの呼び出し後、実際の AssetLoader#_onAssetLoad()
	// などの呼び出しは setTimeout() 経由で行われることがある点に注意。
	// (このメソッドの呼び出し側は、後続の処理を setTimeout() 経由で行う必要がある。mock.ts のアセット実装を参照のこと)
	flushDelayedAssets(): void {
		this._delayedAssets.forEach((a: DelayedAsset) => a.undelay());
		this._delayedAssets = [];
	}

	createImageAsset(id: string, assetPath: string, width: number, height: number): g.ImageAsset {
		if (this.createsDelayedAsset) {
			const ret = new DelayedImageAsset(this._necessaryRetryCount, id, assetPath, width, height);
			this._delayedAssets.push(ret);
			return ret;
		} else {
			return new ImageAsset(this._necessaryRetryCount, id, assetPath, width, height);
		}
	}

	createVideoAsset(id: string, assetPath: string, width: number, height: number,
	                 system: g.VideoSystem, loop: boolean, useRealSize: boolean): g.VideoAsset {
		throw new Error("not implemented");
	}

	createAudioAsset(
		id: string,
		assetPath: string,
		duration: number,
		system: g.AudioSystem,
		loop: boolean,
		hint: g.AudioAssetHint
	): g.AudioAsset {
		return new AudioAsset(this._necessaryRetryCount, id, assetPath, duration, system, loop, hint);
	}

	createAudioPlayer(_system: g.AudioSystem): g.AudioPlayer {
		throw new Error("not implemented");
	}

	createTextAsset(id: string, assetPath: string): g.TextAsset {
		return new TextAsset(this.game, this._necessaryRetryCount, id, assetPath);
	}

	createScriptAsset(id: string, assetPath: string): g.ScriptAsset {
		return new ScriptAsset(this.game, this._necessaryRetryCount, id, assetPath);
	}

	createSurface(width: number, height: number): g.Surface {
		return new Surface(width, height);
	}

	createGlyphFactory(
		_fontFamily: string | string[],
		_fontSize: number,
		_baselineHeight?: number,
		_fontColor?: string,
		_strokeWidth?: number,
		_strokeColor?: string,
		_strokeOnly?: boolean,
		_fontWeight?: g.FontWeightString
	): g.GlyphFactory {
		throw new Error("not implemented");
	}
}

export class Game extends g.Game {
	leftGame: boolean;
	terminatedGame: boolean;
	raisedEvents: g.Event[];

	// constructor(param: g.GameConfiguration) {
	// 	const resourceFactory = param.resourceFactory as ResourceFactory;
	// 	super(param);
	// 	resourceFactory.init(this);
	// 	this.leftGame = false;
	// 	this.terminatedGame = false;
	// 	this.raisedEvents = [];
	// }
	constructor(
		configuration: g.GameConfiguration,
		assetBase?: string,
		selfId?: string,
		operationPluginViewInfo?: g.OperationPluginViewInfo,
		mainFunc?: g.GameMainFunction
	) {
		const resourceFactory = new ResourceFactory();
		const handlerSet = new GameHandlerSet();
		super({ engineModule: g, configuration, resourceFactory, handlerSet, assetBase, selfId, operationPluginViewInfo, mainFunc });
		resourceFactory.init(this);
		this.terminatedGame = false;
		// this.autoTickForInternalEvents = true;
	}

	_leaveGame(): void {
		this.leftGame = true;
	}

	_terminateGame(): void {
		this.terminatedGame = true;
	}

	raiseEvent(e: g.Event): void {
		this.raisedEvents.push(e);
	}

	shouldSaveSnapshot(): boolean {
		return false;
	}

	saveSnapshot(snapshot: any): void {
		// do nothing.
	}

	addEventFilter(filter: g.EventFilter): void {
		throw new Error("not implemented");
	}

	removeEventFilter(filter: g.EventFilter): void {
		throw new Error("not implemented");
	}

	raiseTick(events?: g.Event[]): void {
		throw new Error("not implemented");
	}
}

export class GameHandlerSet implements g.GameHandlerSet {
	raiseTick(_events?: any[]): void {
		// do nothing
	}
	raiseEvent(_event: any): void {
		// do nothing
	}
	addEventFilter(func: g.EventFilter, _handleEmpty?: boolean): void {
		// do nothing
	}
	removeEventFilter(func: g.EventFilter): void {
		// do nothing
	}
	removeAllEventFilters(): void {
		// do nothing
	}
	changeSceneMode(mode: g.SceneMode): void {
		// do nothing
	}
	shouldSaveSnapshot(): boolean {
		return false;
	}
	saveSnapshot(_frame: number, _snapshot: any, _randGenSer: any, _timestamp?: number): void {
		// do nothing
	}
	getInstanceType(): "active" | "passive" {
		return "passive";
	}
	getCurrentTime(): number {
		return 0;
	}
}


export enum EntityStateFlags {
	/**
	 * 特にフラグが立っていない状態
	 */
	None = 0,
	/**
	 * 非表示フラグ
	 */
	Hidden = 1 << 0,
	/**
	 * 描画結果がキャッシュ済みであることを示すフラグ
	 */
	Cached = 1 << 1
}

