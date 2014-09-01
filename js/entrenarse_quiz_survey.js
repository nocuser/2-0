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

//Función que busca las columnas para armar la pregunta Grading de una evaluación
function columnSearch(i,j,k){
	//Inicializo las variables necesarias, todas vacías
	var htmlColumna = '';
	var htmlColumaOpciones = '';
	var htmlGrading = '';
	var htmlOpcionesGrading = '';
	//Por cada columna
	for (var h = 0; h < sv.Section[i].Question[j].Answer[k].GColumn.length; h++) {
		//Guardo el título de la columna y la cantidad de opciones que tiene
		var tituloColumna = sv.Section[i].Question[j].Answer[k].GColumn[h].ColumnTitle;
		var cantidadOpcionesColumna = sv.Section[i].Question[j].Answer[k].GColumn[h].ColumnOptions.length;
		//Por cada item para esa columna
		for (var n = 0; n < sv.Section[i].Question[j].Answer[k].GColumn[h].ColumnOptions.length; n++) {
			//Me guardo el titulo de la opción
			var columnOptionTitle = sv.Section[i].Question[j].Answer[k].GColumn[h].ColumnOptions[n].Title;
			//Concateno los títulos de los items horizontales
			htmlColumaOpciones += '<td class="tg-s6z2">'+columnOptionTitle+'</td>';
		};
		//Concateno las opciones verticales
		htmlColumna += '<th class="tg-jjml columnBG" colspan="'+cantidadOpcionesColumna+'">'+tituloColumna+'</th>';
	};
	//Por cada respuesta
	for (var f = 0; f < sv.Section[i].Question[j].Answer.length; f++) {
		//Guardo los valores
		var id = sv.Section[i].Question[j].Answer[f].ID;
		var aValue = sv.Section[i].Question[j].Answer[f].Value;
		var aTitle = sv.Section[i].Question[j].Answer[f].Title;
		//Empiezo a armar cada fila con todos sus checkboxes
		htmlOpcionesGrading += '<tr class="columnBG"><td class="tg-031e"><span data-answerid="'+id+'">'+aTitle+'</span></td>';
		//Por cada columna
		for (var h = 0; h < sv.Section[i].Question[j].Answer[f].GColumn.length; h++) {
			//Por cada opción de la misma
			for (var n = 0; n < sv.Section[i].Question[j].Answer[f].GColumn[h].ColumnOptions.length; n++) {
				var htmlCheck = '';
				var cValue = sv.Section[i].Question[j].Answer[f].GColumn[h].ColumnOptions[n].Value;
				var cId = sv.Section[i].Question[j].Answer[f].GColumn[h].ColumnOptions[n].ID;
				var caChecked = sv.Section[i].Question[j].Answer[f].GColumn[h].ColumnOptions[n].Checked;
				if(caChecked){
					htmlCheck = 'checked';
				}else{
					htmlCheck = '';
				}
				//Voy agregando cada checkbox a las opciones de las columnas
				htmlOpcionesGrading += '<td class="tg-s6z2"><input data-evarespregitemcod="'+cId+'" '+htmlCheck+' type="radio" name="'+sv.Section[i].Question[j].ID+'-'+aTitle+'" title="'+aTitle+'" value="'+cValue+'" /></td>';
			}
		};
		//Cierro toda la fila
		htmlOpcionesGrading += '</tr>';
	};
	//Concateno todos los strings que armé antes para formar la tabla definitiva
	htmlGrading = 	'<table class="tg">'+
			'<tr>'+
				'<th class="tg-031e" rowspan="2"></th>'+htmlColumna+
			'</tr>'+
			'<tr>'+htmlColumaOpciones+'</tr>'
	htmlGrading += htmlOpcionesGrading;
	//Cierro la tabla completa
	htmlGrading += '</table>';
	//Se la devuelvo a la función getSurvey()
	return htmlGrading;
}

//Acción al submitir una evaluación
function evaSubmit(){
	saveSection();
}

