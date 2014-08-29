//Busco las variables de la URL con la función getVars() (definida más abajo)
var parameters = getVars();
// Variables Globales - Declaración
var	activeMedia,
	audios,
	authorizedToPlay = false,
	ek,
	gFlag = false,
	interval,
	interval_onYoutube,
	isPlaying = false,
	isPlayingType,
	wasPlayed = false,
	logBot,
	mainStage,
	noAudioDuration,
	otherId = '',
	presentation,
	sequenceId,
	setMainsOk,
	SId,
	sldId,
	sliderDuration,
	fs_sliderDuration,
	slides,
	speakerBefore = 0,
	str,
	sv,
	volumeControl,
	fs_volumeControl,
	video;

str = parameters.play;
ek = parameters.ek;

//Variables del escenario (datos de la presentacion)
var 	_PresentationUserId, _PresentationId, _PresentationCode, _PresentationTitle, _CategoriaId, _PresentationStatus, _PresentationActiveData,
	_PresentationCreatedDate, _PresentationKeepStyle, _PresentationDescription, _PresentationProperties, _PresentationLeaveOff, _PresentationSkip,
	PresentationSkipBackwards, _PresentationPlaySlide, _PresentationColorTemplate, _PresentationBackground, _PresentationAllowComment, _TopicId,
	_PresentationShowMsgAllQuizzesApprobed, _PresentationMessageAllQuizzesApprobed, _PresentationPlaySlideOnlyOneTime,
	_PresentationShowMsgPlaySlideOneTime, _PresentationMessagePlaySlideOneTime, _PresentationMsgQuizSurveyDone, _PresentationSurveyMandatory,
	_PresentationContactTrainer, _PresentationDeadline, _PresentationDeadlineDate, _PresentationDeadlineIsDate, _PresentationDeadlineDays,
	_PresentationReceiveEmail, _PresentationPorcentajeVisto, _PresentationCompartir, _PresentationKeyWord, _PresentationDescriptionLink,
	_PresentationSlideCoverId, _PresentationPlayPresAfterFinished, _PresentationActivityLog, _PresentationActivityLogLastDate, _PresentationAprobPerc,
	_PresentationAllQuizzesApprobed, _PresentationAprobQuiz, _PresentationAprobSurvey, _PresentationEvent;

var sort_by = function(field, reverse, pr){
   var k = pr ? 
       function(x) {return pr(x[field])} : 
       function(x) {return x[field]};

   reverse = [-1, 1][+!!reverse];

   return function (a, b) {
       return a = k(a), b = k(b), reverse * ((a > b) - (b > a));
     } 
}

function _userkeep(){
	$.ajax({
		type: "POST",
		url: "../../aws_userkeep.aspx"
	}).done(function(){
		console.log('userkeep excecuted succesfully');
	}).fail(function(){
		console.log('Fail to excecute userkeep');
	})
}

