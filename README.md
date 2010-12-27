Snake JS
========
Snake JS is a **one player simple 2D-game** written *purely in JavaScript* (without any frameworks). It is playable in modern web browsers. It is inspired by the classical video game [Snake][1] which could be played on some Nokia cell phones from the 90's.

Instructions
------------
To just play the game, just open examples/snake-js-example.html in your favourite modern gecko- or webkit-based web browser like Firefox, Safari or Chrome.

If you want to include the game on your own site, follow these steps:
1. Make sure to include snake-js.js and snake-js.css in the \<head\> section of the HTML file.
2. In your own JavaScript code, get the parent element as a DOM-node, preferrably by using `var parent = document.getElementById("id-of-parent-element");`. If you are using jQuery, you can simply use a jQuery selector instead. *Since you need access to the DOM-tree you may want to place this code within an event triggered function like* `window.onload = function() { ... };`.
3. Now create the game object like so: `var game = new SnakeJS(parentElement);`. SnakeJS takes a second argument, which is a settings object. Check the example files for knowledge about these.
4. Play the game by calling the play method like so: `game.play();`.

Purpose
-------
This purpose of Snake JS is (in this order)
1. to explore, discuss and practise good OOP design,
2. to do this in a simple and naked JavaScript-based environment
3. to create a fun game.

The purpose is not to make the game cross-browser compatible. Hacks and inconsistensies are only applied when absolutely necessary.

The project
-----------
Originally Snake JS is written by [Didrik Nordström][2]. It is MIT licensed. Make sure to [follow the project on github][3].

[1] : http://en.wikipedia.org/wiki/Snake\_(video\_game)
[2] : http://betamos.se/
[3] : http://github.com/betamos/Snake-JS
