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
		autoInit : true,				// Game inits automagically. If false, one must call .init() manually
		gridWidth : 30,					// Width of the game grid
		gridHeight : 20,				// Height of the game grid
		frameInterval : 150,			// Milliseconds between frames (@todo change to speed?)
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
		DIRECTION_LEFT : -2,
		DEFAULT_DIRECTION : 2,
		STATE_READY : 1,
		STATE_PAUSED : 2,
		STATE_PLAYING : 3,
		STATE_GAME_OVER : 4,
		INITIAL_SNAKE_FATNESS : 6
	};

	var engine = new Engine(parentElement);

	/**
	 * These methods below (init, pause, resume) are publically accessible.
	 */
	this.init = function(){
		engine.initGame();
	};

	this.pause = function(){
		engine.pauseGame();
	};

	this.resume = function(){
		engine.resume();
	};

	/**
	 * GAME MODEL OBJECT
	 *
	 * This object is doing the game logic, frame management etc.
	 */
	function Engine(parentElement) {
		
		var snake,				// The snake itself
			candy,				// The candy which the snake eats
			view,				// The view object which draws the points to screen
			inputInterface,		// Responsible for handling input from the user
			grid,				// The grid object
			currentState,		// Possible values are found in constants.STATE_*
			mainIntervalId;		// The ID of the interval timer

		this.initGame = function(){

			snake = new Snake();
			view = new View(parentElement, config.backgroundColor);

			inputInterface = new InputInterface(this.pauseGame, this.resumeGame, startMoving);
			grid = new Grid(config.gridWidth, config.gridHeight);

			// Create snake body
			snake.points.push(randomPoint(grid));
			snake.fatness = constants.INITIAL_SNAKE_FATNESS;

			candy = randomPoint(grid);

			view.initPlayField();
			drawCurrentScene();
			inputInterface.startListening();
			currentState = constants.STATE_READY;
		};

		this.pauseGame = function(){
			if (currentState === constants.STATE_PLAYING) {
				clearInterval(mainIntervalId);
				currentState = constants.STATE_PAUSED;
			}
		};

		this.resumeGame = function(){
			if (currentState === constants.STATE_PAUSED) {
				mainIntervalId = setInterval(nextFrame, config.frameInterval);
				currentState = constants.STATE_PLAYING;
			}
		};

		/**
		 * Private methods below
		 */

		// Play a game over scene and restart the game
		var gameOver = function(){
			currentState = constants.STATE_GAME_OVER;
			clearInterval(mainIntervalId);

			// Remove one point from the snakes tail and recurse with a timeout
			var removeTail = function(){
				if (snake.points.length > 1) {
					snake.points.pop();
					drawCurrentScene();
					setTimeout(removeTail, config.frameInterval);
				}
				else
					setTimeout(resurrect, config.frameInterval * 30);
			};
			
			var resurrect = function (){
				snake.fatness = constants.INITIAL_SNAKE_FATNESS;
				snake.alive = true;
				drawCurrentScene();
				currentState = constants.STATE_READY;
			};

			setTimeout(removeTail, config.frameInterval * 10);
		};

		var startMoving = function(){
			if (currentState === constants.STATE_READY) {
				mainIntervalId = setInterval(nextFrame, config.frameInterval);
				currentState = constants.STATE_PLAYING;
			}
		};

		// Calculates what the next frame will be like and draws it.
		var nextFrame = function(){

			// Try to move the snake in the desired direction
			if (!moveSnake(inputInterface.lastDirection())) {
				// @todo Give the player one frame extra time to move away
				snake.alive = false;
				// Draw the dead snake
				drawCurrentScene();
				gameOver();
				return false;
			}

			// If the snake hits a candy
			if(candy.collidesWith(snake.points[0])) {
				snake.fatness += 3;
				// Find a new position for the candy, and make sure it's not inside the snake
				do {
					candy = randomPoint(grid);
				} while(snake.collidesWith(candy));
			}

			drawCurrentScene();

			return true;
		};

		var drawCurrentScene = function() {
			// Clear the view to make room for a new frame
			view.clear();
			// Draw the objects to the screen
			view.drawSnake(snake, config.snakeColor);
			view.drawCandy(candy, config.candyColor);
		};

		// Move the snake. Automatically handles self collision and walking through walls
		var moveSnake = function(desiredDirection){
			var head = snake.points[0];

			// The direction the snake will move in this frame
			snake.direction = actualDirection(desiredDirection || constants.DEFAULT_DIRECTION);

			var newHead = movePoint(head, snake.direction);

			if (!insideGrid(newHead, grid))
				shiftPointIntoGrid(newHead, grid);

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

		// Get the direction which the snake will go this frame
		// The desired direction is usually provided by keyboard input
		var actualDirection = function(desiredDirection){
			if (snake.points.length === 1)
				return desiredDirection;
			else if (utilities.oppositeDirections(snake.direction, desiredDirection)) {
				// Continue moving in the snake's current direction
				// ignoring the player
				return snake.direction;
			}
			else {
				// Obey the player and move in that direction
				return desiredDirection;
			}
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

		// Shifts the points position so that it it is kept within the grid
		// making it possible to "go thru" walls
		var shiftPointIntoGrid = function(point, grid){
			point.left = shiftIntoRange(point.left, grid.width);
			point.top = shiftIntoRange(point.top, grid.height);
			return point;
		};

		// Helper function for shiftPointIntoGrid
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

		// Check if a specific point is inside the grid
		// Returns true if inside, false otherwise
		var insideGrid = function(point, grid){
			if (point.left < 0 || point.top < 0 ||
					point.left >= grid.width || point.top >= grid.height){
				return false;
			}
			else {
				return true;
			}
		};

		// Returns a point object with randomized coordinates within the grid
		var randomPoint = function(grid){
			var left = utilities.randomInteger(0, grid.width - 1);
			var top = utilities.randomInteger(0, grid.height - 1);
			var point = new Point(left, top);
			return point;
		};

		var gameOverScene = function(){
		};
	}

	/**
	 * INPUTINTERFACE OBJECT
	 * 
	 * Takes input from the user, typically key strokes to steer the snake but also window events
	 * 
	 * @param pauseFn A callback function to be executed when the window is blurred
	 * @param resumeFn A callback function which executes when the window is in focus again
	 * @param autoPlayFn A callback function which executes when any arrow key is pressed
	 */
	function InputInterface(pauseFn, resumeFn, autoPlayFn){

		var arrowKeys = [37, 38, 39, 40],	// Key codes for the arrow keys on a keyboard
			listening = false,				// Listening right now for key strokes etc?
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
				window.addEventListener("blur", pauseFn, true);
				window.addEventListener("focus", resumeFn, true);
				listening = true;
			}
		};

		// Stop listening for events. Typically called at game end
		this.stopListening = function(){
			if (listening) {
				window.removeEventListener("keydown", handleKeyPress, true);
				window.removeEventListener("blur", pauseFn, true);
				window.removeEventListener("focus", resumeFn, true);
				listening = false;
			}
		};

		/**
		 * Private methods below
		 */

		var handleKeyPress = function(event){
			// If the key pressed is an arrow key
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
			// Call the auto play function
			autoPlayFn();
		};
	}

	/**
	 * GRID OBJECT
	 *
	 * This object holds the properties of the grid.
	 */
	function Grid(width, height) {
		this.width = width;
		this.height = height;
	}

	/**
	 * VIEW OBJECT
	 *
	 * This object is responsible for drawing the objects to the screen.
	 * It uses the HTML5 Canvas element for drawing.
	 */
	function View(parentElement, backgroundColor) {
		var playField,			// The DOM <canvas> element
			ctx,				// The canvas context
			snakeThickness;		// The thickness of the snake in pixels

		this.initPlayField = function(){
			snakeThickness = length(0.9);

			playField = document.createElement("canvas");
			playField.setAttribute("id", "snake-js");
			playField.setAttribute("width", config.gridWidth * config.pointSize);
			playField.setAttribute("height", config.gridHeight * config.pointSize);
			parentElement.appendChild(playField);
			ctx = playField.getContext("2d");
		};

		this.drawPoint = function(point, color){

			ctx.fillStyle = color || "white";

			var left = point.left * config.pointSize;
			var top = point.top * config.pointSize;

			ctx.fillRect(left, top, config.pointSize, config.pointSize);
		};

		this.drawPoints = function(points, color){
			for (i in points) {
				this.drawPoint(points[i], color);
			}
		};

		// Draw the snake to screen
		this.drawSnake = function(snake, color){

			// If there is only one point
			if (snake.points.length === 1) {
				var position = getPointPivotPosition(snake.points[0]);

				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.arc(position.left, position.top, snakeThickness/2, 0, 2*Math.PI, true);
				ctx.fill();
			}
			else {
				// Prepare drawing
				ctx.strokeStyle = color;
				ctx.lineWidth = snakeThickness;
				ctx.lineJoin = "round";
				ctx.lineCap = "round";
				
				// Bein path drawing.
				ctx.beginPath();
				
				// Loop over the points, beginning with the head
				for (var i = 0; i < snake.points.length; i++) {
	
					// Short name for the point we're looking at now
					var currentPoint = snake.points[i];
	
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
						var prevPoint = snake.points[i-1];
	
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
			}

			// Draw the eye of the snake
			drawEye(snake, snake.direction);
		};

		this.drawCandy = function(point, color){

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
					config.gridWidth * config.pointSize,
					config.gridHeight * config.pointSize);
		};

		// Draw the eye of the snake
		var drawEye = function(snake) {
			var head = snake.points[0];
			var headPosition = getPointPivotPosition(head);

			// Imagine the snake going from right to left.
			// These values determine how much to the left and top the eye's pivot point is adjusted.
			var offsetLeft = length(0.125);
			var offsetTop = length(0.15);

			// Place the eye's pivot point differentely depending on which direction the snake moves
			switch (snake.direction){
			case constants.DIRECTION_LEFT:
				headPosition.left -= offsetLeft;
				headPosition.top -= offsetTop;
				break;
			case constants.DIRECTION_RIGHT:
				headPosition.left += offsetLeft;
				headPosition.top -= offsetTop;
				break;
			case constants.DIRECTION_UP:
				headPosition.left -= offsetTop;
				headPosition.top -= offsetLeft;
				break;
			case constants.DIRECTION_DOWN:
				headPosition.left += offsetTop;
				headPosition.top += offsetLeft;
				break;
			}

			// If the snake is still alive draw a circle
			if (snake.alive) {
				ctx.beginPath();
				ctx.fillStyle = "#fff";
				// Draw the circle
				ctx.arc(headPosition.left, headPosition.top, length(0.125), 0, Math.PI*2, true);
				// And fill it
				ctx.fill();
			}
			// If the snake is dead, draw a cross
			else {
				ctx.beginPath();
				ctx.strokeStyle = "#fff";
				ctx.lineWidth = 2;
				ctx.moveTo(headPosition.left - length(0.1), headPosition.top - length(0.1));
				ctx.lineTo(headPosition.left + length(0.1), headPosition.top + length(0.1));
				ctx.moveTo(headPosition.left + length(0.1), headPosition.top - length(0.1));
				ctx.lineTo(headPosition.left - length(0.1), headPosition.top + length(0.1));
				ctx.stroke();
			}
		};

		// Short name to scale a length relative to config.pointSize
		var length = function(value){
			return value * config.pointSize;
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
			// Create a fake end point outside the grid, next to p1
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
		this.direction = constants.DEFAULT_DIRECTION;
		this.points = [];
		this.fatness = 0;
		this.alive = true;

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
	 * A point has a place in the grid and can be passed
	 * to View for drawing.
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

	if (config.autoInit) {
		this.init();
	}
};
