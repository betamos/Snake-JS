Snake JS
========
Snake JS is a **one player simple 2D-game** written *purely in JavaScript* (without any frameworks). It is playable in modern web browsers. It is inspired by [the classical video game Snake][1] which could be played on some Nokia cell phones from the 90's.

Instructions
------------
To play the game, just open **examples/snake-js-example.html** in your favourite modern gecko- or webkit-based web browser like Firefox, Safari or Chrome.

If you want to include the game on your own site, follow these steps:

1.	Make sure to include snake-js.js and snake-js.css in the `<head>` section of the HTML file:  
`<link href="../snake-js.css" rel="stylesheet" />
<script src="../snake-js.js" type="text/javascript"></script>`
2.	Create a place for the game in the HTML tree:  
`<div id="parent"></div>`
3.	Since you need access to the DOM-tree you may want to create an event triggered function in your JavaScript code:  
`document.addEventListener("DOMContentLoaded", function() { ... }, true);`
4.	In this function, first retrieve the parent element (this is where the game will be played) as a DOM-node, preferrably by using  
`var parentElement = document.getElementById("parent");`
5.	Now create the game object and pass the element to the constructor:  
`var game = new SnakeJS(parentElement);`
6.	Play the game by calling the play method: `game.play();`

Check the example directory for sample implementations of the game. It also contains some information about changing game settings and how to use Snake JS properly with jQuery.

Oh, and please put a link to the [github project][3] if you make it pulic.

Purpose
-------
This purpose of Snake JS is (in this order)

1.	to explore, discuss and practise good OOP design,
2.	to do this in a simple and naked JavaScript-based environment
3.	to create a fun game.

The purpose is not to make the game cross-browser compatible. Hacks and inconsistensies are only applied when absolutely necessary.

Author and License
-----------
Originally Snake JS is written by [Didrik Nordström][2]. It is MIT licensed. Make sure to [follow the project on github][3].

[1]: http://en.wikipedia.org/wiki/Snake_(video_game)
[2]: http://betamos.se/
[3]: http://github.com/betamos/Snake-JS
