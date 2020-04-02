import g = require("../../node_modules/@akashic/akashic-engine");
import mock = require("./mock");
function skeletonRuntime(gameParameterObject?: g.GameParameterObject) {
	if (!gameParameterObject)
		gameParameterObject = {
			engineModule: g,
			configuration: { width: 320, height: 320, main: "", },
			resourceFactory: new mock.ResourceFactory(),
			handlerSet: {
				raiseEvent: () => {},
				raiseTick: () => {},
				addEventFilter: () => {},
				removeEventFilter: () => {},
				removeAllEventFilters: () => {},
				changeSceneMode: () => {},
				shouldSaveSnapshot: () => {},
				saveSnapshot: () => {},
				getInstanceType: () => {},
				getCurrentTime: () => {}
			} as any

		};
	var game = new mock.Game(gameParameterObject);
	var scene = new g.Scene({ game });
	game.pushScene(scene);
	game._flushSceneChangeRequests();
	return {
		game: game,
		scene: scene
	};
}

export = skeletonRuntime
