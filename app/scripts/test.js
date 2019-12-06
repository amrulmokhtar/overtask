/*
$("#openHowItWorks").click(function(){
	console.log("how it works");
	$(document.body).toggleClass("cbp-spmenu-push-toleft");
    $("#rightmenu").toggleClass("cbp-spmenu-open");
    
   $(".overlay, #howitworks").fadeToggle();
   
   console.log("document height: " + $(document).height());
   
   $(".overlay").css({
	    "height":$(document).height(),
	    "width":$(document).width()
	});
});

$("#closeHowItWorks").click(function(){
	console.log("closing how it works");
	
	console.log("how it works");
	$(document.body).toggleClass("cbp-spmenu-push-toleft");
    $("#rightmenu").toggleClass("cbp-spmenu-open");
    
   $(".overlay, #howitworks").fadeToggle();
});

$(".right").click(function(){
    $(document.body).toggleClass("cbp-spmenu-push-toleft");
    $("#rightmenu").toggleClass("cbp-spmenu-open");
});

$("#openclose").click(function(){
	if($("#openclose").hasClass("menuopen")){
		$("#openclose").toggleClass("menuopen");
		$("#openclose").attr("src","../images/open.png");
	}
	else{
		$("#openclose").attr("src","../images/close.png");
		$("#openclose").toggleClass("menuopen");
	}
	
});

$("#AddPeople").focus(function(){
	console.log("add contact");
	$("ul.searchcontact").show();
});

*/

//$(document).ready( function(){

        
  $(".right").click(function(event){
    event.stopPropagation();
    $(document.body).toggleClass("cbp-spmenu-push-toleft");
      $("#rightmenu").toggleClass("cbp-spmenu-open");
      //$("#rightmenu").toggleClass("isOpen");
      console.log("Clicked");
  });

  /*
  $("#edittaskbtn").on('click', function () {
      $('#socialshare').collapse('toggle');
      console.log("edittask clicked");
  });*/
  
  $('#main').click(function() {
    $("#rightmenu").removeClass("cbp-spmenu-open");
  });
  $('#sidebar').click(function() {
    $("#rightmenu").removeClass("cbp-spmenu-open");
  });
  $('#nav').click(function() {
    $("#rightmenu").removeClass("cbp-spmenu-open");
  });

//});