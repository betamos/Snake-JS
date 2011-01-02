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
function SnakeJS(parentElement, config){

	var utilities = new Utilities();

	var defaultConfig = {
			canvasWidth : 40,		// Width of the game canvas
			canvasHeight : 30,		// Height of the game canvas
			frameInterval : 100,	// Milliseconds between frames (@todo change to speed?)
			pointSize : 16			// Size of one point (the snake is always one point thick)
	};

	// Merge user config with default config
	var config = config ? utilities.mergeObjects(defaultConfig, config) : defaultConfig ;

	var constants = {
			DIRECTION_UP : 1,
			DIRECTION_RIGHT : 2,
			DIRECTION_DOWN : -1,
			DIRECTION_LEFT : -2
	};

	var engine = new Engine(parentElement);

	/**
	 * These methods below (play, quit, pause, unpause) are publically accessible.
	 */
	this.play = function(){
		engine.initGame();
		engine.playGame();
	};

	this.quit = function(){
		engine.quitGame();
	};

	this.pause = function(){
		engine.pauseGame();
	};

	this.unpause = function(){
		engine.playGame();
	};

	/**
	 * GAME MODEL OBJECT
	 *
	 * This object is doing the game logic, frame management etc.
	 */
	function Engine(parentElement) {
		
		var snake,				// The snake itself
			candy,				// The candy which the snake eats
			view,				// The view object which renders the points to screen
			inputInterface,		// Responsible for handling input from the user
			canvas,				// The canvas object
			nowPlaying,			// True if game is currently active, false if paused or ended
			mainIntervalId;		// The ID of the interval timer

		this.initGame = function(){

			snake = new Snake();
			view = new CanvasView(parentElement);

			inputInterface = new InputInterface(
					constants.DIRECTION_RIGHT,
					this.pauseGame,
					this.playGame
			);
			canvas = new Canvas(config.canvasWidth, config.canvasHeight);
	
			nowPlaying = false;

			// Create snake body and assign it to the snake
			// @todo Make sure it is within canvas, if user changes canvas width/height
			snake.points = [new Point(17, 15), new Point(16, 15), new Point(15, 15),
				            new Point(14, 15), new Point(13, 15), new Point(12, 15),
				            new Point(11, 15), new Point(10, 15), new Point(9, 15)];

			candy = randomPoint(canvas);

			view.initPlayField();
		};

		this.playGame = function(){
			nextFrame();
			mainIntervalId = setInterval(nextFrame, config.frameInterval);
			inputInterface.startListening();
			nowPlaying = true;
		};

		this.pauseGame = function(){
			clearInterval(mainIntervalId);
			nowPlaying = false;
		};

		var gameOver = function(){
			quitGame();
			alert("GAME OVER");
		};

		var quitGame = this.quitGame = function(){
			clearInterval(mainIntervalId);
			inputInterface.stopListening();
			nowPlaying = false;
		};

		/**
		 * Private methods below
		 */

		// Renders the next frame based on snake and inputInterface conditions
		// Returns
		var nextFrame = function(){
			if (!moveSnake(snake, inputInterface.getLastDirection())) {
				gameOver();
				return false;
			}
			
			if(candy.collidesWith(snake.points[0])) {
				snake.fatness += 3;
				candy = randomPoint(canvas);
			}

			// Clear the view to make room for a new frame
			view.clear();
			// Render the objects to the screen
			view.renderPoints(snake.points, "snake");
			view.renderPoints([candy], "candy");

			return true;
		};

		// Move the snake. Automatically handles self collision and walking through walls
		var moveSnake = function(snake, desiredDirection){
			var head = snake.points[0];

			// The direction the snake will move in this frame
			snake.direction = snake.actualDirection(desiredDirection);

			var newHead = movePoint(head, snake.direction);

			if (!insideCanvas(newHead, canvas))
				shiftPointIntoCanvas(newHead, canvas);

			if (snake.collidesWith(newHead)) {
				// Can't move. Collides with itself
				return false;
			}

			snake.points.unshift(newHead);

			if (snake.fatness >= 1)
				snake.fatness--;
			else
				snake.points.pop();
			
			return true;
		};

		// Take a point (oldPoint), "move" it in any direction (direction) and
		// return a new point (newPoint) which corresponds to the change
		// Does not care about borders, candy or walls. Just shifting position.
		var movePoint = function(oldPoint, direction){
			var newPoint;
			with (constants) {
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

		// Returns a point object with randomized coordinates within the canvas
		var randomPoint = function(canvas){
			var left = utilities.randomInteger(0, canvas.width - 1);
			var top = utilities.randomInteger(0, canvas.height - 1);
			var point = new Point(left, top);
			return point;
		};
	}

	/**
	 * INPUTINTERFACE OBJECT
	 * 
	 * Takes input from the user
	 * 
	 * @todo Don't take initial direction as an argument.
	 * 
	 * @param initialDirection
	 * @param pause A callback function to be executed when the window is blurred
	 * @param unpause A callback function which executes when the window is in focus again
	 * @returns {InputInterface}
	 */
	function InputInterface(initialDirection, blurFn, focusFn){
		// reservedKeys are the keys which should be handled by the game
		// and not do other stuff, like scrolling up and down.
		var arrowKeys = [37, 38, 39, 40];
		var listening = false;
		var lastDirection = initialDirection;
		this.getLastDirection = function(){
			return lastDirection;
		};
		this.startListening = function(){
			if (!listening) {
				window.addEventListener("keydown", handleKeyPress, true);
				window.addEventListener("blur", blurFn, true);
				window.addEventListener("focus", focusFn, true);
				listening = true;
			}
		};
		this.stopListening = function(){
			if (listening) {
				window.removeEventListener("keydown", handleKeyPress, true);
				window.removeEventListener("blur", blurFn, true);
				window.removeEventListener("focus", focusFn, true);
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
			with (constants) {
				switch (event.keyCode) {
				case 37:
					lastDirection = DIRECTION_LEFT;
					break;
				case 38:
					lastDirection = DIRECTION_UP;
					break;
				case 39:
					lastDirection = DIRECTION_RIGHT;
					break;
				case 40:
					lastDirection = DIRECTION_DOWN;
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
	function DOMView(parentElement) {
		this.playField;

		this.initPlayField = function(){
			this.playField = document.createElement("div");
			this.playField.setAttribute("id", "snake-js");
			parentElement.appendChild(this.playField);
			with (this.playField.style) {
				width = (config.canvasWidth * config.pointSize) + "px";
				height = (config.canvasHeight * config.pointSize) + "px";
			}
		};

		this.renderPoints = function(points, name){

			var pointsParent = document.createElement("div");
			pointsParent.className = name + " collection";

			for (i in points) {

				var $point = document.createElement("div");
				$point.className = "point";

				with ($point.style) {
					left = (points[i].left * config.pointSize) + "px";
					top = (points[i].top * config.pointSize) + "px";
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
	 * CANVASVIEW OBJECT
	 *
	 * This object is responsible for rendering the objects to the screen.
	 * It uses the HTML5 Canvas element for rendering.
	 */
	function CanvasView(parentElement) {
		var playField,			// The DOM <canvas> element
			ctx,				// The canvas context
			fillColors = {		// @todo Make an argument of the render functions instead
				snake : "green",
				candy : "pink"
			};

		this.initPlayField = function(){
			playField = document.createElement("canvas");
			playField.setAttribute("id", "snake-js");
			playField.setAttribute("width", config.canvasWidth * config.pointSize);
			playField.setAttribute("height", config.canvasHeight * config.pointSize);
			parentElement.appendChild(playField);
			ctx = playField.getContext("2d");
		};

		this.renderPoints = function(points, name){

			ctx.fillStyle = fillColors[name];

			for (i in points) {
				var left = points[i].left * config.pointSize;
				var top = points[i].top * config.pointSize;

				ctx.fillRect(left, top, config.pointSize, config.pointSize);
			}
		};

		this.clear = function() {
			ctx.fillStyle = "black";
			ctx.fillRect(0, 0,
					config.canvasWidth * config.pointSize,
					config.canvasHeight * config.pointSize);
		};
	}

	/**
	 * SNAKE OBJECT
	 *
	 * The snake itself...
	 */
	function Snake() {
		this.direction = constants.DIRECTION_RIGHT;
		this.points = [];
		this.fatness = 0;

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

		// Merge two flat objects and return the modified object.
		this.mergeObjects = function mergeObjects(slave, master){
			var merged = {};
			for (key in slave) {
				if (typeof master[key] === "undefined")
					merged[key] = slave[key];
				else
					merged[key] = master[key];
			}
			return merged;
		};

		// Returns an integer between min and max, including both min and max
		this.randomInteger = function(min, max){
			var randomNumber = min + Math.floor(Math.random() * (max + 1));
			return randomNumber;
		};
	}
};
