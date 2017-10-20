var canvas = document.getElementById("viewport");
var context = canvas.getContext("2d");

var CANVAS_SIZE = 514;
var MAP_SIZE = 257;

var tilesize = Math.ceil(CANVAS_SIZE/MAP_SIZE);

// Coastal Mountains
var seaLevel = 0.4;
var sandLevel = 0.42;
var treeLevel = 0.7;
var glacierLevel = 0.85;

context.fillStyle = 'rgb(55, 55, 255)';
context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

class Tile {
	constructor(x, y, height, map) {
		this.x = x;
		this.y = y;

		this.height = height;
		this.occupant = null;
		this.waterLevel = 0;

		this.world = map;
	}

	getAdjacentTiles() {

		let result = [];

		for (let row = this.x - 1; row < this.x + 2; row++) {
			for (let col = this.y - 1; col < this.y + 2; col++) {
				if (row == this.x && col == this.y) continue;
				let t = this.world.getTileAt(row, col);
				if (t != null)
					result.push(t);
			}
		}

		return result;
	}

}

class TileMap {
	constructor(heightMap) {
		this.heightMap = heightMap;
		let tiles = [];
		
		for (let i=0; i<heightMap.length; i++) {
			let tileRow = [];
			for (let j=0; j<heightMap.length; j++) {
				tileRow.push(new Tile(i, j, heightMap[i][j], this));
			}

			tiles.push(tileRow);
		}

		this.tiles = tiles;
	}

	getTileAt(row, col) {
		if (row < 0 || row > this.tiles.length
		 || col < 0 || col > this.tiles.length)
			return null;

		else return this.tiles[row][col];
	}

	tick() {
		/* get all entities to update */	
		let updateQueue = [];
		
		this.tiles.forEach(function(row) {
			row.forEach(function(cell) {
				if (cell.occupant != null)
					updateQueue.push(cell.occupant);
			});
		});

		/* update each entity */
		updateQueue.forEach(function(entity) {
			entity.tick();	
		});


		this.draw();
	}

	draw() {
		let map = this.heightMap;
	
		for (let i = 0; i < map.length; i++) {
			for (let j = 0; j < map.length; j++) {
				// Generate color
	
				let r = 0, g = 0, b = 0;
	
				if (this.tiles[i][j].occupant != null) {
					let oc = this.tiles[i][j].occupant;
					r = oc.r;
					g = oc.g;
					b = oc.b;
				} else if (this.tiles[i][j].waterLevel > 0) {
					r = 125 * (map[i][j] + 0.5)/2;
					g = 125 * (map[i][j] + 0.5)/2;
					b = 255 * (map[i][j] + 0.5)/2;
				} else if (map[i][j] < sandLevel) {
					r = 155 + 45 * (map[i][j] / 0.42);
					g = 155 + 45 * (map[i][j] / 0.42);
					b = 125;
				} else if (map[i][j] < treeLevel) {
					r = 55 * map[i][j];
					g = 255 * (map[i][j] + 0.1);
					b = 75;
				} else if (map[i][j] < glacierLevel) {
					r = 195 * map[i][j];
					g = 195 * map[i][j];
					b = 195 * map[i][j];
				} else {
					r = 235 * map[i][j];
					g = 235 * map[i][j];
					b = 255 * map[i][j];
				}
	
				context.fillStyle = 'rgb(' + r + ', ' + g + ', ' + b + ')';
			
				// Draw tile
				context.fillRect(i*tilesize, j*tilesize, tilesize, tilesize);
			}
		}
	}

	init() {
		let anchor = this;
		setInterval(function() {anchor.tick()}, 1000);
	}
}

class Entity {
	constructor(tile, type) {
		this.location = tile;
		tile.occupant = this;
		this.type = type;
	}

	tick() {}

	setTile(tile) {
		tile.occupant = this;
	}
}

class Structure extends Entity {
	constructor(tile, type) {
		super(tile, type);
	}
}

class House extends Structure {
	constructor(tile) {
		super(tile, 'house');
	}

	init() {
		this.r = 55;
		this.g = 55;
		this.b = 55;
	}
}

class Organism extends Entity {
	constructor(tile, type) {
		super(tile, type);
	}

	move(newTile) {
		this.location.occupant = null;
		this.location = newTile;
		this.location.occupant = this;
	}

	reproduce(newTile) {}
}

class Human extends Organism {
	constructor(tile) {
		super(tile, 'human');
	}

	init() {
		this.r = 255;
		this.g = 0;
		this.b = 0;
	}