/*
Todo lo que está adentro de "$()" se ejecuta una vez que el DOM está listo para operar.
O sea, una vez que el HTML ya está generado. Así que todas las cargas y llamados a web services se
realizarán aquí adentro, para poder interactuar con los ID's fijos que están en las etiquetas HTML.
*/
$(function(){
	getPresentationMains(); 		//Buscar la cabecera de la presentación
	getSlides(); 				//busca los slides
	_setMains();				//Setea los datos iniciales
	setInterval(_userkeep,20000);
	var nextVal = 0;
	var inter = setInterval(function(){
		nextVal = nextVal + 33.3; //En cada intervalo sumo 33.3 al valor numérico
		if (nextVal > 100) {
			$("#loader").animate({top:"-100%"},1000);
			authorizedToPlay= true;
		}
		if(authorizedToPlay){
			/*Agrego listeners sobre los elementos*/

			sliderDuration 		= document.getElementById('currentVideoTimeSlider');	//elemento HTML que contiene el tiempo transcurrido del slide
			fs_sliderDuration 	= document.getElementById('fs_currentVideoTimeSlider');	//elemento HTML que contiene el tiempo transcurrido del slide
			mainStage 			= document.getElementById('stageMain');					//elemento HTML que contiene el stage principal en donde se carga el contenido
			volumeControl 		= document.getElementById('volumeControl');				//elemento HTML que controla el volúmen de los videos / audios.
			fs_volumeControl 	= document.getElementById('fs_volumeControl');			//elemento HTML que controla el volúmen de los videos / audios.

			sliderDuration.addEventListener('change',videoSeek,false);			//listener que escucha si hay cambios en sliderDuration y ejecuta "videoSeek()" si los hay
			fs_sliderDuration.addEventListener('change',videoSeek,false);		//listener que escucha si hay cambios en sliderDuration y ejecuta "videoSeek()" si los hay
			volumeControl.addEventListener('change',changeVolume,false);		//listener que escucha si hay cambios en volumeControl y ejecuta "changeVolume()" si los hay
			fs_volumeControl.addEventListener('change',fs_changeVolume,false);	//listener que escucha si hay cambios en volumeControl y ejecuta "changeVolume()" si los hay
			
			var primerSlide = $('#slides .listItem:first-child'); //busco el primer slide
			primerSlide.startSlide(); //inicio el primer slide
			clearInterval(inter);
		}
	},1000)

	/*Funciones jQuery*/

	//Disparo el evento "StartSlide" en el click de un slide en la lista.
	$('.listItem').click(function(){
		var slideNow = $('.active').attr('data-order');
		var slideNext = $(this).attr('data-order');
		//Si existe SKIP O SKIP BACKWARDS
		if(_PresentationSkip || _PresentationSkipBackwards){
			//ES SKIP?
			if(_PresentationSkip){
				//Verifico que NO tenga Survey y Eva Obligatorios
				if(_PresentationSurveyMandatory){
					var continua = 1;
					//Reviso si no existen survey/eva previos NO realizados
					$(this).siblings().each(function(){
						var sld = $(this);
						//Revisa si en los slides previos
						//de tipo Survey o Quiz
						//alguno NO está finalizado
						if ((sld.attr('data-order')<slideNext) && (sld.attr('data-slidetype')=='Survey' || sld.attr('data-slidetype')=='Quiz') && (sld.attr('data-aprobEstado')!=='F')){
							//NO puede reproducir, debe finalizar los surveys o evaluaciones
							new jBox('Notice',{
								content: 'The ' + sld.attr('data-slidetype') + ' ' + sld.attr('data-slidename') + ' must be answered in order to advance',
								color: 'red'
							});
							continua = 0;
						};
					});
					//PUede reproducir el slide.
					if (continua==1){
						$(this).startSlide();
					}
				}
				else{
					//Inicio el slide normalmente
					$(this).startSlide();
				}
			}else{
				//ES BACKWARDS
				//Si el slide que quiero reproducir está antes que el actual puedo reproducirlo
				if(slideNext < slideNow){
					$(this).startSlide();
				}else{
					//Si no está antes que el actual, puede ser el siguiente
					if(slideNext-1 == slideNow){
						//Si es el siguiente y ya fue reproducido
						if(wasPlayed==true && isPlaying==false){
							$(this).startSlide();
						}else{
							//Falta reproducir el actual para avanzar
							new jBox('Notice',{
								content: 'You must finish this slide in order to advance',
								color: 'red'
							});
						}
					} else{
						//Esta queriendo avanzar a un slide que no es el siguiente, sino que está más adelante.
						new jBox('Notice',{
							content: 'You are only allowed to return towards previously played slides',
							color: 'red'
						});
					}
				}
			}
		}else{
			//SI NO HAY NINGUN SKIP
			//SI ES EVALUACION O ENCUESTA
			if($(this).attr('data-slidetype')=='Survey' || $(this).attr('data-slidetype')=='Quiz'){
				//SI EL ACTUAL YA SE REPRODUJO
				if(wasPlayed==true && isPlaying==false){
					$(this).startSlide();
				}else{
					//DEBE TERMINAR EL ACTUAL PARA PODER AVANZAR
					new jBox('Notice', {
						content: 'The slide must finish in order to advance',
						color: 'red'
					});
				}
			}else{
				//ES VIDEO / IMAGEN
				//SI EL ACTUAL ESTÁ REPRODUCIENDOSE
				if(isPlaying){
					new jBox('Notice', {
						content: 'The slide must finish in order to advance',
						color: 'red'
					});
				}else{
					//SI YA FUE REPRODUCIDO
					if(wasPlayed){
						//SI ES EL SIGUIENTE
						if((slideNext-1)==slideNow){
							$(this).startSlide();
						}else{
							new jBox('Notice', {
								content: 'You can only play the next consecutive Slide',
								color: 'red'
							});
						}
					}else{
						new jBox('Notice', {
							content: 'You must first play this slide in order to advance',
							color: 'red'
						});
					}
					
				}
			}
		}
	});
	$('#next').click(function(){
		if(_PresentationSkip){
			nextSlide();
		}else{
			if(isPlaying){
				new jBox('Notice', {
					content: 'The slide must finish in order to advance',
					color: 'red'
				});
			}else{
				if(wasPlayed){
					nextSlide();
				}else{
					new jBox('Notice', {
						content: 'You must first play this slide in order to advance',
						color: 'red'
					});
				}
				
			}
		}
	}); //Disparo el evento NextSlide en el click de la flecha Next.
	$('#previous').click(function(){
		if(_PresentationSkip){
			previousSlide();
		}else{
			if(isPlaying){
				new jBox('Notice', {
					content: 'The slide must finish in order to go back',
					color: 'red'
				});
			}else{
				if(wasPlayed){
					previousSlide();
				}else{
					new jBox('Notice', {
						content: 'You must first play this slide in order to go back',
						color: 'red'
					});
				}
				
			}
		}
	}); //Disparo el evento PreviousSlide en el click de la flecha Previous
	$('#eva-next').click(function(){nextSlide();}); //Disparo el evento NextSlide en el click de la flecha Next.
	$('#eva-previous').click(function(){previousSlide();}); //Disparo el evento PreviousSlide en el click de la flecha Previous
})

