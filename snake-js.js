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
		canvasWidth : 40,				// Width of the game canvas
		canvasHeight : 30,				// Height of the game canvas
		frameInterval : 100,			// Milliseconds between frames (@todo change to speed?)
		pointSize : 16,					// Size of one grid point (the snake is almost one grid point thick)
		backgroundColor : "#f3e698",	// The color of the background. CSS3 color values
		snakeColor : "#4b4312",			// The color of the snake
		candyColor : "#b11c1c"			// The color of the candy
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
			view = new View(parentElement, config.backgroundColor);

			inputInterface = new InputInterface(
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
			if (!nowPlaying)
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
			
			var actualDirection = snake.actualDirection(inputInterface.lastDirection());
			if (!moveSnake(snake, actualDirection)) {
				gameOver();
				return false;
			}

			// If the snake hits a candy
			if(candy.collidesWith(snake.points[0])) {
				snake.fatness += 3;
				candy = randomPoint(canvas);
			}

			// Clear the view to make room for a new frame
			view.clear();
			// Render the objects to the screen
			view.renderSnake(snake.points, actualDirection, config.snakeColor);
			view.renderCandy(candy, config.candyColor);

			return true;
		};

		// Move the snake. Automatically handles self collision and walking through walls
		var moveSnake = function(snake, direction){
			var head = snake.points[0];

			// The direction the snake will move in this frame
			snake.direction = direction;

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
	 * Takes input from the user, typically key strokes to steer the snake
	 * 
	 * @param pause A callback function to be executed when the window is blurred
	 * @param unpause A callback function which executes when the window is in focus again
	 * @returns {InputInterface}
	 */
	function InputInterface(blurFn, focusFn){

		var arrowKeys = [37, 38, 39, 40],	// Key codes for the arrow keys on a keyboard
			listening = false;				// Listening right now for key strokes etc?
			lastDirection = null;			// Corresponds to the last arrow key pressed

		/**
		 * Public methods below
		 */

		this.lastDirection = function(){
			return lastDirection;
		};

		// Start listening for player events
		this.startListening = function(){
			if (!listening) {
				window.addEventListener("keydown", handleKeyPress, true);
				window.addEventListener("blur", blurFn, true);
				window.addEventListener("focus", focusFn, true);
				listening = true;
			}
		};

		// Stop listening for events. Typically called at game end
		this.stopListening = function(){
			if (listening) {
				window.removeEventListener("keydown", handleKeyPress, true);
				window.removeEventListener("blur", blurFn, true);
				window.removeEventListener("focus", focusFn, true);
				listening = false;
			}
		};

		/**
		 * Private methods below
		 */

		var handleKeyPress = function(event){
			// If the key pushed is an arrow key
			if (arrowKeys.indexOf(event.keyCode) >= 0) {
				handleArrowKeyPress(event);
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
			// Arrow keys usually makes the browser window scroll. Prevent this evil behavior
			event.preventDefault();
		};
	}

	/**
	 * CANVAS OBJECT
	 *
	 * This object holds canvas properties and pointers to the objects which are in the
	 * canvas.
	 * @todo Chane name to Grid
	 */
	function Canvas(width, height) {
		this.width = width;
		this.height = height;
	}

	/**
	 * VIEW OBJECT
	 *
	 * This object is responsible for rendering the objects to the screen.
	 * It uses the HTML5 Canvas element for drawing.
	 */
	function View(parentElement, backgroundColor) {
		var playField,			// The DOM <canvas> element
			ctx;				// The canvas context

		this.initPlayField = function(){
			playField = document.createElement("canvas");
			playField.setAttribute("id", "snake-js");
			playField.setAttribute("width", config.canvasWidth * config.pointSize);
			playField.setAttribute("height", config.canvasHeight * config.pointSize);
			parentElement.appendChild(playField);
			ctx = playField.getContext("2d");
		};

		this.renderPoint = function(point, color){

			ctx.fillStyle = color || "white";

			var left = point.left * config.pointSize;
			var top = point.top * config.pointSize;

			ctx.fillRect(left, top, config.pointSize, config.pointSize);
		};

		this.renderPoints = function(points, color){
			for (i in points) {
				this.renderPoint(points[i], color);
			}
		};

		// Draw the snake to screen
		this.renderSnake = function(points, direction, color){
			ctx.strokeStyle = color;
			ctx.lineWidth = config.pointSize - 2;
			ctx.lineJoin = "round";
			ctx.lineCap = "round";
			
			// Bein path drawing.
			ctx.beginPath();
			
			// Loop over the points, beginning with the head
			for (var i = 0; i < points.length; i++) {

				// Short name for the point we're looking at now
				var currentPoint = points[i];

				// If we're looking at the head
				if (i === 0) {
					// The position of this point in screen pixels
					var currentPointPosition = getPointPivotPosition(currentPoint);
					// Don't draw anything, just move the "pencil" to the position of the head
					ctx.moveTo(currentPointPosition.left, currentPointPosition.top);
				}
				// If we're looking at any other point
				else {
					// Short name to the previous point (which we looked at in the last iteration)
					var prevPoint = points[i-1];

					// If these points are next to each other (Snake did NOT go through the wall here)
					if(Math.abs(prevPoint.left - currentPoint.left) <= 1 && Math.abs(prevPoint.top - currentPoint.top) <= 1){
						// The position of this point in screen pixels
						var currentPointPosition = getPointPivotPosition(currentPoint);
						// Draw pencil from the position of the "pencil" to this point
						ctx.lineTo(currentPointPosition.left, currentPointPosition.top);
					}
					// If these points are far away from each other (Snake went through wall here)
					else {
						// Connect these points together. This method will simulate wall entrance/exit if necessary
						connectWallPoints(prevPoint, currentPoint);
					}
				}
			}
			// Now draw the snake to screen
			ctx.stroke();

			// Draw the eye of the snake
			drawEye(points[0], direction);
		};

		this.renderCandy = function(point, color){

			ctx.fillStyle = color || "white";

			var position = getPointPivotPosition(point);

			ctx.beginPath();
			//ctx.moveTo(position.left, position.top);
			ctx.arc(position.left, position.top, config.pointSize / 3, 0, Math.PI*2, true);
			ctx.fill();
		};

		this.clear = function(color) {
			ctx.fillStyle = color || backgroundColor;
			ctx.fillRect(0, 0,
					config.canvasWidth * config.pointSize,
					config.canvasHeight * config.pointSize);
		};

		var drawEye = function(head, direction) {
			var headPosition = getPointPivotPosition(head);
			switch (direction){
			case constants.DIRECTION_LEFT:
				headPosition.left -= 2;
				headPosition.top -= 3;
				break;
			case constants.DIRECTION_RIGHT:
				headPosition.left += 2;
				headPosition.top -= 3;
				break;
			case constants.DIRECTION_UP:
				headPosition.left -= 3;
				headPosition.top -= 2;
				break;
			case constants.DIRECTION_DOWN:
				headPosition.left += 3;
				headPosition.top += 2;
				break;
			}
			ctx.beginPath();
			ctx.fillStyle = "#fff";
			ctx.arc(headPosition.left, headPosition.top, 2, 0, Math.PI*2, true);
			ctx.fill();
		};

		var getPointPivotPosition = function(point) {
			var position = {
					left : point.left * config.pointSize + config.pointSize / 2,
					top : point.top * config.pointSize + config.pointSize / 2
			};
			return position;
		};

		// Connect two points in opposite sides of the grid. Makes lines like Snake went through the wall
		// Presumes that the "pencil" is moved to position of p1
		var connectWallPoints = function(p1, p2) {

			// The position of these points in screen pixels
			var p2Position = getPointPivotPosition(p2);

			// This holds -1 or 1 if points are separated horizontally, else 0
			var leftOffset = utilities.sign(p2.left - p1.left);
			// This holds -1 or 1 if points are separated vertically, else 0
			var topOffset = utilities.sign(p2.top - p1.top);

			// First let's look at p1
			// Create a fake end point outside the canvas, next to p1
			var fakeEndPoint = new Point(p1.left - leftOffset, p1.top - topOffset);
			// And get the screen position
			var fakeEndPointPosition = getPointPivotPosition(fakeEndPoint);
			// End the current line (which was initially drawn outside this method) in this fake point
			ctx.lineTo(fakeEndPointPosition.left, fakeEndPointPosition.top);

			// Let's look at p2. Create a fakepoint again and get it's position...
			var fakeStartPoint = new Point(p2.left + leftOffset, p2.top + topOffset);
			var fakeStartPointPosition = getPointPivotPosition(fakeStartPoint);
			// ...But this time, first move the pencil (without making a line) to the fake point
			ctx.moveTo(fakeStartPointPosition.left, fakeStartPointPosition.top);
			// Then make a line to p2. Note that these lines are not drawn, since this method
			// only connects the lines, the drawing is handled outside this method
			ctx.lineTo(p2Position.left, p2Position.top);
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
			desiredDirection = desiredDirection || constants.DIRECTION_RIGHT;
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