	tick() {
		/* Get adjacent cells */
		let adjacentTiles = this.location.getAdjacentTiles();

		/* move into one */
		let destination =
			adjacentTiles[Math.floor(Math.random()*adjacentTiles.length)];

		this.location.occupant = null;
		this.location = destination;
		this.location.occupant = this;
	}

	reproduce(newTile) {
		newTile.occupant = new Human(newTile);
	}
}

class Tree extends Organism {
	constructor(tile) {
		super(tile, 'tree');
	}

	reproduce(newTile) {
		newTile.occupant = new Tree(newTile);
	}
}

let tileMap = new Array();

for (let i=0; i<MAP_SIZE; i++) {
	tileMap.push([]);
	for (let j=0; j<MAP_SIZE; j++) {
		tileMap[i].push(0);
	}
}


let seedMap = function(map, featureSize) {

	for (let i = 0; i < map.length; i += featureSize)
		for (let j = 0; j < map.length; j += featureSize)
			map[i][j] = Math.random();
}

let squareStep = function(map, i, j, featureSize) {

	if (!isInMap(map, i, j)) return;

	let halfstep = featureSize / 2;

	let samples = []
	if (isInMap(map, i - halfstep, j - halfstep))
		samples.push(map[i - halfstep][ j - halfstep]);

	if (isInMap(map, i - halfstep, j + halfstep))
		samples.push(map[i - halfstep][ j + halfstep]);

	if (isInMap(map, i + halfstep, j + halfstep))
		samples.push(map[i + halfstep][ j + halfstep]);

	if (isInMap(map, i + halfstep, j - halfstep))
		samples.push(map[i + halfstep][ j - halfstep]);
	
	let sum = samples.reduce(function(a, b) { return a + b; });
	let avg = sum / samples.length;

	map[i][j] = avg + ((Math.random() - 0.5) * (featureSize/map.length));

}

let diamondStep = function(map, i, j, featureSize) {

	if (!isInMap(map, i, j)) return;

	let halfstep = featureSize / 2;

	let samples = []
	if (isInMap(map, i - halfstep, j))
		samples.push(map[i - halfstep][j]);

	if (isInMap(map, i + halfstep, j))
		samples.push(map[i + halfstep][j]);

	if (isInMap(map, i, j + halfstep))
		samples.push(map[i][ j + halfstep]);

	if (isInMap(map, i, j - halfstep))
		samples.push(map[i][ j - halfstep]);
	
	let sum = samples.reduce(function(a, b) { return a + b; });
	let avg = sum / samples.length;
	
	map[i][j] = avg + ((Math.random() - 0.5) * (featureSize/map.length));
}

let isInMap = function(map, i, j) {
	if (i > -1 && i < map.length && j > -1 && j < map.length)
		return true;
}

let sample = function(map, i, j) {
	if (isInMap(map, i, j)) return map[i][j];
	else return 0.5;
}

let squareDiamond = function(map, featureSize) {
	
	seedMap(map, featureSize);
	
	let stepSize = featureSize;
	
	let halfstep;

	while (stepSize > 1) {
		halfstep = stepSize / 2;

		for (let i=halfstep; i<map.length-1; i += stepSize) {
			for (let j=halfstep; j<map.length-1; j+= stepSize) {
				squareStep(map, i, j, stepSize);
			}
		}

		for (let i=0; i<map.length; i += stepSize) {
			for (let j=0; j<map.length; j += stepSize) {
				diamondStep(map, i + halfstep, j, stepSize);
				diamondStep(map, i, j + halfstep, stepSize);
			}
		}

		stepSize = stepSize/2;
	}
}

let generateRiver = function(tileMap, i, j)
{
	let toCheck = [[i, j]];
	let river = [];

	let map = tileMap.heightMap;

	while (isInMap(map, i, j) && map[i][j] > seaLevel) {
		
		// add i, j to river
		toCheck.splice(0, 1);
		river.push([i, j]);

		// add neighbors to queue if not in river or queue
		let neighbors = [[i-1, j], [i+1, j], [i, j-1], [i, j+1]];

		for (let n = 0; n < neighbors.length; n++) {
			if (!arrayInArray(toCheck, neighbors[n]) &&
				!arrayInArray(river, neighbors[n]))
				toCheck.push(neighbors[n]);
		}

		// sort queue
		toCheck.sort(function(a, b) {
			if (!isInMap(map, a[0], a[1])) return Math.random() - 0.5;
			if (!isInMap(map, b[0], b[1])) return Math.random() - 0.5;
			return map[a[0]][a[1]] - map[b[0]][b[1]];
		});
	
		// set i, j = lowest in queue
		i = toCheck[0][0];
		j = toCheck[0][1];
	}

	for (let i=0; i<river.length; i++) {
		if (map[river[i][0]][river[i][1]] < 0.9)
		{
			map[river[i][0]][river[i][1]] -= 0.05;
			tileMap.tiles[river[i][0]][river[i][1]].waterLevel = 1;
		}
	}
}