//Función que setea los datos de la cabecera en el stage.
function _setMains(){
	//Si los datos fueron traidos correctamente
	if(setMainsOk){
		//Le pongo el titulo a la pestaña del navegador
		document.title = presentation.PresentationTitle+' | EntrenarSE - Online Training Platform';
		//me guardo el titulo de la presentación
		_PresentationTitle = presentation.PresentationTitle;
		//Me guardo el tipo de reproducción (Automatica o Manual)
		_PresentationPlaySlide = presentation.PresentationPlaySlide;
		//Guardo el ID de usuario
		_PresentationUserId = presentation.PresentationUserId;
		//Guardo el modo Skip de la presentacion
		_PresentationSkip = presentation.PresentationSkip;
		//Guardo el Skip Backwards
		_PresentationSkipBackwards = presentation.PresentationSkipBackwards;
		//Guardo el PresentationSurveyMandatory
		_PresentationSurveyMandatory = presentation.PresentationSurveyMandatory;
		//Muestro el titulo en el Stage
		$("#spanTitle").text(_PresentationTitle);
	}
}

//Función para ajustar el volumen
function changeVolume(){
	//la variable "video" es la variable global que contiene el video HTML5. ".volume" es el método que le aplica el nivel de volumen.
	//Como el volumen se mide en décimas entre 0 y 1 (0.1, 0.2, 0.3, etc...) al rango del slider (0-10) lo divido por 10 para obtener el volumen correcto.
	video.volume = volumeControl.value / 10;
	if(isPlayingType=='ytb'){
		video.setVolume(volumeControl.value);
	}
	//Le doy al otro control de volumen el mismo valor
	fs_volumeControl.value = volumeControl.value;
}
//Función para ajustar el volumen en Full Screen
function fs_changeVolume(){
	//la variable "video" es la variable global que contiene el video HTML5. ".volume" es el método que le aplica el nivel de volumen.
	//Como el volumen se mide en décimas entre 0 y 1 (0.1, 0.2, 0.3, etc...) al rango del slider (0-10) lo divido por 10 para obtener el volumen correcto.
	video.volume = fs_volumeControl.value / 10;
	if(isPlayingType=='ytb'){
		video.setVolume(fs_volumeControl.value);
	}
	//Le doy al otro control de volumen el mismo valor
	volumeControl.value = fs_volumeControl.value;
}

//Función para limpar el escenario y cargar contenido nuevo.
//Cada vez que se clickea un slide, primero se limpia el contenido que haya y después se carga lo nuevo
function cleanStage(){
	$("#stageMain").empty();
	$(".fullscreenControls").css('display','none');
	$(".imgSlide").css('position','relative');
	$(".imgSlide").css('z-index','');
}

// función que busca la cabecera de la presentación en la base de datos.
function getPresentationMains(){
	/*Consulta*/
	var url = '../../aws_getpresentation_mains.aspx'
	var request = new XMLHttpRequest();
	request.open("POST", url, false);
	request.setRequestHeader("str", str);
	request.setRequestHeader("key", ek);
	request.send();
	if (request.status == 200) {
		/*Consulta exitosa*/
		//Guardo en la variable "presentation" el array de datos en formato JSON
		presentation = $.parseJSON(request.responseText);
		//Los datos se trajeron bien así que guardo en True el flag "setMainsOk"
		setMainsOk = true; 
	}else{
		/*Consulta fallida*/
		loadingError(request.statusText);
	}
}

//Función que trae los slides de la base de datos
function getSlides(){
	/*Consulta*/
	var url = '../../aws_getpresentation_slides.aspx'
	var request = new XMLHttpRequest();
	request.open("POST", url, false);
	request.setRequestHeader("str", str);
	request.setRequestHeader("key", ek);
	request.send();
	if (request.status == 200) {
		/*Consulta exitosa*/
		//Guardo en "slides" el array de datos en formato JSON
		slides = $.parseJSON(request.responseText);

		slides.sort(sort_by('PlayListOrder', true, parseInt));
		//Inicio la lista de los slides
		var html = '<ol class="list">';
		for (var i = 0; i < slides.length; i++) {
			//Agrego cada slide a la lista con sus respectivos valores
			if(slides[i].SlideType=='youtube'){
				var dataLocation = slides[i].ExternalLocation;
			}else{
				var dataLocation = slides[i].SlideLocation;
			}
			html += '<li class="listItem" data-totalFrames="'+slides[i].TotalFrames+'" data-order="'+slides[i].PlayListOrder+'" data-resourcelocation="'+dataLocation+'" data-slideType="'+slides[i].SlideType+'" data-sldId="'+slides[i].PlayListSlideId+'" data-SId="'+slides[i].SId+'" data-trainer="'+slides[i].Speaker+'" data-aprobOK="'+slides[i].EvaAprobOK+'" data-aprobPercent="'+slides[i].EvaAprobPercent+'" data-aprobEstado="'+slides[i].EvaAprobEstado+'" data-slidename="'+slides[i].PlayListSlideName+'">'+slides[i].PlayListSlideName+'</li>';
		};
		//Cierro la lista de slides.
		html += '</ol>';
		//Asigno al contenedor la lista ya armada.
		$("#slides").html(html);
	}else{
		/*Consulta fallida*/
		loadingError(request.statusText);
	}
}

