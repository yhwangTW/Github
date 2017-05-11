$(document).bind("mobileinit", function(){
    $.mobile.notesdb = openDatabase("NTUPSY", "1.0", "NTUPSY", 2*1024*1024);
    $.mobile.notesdb.transaction(function (t) {
	    t.executeSql("CREATE TABLE IF NOT EXISTS PSY (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,details TEXT NOT NULL, created TEXT NOT NULL, updated TEXT, latitude REAL, longitude REAL);");			
		
	    //t.executeSql('DROP TABLE PSY');    
		//localStorage.removeItem("loaddata")
		
		if (isLoadData==null){  
			localStorage.setItem("loaddata",true); 
  			
			$.each(PSYCC, function(InfoIndex, Info) { 
				var title = Info["title"];
				var details = Info["details"];
				var lat = Info["latitude"];
				var lng = Info["longitude"];
				t.executeSql('INSERT into PSY(title, details, created, latitude, longitude) VALUES (?,?,date("now"),?,?);',[title, details, lat, lng]);
		    })
		}
    });	
});

$(function(){
	$('#new').bind('pageshow', getLocation);     
	$("#home").bind("pageshow", getTitles);     
	$("#btn_insert").bind("click", insertItem); 
	$("#editItem").bind("click", editItem);      
	$("#delete").bind("click", deleteItem);      
	$("#update").bind("click", updateItem);      
	$("#btn_showmap2").bind("click", showmap);   
	$("#btn_showhome1").bind("click", showhome); 
	$('#btn_route').bind('click', Route);        
	$('#btn_search').bind('click', SearchFor);   
	$("#end").bind("click", runEnd);             
	$("#display").bind("pageshow", getLocation); 
	$('#mappage').bind('pageshow', getMap);      
});

var gmap;       
var map_div;     
var opts=[];    
var infowindow;  
var PSYNote={lat:null, lng:null, limit:-1}; 
var isLoadData;
var CurrentGeoPoint={lat:null, lng:null };   

PSYNote.lat=localStorage.getItem("lat"); 
PSYNote.lng=localStorage.getItem("lng");

isLoadData=localStorage.getItem("loaddata");

if (PSYNote.lat==null || PSYNote.lng==null ){
	PSYNote.lat=25.020113;  
	PSYNote.lng=121.540246;
	localStorage.setItem("lat",PSYNote.lat); 
    localStorage.setItem("lng",PSYNote.lng);
}

function getMap() {  
   
	var marker=[];
	map_div = document.getElementById("map_div");
	var latlng = new google.maps.LatLng(PSYNote.lat,PSYNote.lng); 
	gmap = new google.maps.Map(map_div, {
		zoom:15,
		center: latlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	});   
	
	$.mobile.notesdb.transaction(function(t) {
	    t.executeSql("SELECT id, title,details,latitude,longitude FROM PSY ORDER BY id DESC LIMIT ?", [PSYNote.limit], function(t, result) {
		var len = result.rows.length, row,i;
		if (len > 0 ) {			
			for (i = 0; i < len; i += 1) {
				row = result.rows.item(i);					
								
				var latlng = new google.maps.LatLng(row.latitude,row.longitude);
				
				var mess=row.title + "</br>" + row.details;
				marker[i] = new google.maps.Marker({
				    position: latlng,
				    map: gmap,
					icon: "images/mapmarker.png",
				    title: mess
				});	
				
				google.maps.event.addListener(marker[i], "click", function(event) {	
									
					var lat=event.latLng.lat();  
					var lng=event.latLng.lng(); 
					
					$.mobile.notesdb.transaction(function(t) {			
						t.executeSql("SELECT id, title,details,latitude,longitude FROM PSY ORDER BY id DESC LIMIT ?",
						 [PSYNote.limit], function(t, result2) {
							
							if (result2.rows.length>0){  					  
								for (j= 0; j < result2.rows.length; j += 1) {
									 var row = result2.rows.item(j);
									 var disp=getDistance(lat,lng,row.latitude,row.longitude); 
									 
									 var showdata='<div class="title"><a onclick="displayNote(' +                                         "'" + row.id + "');" + '">' + row.title + '</a></div>'
									  
									 if (disp<0.001) { 
										 infowindow = new google.maps.InfoWindow({   
											 content: showdata
										 });
										 infowindow.open(gmap,marker[j]);
										 
										 j=	result2.rows.length+1;i=len+1; 		
									 } 
								 }    
							 }         
						})				
					});	   	
				});	
			 }      
		  } 
	  });   
   });       
}            


function getTitles() {
	var listTitle = $("#recent");
	var items = [];
	$.mobile.notesdb.transaction(function(t) {
		t.executeSql("SELECT id, title,details,latitude,longitude FROM PSY ORDER BY id DESC LIMIT ?", [PSYNote.limit], function(t, result) {			    
				var i, len = result.rows.length,row;
				if (len > 0 ) {
					for (i = 0; i < len; i += 1) {
						row = result.rows.item(i);
					    items.push("<li><a href='#display' data-trnote='" + row.id + "'>"
						 + row.title + "</a></li>");						
					}
					listTitle.html(items.join('\n'));
					listTitle.listview("refresh");
								
					$("a",listTitle).bind("click", function(e) {					
						getItem($(this).attr("data-trnote"));
					});
			    }
		 })	 
	}); 
}


