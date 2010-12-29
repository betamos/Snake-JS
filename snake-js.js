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
			canvasWidth : 40,
			canvasHeight : 30,
			frameInterval : 100
	};

	var config = config ? utilities.mergeObjects(defaultConfig, config) : defaultConfig ;

	var constants = {
			DIRECTION_UP : 1,
			DIRECTION_RIGHT : 2,
			DIRECTION_DOWN : -1,
			DIRECTION_LEFT : -2,
			CANVAS_POINT_SIZE : 16
	};

	var engine = new Engine(parentElement);

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
		var candy;
		var snake = new Snake();
		var view = new DOMView(parentElement);
		var inputInterface = new InputInterface(constants.DIRECTION_RIGHT);
		var canvas = new Canvas(config.canvasWidth, config.canvasHeight);

		var nowPlaying = false;
		var mainIntervalId;

		this.initGame = function(){

			// Create snake body and assign it to the snake
			// @todo Make sure it is within canvas, if user changes canvas width/height
			snake.points = [new Point(17, 15), new Point(16, 15), new Point(15, 15),
				                 new Point(14, 15), new Point(13, 15), new Point(12, 15),
				                 new Point(11, 15), new Point(10, 15), new Point(9, 15)];

			candy = randomPoint();

			view.initPlayField();
		};

		this.playGame = function(){
			nextFrame();
			mainIntervalId = setInterval(nextFrame, config.frameInterval);
			inputInterface.startListening();
			nowPlaying = true;
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

		this.pauseGame = function(){
			clearInterval(mainIntervalId);
			inputInterface.startListening();
			nowPlaying = false;
		};

		var nextFrame = function(){
			if (!moveSnake(snake, inputInterface.getLastDirection())) {
				gameOver();
				return false;
			}
			
			if(candy.collidesWith(snake.points[0])) {
				snake.fatness += 3;
				candy = randomPoint();
			}
			// Render
			view.clear();
			view.renderPoints(snake.points, "snake");
			view.renderPoints([candy], "candy");

			return true;
		};

		// Move the snake. Automatically handles self collision and walk through walls
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

		var randomPoint = function(){
			var left = utilities.randomInteger(0, canvas.width - 1);
			var top = utilities.randomInteger(0, canvas.height - 1);
			var point = new Point(left, top);
			return point;
		};
	}

	function InputInterface(initialDirection){
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
				width = (config.canvasWidth * constants.CANVAS_POINT_SIZE) + "px";
				height = (config.canvasHeight * constants.CANVAS_POINT_SIZE) + "px";
			}
		};

		this.renderPoints = function(points, name){

			var pointsParent = document.createElement("div");
			pointsParent.className = name + " collection";

			for (i in points) {

				var $point = document.createElement("div");
				$point.className = "point";

				with ($point.style) {
					left = (points[i].left * constants.CANVAS_POINT_SIZE) + "px";
					top = (points[i].top * constants.CANVAS_POINT_SIZE) + "px";
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