//Función que trae los speakers asociados a cada slide desde la base de datos.
function getSpeaker(speakerId){
	//Si el speaker no viene vacío
	if(speakerId!=0){
		//Controlo que el que estaba cargado antes no sea el mismo, si es el mismo no necesito cargar.
		if(speakerBefore!=speakerId){
			//Si son distintos me guardo en "before" el que voy a cargar ahora para tenerlo en el siguiente slide
			//y poder volver a comparar.
			speakerBefore = speakerId;
			//Consulto al servidor
			$.ajax({
				url: '../../aws_getpresentation_speaker.aspx',
				type: 'POST',
				headers: {
					'str':str,
					'key':ek,
					'speakerId': speakerId
				}
			}).done(function(data){
				var spk = $.parseJSON(data);

				var speakerName = spk.TrainerName+' '+spk.TrainerApellido;
				var speakerTitle = spk.TrainerTitle;
				var speakerBio = spk.TrainerBio;
				var speakerImg = spk.TrainerFotoURL;

				$("#speakerPhoto").html('<img alt="profile" src="'+speakerImg+'" />');
				$("#speakerName").text(speakerName);
				$("#speakerBio").text(speakerBio);
				$("#contactSpeakerTitle").text('Contact '+speakerName);
				$(".contactContainer").css('display','block');
			});
		}
	}else{
		//Si estoy aquí es porque el speaker para ese slide no estaba asignado. Muestro la foto de "Anonymous User"
		speakerBefore = 0;
		$("#speakerPhoto").html('<img alt="profile" src="img/avatar.png" />');
		$("#speakerName").text('Anonymous');
		$("#contactSpeakerTitle").css('display','none');
		$("#speakerBio").empty();
		$(".contactContainer").css('display','none');
	}
}

//Función para recuperar las variables de la URL
function getVars(){
	var url= location.search.replace("?", "");
	var arrUrl = url.split("&");
	var urlObj={};
	for(var i=0; i<arrUrl.length; i++){
		var x= arrUrl[i].split(":");
		urlObj[x[0]]=x[1];
	}
	//Este valor va a parar a la variable "parameters" en la primera línea del javascript
	return urlObj;
}

//Navegación de tabs del panel izquierdo
//Esta funcion se usa para cambiar entre el contenido de la presentacion, los commentarios y los handouts.
function goto(arg){
	//Ni bien se hace el click, oculto todos los tabs
	$("div.container#presentationContent").css('display','none');
	$("div.container#presentationComments").css('display','none');
	$("div.container#presentationDownloads").css('display','none');
	if(arg==1){
		//Si la selección fue 1, muestro los downloads
		$("div.container#presentationDownloads").css('display','block');
	}
	if(arg==2){
		//Si la selección fue 2, muestro los comments
		$("div.container#presentationComments").css('display','block');
	}
	if(arg==3){
		//Si la selección fue 3, muestro el contenido de la presentación (slides, speaker)
		//Esta es la selección por defecto
		$("div.container#presentationContent").css('display','block');
	}
}

//Funcion que se ejecuta para mostrar errores en la carga de datos.
function loadingError(errorMessage){
	alert('Error while loading the content: '+errorMessage);
}



//Pasar al siguiente slide.
function nextSlide(){
	//Busco el slide siguiente al seleccionado.
	var slideSiguiente = $("#slides").find("li.active").next();
	//Le doy ventaja de 1 segundo al browser para que se acomode y pase al siguiente slide.
	//Al slide siguiente que ya tengo en la variable, le asigno el método "startSlide()"
	window.setTimeout(function(){slideSiguiente.startSlide()},1000);
}

