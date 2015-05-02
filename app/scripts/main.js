'use strict';
(function($){
	$(document).ready(function(){
		$('.card').on('click', function(){
			$(this).toggleClass('face back');
		});
	});
})(jQuery);