//Función que busca el Survey / Evaluación en la base de datos.
function getSurvey(SId){
	/*Consulta*/
	var url = '../../aws_getpresentation_surveyeva.aspx'
	var request = new XMLHttpRequest();
	request.open("POST", url, false);
	request.setRequestHeader("str", str);
	request.setRequestHeader("key", ek);
	request.setRequestHeader("SId",SId);
	request.send();
	if (request.status == 200) {
		/*Consulta exitosa*/
		console.log(request.responseText);
		//Guardo en "sv" el array de datos en formato JSON
		sv = $.parseJSON(request.responseText);
		var html = '';
		//ORDENO por el campo "Order" el JSON de la evaluación.
		sv.Section.sort(sort_by('Order', true, parseInt));
		//Por cada SECCIÓN
		for (var i = 0; i < sv.Section.length; i++) {
			var sId = sv.Section[i].ID;
			var sectionNumber = i + 1;
			html += '<ul class="sectionList" sectionnumber="'+sectionNumber+'" data-sectionId="'+sId+'">';
			html += '<li>';
			html += '<span class="sectionTitle">Page '+sv.Section[i].Order+'</span>';
			//Por cada PREGUNTA
			for (var j = 0; j < sv.Section[i].Question.length; j++) {
				var questionType = sv.Section[i].Question[j].QuestionType;
				var qId = sv.Section[i].Question[j].ID;
				var hasOther = sv.Section[i].Question[j].hasOther;
				var isRequired = sv.Section[i].Question[j].isRequired;
				var isMultiSelect = sv.Section[i].Question[j].IsMultiSelect;
				//Si es REQUIRED
				if(isRequired){
					html += '<span class="questionTitle isRequired" data-mselect="'+isMultiSelect+'" data-qtype="'+questionType+'" data-required="true" data-questionid="'+qId+'">'+sv.Section[i].Question[j].Title+'</span>';
				}else{
					html += '<span class="questionTitle" data-mselect="'+isMultiSelect+'" data-qtype="'+questionType+'" data-required="false" data-questionid="'+qId+'">'+sv.Section[i].Question[j].Title+'</span>';
				}
				html += '<div id="a-hold-'+sId+qId+'" class="answerHolder">';
				gFlag = false;
				//Por cada RESPUESTA
				for (var k = 0; k < sv.Section[i].Question[j].Answer.length; k++) {
					var aId = sv.Section[i].Question[j].Answer[k].ID;
					var aValue = sv.Section[i].Question[j].Answer[k].Value;
					var aText = sv.Section[i].Question[j].Answer[k].Title;
					var aChecked = sv.Section[i].Question[j].Answer[k].Checked;
					//Si aChecked == True, está respondida esta opción en la base de datos, la marco como tal
					if(aChecked==true){
						var htmlCheck = 'checked';
					}else{
						var htmlCheck = '';
					}
					switch(questionType) {
	    				case 1: //Si es Grading
							if(gFlag==false){
								var htmlGrading = columnSearch(i,j,k);
								html += htmlGrading;
								gFlag = true;
							}
							break;
						case 2: //Si es multiple Choice
							if(isMultiSelect){
								html += '<input data-answerid="'+aId+'" '+htmlCheck+' type="checkbox" value="'+aValue+'" name="checkbox-'+sId+qId+'" id="a-'+sId+qId+aId+'" onchange="_showHideOther('+sId+qId+')" /><label for="a-'+sId+qId+aId+'">'+aText+'</label><br>';
							}else{
								html += '<input data-answerid="'+aId+'" '+htmlCheck+' type="radio" value="'+aValue+'" name="radiobutton-'+sId+qId+'" id="a-'+sId+qId+aId+'" onchange="_showHideOther('+sId+qId+')" /><label for="a-'+sId+qId+aId+'">'+aText+'</label><br>';
							}
							break;
						case 4: //Si es Comment
							html += '<textarea data-answerid="'+aId+'" name="comment'+sId+qId+'" id="a-'+sId+qId+aId+'"></textarea>';
							break;
						case 6: //Si es LikerScale
							//Liker Scale
	                        var minValue = sv.Section[i].Question[j].SvPregInitialValue;
	                        var maxValue = sv.Section[i].Question[j].SvPregFinalValue;
	                        var interval = sv.Section[i].Question[j].SvPregStepValue;
	                        var text1 = sv.Section[i].Question[j].SvPregInitialText;
	                        var text2 = sv.Section[i].Question[j].SvPregMediaText;
	                        var text3 = sv.Section[i].Question[j].SvPregFinalText;
	                        var valresp = sv.Section[i].Question[j].Answer[k].Title;
	                        html +='<div class="likerscaleContainer">'+
	                                    '<span>'+text1+'</span>'+
	                                    '<ul class="rangeSelector">';
	                                
	                        for (n=minValue; n <= maxValue; n += interval){
	                            if (valresp!=='' && valresp == n)
	                            {
	                                html +='<li class="likerScaleOption liker-active" onclick="clickScaleOption('+qId+','+n+');" id="li-' + qId + '-'+n+'">'+n+' <input class="liker-check" type="checkbox" hidden value="'+n+'" checked> </li>';
	                            }
	                            else
	                            {
	                                html +='<li class="likerScaleOption" onclick="clickScaleOption('+qId+','+n+');" id="li-' + qId + '-'+n+'">'+n+' <input class="liker-check" type="checkbox" hidden value="'+n+'" > </li>';
	                            }
	                        }
	                        html += '</ul><span>'+text3+'</span></div>';
	                        break;
						case 7: //Si es Slider
							var minValue = sv.Section[i].Question[j].SvPregInitialValue;
	                        var maxValue = sv.Section[i].Question[j].SvPregFinalValue;
	                        var interval = sv.Section[i].Question[j].SvPregStepValue;
							var valresp = sv.Section[i].Question[j].Answer[k].Title;
							minValue -= 1;
	                        if (valresp == '') {
	                            //Si el slider tiene valor, lo posiciono en el numero que indica el valor
	                            html += '<div class="sliderVerticalContainer"><input type="range" orient="vertical" class="eva-range vertical" id="a-'+sId+qId+aId+'" min="'+minValue+'" max="'+maxValue+'" value="-1" /></div>';
	                        } else {
	                            html += '<div class="sliderVerticalContainer"><input type="range" orient="vertical" class="eva-range vertical"  id="a-'+sId+qId+aId+'" min="'+minValue+'" max="'+maxValue+'" value="'+valresp+'"  /></div>';
	                        }
							break;
						case 8: //Si es date
							var valresp = sv.Section[i].Question[j].Answer[k].Title;
							var format = sv.Section[i].Question[j].SvPregFormatDate;
							 //Busco el valor respondido (si lo hay) y reemplazo lo vacio con ceros
	                        if (valresp != '') {
	                            var arrayDate = valresp.split('/');
	                            
	                            if (arrayDate[0]) {} else {
	                                arrayDate[0] = '00';
	                            }
	                            if (arrayDate[1]) {} else {
	                                arrayDate[1] = '00';
	                            }
	                            if (arrayDate[2] == '0000') {
	                                arrayDate[2] = '';
	                            }
	                        } else {
	                            var arrayDate = [
	                                "00",
	                                "00",
	                                ""
	                            ];
	                        }
	                        //Escribo la respuesta
	                        var htmlMonth = '<select  data-selecttype="month" id="comboMonth-'+sId+qId+aId+'" class="comboboxMonth" value="' + arrayDate[1] + '">';
	                        //Genero las opciones para el combobox
	                        for (var m = 0; m < 13; m++) {
	                            var mesSeleccion = arrayDate[1];
	                            if (m < 10) {
	                                var n = '0' + m;
	                            } else {
	                                var n = m;
	                            }
	                            if (n == mesSeleccion) {
	                                var selected = 'selected';
	                            } else {
	                                var selected = '';
	                            }
	                            switch (m) {
	                                case 0:
	                                    htmlMonth += '<option ' + selected + ' value="00">Select Month</option>';
	                                    break;
	                                case 1:
	                                    htmlMonth += '<option ' + selected + ' value="01">January</option>';
	                                    break;
	                                case 2:
	                                    htmlMonth += '<option ' + selected + ' value="02">February</option>';
	                                    break;
	                                case 3:
	                                    htmlMonth += '<option ' + selected + ' value="03">March</option>';
	                                    break;
	                                case 4:
	                                    htmlMonth += '<option ' + selected + ' value="04">April</option>';
	                                    break;
	                                case 5:
	                                    htmlMonth += '<option ' + selected + ' value="05">May</option>';
	                                    break;
	                                case 6:
	                                    htmlMonth += '<option ' + selected + ' value="06">June</option>';
	                                    break;
	                                case 7:
	                                    htmlMonth += '<option ' + selected + ' value="07">July</option>';
	                                    break;
	                                case 8:
	                                    htmlMonth += '<option ' + selected + ' value="08">August</option>';
	                                    break;
	                                case 9:
	                                    htmlMonth += '<option ' + selected + ' value="09">September</option>';
	                                    break;
	                                case 10:
	                                    htmlMonth += '<option ' + selected + ' value="10">October</option>';
	                                    break;
	                                case 11:
	                                    htmlMonth += '<option ' + selected + ' value="11">November</option>';
	                                    break;
	                                case 12:
	                                    htmlMonth += '<option ' + selected + ' value="12">December</option></select>';
	                                    break;
	                            }
	                        }
	                        var htmlDay = '<select data-selecttype="day" id="comboDay-' +sId+qId+aId+'" class="comboboxDay" value="' + arrayDate[0] + '">';
	                        htmlDay += '<option selected value="00">Select Day</option>';
	                        //Genero las opciones para el combobox
	                        for (var c = 1; c < 32; c++) {
	                            if (c < 10) {
	                                var value = '0' + c;
	                                if (arrayDate[0] == value) {
	                                    htmlDay += '<option selected value="0' + c + '" >0' + c + '</option>';
	                                } else {
	                                    htmlDay += '<option value="0' + c + '" >0' + c + '</option>';
	                                }
	                            } else {
	                                var value = c;
	                                if (arrayDate[0] == value) {
	                                    htmlDay += '<option selected value="' + c + '" >' + c + '</option>';
	                                } else {
	                                    htmlDay += '<option value="' + c + '" >' + c + '</option>';
	                                }
	                            }
	                        }
	                        htmlDay += '</select>';
	                        var htmlYear = '<input pattern="[0-9]" type="text" onkeypress="return justNumbers(event);" id="comboYear-' +sId+qId+aId+'" class="comboboxYear" value="' + arrayDate[2] + '" />';
	                        if (format=='DD/MM/YYYY') {
	                        	html+=htmlDay+htmlMonth+htmlYear;
	                        }else{
	                        	html+=htmlMonth+htmlDay+htmlYear;
	                        }
							break;
						case 9: //Free Numeric Form
	                   		var valresp = sv.Section[i].Question[j].Answer[k].Title;
	                        html += '<input class="freenumericform" type="number" pattern="[0-9]+([\.|,][0-9]+)?" value="' + valresp + '" />';
							break;
					}
				
					//Si tiene opción "other"
					if(hasOther){
						if(questionType==2){
							html += '<input data-answerid="'+aId+'" '+htmlCheck+' type="radio" value="Other" name="radiobutton-'+sId+qId+'" id="a-'+sId+qId+'other" onchange="showHideOther('+sId+qId+')" /><label for="a-'+sId+qId+'other">Other</label><br>';
							html += '<textarea name="txt'+sId+qId+'" id="txt'+sId+qId+'" style="display:none;"></textarea>';
						}
					}
					
				}
				html += '</div>';
			}
			html += '</li>';
			html += '</ul>';
		}
		//Me guardo la cantidad de secciones para hacer el paginado.
		var sLong = sv.Section.length;
		html += '<button id="evaprevbtn" onclick="prevEvaSection('+sLong+')"><< Previous</button>';
		html += '<button id="evanextbtn" onclick="nextEvaSection('+sLong+')">Next >></button>';
		html += '<button id="evasubmit" onclick="evaSubmit('+sLong+')">Submit</button>';
		$("#eva-stageMain").attr('data-sid',SId);
		$("#eva-stageMain").html(html);
		//Ejecuto función para configurar y armar las secciones.
		setSections(sLong);
	}else{
		//El request de datos fallo
		alert('Survey loading fail!');
	}
}