//Función para reproducir y detener el slide.
function playPause(){
	//Si "noAudioDuration" es cero, quiere decir que hay contenido multimedia (audio o video) para reproducir
	var volumen = document.getElementById('volumeControl');
	var slideId = $('#slides li.active').attr('data-sldId');
	//Si es video comun
	if(isPlayingType=='video'){
		video.volume = (volumen.value / 10);
		//Si el video está pausado/detenido
		if (video.paused){
			if(isPlaying){
				sendLog(slideId,'retake'); //Ejecuto AJAX que almacena los logs // Está retomando la reproducción.
			}else{
				sendLog(slideId,'startPlay'); //Ejecuto AJAX que almacena los logs // Esta iniciando la reproducción.
			}
			video.play(); //reproduzco
			isPlaying = true;
			$("#playPauseIcon").removeClass('fa-play').addClass("fa-pause"); //cambio el icono de play por el de pausa.
			$("#fs_playPauseIcon").removeClass('fa-play').addClass("fa-pause"); //cambio el icono de play por el de pausa.
			video.addEventListener('timeupdate',seekTimeUpdate,false); //Agrego un listener para ir actualizando el timer.
		} 
		else{
			//Si el video está reproduciendo
			//Detengo la recolección de logs.
			sendLog(slideId,'pause');
			video.pause(); //Pauso el video.
			$("#playPauseIcon").removeClass('fa-pause').addClass("fa-play"); //cambio el ícono de pausa a play neuvamente.
			$("#fs_playPauseIcon").removeClass('fa-pause').addClass("fa-play"); //cambio el ícono de pausa a play neuvamente.
		}
	}
	if(isPlayingType=='ytb'){
		video.setVolume(volumen.value);
		var updateYtbTime;
		if (video.getPlayerState() == 2 || video.getPlayerState() == -1 || video.getPlayerState() == 0){

			if(video.getPlayerState() == -1){
				sendLog(slideId,'startPlay'); //Ejecuto AJAX que almacena los logs // Esta iniciando la reproducción.
			}else if(video.getPlayerState() == 2){
				sendLog(slideId,'retake'); //Ejecuto AJAX que almacena los logs // Esta iniciando la reproducción.
			}

			video.playVideo(); //reproduzco
			isPlaying = true;
			$("#playPauseIcon").removeClass('fa-play').addClass("fa-pause"); //cambio el icono de play por el de pausa.
			$("#fs_playPauseIcon").removeClass('fa-play').addClass("fa-pause"); //cambio el icono de play por el de pausa.
			updateYtbTime = setInterval(
				function(){
					if(isPlayingType=='ytb'){
						
						var tiempo = video.getCurrentTime();
						var total = video.getDuration();

						sliderDuration.value = tiempo * (1000 / total);
						fs_sliderDuration.value = tiempo * (1000 / total);

						var curmins = Math.floor(tiempo / 60);
						var cursecs = Math.floor(tiempo - curmins * 60);
						var durmins = Math.floor(total / 60);
						var dursecs = Math.floor(total - durmins * 60);
						//Si son menores a 10, les agrego un cero adelante.
						if(cursecs < 10){ cursecs = "0"+cursecs; }
						if(dursecs < 10){ dursecs = "0"+dursecs; }
						if(curmins < 10){ curmins = "0"+curmins; }
						if(durmins < 10){ durmins = "0"+durmins; }
						//Genero los textos de los valores.
						var _curTime = curmins+":"+cursecs
						var _durTime = durmins+":"+dursecs
						//Los muestro en pantalla.
						$(".currentTime").text(curmins+":"+cursecs);
						$(".videoDuration").text(durmins+":"+dursecs);
					}
				},1000);
		} 
		else{
			//Si el video está reproduciendo
			sendLog(slideId,'pause'); //Detengo el log.
			video.pauseVideo(); //Pauso el video.
			$("#playPauseIcon").removeClass('fa-pause').addClass("fa-play"); //cambio el ícono de pausa a play neuvamente.
			$("#fs_playPauseIcon").removeClass('fa-pause').addClass("fa-play"); //cambio el ícono de pausa a play neuvamente.
			clearInterval(updateYtbTime);
		}
	}
}


//Función para reproducir el slide anterior.
function previousSlide(){
	var slideSiguiente = $("#slides").find("li.active").prev(); //busco el slide previo al activo.
	//Le doy ventaja de 1 segundo al browser para que se acomode y pase al slide anterior.
	//Al slide anterior que ya tengo en la variable, le asigno el método "startSlide()"
	window.setTimeout(function(){slideSiguiente.startSlide()},1000);
}

//Función que vuelve a cero los relojes e íconos para reproducir contenido nuevo.
function resetTimer(){
	/*Pongo los contadores en cero*/
	$(".currentTime").text("00:00");
	$(".videoDuration").text("00:00");
	/*Pongo la barra de progress en cero*/
	sliderDuration.value = 0;
	fs_sliderDuration.value = 0;
	/*Reseteo el boton de play para que muestre si o si Play*/
	$("#playPauseIcon").removeClass('fa-pause').addClass("fa-play");
}

//funcion que actualiza el tiempo de reproducción del video / audio
function seekTimeUpdate(){
	//"newTime" es el tiempo nuevo que tengo que mostrar.
	var newTime = video.currentTime * (1000 / video.duration);
	//Le paso el valor a la barra de progreso para que se actualice.
	sliderDuration.value = newTime;
	fs_sliderDuration.value = newTime;
	//Calculo los segundos y minutos que debo mostrar.
	var curmins = Math.floor(video.currentTime / 60);
	var cursecs = Math.floor(video.currentTime - curmins * 60);
	var durmins = Math.floor(video.duration / 60);
	var dursecs = Math.floor(video.duration - durmins * 60);
	//Si son menores a 10, les agrego un cero adelante.
	if(cursecs < 10){ cursecs = "0"+cursecs; }
	if(dursecs < 10){ dursecs = "0"+dursecs; }
	if(curmins < 10){ curmins = "0"+curmins; }
	if(durmins < 10){ durmins = "0"+durmins; }
	//Genero los textos de los valores.
	var _curTime = curmins+":"+cursecs
	var _durTime = durmins+":"+dursecs
	//Los muestro en pantalla.
	$(".currentTime").text(curmins+":"+cursecs);
	$(".videoDuration").text(durmins+":"+dursecs);
	//Como esta es la función que actualiza segundo a segundo el tiempo reproducido, voy a preguntar aca si ya terminó la reproducción
	//Esto lo hago comparando el tiempo transcurrido con el tiempo total, ya que no tengo forma de saber cuando termina un video con javascript.
	//Esto solo me interesa saberlo si la reproducción de slides es automática, puesto que debo detectar el final del contenido para
	//poder pasar al siguiente slide. entonces:
	//Si la reproducción es automática
	if(_PresentationPlaySlide=='A'){
		//Pregunto si el tiempo transcurrido ES IGUAL a la duración del contenido Y ADEMAS la duración es un número válido...
		//(esto del número válido lo pregunto también porque hay 2 momentos en los que los valores son iguales, al final de la reproducción,
		//cuando ambos valores estan en el punto más alto, y AL PRINCIPIO, cuando ambos valores son cero. Si yo no preguntara por números válidos
		//Va a saltar de slide indefinidamente, puesto que siempre va a encontrar igualdad en el inicio de la reproducción.)
		if(video.currentTime==video.duration && !isNaN(video.duration)){
			//Pauso el video.
			video.pause();
			//Vuelvo el tiempo a cero
			video.currentTime = 0;
			//Paso al siguiente slide
			nextSlide();
		}
	}
	var r = video.buffered.end(0);
	var total = video.duration;
	var nuevo = (r/total)*100;
	/*BUFFER ACA*/
	if(video.currentTime==video.duration){
		isPlaying = false;
		wasPlayed = true;
		$("#playPauseIcon").removeClass('fa-pause').addClass("fa-play"); //cambio el ícono de pausa a play neuvamente.
		$("#fs_playPauseIcon").removeClass('fa-pause').addClass("fa-play"); //cambio el ícono de pausa a play neuvamente.
	}
}