let generateSettlement = function(tileMap) {
	// find area
	console.log("get shoreline")
	let shoreline = getShoreline(tileMap);
	console.log("restrict height");
	let points = restrictHeight(shoreline, 0.4, 0.7);
	console.log("pick center");
	let center = points[Math.floor(Math.random()*points.length)];
	console.log(center);

	let min_x = center.x - 8;
	let min_y = center.y - 8;
	let max_x = center.x + 8;
	let max_y = center.y + 8;

	let settlementTiles = [];
	for (let i = min_x; i < max_x; i++)
		for (let j = min_y; j < max_y; j++)
			if (isInMap(tileMap.tiles, i, j) && !isWater(tileMap, i, j))
				settlementTiles.push(tileMap.tiles[i][j]);

	/* place a house */
	let i = Math.floor(Math.random()*settlementTiles.length);
	let t = settlementTiles.splice(i, 1)[0];
	t.occupant = new House(t);
	t.occupant.init();

	/* place two humans */
	i = Math.floor(Math.random()*settlementTiles.length);
	t = settlementTiles.splice(i, 1)[0];
	t.occupant = new Human(t);
	t.occupant.init();

	i = Math.floor(Math.random()*settlementTiles.length);
	t = settlementTiles.splice(i, 1)[0];
	t.occupant = new Human(t);
	t.occupant.init();
}

let restrictHeight = function(points, low, high)
{
	let result = [];

	points.forEach(function(p) {
		if (p.height > low && p.height < high)
			result.push(p);
	});

	return result;
}

let getPointsAbove = function(map, n) {
	let result = [];
	for (let i = 0; i < map.length; i++)
		for (let j = 0; j < map.length; j++)
			if (map[i][j] > n) result.push([i, j]);

	return result;
}

let getHighestPoints = function(map, n) {
	points.sort(function(a, b) {
		return map[b[0]][b[1]] - map[a[0]][a[1]];
	});

	return points.slice(0, n);
}

let randomHighs = function(map, m, n) {
	let highs = getHighestPoints(map, n);
	let result = [];

	for (let i = 0; i < m; i++)
		result.push(highs[i]);
		result.push(highs.splice(Math.floor(Math.random()*highs.length), 1));
	
	return result;
}

let getShoreline = function(map) {
	let result = [];
	
	for (let i = 0; i < map.tiles.length; i++)
		for (let j = 0; j < map.tiles.length; j++)
			if (isShore(map, i, j)) result.push(map.tiles[i][j]);
	
	return result;
}

let isShore = function(map, i, j) {

	if (isWater(map, i, j))
		return false;

	if (isWater(map, i-1, j)
		|| isWater(map, i+1, j)
		|| isWater(map, i, j-1)
		|| isWater(map, i, j+1))
			return true;
	
	return false;
}

let isWater = function(map, i, j) {
	if (!isInMap(map.tiles, i, j)) return false;
	if (map.tiles[i][j].waterLevel > 0) return true;
	return false;
}

let arrayInArray = function(A, element) {
	for (let i = 0; i < A.length; i++) {
		if (arraysEqual(A[i], element)) return true;
	}

	return false;
}

let arraysEqual = function(A, B) {
	for (let i = 0; i < A.length; i++) {
		if (A[i] != B[i]) return false;
	}

	return true;
}

let generateRivers = function(map, n) {
	let sources = getPointsAbove(map.heightMap, n);
	sources.forEach(function(element) {
		if (Math.random() > 0.999)
			generateRiver(map, element[0], element[1]);	
	});
}

let fillOceans = function(map, seaLevel) {
	let heightMap = map.heightMap;
	for (let i = 0; i < map.tiles.length; i++) {
		for (let j = 0; j < map.tiles.length; j++) {
			if (heightMap[i][j] < seaLevel)
				map.tiles[i][j].waterLevel = 1;
		}
	}
}

let generate = function(TM) {
	console.log("filling oceans...");
	fillOceans(TM, seaLevel);
	
	console.log("generating rivers...");
	generateRivers(TM, glacierLevel - 0.1);
	
	console.log("generating settlements...");
	generateSettlement(TM); 

	console.log("drawing map...");
	TM.draw();

}

console.log("generating heightmap");
squareDiamond(tileMap, 128);

let TM = new TileMap(tileMap);
generate(TM);
TM.init();