//Función para avanzar a la siguiente sección de una evaluación / encuesta
function nextEvaSection(sLong){
	//Si está activa, guardo la section antes de avanzar a la siguiente página
	saveSection();
	//Cambio la sección activa
	$('.selected').next().addClass('selected');
	$('.selected').prev().removeClass('selected');
	//Vuelvo a ejecutar setSections para que organize y muestre el nuevo contenido
	setSections(sLong);
}

function prevEvaSection(sLong){
	// if(_PresentationStatus=='A'){
		saveSection();
	// }
	$('.selected').prev().addClass('selected');
	$('.selected').next().removeClass('selected');
	setSections(sLong);
}

function saveSection(){
	var answerArray = '[';
	var surveyid = $("#eva-stageMain").attr('data-sid');
	$(".selected").find(".questionTitle").each(function(){

		var sId = $(".selected").attr('data-sectionId');
		var elemento = this;
		var qId = elemento.dataset.questionid;
		var isMS = 'false';
		var suma = 0;
		console.log("pregunta " + qId + " tipo " + elemento.dataset.qtype);
		if(elemento.dataset.qtype==1){ //Grading
			$("table.tg tbody tr.columnBG td.tg-031e").siblings().each(function(){
				var aId = $(this).parents('tr').children('.tg-031e').children('span').attr('data-answerid');
				$(this).find(':input').each(function(){
					if(this.checked){
						suma = suma + 1
						answerArray += '{ "SvEvaCodOrg" : "'+ surveyid+'",';
						answerArray += '"SvEvaCod" : "'+ surveyid+'",';
						answerArray += '"SvEvaPregCod" : "'+ qId+'",';
						answerArray += '"SvQuestionType" : '+elemento.dataset.qtype+',';
						answerArray += '"SvIsMultiSelect" : "'+isMS+'",';
						answerArray += '"SvTipSccCod" : "'+ sId+'",';
						answerArray += '"SvEvaResCod" : "'+suma+'",'; //Aumentar
						answerArray += '"SvEvaResPregItemCod" : "'+this.dataset.evarespregitemcod+'",';
						answerArray += '"SvEvaPregItemCod" : "'+aId+'",';
						answerArray += '"SvEvaResLevelCod" : "1",';
						answerArray += '"SvUserIdRes" : "'+ _PresentationUserId+'",';
						answerArray += '"SvEvaResComment" : "",';
						answerArray += '"SvCategCod" : "0"},';
					}
				})
			})
		}
		if(elemento.dataset.qtype==2){ //MultiPleChoice
			isMS = elemento.dataset.mselect;
			if(isMS=='true'){
				$("#a-hold-"+sId+qId).find(':input').each(function(){
					var respuesta = this;
					if(respuesta.checked){
						suma = suma + 1
						answerArray += '{ "SvEvaCodOrg" : "'+ surveyid+'",';
						answerArray += '"SvEvaCod" : "'+ surveyid+'",';
						answerArray += '"SvEvaPregCod" : "'+ qId+'",';
						answerArray += '"SvQuestionType" : '+elemento.dataset.qtype+',';
						answerArray += '"SvIsMultiSelect" : "'+isMS+'",';
						answerArray += '"SvTipSccCod" : "'+ sId+'",';
						answerArray += '"SvEvaResCod" : "1",';
						answerArray += '"SvEvaResPregItemCod" : "'+ respuesta.dataset.answerid+'",';
						answerArray += '"SvEvaPregItemCod" : "1",';
						answerArray += '"SvEvaResLevelCod" : "'+suma+'",'; //Aumentar
						answerArray += '"SvUserIdRes" : "'+ _PresentationUserId+'",';
						answerArray += '"SvEvaResComment" : "",';
						answerArray += '"SvCategCod" : "0"},';
					}
				});
				isMS = 'false';
			}else{
				$("#a-hold-"+sId+qId).find(':input').each(function(){
					var respuesta = this;
					if(respuesta.checked){
						answerArray += '{ "SvEvaCodOrg" : "'+surveyid+'",';
						answerArray += '"SvEvaCod" : "'+surveyid+'",';
						answerArray += '"SvEvaPregCod" : "'+qId+'",';
						answerArray += '"SvQuestionType" : '+elemento.dataset.qtype+',';
						answerArray += '"SvIsMultiSelect" : "'+isMS+'",';
						answerArray += '"SvTipSccCod" : "'+sId+'",';
						answerArray += '"SvEvaResCod" : "1",';
						answerArray += '"SvEvaResPregItemCod" : "'+respuesta.dataset.answerid+'",';
						answerArray += '"SvEvaPregItemCod" : "1",';
						answerArray += '"SvEvaResLevelCod" : "1",';
						answerArray += '"SvUserIdRes" : "'+_PresentationUserId+'",';
						answerArray += '"SvEvaResComment" : "",';
						answerArray += '"SvCategCod" : "0"},';
					}
				});
				isMS = 'false';
			}
		}
		if(elemento.dataset.qtype==4){ //Comment
			$("#a-hold-"+sId+qId).find('textarea').each(function(){
				var respuesta = this;
				answerArray += '{ "SvEvaCodOrg" : "'+surveyid+'",';
				answerArray += '"SvEvaCod" : "'+surveyid+'",';
				answerArray += '"SvEvaPregCod" : "'+qId+'",';
				answerArray += '"SvQuestionType" : '+elemento.dataset.qtype+',';
				answerArray += '"SvIsMultiSelect" : "'+isMS+'",';
				answerArray += '"SvTipSccCod" : "'+sId+'",';
				answerArray += '"SvEvaResCod" : "1",';
				answerArray += '"SvEvaResPregItemCod" : "'+respuesta.dataset.answerid+'",';
				answerArray += '"SvEvaPregItemCod" : "1",';
				answerArray += '"SvEvaResLevelCod" : "1",';
				answerArray += '"SvUserIdRes" : "'+_PresentationUserId+'",';
				answerArray += '"SvEvaResComment" : "'+respuesta.value+'",';
				answerArray += '"SvCategCod" : "0"},';
			});
		}
		if(elemento.dataset.qtype==6){ //LikerScale
			$("#a-hold-"+sId+qId).find(':input').each(function(){
				if(this.checked){
					var cheq = this.value;
					answerArray += '{ "SvEvaCodOrg" : "'+ surveyid+'",';
					answerArray += '"SvEvaCod" : "'+ surveyid+'",';
					answerArray += '"SvEvaPregCod" : "'+ qId+'",';
					answerArray += '"SvQuestionType" : '+elemento.dataset.qtype+',';
					answerArray += '"SvIsMultiSelect" : "'+isMS+'",';
					answerArray += '"SvTipSccCod" : "'+ sId+'",';
					answerArray += '"SvEvaResCod" : "1",'; //Aumentar
					answerArray += '"SvEvaResPregItemCod" : "'+cheq+'",';
					answerArray += '"SvEvaPregItemCod" : "1",';  
					answerArray += '"SvEvaResLevelCod" : "1",';
					answerArray += '"SvUserIdRes" : "'+ _PresentationUserId+'",';
					answerArray += '"SvEvaResComment" : "",';
					answerArray += '"SvCategCod" : "0"},';
				}
			});
		}
		if(elemento.dataset.qtype==7){ //Slider
				answerArray += '{ "SvEvaCodOrg" : "'+ surveyid+'",';
				answerArray += '"SvEvaCod" : "'+ surveyid+'",';
				answerArray += '"SvEvaPregCod" : "'+ qId+'",';
				answerArray += '"SvQuestionType" : '+elemento.dataset.qtype+',';
				answerArray += '"SvIsMultiSelect" : "'+isMS+'",';
				answerArray += '"SvTipSccCod" : "'+ sId+'",';
				answerArray += '"SvEvaResCod" : "1",'; //Aumentar
				answerArray += '"SvEvaResPregItemCod" : "'+$("#a-"+sId+qId+'1').val()+'",';
				answerArray += '"SvEvaPregItemCod" : "1",';  
				answerArray += '"SvEvaResLevelCod" : "1",';
				answerArray += '"SvUserIdRes" : "'+ _PresentationUserId+'",';
				answerArray += '"SvEvaResComment" : "",';
				answerArray += '"SvCategCod" : "0"},';
		}
		if(elemento.dataset.qtype==8){ //Date
			var strDate = '';
			
			strDate = $("#comboDay-"+sId+qId+'1').val() +"/" + $("#comboMonth-"+sId+qId+'1').val()+"/"+$("#comboYear-"+sId+qId+'1').val();
			
			answerArray += '{ "SvEvaCodOrg" : "'+ surveyid+'",';
			answerArray += '"SvEvaCod" : "'+ surveyid+'",';
			answerArray += '"SvEvaPregCod" : "'+ qId+'",';
			answerArray += '"SvQuestionType" : '+elemento.dataset.qtype+',';
			answerArray += '"SvIsMultiSelect" : "'+isMS+'",';
			answerArray += '"SvTipSccCod" : "'+ sId+'",';
			answerArray += '"SvEvaResCod" : "1",'; //Aumentar
			answerArray += '"SvEvaResPregItemCod" : "'+strDate+'",';
			answerArray += '"SvEvaPregItemCod" : "1",';  
			answerArray += '"SvEvaResLevelCod" : "1",';
			answerArray += '"SvUserIdRes" : "'+ _PresentationUserId+'",';
			answerArray += '"SvEvaResComment" : "",';
			answerArray += '"SvCategCod" : "0"},';
		}

		if(elemento.dataset.qtype==9){ //Free Numeric Form
			$("#a-hold-"+sId+qId).find(':input').each(function(){
				answerArray += '{ "SvEvaCodOrg" : "'+ surveyid+'",';
				answerArray += '"SvEvaCod" : "'+ surveyid+'",';
				answerArray += '"SvEvaPregCod" : "'+ qId+'",';
				answerArray += '"SvQuestionType" : '+elemento.dataset.qtype+',';
				answerArray += '"SvIsMultiSelect" : "'+isMS+'",';
				answerArray += '"SvTipSccCod" : "'+ sId+'",';
				answerArray += '"SvEvaResCod" : "1",'; //Aumentar
				answerArray += '"SvEvaResPregItemCod" : "'+this.value+'",';
				answerArray += '"SvEvaPregItemCod" : "1",';  
				answerArray += '"SvEvaResLevelCod" : "1",';
				answerArray += '"SvUserIdRes" : "'+ _PresentationUserId+'",';
				answerArray += '"SvEvaResComment" : "",';
				answerArray += '"SvCategCod" : "0"},';
			});
		}
	})
	var arrayCompleto = answerArray.substring(0, answerArray.length - 1);
	arrayCompleto += ']';
	console.log("arraycompleto " + arrayCompleto);
	$.ajax({
		type: "POST",
		headers: {
		  "key": ek,
		  "str": str
		},
		data: arrayCompleto,
		url: "../../aws_getpresentation_savesurvey.aspx",
		timeout: 10000
	}).done(function(){
		/*

		PASAR AL SIGUIENTE SLIDE

		*/
		//Paso al siguiente slide
		nextSlide();
	}).fail(function(){
		alert("There was a communication problem, please try again.");
	});

}