function seekYoutubeUpdate(){
	var slideId = $('#slides li.active').attr('data-sldId');
	var updateYtbTime;
	if (video.getPlayerState() == 1){ //Si está reproduciendose
		isPlaying = true;
		$("#playPauseIcon").removeClass('fa-play').addClass("fa-pause"); 	//cambio el icono de play por el de pausa.
		$("#fs_playPauseIcon").removeClass('fa-play').addClass("fa-pause"); //cambio el icono de play por el de pausa.
		updateYtbTime = setInterval(
			function(){
				if(isPlayingType=='ytb'){
					var tiempo = video.getCurrentTime();
					var total = video.getDuration();

					sliderDuration.value = tiempo * (1000 / total);
					fs_sliderDuration.value = tiempo * (1000 / total);

					var curmins = Math.floor(tiempo / 60);
					var cursecs = Math.floor(tiempo - curmins * 60);
					var durmins = Math.floor(total / 60);
					var dursecs = Math.floor(total - durmins * 60);
					//Si son menores a 10, les agrego un cero adelante.
					if(cursecs < 10){ cursecs = "0"+cursecs; }
					if(dursecs < 10){ dursecs = "0"+dursecs; }
					if(curmins < 10){ curmins = "0"+curmins; }
					if(durmins < 10){ durmins = "0"+durmins; }
					//Genero los textos de los valores.
					var _curTime = curmins+":"+cursecs
					var _durTime = durmins+":"+dursecs
					//Los muestro en pantalla.
					$(".currentTime").text(curmins+":"+cursecs);
					$(".videoDuration").text(durmins+":"+dursecs);

					if(_PresentationPlaySlide=='A'){
						if(video.getPlayerState()==0){ //Finalizó el video
							isPlaying = false;
							wasPlayed = true;
							clearInterval(updateYtbTime);
							clearInterval(interval_onYoutube);
							cleanStage();
							nextSlide();
						}
<<<<<<< HEAD
=======
					}else{
						if(video.getPlayerState()==0){ //Finalizó el video
							isPlaying = false;
							wasPlayed = true;
							clearInterval(updateYtbTime);
							clearInterval(interval_onYoutube);
						}
>>>>>>> upstream/master
					}
				}
			},1000);
	}else{
		//Si el video NO está reproduciendo
		$("#playPauseIcon").removeClass('fa-pause').addClass("fa-play"); //cambio el ícono de pausa a play neuvamente.
		$("#fs_playPauseIcon").removeClass('fa-pause').addClass("fa-play"); //cambio el ícono de pausa a play neuvamente.
		clearInterval(updateYtbTime);
		isPlaying = false;
	}
}



//Función para mostrar la opción "Other" de la respuesta.
function showHideOther(id){
	if($("#a-"+id+"other").is(':checked')){
		$("#txt"+id).show();
	}
}

//Función para mostrar la opción "Other" de la respuesta.
function _showHideOther(id){
	$("#txt"+id).hide();
}

//Función que esconde y muestra el panel derecho y acomoda el stage en el centro o a la izquierda.
function toogleContainer(){
	if ($("#content").hasClass('animated')){
		$("#content").animate({right:'0'},"fast").removeClass('animated');
		$("#stage").removeClass('stageAligned');
		$("#stageMain").removeClass('inline-block');
	}else{
		$("#content").animate({right:'-22.5%'},"fast").addClass('animated');
		$("#stage").addClass('stageAligned');
		$("#stageMain").addClass('inline-block');
	}
}

