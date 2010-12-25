/**
 * Snake The Game
 * By Didrik Nordström, http://betamos.se
 * MIT Licensed
 */

/**
 * MAIN GAME OBJECT
 *
 * Everything associated with the snake game should be encapsulated within
 * this namespace
 */
//@todo the constructor should probably take some arguments
//like pointsize, canvaswidth and height and the DOM element
//for the game itself.
function SnakeGame(element){
	var game = this;

	this.config = {
			CANVAS_WIDTH : 40,
			CANVAS_HEIGHT : 30,
			FRAME_INTERVAL : 100
	};

	this.constants = {
			DIRECTION_UP : 1,
			DIRECTION_RIGHT : 2,
			DIRECTION_DOWN : -1,
			DIRECTION_LEFT : -2,
			CANVAS_POINT_SIZE : 15
	};

	this.gameModel = new GameModel();
	this.snake = new Snake();
	this.canvas = new Canvas(this.config.CANVAS_WIDTH, this.config.CANVAS_HEIGHT);
	this.view = new DOMView(element);
	this.inputInterface = new InputInterface(this.constants.DIRECTION_RIGHT);

	/**
	 * GAME MODEL OBJECT
	 *
	 * This object is doing the game logic, frame management etc.
	 */
	function GameModel() {
		var mainIntervalId;

		this.initGame = function(){
			game.canvas.$DOMCanvas = $("#canvas");

			// Create snake body and assign it to the snake
			var snakeBody = [new Point(7, 4), new Point(6, 4), new Point(5, 4),
			                 new Point(4, 4), new Point(3, 4)];
			game.snake.points = snakeBody;

			game.view.initPlayField();

			game.inputInterface.startListening();

			this.nextFrame();

			mainIntervalId = setInterval(this.nextFrame, game.config.FRAME_INTERVAL);

		};

		this.nextFrame = function(){
			var head = game.snake.points[0];

			// The direction the snake will move in this frame
			var direction = actualSnakeDirection(game.snake.direction,
					game.inputInterface.lastDirection);

			var newHead = movePoint(head, direction);

			if (!insideCanvas(newHead, game.canvas))
				shiftPointIntoCanvas(newHead, game.canvas);

			if (game.snake.collidesWith(newHead)) {
				game.gameModel.gameOver();
				return false;
			}
			// @todo also check if it enters itself, goes thru wall or catches candy?
			// Separate to different local functions

			game.snake.direction = direction;

			game.snake.points.unshift(newHead);
			// @todo pop() returns undefined if empty, check that it doesn't shrink too far
			game.snake.points.pop();

			// Render
			game.view.clear();
			game.view.renderPoints(game.snake.points, "snake");

			return true;
		};

		this.gameOver = function(){
			clearInterval(mainIntervalId);
			alert("GAME OVER");
		};

		// Get the direction which the snake will go this frame
		// To determine this, it uses the inputinterface and the last frame's direction.
		var actualSnakeDirection = function(snakeDirection, playerDirection){
			// @todo performance increased if check is only made when necessary
			if (oppositeDirections(snakeDirection, playerDirection)) {
				// Continue moving in the snake's current direction
				// ignoring the player
				return snakeDirection;
			}
			else {
				// Obey the player and move in that direction
				return playerDirection;
			}
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
			if (Util.sign(number) == 1){
				steps = Math.floor(number/range);
				shiftedNumber = number - (range * steps);
			}
			else if (Util.sign(number) == -1){
				steps = Math.floor(Math.abs(number)/range) + 1;
				shiftedNumber = number + (range * steps);
			}
			else {
				shiftedNumber = number;
			}
			return shiftedNumber;
		};

		// Helper function to find if two directions are in opposite to each other
		// Returns true if the directions are in opposite to each other, false otherwise
		var oppositeDirections = function(direction1, direction2){

			// @see Declaration of constants to understand.
			// E.g. UP is defined as 1 while down is defined as -1
			if (Math.abs(direction1) == Math.abs(direction2) &&
					Util.sign(direction1 * direction2) == -1) {
				return true;
			}
			else {
				return false;
			}
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
		this.lastDirection = initialDirection;
		this.startListening = function(){
			$(window).keydown(handleKeyPress);
		};
		var handleKeyPress = function(event){
			// If the key pushed is an arrow key
			if (arrowKeys.indexOf(event.keyCode) >= 0) {
				handleArrowKeyPress(event.keyCode);
				return false;
			}
		};
		var handleArrowKeyPress = function(keyCode){
			with (game.constants) {
				switch (keyCode) {
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
				width = (game.config.CANVAS_WIDTH * game.constants.CANVAS_POINT_SIZE) + "px";
				height = (game.config.CANVAS_HEIGHT * game.constants.CANVAS_POINT_SIZE) + "px";
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
	 * UTIL OBJECT
	 *
	 * Provides some utility methods which don't fit anywhere else.
	 */
	var Util = {
			sign : function(number){
				if(number > 0)
					return 1;
				else if (number < 0)
					return -1;
				else if (number === 0)
					return 0;
				else
					return undefined;
			}
	};
};