//funcion que setea las secciones
function setSections(sLong){
	//Busco cual es la seccion activa
	var sActive = $('.selected');
	//Pregunto si la activa es < > 0 o es igual. Si es igual, quiere decir que aún no se seleccionó ninguna sección. O sea, es la primera vez que imprimo
	//El survey o Evaluación.
	if(sActive.length==0){
		//Es cero, por lo tanto busco la primera sección para mostrar.
		$(".eva-stageMain ul:first-child").addClass("selected");
		//Si el rango de secciones es solamente 1, no tengo que mostrar boton next
		if(sLong==1){
			$("#evaprevbtn").css('display','none');
			$("#evasubmit").css('display','inline-block');
			$("#evanextbtn").css('display','none');
		}else{
			//Si hay más de 1 sección, como estoy mostrando la primera de todas, muestro el next y no el previous o submit.
			$("#evaprevbtn").css('display','none');
			$("#evasubmit").css('display','none');
			$("#evanextbtn").css('display','inline-block');
		}
	}else{
		//Es distinto de cero, por lo tanto, tengo varias secciones para mostrar. 
		//Busco la que tengo seleccionada.
		var selection = $(".selected").attr("sectionnumber");
		//Si es 1, estoy en la primera sección
		if(selection==1){
			$("#evaprevbtn").css('display','none');
			$("#evasubmit").css('display','none');
			$("#evanextbtn").css('display','inline-block');
		}else{
			//Si estoy aca, NO estoy en la primera seccion, pregunto si estoy en la última
			if(selection==sLong){
				//Estoy en la última sección, tengo que mostrar el previous y el submit.
				$("#evaprevbtn").css('display','inline-block');
				$("#evanextbtn").css('display','none');
				$("#evasubmit").css('display','inline-block');
			}else{
				//No es la última ni la primera sección, es una intermedia.
				//Muestro next y previous.
				$("#evaprevbtn").css('display','inline-block');
				$("#evanextbtn").css('display','inline-block');
				$("#evasubmit").css('display','none');
			}
		}
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


function clickScaleOption(qId,num){
            if($('#li-' + qId + '-'+num).hasClass('liker-active')){
                //le quito la clase activa.
                $('#li-' + qId + '-'+num).removeClass('liker-active');
                $('#li-' + qId + '-'+num).find(":input").each(function(){
                    //var seleccionado = this.value;
                     this.checked = false;
                });
            }else{
                //Quita la clase "active" de donde quiera que esté
                $('#li-' + qId + '-'+num).siblings().removeClass('liker-active');
                $('#li-' + qId + '-'+num).siblings().find(":input").each(function(){
                    //var seleccionado = this.value;
                    this.checked = false;
                 });
                //Pone la clase "active" en el seleccionado para colorearlo
                $('#li-' + qId + '-'+num).addClass('liker-active');
                $('#li-' + qId + '-'+num).find(":input").each(function(){
                    //var seleccionado = this.value;
                    this.checked = true;
                 });
            }
    };