//Función para mostrar a pantalla completa el slide.
function toogleFullScreen(){
	if (video.requestFullscreen) {
		if(isPlayingType=='video'){
			video.requestFullscreen();
		}else if(isPlayingType=='ytb'){
			var escenario = document.getElementById('stageMain');
			$("#stageMain").addClass('stageFullScreen');
			escenario.requestFullscreen();
		}
		//mainStage.requestFullscreen();
		$(".fullscreenControls").css('display','block');
	}else if (video.mozRequestFullScreen) {
		if(isPlayingType=='video'){
			video.mozRequestFullScreen();
		}else if(isPlayingType=='ytb'){
			var escenario = document.getElementById('stageMain');
			$("#stageMain").addClass('stageFullScreen');
			escenario.mozRequestFullScreen();
		}
		//mainStage.mozRequestFullscreen();
		$(".fullscreenControls").css('display','block');
	} else if (video.webkitRequestFullscreen) {
		if(isPlayingType=='video'){
			video.webkitRequestFullscreen();
		}else if(isPlayingType=='ytb'){
			var escenario = document.getElementById('stageMain');
			$("#stageMain").addClass('stageFullScreen');
			escenario.webkitRequestFullscreen();
		}
		//mainStage.webkitRequestFullscreen();
		$(".fullscreenControls").css('display','block');
	}
}

//Función para retirar la pantalla completa desde el boton de los controles.
function quitFullScreen(){
	if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen();
		if(isPlayingType=='ytb'){
			$("#stageMain").removeClass('stageFullScreen');
		}
	}else{
		if(document.webkitCancelFullScreen){
			document.webkitCancelFullScreen();
			$("#stageMain").removeClass('stageFullScreen');
		}else{
			document.exitFullscreen();
			$("#stageMain").removeClass('stageFullScreen');
		}
	}
	$(".fullscreenControls").css('display','none');
	$(".imgSlide").css('position','relative');
	$(".imgSlide").css('z-index','');
}

function sendLog(id,state){
	console.log('Inicio el log con state = '+state);

	if(state=='pause'){
		clearInterval(logBot);
		console.log('Detuve la ejecución de los logs');
	}else if(state=='startPlay'){
		$.ajax({
			url: '../../aws_getpresentation_lastsequence.aspx',
			type: 'POST',
			headers:{'str':str,'key':ek,'slideId':id}
		})
		.done(function(lastSeq) {
			console.log('Se obtuvo la secuencia: '+lastSeq);
			sequenceId = lastSeq;
			logBot = setInterval(function(){
				if(isPlayingType=='video'){
					console.log('Tengo que guardar un log de video. Current = ' + video.currentTime);
				}else if(isPlayingType=='ytb'){
					console.log('Tengo que guardar un log de youtube. Current = ' + video.getCurrentTime());
				}else if(isPlayingType=='quiz_sv'){
					console.log('Tengo que guardar un log de quiz.');
				}
			},5000 /*Ejecuta cada 5 segundos*/);
		})
		.fail(function() {
			console.log("error: no se pudo obtener la secuencia");
		})
		.always(function() {
			console.log("completada la operación");
		});
	}else if(state=='retake'){
		console.log('Tengo que hacer un retake de los logs, con secuencia '+sequenceId);
		logBot = setInterval(function(){
			if(isPlayingType=='video'){
				console.log('Tengo que guardar un log de video. Current = ' + video.currentTime);
			}else if(isPlayingType=='ytb'){
				console.log('Tengo que guardar un log de youtube. Current = ' + video.getCurrentTime());
			}else if(isPlayingType=='quiz_sv'){
				console.log('Tengo que guardar un log de quiz.');
			}
		},5000 /*Ejecuta cada 5 segundos*/);
	}
	
}

//VideoSeek actualmente no se utiliza, pero es una función para seleccionar en la progress bar a que momento del video/audio se quiere ir.
function videoSeek(){
	var seekto = video.duration * (sliderDuration.value / 1000);
	video.currentTime = seekto;
}

//Función para detectar si se presiona ESC. Esta tecla sirve para salir de FullScreen, en cuyo caso hay que ocultar los controles FullScreen
//y mostrar nuevamente los controles estándares del reproductor.
$(document).keyup(function(event){
	//Si la tecla presionada es 27 (ESC)
	if(event.which==27){
		$(".fullscreenControls").css('display','none');
		$(".imgSlide").css('position','relative');
		$(".imgSlide").css('z-index','');
		if(isPlayingType=='ytb'){
			$("#stageMain").removeClass('stageFullScreen');
		}
	}
});

/*---------------------------------------
METODOS JQUERY
---------------------------------------*/