function getItem(id) {
	$.mobile.notesdb.transaction(function(t) {		
		t.executeSql("SELECT * FROM PSY WHERE id = ?", [id], function(t, result) {
			var row = result.rows.item(0), created = convertDateToMDY(row.created),	updated = row.updated;
			$("#display h1").text(row.title);
			$("#showdetail").html("<p>" + row.details + "</p>");
			if (row.latitude != null && row.longitude != null) {				
				opts.title = row.title;
				opts.lat = row.latitude;
				opts.lng = row.longitude;
				$("#btn_showmap3").unbind("click"); 
				$("#btn_showmap3").click(opts, displayMap);
			}
			$("#createtime").html("建立時間：" + created);
			if (updated != null){
				updated = convertDateToMDY(updated);
				$("#updatetime").html("更新時間：" + updated );
			}
			$("#delete, #update").attr("data-trnote", id);
			$("#title2").val(row.title);
			$("#details2").val(row.details);
			$("#latitude2").val(row.latitude);
			$("#longitude2").val(row.longitude);
		})
	});
}

function showmap() { 
	$.mobile.changePage("#mappage", "slide", false, true);	
	e.preventDefault();  
}

function showhome() {  
	$.mobile.changePage("#home", "slide", false, true);	
	e.preventDefault();  
}

function displayNote(id) { 
	infowindow.close();    
	$.mobile.changePage("#display", "slideup", false, true);	
	getItem(id);  
}

function editItem() {  
	$.mobile.changePage("#editNote", "slideup", false, true);
}

function insertItem(e) { 
	var title = $("#title").val();
	var details = $("#details").val();
	var lat=$("#latitude").val();
	var lng=$("#longitude").val();
   	
	if (title==""){
		alert("必須輸入誰是天才!");
		$("#title").focus();
		return false;
		e.preventDefault();	
	}else if (details==""){
		alert("必須輸入天才背景!");
		$("#details").focus();
		return false;
		e.preventDefault();		
	}else{
		$.mobile.notesdb.transaction(function(t) {
			t.executeSql('INSERT into PSY(title, details, created, latitude, longitude) VALUES (?,?,date("now"),?,?);',
			[title, details, lat, lng],
			function() {
				$.mobile.changePage("#home", "slide", false, true);	
				$("#title").val("");
				$("#details").val("");
				$("#latitude").val("");
				$("#longitude").val("");
			}, 
			null);
		});
		e.preventDefault();
	}
};

function updateItem(e) {  
	var title = $("#title2").val();
	var details = $("#details2").val();
	var	id = $(this).attr("data-trnote");
	var	latitude = $("#latitude2").val();
	var	longitude = $("#longitude2").val();
	$.mobile.notesdb.transaction(function(t) {
		t.executeSql('UPDATE PSY SET title = ?, details = ?, updated = date("now"), latitude=?, longitude=? WHERE id = ?',
		    [title, details, latitude, longitude, id],
			$.mobile.changePage("#home", "flip", false, true),
			null);
	});
	e.preventDefault();
}

function deleteItem(e) {  
	var flagConfirm=confirm("是否確定刪除？"); 
	if(flagConfirm) { 
		var id = $(this).attr("data-trnote");
		$.mobile.notesdb.transaction(function(t) {
			t.executeSql("DELETE FROM PSY WHERE id = ?", [id],
			$.mobile.changePage("#home", "slide", false, true),	null);
		});
		e.preventDefault();
	}
}

function displayMap(e) {  
	PSYNote.lat=e.data.lat;  
	PSYNote.lng=e.data.lng;
	showmap(); 
}

function getLocation() { 
	navigator.geolocation.getCurrentPosition(locSuccess, locFail, {enableHighAccuracy:true});
}

function locSuccess(position) {  
	$("#latitude").val(position.coords.latitude);
	$("#longitude").val(position.coords.longitude);
	CurrentGeoPoint.lat=position.coords.latitude; 
	CurrentGeoPoint.lng=position.coords.longitude;
    return true;
}

function locFail(error){    
	var message="無法取得 GPS 位置！";
	try{
		navigator.notification.alert(messqage, null, "Geolocation");
	}catch(e){
		alert(message);
	}
}

function convertDateToMDY(date) { 
	var d = date.split("-");
	return d[1] + "/" + d[2] + "/" + d[0];
};

function Route(){  
  
	var lat1 = CurrentGeoPoint.lat.toString();
	var lng1 = CurrentGeoPoint.lng.toString();
	var lat2=$("#latitude2").val().toString();
	var lng2=$("#longitude2").val().toString();
 	window.open("http://maps.google.com/maps?f=d&saddr=" + lat1 + "," + lng1 + "&daddr=" + lat2 +","+ lng2+ "&hl=zh-TW&ie=UTF8");
}

function SearchFor(){ 
	var addr=$("#title2").val();
	window.open("http://www.google.com/search?hl=zh-TW&q=" + addr );
}

function runEnd() {
	var flagConfirm=confirm("確定要結束本應用程式嗎？"); 
	if(flagConfirm) { 
		navigator.app.exitApp();
	}
}

