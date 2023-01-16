import g = require("../../node_modules/@akashic/akashic-engine");
import mock = require("./mock");

interface Runtime {
	game: g.Game;
	scene: g.Scene;
}

function skeletonRuntime(gameConfiguration?: g.GameConfiguration): Runtime  {
	if (!gameConfiguration)
		gameConfiguration = { width: 320, height: 320, main: "", assets: {} };
	const game = new mock.Game(gameConfiguration);
	const scene = new g.Scene({ game });
	game.pushScene(scene);
	game._flushPostTickTasks();
	return {
		game: game,
		scene: scene
	};
}

export = skeletonRuntime;