//Función para inicializar slides. se puede usar como ".startSlide()" sobre una variable jQuery.
$.fn.startSlide = function startSlide(){
	//Cierro los intervalos en caso de que se haya estado reproduciendo una imagen sin sonido.
	clearInterval(interval);
	//limpio el stage.
	cleanStage();
	//Reseteo los relojes.
	resetTimer();
	//guardo en "slideTitle" el título de el slide sobre el que estoy parado.
	var slideTitle = $(this).html();
	var slideType = $(this).attr('data-slideType');
	var speakerId = $(this).attr('data-trainer');
	wasPlayed = false;
	//Si es de tipo VIDEO
	if( slideType == 'video' || slideType == 'normal' ){
		isPlayingType = 'video';
		// se lo paso al titulo del stage
		$("#slideTitle").html(slideTitle);
		//agrego el elemento video a la pantalla.
		$("#stageMain").append('<video id="video"></video>');
		//guardo la URL del video (proc. genexus) en la variable "rl" (resource location).
		var rl = $(this).attr('data-resourcelocation');
		//le agrego al elemento video recien creado el source con la URL del video.
		$("#stageMain #video").append('<source src="'+rl+'" type="video/mp4; codecs='+"'avc1.42E01E, mp4a.40.2'"+'" />');
		//Lo ajusto al tamaño del stage.
		$("#video").css({'width':'100%','height':'100%'});
		//Me guardo en la variable video el identificador del elemento. A partir de ahora trabajo sobre la variable video el contenido.
		video = document.getElementById('video');
		$("#stage").animate({left:'0px'},'slow');
		$("#evaStage").animate({left:'-9999px'},'slow');
		if(_PresentationPlaySlide=='A'){
			noAudioDuration = 0;
			//Si es reproducción automática, lo largo con playPause().
			playPause();
		}
	}

	if(slideType == 'youtube'){
		isPlayingType = 'ytb';
		$("#slideTitle").html(slideTitle);
		var ytLocation = $(this).attr('data-resourcelocation');
		$("#stage").animate({left:'0px'},'slow');
		$("#evaStage").animate({left:'-9999px'},'slow');
		if(_PresentationPlaySlide=='I'){
			var ytCode = '<embed id="ytVideo" style="top: 0; left: 0;" width="100%" height="100%" frameborder="0" '
						+'webkitallowfullscreen'
						+' mozallowfullscreen'
						+' allowfullscreen'
						+' allowfullscreen="true"'
						+' allowscriptaccess="always"'
						+' quality="high"'
						+' bgcolor="#000000"'
						+' name="ytVideo"'
						+' src="http://www.youtube.com/v/'+ytLocation+'?enablejsapi=1'
							+'&version=3'
							+'&playerapiid=ytplayer'
							+'&controls=0'
							+'&disablekb=1'
							+'&iv_load_policy=3'
							+'&modestbranding=1'
							+'&rel=0'
							+'&showinfo=0"'
						+' type="application/x-shockwave-flash">';
			$("#stageMain").append(ytCode);
		}else{
			var ytCode = '<embed id="ytVideo" style="top: 0; left: 0;" width="100%" height="100%" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen allowfullscreen="true" allowscriptaccess="always" quality="high" bgcolor="#333333" name="ytVideo" src="http://www.youtube.com/v/'+ytLocation+'?enablejsapi=1&version=3&playerapiid=ytplayer&controls=0&disablekb=1&iv_load_policy=3&modestbranding=1&rel=0&showinfo=0&autoplay=1" type="application/x-shockwave-flash">';

			$("#stageMain").append(ytCode);
		}
	}

	//Si es una EVALUACION / ENCUESTA
	if(slideType == 'Survey' || slideType == 'Quiz'){
		isPlayingType = 'quiz_sv';
		SId = $(this).attr('data-SId');
		// se lo paso al titulo del stage
		$("#eva-slideTitle").html(slideTitle);
		$("#stage").animate({left:'-9999px'},'slow');
		$("#evaStage").animate({left:'0px'},'slow');

		//Ejecuto la creación de la evaluacion / encuesta
		getSurvey(SId);
	}
	getSpeaker(speakerId);
	//Una vez que haya seteado todo el slide, busco entre todos los hermanos el que haya estado "activo" anteriormente, y le borro el estilo
	$(this).siblings().removeClass('active');
	//Luego, a este slide que estoy por reproducir lo resalto en verde en la lista para identificar que se está reproduciendo.
	$(this).addClass('active');
	//return false se pone para evitar que se envié algun resultado a la variable destino donde se ejecutó la función. no se necesita nada del otro lado.
	return false;
}

function onYouTubePlayerReady(){
	var slideId = $('#slides li.active').attr('data-sldId');
	video = document.getElementById('ytVideo');
	video.setVolume(volumeControl.value);
	video.addEventListener('onStateChange',youtubeStateChange);
	interval_onYoutube = setInterval(function(){
		if(video.getPlayerState()!=1){
			//Si el video NO está reproduciendo
			$("#playPauseIcon").removeClass('fa-pause').addClass("fa-play"); 	//cambio el ícono de pausa a play neuvamente.
			$("#fs_playPauseIcon").removeClass('fa-pause').addClass("fa-play"); //cambio el ícono de pausa a play neuvamente.
		}else{
			$("#playPauseIcon").removeClass('fa-play').addClass("fa-pause"); 	//cambio el icono de play por el de pausa.
			$("#fs_playPauseIcon").removeClass('fa-play').addClass("fa-pause"); //cambio el icono de play por el de pausa.
			seekYoutubeUpdate();
		}
	})
}

function youtubeStateChange(){
	var st = video.getPlayerState();

	switch(st){
		case -1:
			console.log('Player State: '+st);
			break;
		case 0:
			console.log('Player State: '+st);
			break;
		case 1:
			console.log('Player State: '+st);
			break;
		case 2:
			console.log('Player State: '+st);
			break;

	}
}