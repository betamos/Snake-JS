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
		autoInit : true,					// Game inits automagically
		gridWidth : 30,						// Width of the game grid
		gridHeight : 20,					// Height of the game grid
		frameInterval : 150,				// Milliseconds between frames (@todo change to speed?)
		pointSize : 16,						// Size of one grid point
		backgroundColor : "white",			// Color of the background. CSS3 color values
		snakeColor : "#4b4312",				// Color of the snake
		snakeEyeColor : "white",			// Color of the snake's eye
		candyColor : "#b11c1c",				// Color of the candy
		shrinkingCandyColor : "#199C2C",	// Color of the special candy that shrinks
		scoreBoardColor : "#c0c96b",		// Color of the score board
		scoreTextColor : "#4b4312",			// Color of the score numbers on the score board
		collisionTolerance : 1				// Still frames before collision. More = easier
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
		INITIAL_SNAKE_GROWTH_LEFT : 6,
		SCOREBOARD_HEIGHT : 20,
		CANDY_REGULAR : 1,
		CANDY_MASSIVE : 2,
		CANDY_SHRINKING : 3
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

	this.getHighScore = function(){
		return engine.getHighScore();
	};

	/**
	 * GAME MODEL OBJECT
	 *
	 * This object is doing the game logic, frame management etc.
	 */
	function Engine(parentElement) {
		
		var snake,					// The snake itself
			candy,					// The candy which the snake eats
			view,					// The view object which draws the points to screen
			inputInterface,			// Responsible for handling input from the user
			grid,					// The grid object
			currentState,			// Possible values are found in constants.STATE_*
			frameIntervalId,		// The ID of the interval timer
			score,					// Player score
			highScore,				// Player highScore
			collisionFramesLeft;	// If the snake collides, how many frames are left until death

		this.initGame = function(){

			view = new View(parentElement, config.backgroundColor);
			inputInterface = new InputInterface(this.pauseGame, this.resumeGame, startMoving);

			snake = new Snake();
			grid = new Grid(config.gridWidth, config.gridHeight);
			score = 0;
			highScore = score;

			// Create snake body
			snake.points.push(randomPoint(grid));
			snake.growthLeft = constants.INITIAL_SNAKE_GROWTH_LEFT;

			candy = randomCandy();

			view.initPlayField();
			drawCurrentScene();
			inputInterface.startListening();
			currentState = constants.STATE_READY;
		};

		this.pauseGame = function(){
			if (currentState === constants.STATE_PLAYING) {
				clearInterval(frameIntervalId);
				currentState = constants.STATE_PAUSED;
			}
		};

		this.resumeGame = function(){
			if (currentState === constants.STATE_PAUSED) {
				frameIntervalId = setInterval(nextFrame, config.frameInterval);
				currentState = constants.STATE_PLAYING;
			}
		};

		this.getHighScore = function(){
			return highScore;
		};

		/**
		 * Private methods below
		 */

		// Play a game over scene and restart the game
		var gameOver = function(){
			currentState = constants.STATE_GAME_OVER;
			clearInterval(frameIntervalId);

			// Remove one point from the snakes tail and recurse with a timeout
			var removeTail = function(){
				if (snake.points.length > 1) {
					snake.points.pop();
					drawCurrentScene();
					setTimeout(removeTail, config.frameInterval/4);
				}
				else
					setTimeout(resurrect, config.frameInterval * 10);
			};

			var resurrect = function (){
				score = 0;
				snake.growthLeft = constants.INITIAL_SNAKE_GROWTH_LEFT;
				snake.alive = true;
				drawCurrentScene();
				currentState = constants.STATE_READY;
			};

			setTimeout(removeTail, config.frameInterval * 10);
		};

		var startMoving = function(){
			if (currentState === constants.STATE_READY) {
				frameIntervalId = setInterval(nextFrame, config.frameInterval);
				currentState = constants.STATE_PLAYING;
			}
		};

		// Calculates what the next frame will be like and draws it.
		var nextFrame = function(){

			// If the snake can't be moved in the desired direction due to collision
			if (!moveSnake(inputInterface.lastDirection())) {
				if (collisionFramesLeft > 0) {
					// Survives for a little longer
					collisionFramesLeft--;
					return;
				}
				else {
					// Now it's dead
					snake.alive = false;
					// Draw the dead snake
					drawCurrentScene();
					// And play game over scene
					gameOver();
					return;
				}
			}
			// It can move.
			else
				collisionFramesLeft = config.collisionTolerance;

			if (!candy.age())
					// The candy disappeared by ageing
					candy = randomCandy();

			// If the snake hits a candy
			if(candy.point.collidesWith(snake.points[0])) {
				eatCandy();
				candy = randomCandy();
			}

			drawCurrentScene();
		};

		var drawCurrentScene = function() {
			// Clear the view to make room for a new frame
			view.clear();
			// Draw the objects to the screen
			view.drawSnake(snake, config.snakeColor);
			view.drawCandy(candy);
			view.drawScore(score, highScore);
		};

		// Move the snake. Automatically handles self collision and walking through walls
		var moveSnake = function(desiredDirection){
			var head = snake.points[0];

			// The direction the snake will move in this frame
			var newDirection = actualDirection(desiredDirection || constants.DEFAULT_DIRECTION);

			var newHead = movePoint(head, newDirection);

			if (!insideGrid(newHead, grid))
				shiftPointIntoGrid(newHead, grid);

			if (snake.collidesWith(newHead, true)) {
				// Can't move. Collides with itself
				return false;
			}

			snake.direction = newDirection;
			snake.points.unshift(newHead);

			if (snake.growthLeft >= 1)
				snake.growthLeft--;
			else
				snake.points.pop();
			
			return true;
		};

		var eatCandy = function(){
			score += candy.score;
			highScore = Math.max(score, highScore);
			snake.growthLeft += candy.calories;
		};

		var randomCandy = function() {
			// Find a new position for the candy, and make sure it's not inside the snake
			do {
				var newCandyPoint = randomPoint(grid);
			} while(snake.collidesWith(newCandyPoint));
			// Gives a float number between 0 and 1
			var probabilitySeed = Math.random();
			if (probabilitySeed < 0.75)
				var newType = constants.CANDY_REGULAR;
			else if (probabilitySeed < 0.95)
				var newType = constants.CANDY_MASSIVE;
			else
				var newType = constants.CANDY_SHRINKING;
			return new Candy(newCandyPoint, newType);
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
	 * SNAKE OBJECT
	 *
	 * The snake itself...
	 */
	function Snake() {
		this.direction = constants.DEFAULT_DIRECTION;
		this.points = [];
		this.growthLeft = 0;
		this.alive = true;

		// Check if any of this objects points collides with an external point
		// Returns true if any collision occurs, false otherwise
		// @param simulateMovement boolean Simulates the removal of the end point
		// This addresses a bug where the snake couldn't move to a point which
		// is not currently free, but will be in the next frame
		this.collidesWith = function(point, simulateMovement){
			if (simulateMovement && this.growthLeft === 0)
				// Now th
				range = this.points.length - 1;
			else
				range = this.points.length;
			for (var i = 0; i < range; i++) {
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
	 * CANDY OBJECT
	 * 
	 * @param point The point object which determines the position of the candy
	 * @param type Any type defined in constants.CANDY_*
	 */
	function Candy(point, type){
		this.point = point,
		this.type = type,
		this.score,			// Increment in score when eaten by snake
		this.calories,		// How much growth the snake gains if it eats this candy
		this.radius,		// Radius of the candy, relative to config.pointSize
		this.color,			// Color of the candy
		this.decrement,		// If greater than 0, the radius of the candy will shrink...
		this.minRadius;		// until it reaches this minimum value. Then it will disappear

		switch (type) {
		case constants.CANDY_REGULAR:
			this.score = 5;
			this.calories = 3;
			this.radius = 0.3;
			this.color = config.candyColor;
			break;
		case constants.CANDY_MASSIVE:
			this.score = 15;
			this.calories = 5;
			this.radius = 0.45;
			this.color = config.candyColor;
			break;
		case constants.CANDY_SHRINKING:
			this.score = 50;
			this.calories = 0;
			this.radius = 0.45;
			this.color = config.shrinkingCandyColor;
			this.decrement = 0.008;
			this.minRadius = 0.05;
			break;
		}

		// Shrinks a CANDY_SHRINKING candy. Returns false if candy is below minRadius
		this.age = function(){
			// Currently only CANDY_SHRINKING reacts to ageing
			if (this.type === constants.CANDY_SHRINKING) {
				this.radius -= this.decrement;
				if (this.radius < this.minRadius)
					return false;
				else
					return true;
			}
			else
				return true;
		};
	};
	
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
			playField.setAttribute("height", config.gridHeight * config.pointSize + constants.SCOREBOARD_HEIGHT);
			parentElement.appendChild(playField);
			ctx = playField.getContext("2d");
			// Translate the coordinates so that we don't need to care about the scoreboard
			// when we draw all the other stuff
			ctx.translate(0, constants.SCOREBOARD_HEIGHT);
		};

		// Draw the snake to screen
		this.drawSnake = function(snake, color){

			// If there is only one point
			if (snake.points.length === 1) {
				var position = getPointPivotPosition(snake.points[0]);

				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.arc(position.left, position.top, snakeThickness/2, 0, 2*Math.PI, false);
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

		this.drawCandy = function(candy){

			ctx.fillStyle = candy.color;

			var position = getPointPivotPosition(candy.point);

			ctx.beginPath();

			ctx.arc(position.left, position.top, length(candy.radius), 0, Math.PI*2, false);
			ctx.fill();
		};

		this.clear = function(color) {
			ctx.fillStyle = color || backgroundColor;
			ctx.fillRect(0, 0,
					config.gridWidth * config.pointSize,
					config.gridHeight * config.pointSize);
		};

		this.drawScore = function(score, highScore){
			// Translate to 0, 0 to draw from origo
			ctx.translate(0, -1 * constants.SCOREBOARD_HEIGHT);

			var bottomMargin = 5;
			var horizontalMargin = 4;

			// Draw the score board
			ctx.fillStyle = config.scoreBoardColor;
			ctx.fillRect(0, 0, config.gridWidth * config.pointSize, constants.SCOREBOARD_HEIGHT);

			// Prepare drawing text
			ctx.fillStyle = config.scoreTextColor;
			ctx.font = "bold 16px 'Courier new', monospace";

			// Draw score to the upper right corner
			ctx.textAlign = "right";
			ctx.fillText(score, config.gridWidth * config.pointSize - horizontalMargin, constants.SCOREBOARD_HEIGHT - bottomMargin);

			// Draw high score to the upper left corner
			ctx.textAlign = "left";
			ctx.fillText(highScore, horizontalMargin, constants.SCOREBOARD_HEIGHT - bottomMargin);

			// Translate back
			ctx.translate(0, constants.SCOREBOARD_HEIGHT);
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
				ctx.fillStyle = config.snakeEyeColor;
				// Draw the circle
				ctx.arc(headPosition.left, headPosition.top, length(0.125), 0, Math.PI*2, false);
				// And fill it
				ctx.fill();
			}
			// If the snake is dead, draw a cross
			else {
				ctx.beginPath();
				ctx.strokeStyle = config.snakeEyeColor;
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
					left : point.left * length(1) + length(.5),
					top : point.top * length(1) + length(.5)
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
				window.addEventListener("keydown", handleKeyDown, true);
				window.addEventListener("keypress", disableKeyPress, true);
				window.addEventListener("blur", pauseFn, true);
				window.addEventListener("focus", resumeFn, true);
				listening = true;
			}
		};

		// Stop listening for events. Typically called at game end
		this.stopListening = function(){
			if (listening) {
				window.removeEventListener("keydown", handleKeyDown, true);
				window.removeEventListener("keypress", disableKeyPress, true);
				window.removeEventListener("blur", pauseFn, true);
				window.removeEventListener("focus", resumeFn, true);
				listening = false;
			}
		};

		/**
		 * Private methods below
		 */

		var handleKeyDown = function(event){
			// If the key pressed is an arrow key
			if (arrowKeys.indexOf(event.keyCode) >= 0) {
				handleArrowKeyPress(event);
			}
		};

		var disableKeyPress = function(event){
			// If the key pressed is an arrow key
			if (arrowKeys.indexOf(event.keyCode) >= 0) {
				event.preventDefault();
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

	if (config.autoInit) {
		this.init();
	}
};
