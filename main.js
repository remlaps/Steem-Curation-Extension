console.log("The extension is up and running");

const highLight = () => {
	
	var curatorBackgroundColor;
	const listItem = document.querySelectorAll('li');
	console.log("Highlight()");

	for (let i=listItem.length-1; i>=0; i--) {
		if ( listItem[i].textContent.match('null: .*%' ) && listItem[i].textContent.match('Promotion Cost .*\$') ) {
			console.log("Found a /promoted post in #burnsteem25 (outer block)");
			curatorBackgroundColor = '#1E90FF';
			listItem[i].style['background-color'] = curatorBackgroundColor;
		} else if ( listItem[i].textContent.match('null: .*%' )) {
			console.log("#burnsteem25 outer match: ");
			if ( listItem[i].textContent.match('^null:.*\%') ) {
				console.log("Found #burnsteem25");
				var str = listItem[i].textContent;
				var nullPct = str.substring(
					str.indexOf(" ") + 1, 
					str.lastIndexOf("%")
				);
				if ( nullPct > 0 && nullPct < 25 ) {
					curatorBackgroundColor = "coral";
				} else if ( nullPct < 50 ) {
					curatorBackgroundColor = "orange";
				} else if ( nullPct < 75 ) {
					curatorBackgroundColor = "darkorange";
				} else if ( nullPct > 0 ) {
					curatorBackgroundColor = "orangered";
				}
			}
			listItem[i].style['background-color'] = curatorBackgroundColor;
		} else if ( listItem[i].textContent.match('Promotion Cost .*\$') ) {
			console.log("Found a /promoted post (outer block)");
			
			if ( listItem[i].textContent.match('^Promotion Cost .*\$$') ) {
				console.log("Found a /promoted post");
				var str = listItem[i].textContent;
				var promoAmount = str.substring(
					str.indexOf("$") + 1, 
					str.length
				);
				console.log ("Promotion amount: " + promoAmount);
			
				if ( promoAmount > 0 && promoAmount < 0.26 ) {
					curatorBackgroundColor = "paleturquoise";
				} else if ( promoAmount < 0.51 ) {
					curatorBackgroundColor = "aquamarine";
				} else if ( promoAmount < 1.01 ) {
					curatorBackgroundColor = "turquoise";
				} else if ( promoAmount > 0 ) {
					curatorBackgroundColor = "lightseagreen";
				}
			}
			listItem[i].style['background-color'] = curatorBackgroundColor;
		} else {
			listItem[i].style['background-color'] = "initial";
		}
	}
}

highLight();
window.addEventListener('load', () => {
	console.log("Load event observed");
	highLight();
});
window.addEventListener('scroll', () => {
	console.log("Scroll event observed");
	highLight();
});
console.log("The extension is done.");