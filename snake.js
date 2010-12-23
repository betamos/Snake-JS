/**
 * Snake The Game
 * @author Didrik Nordström, didrik@betamos.se
 */

/**
 * MAIN GAME OBJECT
 *
 * Everything associated with the snake game should be encapsulated within
 * this namespace
 */
// Constructor maybe should contain setup config like $DOMCanvas etc...
function SnakeGame(jQ){
	var game = this;
	
	// @todo Check how to do it properly
	var $ = jQuery;
	if (typeof jQ != "undefined") {
		$ = jQ;
	}

    this.gameModel = new GameModel();
    this.snake = new Snake();
    this.canvas = new Canvas();
    this.inputInterface = new InputInterface(this.gameModel.constants.DIRECTION_RIGHT);
    
    this.config = {
		CANVAS_POINT_SIZE : 15,
		CANVAS_WIDTH : 40,
		CANVAS_HEIGHT : 30,
		FRAME_INTERVAL : 100
    };

    /**
     * GAME MODEL OBJECT
     *
     * This object is doing the game logic, frame management etc.
     */
    function GameModel() {
        this.constants = {
            DIRECTION_UP : 1,
            DIRECTION_RIGHT : 2,
            DIRECTION_DOWN : -1,
            DIRECTION_LEFT : -2
        };
        
        this.initGame = function(){
            game.canvas.$DOMCanvas = $("#canvas");
            
            // Create snake body and assign it to the snake
            var snakeBody = [new Point(3, 4), new Point(3, 5), new Point(4, 5)];
            game.snake.snakeBody = snakeBody;
            
            game.canvas.initCanvas();
            game.canvas.renderSnake(game.snake.snakeBody);
            
            game.inputInterface.startListening();
            
            // @todo the timer should be in game config.
            setInterval(this.nextFrame, game.config.FRAME_INTERVAL);
            
        };
        
        this.nextFrame = function(){
        	var snake = game.snake;
        	var head = game.snake.getHeadPoint();
        	
        	// The direction the snake will move in this frame
        	var direction = actualSnakeDirection(game.snake.direction,
        			game.inputInterface.lastDirection);
        	
        	
        	var newHead = movePoint(head, direction);
        	
        	if (!insideCanvas(newHead, game.config.CANVAS_WIDTH, game.config.CANVAS_HEIGHT)){
        		shiftPointIntoCanvas(newHead);
        	}

        	// @todo also check if it enters itself, goes thru wall or catches candy?
        	// Separate to different local functions
        	
        	
        	game.snake.direction = direction;
        	
        	game.snake.addHeadPoint(newHead);
        	game.snake.removeTailPoint();
        	
        	// Render
        	game.canvas.clear();
        	game.canvas.renderSnake(game.snake.snakeBody);
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
        	switch (direction) {
        	case game.gameModel.constants.DIRECTION_LEFT:
        		newPoint = new Point(oldPoint.left-1, oldPoint.top);
        		break;
        	case game.gameModel.constants.DIRECTION_UP:
        		newPoint = new Point(oldPoint.left, oldPoint.top-1);
        		break;
        	case game.gameModel.constants.DIRECTION_RIGHT:
        		newPoint = new Point(oldPoint.left+1, oldPoint.top);
        		break;
        	case game.gameModel.constants.DIRECTION_DOWN:
        		newPoint = new Point(oldPoint.left, oldPoint.top+1);
        		break;
        	}
        	return newPoint;
        };
        
        // Shifts the points position so that it it is kept within the canvas
        // making it possible to "go thru" walls
        var shiftPointIntoCanvas = function(point){
        	point.left = shiftIntoRange(point.left, game.config.CANVAS_WIDTH);
        	point.top = shiftIntoRange(point.top, game.config.CANVAS_HEIGHT);
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
        var insideCanvas = function(point, canvasWidth, canvasHeight){
        	if (point.left < 0 || point.top < 0 ||
        		point.left >= canvasWidth || point.top >= canvasHeight){
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
    	var reservedKeys = [37, 38, 39, 40];
    	this.lastDirection = initialDirection;
    	this.startListening = function(){
    		$(window).keydown(handleKeyPress);
    	};
    	var handleKeyPress = function(event){
    		// If the key pushed is a reserved key
			if (reservedKeys.indexOf(event.keyCode) >= 0) {
    			switch (event.keyCode) {
    				case 37:
    					game.inputInterface.lastDirection = game.gameModel.constants.DIRECTION_LEFT;
    					break;
    				case 38:
    					game.inputInterface.lastDirection = game.gameModel.constants.DIRECTION_UP;
    					break;
    				case 39:
    					game.inputInterface.lastDirection = game.gameModel.constants.DIRECTION_RIGHT;
    					break;
    				case 40:
    					game.inputInterface.lastDirection = game.gameModel.constants.DIRECTION_DOWN;
    					break;
    			}
    			return false;
			}
    	};
    }

    /**
     * CANVAS OBJECT
     *
     * This object is responsible for rendering the view to screen.
     */
    function Canvas() {
        this.points = [];
        this.$DOMCanvas = null;
        this.renderSnake = function(points){
        	
        	// @todo check that it's not outside canvas
        	var $DOMSnake = $("<div />").addClass("snake");
        	
        	for (i in points) {
        		
        		var $DOMPoint = $("<div />").addClass("point");
        		
        		$DOMPoint.css({
        			left : (points[i].left * game.config.CANVAS_POINT_SIZE) + "px",
        			top : (points[i].top * game.config.CANVAS_POINT_SIZE) + "px"
        		});
        		
        		$DOMSnake.append($DOMPoint);
        		
        	}
        	
        	this.$DOMCanvas.append($DOMSnake);
        };
        
        this.initCanvas = function(){
        	this.$DOMCanvas.css({
        		position : "relative",
        		width : (game.config.CANVAS_WIDTH * game.config.CANVAS_POINT_SIZE) + "px",
        		height : (game.config.CANVAS_HEIGHT * game.config.CANVAS_POINT_SIZE) + "px",
        		backgroundColor : "#000"
        	});
        };
        
        this.clear = function() {
        	this.$DOMCanvas.empty();
        };
    }

    /**
     * SNAKE OBJECT
     *
     * The snake itself...
     */
    function Snake() {
        this.direction = game.gameModel.constants.DIRECTION_RIGHT;
        this.snakeBody = [];
        this.pointCount = 0;
        
        this.getHeadPoint = function(){
        	return this.snakeBody[0];
        };
        
        // Adds a point to the beginning of the snake's body (a head)
        this.addHeadPoint = function(point){
            this.snakeBody.unshift(point);
            this.pointCount++;
        };
        
        // Removes the last point in the snakes body
        // Returns true if success, false otherwise
        this.removeTailPoint = function(){
            if (this.pointCount > 1) {
                this.snakeBody.pop();
                this.pointCount--;
                return true;
            }
            else {
                return false;
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
        this.collides = function(otherPoint){
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



// @todo the constructor should probably take some arguments
// like pointsize, canvaswidth and height and the DOM element
// for the game itself.


$(document).ready(function(){
    var game = new SnakeGame();
    
    // @todo maybe game.play() ?
    game.gameModel.initGame();
});

function log(o) {
  console.log(o);
}