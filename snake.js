/**
 * Snake-JS
 * 
 * By Didrik Nordstrom, http://betamos.se
 * Follow the project on github: http://github.com/betamos/Snake-JS
 * MIT Licensed
 */

/**
 * MAIN GAME OBJECT
 *
 * Everything associated with the snake game should be encapsulated within
 * this function to avoid pollution of the global namespace
 */
function SnakeGame(element, config){
	var game = this;

	var utilities = new Utilities();

	var defaultConfig = {
			canvasWidth : 40,
			canvasHeight : 30,
			frameInterval : 100
	};

	this.config = config ? utilities.mergeObjects(defaultConfig, config) : defaultConfig ;

	this.constants = {
			DIRECTION_UP : 1,
			DIRECTION_RIGHT : 2,
			DIRECTION_DOWN : -1,
			DIRECTION_LEFT : -2,
			CANVAS_POINT_SIZE : 16
	};

	this.gameModel = new GameModel();
	this.snake = new Snake();
	this.canvas = new Canvas(this.config.canvasWidth, this.config.canvasHeight);
	this.view = new DOMView(element);
	this.inputInterface = new InputInterface(this.constants.DIRECTION_RIGHT);

	this.nowPlaying = false;

	this.play = function(){
		this.gameModel.initGame();
		this.gameModel.playGame();
	};

	this.quit = function(){
		this.gameModel.quitGame();
	};

	this.pause = function(){
		this.gameModel.pauseGame();
	};

	this.unpause = function(){
		this.gameModel.playGame();
	};

	/**
	 * GAME MODEL OBJECT
	 *
	 * This object is doing the game logic, frame management etc.
	 */
	function GameModel() {
		var mainIntervalId;

		this.initGame = function(){

			// Create snake body and assign it to the snake
			// @todo Make sure it is within canvas, if user changes canvas width/height
			game.snake.points = [new Point(17, 15), new Point(16, 15), new Point(15, 15),
				                 new Point(14, 15), new Point(13, 15), new Point(12, 15),
				                 new Point(11, 15), new Point(10, 15), new Point(9, 15)];

			game.view.initPlayField();
		};

		this.playGame = function(){
			this.nextFrame();
			mainIntervalId = setInterval(this.nextFrame, game.config.frameInterval);
			game.inputInterface.startListening();
			game.nowPlaying = true;
		};

		this.gameOver = function(){
			this.stopGame();
			alert("GAME OVER");
		};

		this.quitGame = function(){
			clearInterval(mainIntervalId);
			game.inputInterface.stopListening();
			game.view.clear();
			game.nowPlaying = false;
		};

		this.pauseGame = function(){
			clearInterval(mainIntervalId);
			game.nowPlaying = false;
		};

		this.nextFrame = function(){
			moveSnake(game.snake, game.inputInterface.lastDirection);
			// Render
			game.view.clear();
			game.view.renderPoints(game.snake.points, "snake");

			return true;
		};

		// Move the snake. Automatically handles self collision and walk through walls
		var moveSnake = function(snake, desiredDirection){
			var head = snake.points[0];

			// The direction the snake will move in this frame
			snake.direction = snake.actualDirection(desiredDirection);

			var newHead = movePoint(head, snake.direction);

			if (!insideCanvas(newHead, game.canvas))
				shiftPointIntoCanvas(newHead, game.canvas);

			if (snake.collidesWith(newHead)) {
				game.gameModel.gameOver();
				return false;
			}

			snake.points.unshift(newHead);

			snake.points.pop();
			
			return true;
		};

		// Take a point (oldPoint), "move" it in any direction (direction) and
		// return a new point (newPoint) which corresponds to the change
		// Does not care about borders, candy or walls. Just shifting position.
		var movePoint = function(oldPoint, direction){
			var newPoint;
			with (game.constants) {
				switch (direction) {
				case DIRECTION_LEFT:
					newPoint = new Point(oldPoint.left-1, oldPoint.top);
					break;
				case DIRECTION_UP:
					newPoint = new Point(oldPoint.left, oldPoint.top-1);
					break;
				case DIRECTION_RIGHT:
					newPoint = new Point(oldPoint.left+1, oldPoint.top);
					break;
				case DIRECTION_DOWN:
					newPoint = new Point(oldPoint.left, oldPoint.top+1);
					break;
				}
			}
			return newPoint;
		};

		// Shifts the points position so that it it is kept within the canvas
		// making it possible to "go thru" walls
		var shiftPointIntoCanvas = function(point, canvas){
			point.left = shiftIntoRange(point.left, canvas.width);
			point.top = shiftIntoRange(point.top, canvas.height);
			return point;
		};

		// Helper function for shiftPointIntoCanvas
		// E.g. if number=23, range=10, returns 3
		// E.g.2 if nubmer = -1, range=10, returns 9
		var shiftIntoRange = function(number, range) {
			var shiftedNumber, steps;
			if (utilities.sign(number) == 1){
				steps = Math.floor(number/range);
				shiftedNumber = number - (range * steps);
			}
			else if (utilities.sign(number) == -1){
				steps = Math.floor(Math.abs(number)/range) + 1;
				shiftedNumber = number + (range * steps);
			}
			else {
				shiftedNumber = number;
			}
			return shiftedNumber;
		};

		// Check if a specific point is inside the canvas
		// Returns true if inside, false otherwise
		var insideCanvas = function(point, canvas){
			if (point.left < 0 || point.top < 0 ||
					point.left >= canvas.width || point.top >= canvas.height){
				return false;
			}
			else {
				return true;
			}
		};
	}

	function InputInterface(initialDirection){
		// reservedKeys are the keys which should be handled by the game
		// and not do other stuff, like scrolling up and down.
		var arrowKeys = [37, 38, 39, 40];
		var listening = false;
		this.lastDirection = initialDirection;
		this.startListening = function(){
			if (!listening) {
				window.addEventListener("keydown", handleKeyPress, true);
				listening = true;
			}
		};
		this.stopListening = function(){
			if (listening) {
				window.removeEventListener("keydown", handleKeyPress, true);
				listening = false;
			}
		};
		var handleKeyPress = function(event){
			// If the key pushed is an arrow key
			if (arrowKeys.indexOf(event.keyCode) >= 0) {
				handleArrowKeyPress(event);

				// @todo Return false doesn't seem to prevent scrolling
				// with arrow keys. See what can be done
				return false;
			}
		};
		var handleArrowKeyPress = function(event){
			with (game.constants) {
				switch (event.keyCode) {
				case 37:
					game.inputInterface.lastDirection = DIRECTION_LEFT;
					break;
				case 38:
					game.inputInterface.lastDirection = DIRECTION_UP;
					break;
				case 39:
					game.inputInterface.lastDirection = DIRECTION_RIGHT;
					break;
				case 40:
					game.inputInterface.lastDirection = DIRECTION_DOWN;
					break;
				}
			}
			event.preventDefault();
		};
	}

	/**
	 * CANVAS OBJECT
	 *
	 * This object holds canvas properties and pointers to the objects which are in the
	 * canvas.
	 */
	function Canvas(width, height) {
		this.width = width;
		this.height = height;

		// All objects within the canvas are in this array, like the snakebody, candy collection
		this.contents = [];
	}

	/**
	 * DOMVIEW OBJECT
	 *
	 * This object is responsible for rendering the objects to the screen.
	 * It creates DOM-elements to do so.
	 */
	function DOMView(element) {
		this.playField = element;

		this.initPlayField = function(){
			with (this.playField.style) {
				position = "relative";
				width = (game.config.canvasWidth * game.constants.CANVAS_POINT_SIZE) + "px";
				height = (game.config.canvasHeight * game.constants.CANVAS_POINT_SIZE) + "px";
			}
		};

		this.renderPoints = function(points, name){

			var pointsParent = document.createElement("div");
			pointsParent.className = name;

			for (i in points) {

				var $point = document.createElement("div");
				$point.className = "point";

				with ($point.style) {
					left = (points[i].left * game.constants.CANVAS_POINT_SIZE) + "px";
					top = (points[i].top * game.constants.CANVAS_POINT_SIZE) + "px";
				}

				pointsParent.appendChild($point);

			}

			this.playField.appendChild(pointsParent);
		};

		this.clear = function() {
			while (this.playField.hasChildNodes())
			{
				this.playField.removeChild(this.playField.lastChild);       
			}
		};
	}

	/**
	 * SNAKE OBJECT
	 *
	 * The snake itself...
	 */
	function Snake() {
		this.direction = game.constants.DIRECTION_RIGHT;
		this.points = [];

		// Check if any of this objects points collides with an external point
		// Returns true if any collision occurs, false otherwise
		this.collidesWith = function(point){
			for (i in this.points) {
				if (point.collidesWith(this.points[i]))
					return true;
			}
			return false;
		};

		// Get the direction which the snake will go this frame
		// The desired direction is usually provided by the player
		this.actualDirection = function(desiredDirection){
			if (utilities.oppositeDirections(this.direction, desiredDirection)) {
				// Continue moving in the snake's current direction
				// ignoring the player
				return this.direction;
			}
			else {
				// Obey the player and move in that direction
				return desiredDirection;
			}
		};
	}

	/**
	 * POINT OBJECT
	 *
	 * A point has a place in the canvas coordinate system and can be passed
	 * to Canvas for rendering.
	 */
	function Point(left, top) {
		this.left = left;
		this.top = top;

		// Check if this point collides with another
		this.collidesWith = function(otherPoint){
			if (otherPoint.left == this.left && otherPoint.top == this.top)
				return true;
			else
				return false;
		};
	}

	/**
	 * UTILITIES OBJECT
	 *
	 * Provides some utility methods which don't fit anywhere else.
	 */
	function Utilities() {

		// Takes a number and returns the sign of it.
		// E.g. -56 -> -1, 57 -> 1, 0 -> 0
		this.sign = function(number){
			if(number > 0)
				return 1;
			else if (number < 0)
				return -1;
			else if (number === 0)
				return 0;
			else
				return undefined;
		};

		// Helper function to find if two directions are in opposite to each other
		// Returns true if the directions are in opposite to each other, false otherwise
		this.oppositeDirections = function(direction1, direction2){
	
			// @see Declaration of constants to understand.
			// E.g. UP is defined as 1 while down is defined as -1
			if (Math.abs(direction1) == Math.abs(direction2) &&
					this.sign(direction1 * direction2) == -1) {
				return true;
			}
			else {
				return false;
			}
		};

		this.mergeObjects = function mergeObjects(slave, master){
			var merged = {};
			for (i in slave) {
				if (typeof master[i] === "undefined")
					merged[i] = slave[i];
				else
					merged[i] = master[i];
			}
			return merged;
		};
	}
};
