Snake JS
========
Snake JS is a **one player simple 2D-game** written *purely in JavaScript* (without any frameworks). It is playable in modern web browsers. It is inspired by [the classical video game Snake][1] which could be played on some Nokia cell phones from the 90's. It uses the HTML5 canvas element for rendering.

Demo
----
Play the game on my [personal website][4]. There is also a highscore feature there.

Instructions
------------
To play the game, just open **&lt;example.html&gt;** in your favourite modern gecko- or webkit-based web browser like Firefox, Safari or Chrome.

If you want to include the game on your own site, follow these steps:

First make sure to include **&lt;snake-js.js&gt;** in the `<head>` section of the HTML file:

	<script src="path/to/snake-js.js" type="text/javascript"></script>

Then create an element for the game somewhere in the HTML `<body>` section:  

	<div id="parent"></div>

Since you need access to the DOM-tree you may want to create an event triggered function in your JavaScript code. Put it in the head of your document or in a separate JavaScript file, but include or reference it **after** you reference **&lt;snake-js.js&gt;**:

	<script type="text/javascript">
	
	document.addEventListener("DOMContentLoaded", function() {
		var parentElement = document.getElementById("parent");
		var game = new SnakeJS(parentElement);
	}, true);
	
	</script>

In this function, first retrieve the **parent element** (this is where the game will be rendered) as a **DOM element**. Then create the `SnakeJS` object and pass the parent element to the constructor.

Check **&lt;example.html&gt;** for a sample implementation of the game. It also contains some information about changing game settings and how to use Snake JS properly with jQuery.

Oh, and please put a link to the [github project][3] if you make it pulic.

Purpose
-------
This purpose of Snake JS is (in this order)

1.	to explore, discuss and practise good OOP design
	in a simple and naked JavaScript-based environment,
2.	to adapt new web techniques, like the HTML5 canvas element
3.	to create an extremely entertaining game.

The purpose is **not** to make the game cross-browser compatible. Hacks and inconsistensies are only applied when absolutely necessary.

Currently Snake JS **does not work on Internet Explorer**. This is because IE is a **non-standards compliant browser** which does not support things like <code>DOMObject.addEventListener()</code>. IE is like a spoiled child, and I refuse to treat it differently. Partly because I don't want to bloat the code or use extrenal libraries and partly because I just don't feel for it.

Author and License
-----------
Originally Snake JS is written by [Didrik Nordström][2]. It is MIT licensed. Make sure to [follow the project on github][3].

[1]: http://en.wikipedia.org/wiki/Snake_(video_game)
[2]: http://betamos.se/
[3]: http://github.com/betamos/Snake-JS
[4]: http://betamos.se/bloggen/spela-snake-med-html5
